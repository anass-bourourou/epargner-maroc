const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const TRANSIENT = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 6;

// Backoff explicite en secondes — plus long pour absorber les vagues de
// surcharge Gemini qui durent typiquement 1-3 minutes.
// Total : 5 + 15 + 30 + 60 + 120 = ~4 minutes avant abandon
const BACKOFF_SECONDS = [5, 15, 30, 60, 120];

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
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
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
    lastErr = new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);

    if (!TRANSIENT.has(res.status) || attempt === MAX_ATTEMPTS) {
      throw lastErr;
    }

    // Identifier la cause "high demand" pour un log plus clair
    const isHighDemand = res.status === 503 && errText.includes('high demand');
    const reason = isHighDemand ? 'high demand côté Google' : `HTTP ${res.status}`;

    const backoffSeconds = BACKOFF_SECONDS[attempt - 1] || 120;
    console.warn(
      `[gemini] ${reason} — tentative ${attempt}/${MAX_ATTEMPTS} échouée, ` +
        `nouvelle tentative dans ${backoffSeconds}s…`,
    );
    await sleep(backoffSeconds * 1000);
  }
  throw lastErr;
}
