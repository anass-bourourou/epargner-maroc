// Modèle principal + fallbacks — testés du plus performant au plus stable.
// Si le principal est saturé (503) ou indisponible (404 modèle déprécié),
// on bascule automatiquement sur le suivant.
// Configurable via env var GEMINI_MODELS="modelA,modelB,modelC".
const MODELS = (
  process.env.GEMINI_MODELS ||
  'gemini-3.6-flash,gemini-3.6-flash-lite,gemini-3.6-pro,gemini-3.5-flash'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Erreurs transitoires (côté serveur, sur ce modèle précis) → retry sur le même modèle
const TRANSIENT = new Set([429, 500, 502, 503, 504]);
// Erreurs "modèle indisponible" (spécifiques au modèle) → passe au suivant sans retry
const MODEL_UNAVAILABLE = new Set([404]);

// Retries par modèle — courts pour laisser le temps au fallback.
// 3 tentatives : 5s, 15s, 30s = ~50s par modèle
// Avec 4 modèles → total max ~3m30 avant abandon complet.
const MAX_ATTEMPTS = 3;
const BACKOFF_SECONDS = [5, 15, 30];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function generateStructured({ systemPrompt, userPrompt, schema, temperature = 0.7 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquant.');

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

  for (let m = 0; m < MODELS.length; m++) {
    const model = MODELS[m];
    const isFallback = m > 0;
    if (isFallback) {
      console.warn(`[gemini] bascule sur modèle de fallback : ${model}`);
    } else {
      console.log(`[gemini] modèle principal : ${model}`);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(`${ENDPOINT(model)}?key=${apiKey}`, {
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

      // 404 = modèle spécifiquement indisponible (déprécié, mauvais nom…)
      // → on passe direct au fallback suivant sans retry sur ce modèle.
      if (MODEL_UNAVAILABLE.has(res.status)) {
        console.warn(`[gemini] ${model} indisponible (HTTP ${res.status}) — modèle probablement déprécié.`);
        if (m < MODELS.length - 1) {
          break; // passe au modèle suivant
        }
        throw lastErr;
      }

      // 401, 403, 400 = problème côté clé/requête → aucun modèle ne va aider, on abandonne
      if (!TRANSIENT.has(res.status)) {
        throw lastErr;
      }

      const isHighDemand = res.status === 503 && errText.includes('high demand');
      const isQuotaExceeded = res.status === 429;
      let reason;
      if (isHighDemand) reason = 'high demand côté Google';
      else if (isQuotaExceeded) reason = 'quota dépassé (429)';
      else reason = `HTTP ${res.status}`;

      // Sur quota dépassé, inutile d'insister sur le même modèle : on tente le suivant tout de suite
      if (isQuotaExceeded) {
        console.warn(`[gemini] ${model} en quota dépassé — passage direct au fallback.`);
        if (m < MODELS.length - 1) {
          break;
        }
        throw lastErr;
      }

      // Dernière tentative sur ce modèle → passe au fallback suivant
      if (attempt === MAX_ATTEMPTS) {
        if (m < MODELS.length - 1) {
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
