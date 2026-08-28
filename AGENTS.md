# Loodi-One — Agent Instructions

Projet : application native (Capacitor) servant de conteneur unifié aux PWA de l'écosystème Loodi. Le POC charge chaque module dans une iframe ; la cible MVP de production est une WebView native persistante par module, avec le même contrat bridge.

L'ancien shell vanilla JS dans `www/` a été migré vers React/Vite/Tailwind dans `apps/one/`.

## Documentation & accès fichiers

### Vault Obsidian

- **Racine du vault** : `~/Library/CloudStorage/SynologyDrive-battle_benny/Obsidian/battle_benny/Projets/`
- **Un dossier de docs par projet Loodi** : `Loodi/`, `Loodi-one/`, `Loodi-mate/`, `Loodi-mag/`, `Loodi-places/`, `Loodi-fest/`, `Loodi-planner/`, `Loodi-asso/`…
- **`loodi-one/docs/` est un symlink** vers `…/Projets/Loodi-one/Docs/`. Éditer `docs/` **=** éditer le fichier Obsidian (synchro automatique, pas d'outil dédié requis).

### Accès aux docs des autres projets Loodi

Les docs des projets frères sont **lisibles directement** via le chemin du vault (ex. `…/Projets/Loodi-mate/Docs/01_PRD.md`). **Aucun MCP Obsidian n'est installé** — et ce n'est pas nécessaire : la lecture brute de fichiers suffit pour un vault petit et structuré (`00_`, `01_`…).

### ⚠️ Règle absolue : écritures hors du dossier de travail

Le périmètre de travail de l'agent est `loodi-one/`. **Par défaut, l'agent ne lit que ce dossier.**

Toute **écriture, édition ou suppression en dehors de `loodi-one/`** (y compris dans d'autres dossiers `Loodi/`, `Loodi-mate/` du vault, ou tout autre chemin) est **interdite sans confirmation explicite de l'utilisateur, action par action**. La lecture est tolérée pour le contexte (elle n'est pas destructrice), mais aucune mutation hors `loodi-one/` ne se fait sans demande préalable et accord exprès.

Cette règle existe car la configuration ZCode ne définit pas de verrou technique d'écriture au dossier de travail : la sécurité repose sur la discipline procédurale documentée ici.

## Structure

- `apps/one/` — App web du shell (React 19 + Vite 7 + Tailwind v4 + TypeScript)
- `packages/@loodi/ui/` — Composants partagés (Header, BottomNav, Launcher, FAB)
- `packages/@loodi/bridge/` — Pont typé `BridgeClient` pour la communication postMessage
- `android/`, `ios/` — Projets natifs Capacitor
- `docs/00_ARCHITECTURE.md` — Architecture de référence (POC iframe et cible WebView native)
- `docs/01_DESIGN_GOVERNANCE.md` — Sources de vérité design et workflow
- `docs/03_Integration_PWA.md` — Intégration des modules PWA
- `docs/04_Distribution.md` — Distribution native et beta

## Lancer le projet

```bash
# Dev (hot reload)
npm run dev              # Vite dev server → http://localhost:5173

# Production build
npm run build            # Build apps/one/ → apps/one/dist/

# Build packages seuls
npm run build:packages

# iOS
npm run cap:open:ios     # Ouvre Xcode → build + lancer sur simulateur

# Android
npm run cap:open:android # Ouvre Android Studio → build + lancer sur émulateur

# Sync apps/one/dist/ → natif (après build)
npm run cap:sync
```

Le `webDir` Capacitor pointe vers `apps/one/dist/`.

## Modules

| ID | URL | Statut |
|----|-----|--------|
| `loodi-collec` | `https://loodicollec.vercel.app` | ✅ Actif |
| `loodi-dev` | `http://localhost:8080/dev/dummy.html` | ✅ Dev |
| `loodi-mate` | — | 📝 À configurer |
| `loodi-mag` | — | 📝 À configurer |
| `loodi-places` | — | 📝 À configurer |
| `loodi-fest` | — | 📝 À configurer |
| `loodi-planner` | — | 📝 À configurer |
| `loodi-friends` | `https://loodifriends.vercel.app` | ✅ Actif |

## Architecture

- **Stack** : Capacitor 8 + React 19 + Vite 7 + Tailwind v4 + TypeScript 5.7
- **Modules PWA** : POC en `<iframe>` cross-origin via `postMessage` ; production en WebViews natives dédiées derrière le même bridge.
- **Détection shell** : le shell ajoute `?loodi-shell=1` à l'URL. Le module peut inclure `packages/@loodi/bridge` pour utiliser `BridgeClient`.
- **Thème** : 3 modes — Auto (suit `prefers-color-scheme`), Clair, Sombre. Toggle via page Paramètres. Broadcast `loodi:themechange` aux modules. Class-based Tailwind (`@custom-variant dark`).
- **MiniHeader** : 2 boutons flottants top-right (user + more). Le dropdown "more" contient un lien vers Paramètres.
- **Bottom nav** : pilule flottante centrée (max 448px), glassmorphism, indicateur coulissant. Au plus quatre onglets de module, suivis du bouton fixe **Loodi** (grille) qui ouvre le launcher.
- **Launcher** : surface flottante avec grille 4 colonnes. Apps issues de `fetchAppsFromConfig()` + fallback local.
- **Paramètres** : page plein écran dans le shell (pas dans une iframe), rubrique "Affichage" avec radio thème.

## Bridge JS (`@loodi/bridge`)

- `BridgeClient` — classe typée pour les modules PWA
- `bridge.getUser()`, `bridge.getToken()`, `bridge.getCollection()`, `bridge.getNetworkStatus()`
- `bridge.openApp(appId, path?)`, `bridge.closeApp()`, `bridge.showAppSwitcher()`
- `bridge.setBottomNav(tabs[])`, `bridge.onBottomNavTap(callback)`, `bridge.queueAction(action)`
- Événements effectivement pris en charge : `loodi:themechange`, `loodi:tabtap`, `loodi:badgecount`, `loodi:error`, `loodi:overlaychange`, `loodi:scroll`

## TDD (Test-Driven Development)

Règle absolue : **pas de code de production sans test qui échoue d'abord**.

### Cycle RED → GREEN → REFACTOR

1. **RED** — écrire un test qui échoue pour la fonctionnalité souhaitée
2. **Vérifier RED** — `npm run test:run -w @loodi/one` — le test doit échouer (pas d'erreur de syntaxe)
3. **GREEN** — écrire le minimum de code pour passer le test
4. **Vérifier GREEN** — `npm run test:run -w @loodi/one` — tous les tests verts
5. **REFACTOR** — nettoyer, garder les tests verts
6. **Build** — `npm run build -w @loodi/one`

### Infrastructure

- Framework : **vitest** (config dans `apps/one/vite.config.ts`)
- Environment : jsdom (navigateur simulé)
- Setup : `@testing-library/jest-dom` dans `src/test/setup.ts`
- Scripts : `npm test -w @loodi/one` (watch), `npm run test:run -w @loodi/one` (CI)

### Code existant

Pour du code existant sans test : écrire un test qui documente le comportement actuel avant toute modification. Pas de dérogation.

## Design Context

Avant toute modification visuelle ou ajout de composant, lire `PRODUCT.md` et `DESIGN.md` à la racine du projet.

- **PRODUCT.md** — stratégie produit : register, utilisateurs, personnalité de marque, principes, accessibilité (WCAG AA).
- **DESIGN.md** — système visuel : palette (orange brûlé `#ca4a16`, neutres chauds), typographie (Playfair Display + DM Sans), glassmorphism comme signature du shell, règles nommées.

Les décisions visuelles suivent DESIGN.md ; les décisions stratégiques suivent PRODUCT.md.

### Ponytail simplifications

- iframes au lieu de WebViews natives (pas de SW dans iframes cross-origin)
- Auth mockée (`getUser`, `getToken` factices)
- Queue d'actions offline en mémoire (console.log)
- Thème : choix persistant Auto, Clair ou Sombre ; Auto suit le système
- Scroll header : via bridge seulement (cross-origin iframe → pas de scroll natif)


<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->
