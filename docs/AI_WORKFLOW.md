# Pipeline de contenu assisté par IA

Ce dépôt inclut un pipeline **100 % gratuit** pour générer des drafts
d'articles éditoriaux. Un article généré arrive **toujours** en Pull
Request, **jamais** en commit direct sur `main` — la revue humaine est
obligatoire (règle du brief : *never automatically publish financial
advice without human review*).

## Stack

- **Google AI Studio · Gemini 2.0 Flash** — 1 500 requêtes/jour gratuites.
- **GitHub Actions** — 2 000 min/mois sur repo privé, illimité sur public.
- **Node script** local + workflow GitHub.
- **peter-evans/create-pull-request** — ouvre automatiquement une PR.

**Coût mensuel : 0 DH.**

## Mise en place

### 1. Obtenir une clé Gemini

1. Aller sur [aistudio.google.com](https://aistudio.google.com).
2. Se connecter avec un compte Google.
3. Cliquer sur **Get API key** → **Create API key**.
4. Copier la clé.

### 2. Ajouter la clé comme secret GitHub

1. Dans le dépôt GitHub → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
2. Nom : `GEMINI_API_KEY`.
3. Valeur : la clé copiée précédemment.

### 3. Vérifier les permissions du workflow

**Settings** → **Actions** → **General** → **Workflow permissions** :
- ✅ **Read and write permissions**
- ✅ **Allow GitHub Actions to create and approve pull requests**

## Utilisation

### Trigger manuel (recommandé pour tester)

**Actions** → **Generate article draft** → **Run workflow**.

Deux options :
1. Laisser les champs vides → le script pioche la première idée
   non utilisée dans `content-ideas.json`.
2. Renseigner **topic** + **category** → le script génère sur ce
   sujet précis.

Le workflow :
1. Génère le draft.
2. Valide contre le schéma Zod (`astro check`).
3. Build le site (`astro build`) — si ça casse, la PR n'est pas créée.
4. Ouvre une PR sur la branche `ai-draft/{slug}` avec les labels
   `ai-draft` et `needs-review`.

### Trigger automatique (cron)

Le workflow s'exécute automatiquement **lundi, mercredi et vendredi
à 08:00 UTC** (09:00 en heure marocaine hiver, 10:00 en été).

Il pioche l'idée suivante dans `content-ideas.json`. Quand la file
est vide, le workflow ne fait rien.

### En local

```bash
export GEMINI_API_KEY="votre-clé"
npm run generate:article
# ou avec un sujet libre :
node scripts/generate-article.mjs \
  --topic="Comprendre le TAEG" \
  --category=credit
```

## Alimenter la file d'idées

Éditez `content-ideas.json` :

```json
{
  "topic": "Comment lire son relevé bancaire",
  "category": "banques",
  "angle": "Décrypter les libellés et repérer les frais silencieux.",
  "used": false
}
```

Champs :
- `topic` — sujet, formulé comme un titre.
- `category` — `epargne` | `banques` | `assurances` | `credit` | `investissement`.
- `angle` — orientation éditoriale (une phrase).
- `slug` (optionnel) — force le nom de fichier.
- `used` — passé à `true` par le script après génération.

## Cycle de vie d'un article

```
content-ideas.json (queue)
   ↓
scripts/generate-article.mjs
   ↓
src/content/articles/<slug>.mdx  (draft: true)
   ↓
PR ai-draft/<slug>
   ↓  ⛔ REVUE HUMAINE OBLIGATOIRE
   ↓
Merge de la PR après relecture + passage à draft: false
   ↓
CI Phase 8 (check, lint, test, build) sur main
   ↓
Déploiement automatique (Cloudflare Pages / Netlify / Vercel)
```

## Ce que la revue humaine doit vérifier

Le checklist figure aussi dans le corps de chaque PR ouverte :

1. **Vérifier les affirmations factuelles ligne par ligne.**
   Le modèle peut inventer un chiffre plausible. Toute affirmation
   quantifiée sans source doit être retirée ou sourcée.
2. **Ajouter les sources dans `sources[]`.** Le pipeline laisse
   `sources: []` si le modèle n'en connaît pas avec certitude.
3. **Ajuster le ton si nécessaire** — Épargner Maroc = calme,
   éditorial, français naturel.
4. **Basculer `draft: false`** pour publier.

## Limites & garde-fous

- Le prompt (`scripts/lib/prompt.mjs`) interdit explicitement d'inventer
  taux, prix et classements. Le modèle peut néanmoins produire une
  affirmation incorrecte — d'où la revue.
- Chaque draft passe par `astro check` (Zod) avant l'ouverture de PR.
  Un frontmatter mal formé ne crée pas de PR.
- Les articles sont écrits en `.mdx` — ils peuvent embarquer les
  composants éditoriaux (`<Callout>`, `<KeyTakeaway>`, `<CalculatorEmbed>`,
  `<Quote>`).

## Coût effectif

En pratique, un article ≈ 1500 tokens en entrée + 3000 tokens en sortie
avec Gemini 2.0 Flash. Le tier gratuit couvre **au moins 500 articles /
mois** — bien au-delà du besoin d'une publication.
