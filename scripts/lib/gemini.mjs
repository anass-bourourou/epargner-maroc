// Découverte automatique des modèles disponibles + fallback en cascade.
// Au 1er appel, on interroge l'API pour lister les modèles réels de ta clé,
// puis on essaie dans l'ordre : Flash → Pro (du plus récent au plus ancien).
//
// Configurable via env var GEMINI_MODELS="modelA,modelB" pour forcer la liste
// (utile pour du debug ou pour skipper la découverte).

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Erreurs transitoires (côté serveur, sur ce modèle précis) → retry sur le même modèle
const TRANSIENT = new Set([429, 500, 502, 503, 504]);
// Erreurs "modèle indisponible" → passe au suivant sans retry
const MODEL_UNAVAILABLE = new Set([404]);

// Retries par modèle
const MAX_ATTEMPTS = 3;
const BACKOFF_SECONDS = [5, 15, 30];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cache de la liste des modèles pendant la vie du process
let discoveredModels = null;

async function discoverModels(apiKey) {
  if (discoveredModels) return discoveredModels;

  // Si GEMINI_MODELS est set explicitement, on skip la découverte
  const forced = process.env.GEMINI_MODELS;
  if (forced) {
    discoveredModels = forced.split(',').map((m) => m.trim()).filter(Boolean);
    console.log(`[gemini] modèles forcés via env : ${discoveredModels.join(', ')}`);
    return discoveredModels;
  }

  console.log('[gemini] découverte des modèles disponibles…');
  const res = await fetch(`${API_BASE}/models?key=${apiKey}`);
  if (!res.ok) {
    // Si la découverte échoue, fallback sur une liste par défaut
    console.warn(`[gemini] découverte échouée (HTTP ${res.status}), utilisation liste par défaut`);
    discoveredModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    return discoveredModels;
  }

  const data = await res.json();
  const usable = (data.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
    // Exclure les modèles vision-only / image / embedding / TTS
    .filter((n) => !n.includes('embedding') && !n.includes('aqa') && !n.includes('tts'));

  // Priorité : les "flash" d'abord (rapides + moins chers), puis les "pro"
  const flashModels = usable.filter((n) => n.includes('flash')).sort().reverse();
  const proModels = usable.filter((n) => n.includes('pro') && !n.includes('vision')).sort().reverse();

  discoveredModels = [...flashModels, ...proModels];
  if (discoveredModels.length === 0) {
    // Filet de sécurité : si le filtre a tout viré, on essaie tout
    discoveredModels = usable;
  }

  console.log(`[gemini] ${discoveredModels.length} modèles utilisables : ${discoveredModels.join(', ')}`);
  return discoveredModels;
}

export async function generateStructured({ systemPrompt, userPrompt, schema, temperature = 0.7 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquant.');

  const models = await discoverModels(apiKey);
  if (models.length === 0) {
    throw new Error('Aucun modèle Gemini disponible pour cette clé API.');
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  let lastErr;

  for (let m = 0; m < models.length; m++) {
    const model = models[m];
    const isFallback = m > 0;
    if (isFallback) {
      console.warn(`[gemini] bascule sur modèle de fallback : ${model}`);
    } else {
      console.log(`[gemini] modèle principal : ${model}`);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini: réponse vide.');
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(`Gemini: JSON invalide — ${e.message}\n${text.slice(0, 400)}`);
        }
      }

      const errText = await res.text();
      lastErr = new Error(`Gemini ${res.status} (${model}): ${errText.slice(0, 300)}`);

      // 404 = modèle indisponible → passe direct au suivant
      if (MODEL_UNAVAILABLE.has(res.status)) {
        console.warn(`[gemini] ${model} indisponible (HTTP ${res.status}).`);
        if (m < models.length - 1) break;
        throw lastErr;
      }

      // 401, 403, 400 = problème côté clé/requête → aucun fallback ne va aider
      if (!TRANSIENT.has(res.status)) {
        throw lastErr;
      }

      const isHighDemand = res.status === 503 && errText.includes('high demand');
      const isQuotaExceeded = res.status === 429;
      let reason;
      if (isHighDemand) reason = 'high demand côté Google';
      else if (isQuotaExceeded) reason = 'quota dépassé (429)';
      else reason = `HTTP ${res.status}`;

      // Quota dépassé sur ce modèle → passe direct au suivant (quota par modèle)
      if (isQuotaExceeded) {
        console.warn(`[gemini] ${model} en quota dépassé — passage direct au fallback.`);
        if (m < models.length - 1) break;
        throw lastErr;
      }

      // Dernière tentative sur ce modèle → passe au fallback
      if (attempt === MAX_ATTEMPTS) {
        if (m < models.length - 1) {
          console.warn(
            `[gemini] ${model} indisponible après ${MAX_ATTEMPTS} tentatives (${reason}).`,
          );
          break;
        }
        throw lastErr;
      }

      const backoffSeconds = BACKOFF_SECONDS[attempt - 1] || 30;
      console.warn(
        `[gemini] ${reason} — ${model} tentative ${attempt}/${MAX_ATTEMPTS} échouée, ` +
          `nouvelle tentative dans ${backoffSeconds}s…`,
      );
      await sleep(backoffSeconds * 1000);
    }
  }

  throw lastErr;
}
