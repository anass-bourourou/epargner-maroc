# Déploiement — Épargner Maroc

Le site est **100 % statique**. `npm run build` produit `./dist/` : n'importe
quel hébergeur statique convient. Trois cibles recommandées :
Cloudflare Pages, Netlify, Vercel.

## Prérequis

- Node 22 (voir `package.json > engines` si ajouté ultérieurement)
- `npm ci` (build reproductible avec `package-lock.json`)
- Variables d'environnement — voir `.env.example`

## Build & preview locaux

```bash
npm ci
npm run build          # → dist/
npm run preview        # sert dist/ sur http://localhost:4321
```

## Cloudflare Pages

1. **New Project → Connect Git → sélectionner le dépôt**
2. **Framework preset** : Astro
3. **Build command** : `npm run build`
4. **Build output directory** : `dist`
5. **Node version** : `22`
6. **Environment variables** : reprendre `.env.example` — au minimum `SITE_URL`.
7. **Redirections** : Cloudflare Pages lit `public/_redirects` automatiquement.
8. **Headers** : `public/_headers` est également lu automatiquement.

Le domaine `epargnermaroc.ma` est branché via **Custom domains**. HTTPS et
HTTP/3 sont activés par défaut.

## Netlify

1. **Add new site → Import an existing project → GitHub**
2. **Build command** : `npm run build`
3. **Publish directory** : `dist`
4. **Node version** : ajouter `NODE_VERSION=22` dans les variables
   d'environnement (ou dans `netlify.toml` si vous le préférez).
5. `public/_headers` et `public/_redirects` sont pris en compte tels quels.

## Vercel

1. **Add new → Project → Import Git Repository**
2. **Framework preset** : Astro
3. **Build command** : `npm run build` · **Output** : `dist`
4. **Node version** : 22
5. Vercel n'utilise **pas** `_headers` / `_redirects` : traduire en
   `vercel.json` :
   ```json
   {
     "headers": [
       { "source": "/_astro/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}] },
       { "source": "/fonts/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}] }
     ]
   }
   ```

## Domaine + DNS

- Enregistrement A (apex) → IP de l'hébergeur.
- CNAME `www` → domaine du projet chez l'hébergeur.
- Rediriger `www` → apex via `_redirects` (déjà préparé).
- HSTS (`Strict-Transport-Security`) : déjà présent dans `_headers`.
- Configurer `sitemap-index.xml` dans Google Search Console et Bing
  Webmaster Tools après la mise en production.

## Post-déploiement

Vérifier après le premier déploiement :

- [ ] `/rss.xml` retourne un flux XML valide (valider avec
      https://validator.w3.org/feed/).
- [ ] `/sitemap-index.xml` référence `sitemap-0.xml`, qui liste les URLs
      publiques (pas `/design-system/`).
- [ ] `/.well-known/security.txt` accessible.
- [ ] `/humans.txt` accessible.
- [ ] `/site.webmanifest` sert du JSON valide.
- [ ] JSON-LD Organization + WebSite visibles avec
      https://validator.schema.org/ sur la homepage.
- [ ] JSON-LD Article + BreadcrumbList visibles sur un article.
- [ ] Google Search Console : « Test URL en direct » ne remonte pas
      d'erreur d'indexation.
- [ ] PageSpeed Insights (mobile) affiche des Core Web Vitals verts.

## CI

`.github/workflows/ci.yml` exécute `check`, `lint`, `test` et `build`
sur chaque `push` et chaque `pull_request` vers `main`, puis archive
`dist/` pendant 7 jours. À adapter si vous migrez sur GitLab/Bitbucket.

## Rollback

Cloudflare Pages, Netlify et Vercel conservent l'historique des
déploiements. En cas de régression, un « Rollback » sur le déploiement
précédent est immédiat — aucune manœuvre côté DNS n'est requise tant
que le domaine reste attaché au projet.
