# Loodi-One — Agent Instructions

Projet : application native (Capacitor) servant de conteneur unifié aux PWA de l'écosystème Loodi. Chaque module est une PWA chargée dans une iframe.

L'ancien shell vanilla JS dans `www/` a été migré vers React/Vite/Tailwind dans `apps/one/`.

## Documentation & accès fichiers

### Vault Obsidian

- **Racine du vault** : `~/Library/CloudStorage/SynologyDrive-battle_benny/Obsidian/battle_benny/Projets/`
- **Un dossier de docs par projet Loodi** : `Loodi/`, `Loodi-one/`, `Loodi-mate/`, `Loodi-mag/`, `Loodi-places/`, `Loodi-fest/`, `Loodi-session/`, `Loodi-asso/`…
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
- `docs/shell-architecture.md` — Documentation d'architecture

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
| `loodi` | `https://loodi.vercel.app` | ✅ Actif |
| `loodi-dev` | `http://localhost:8080/dev/dummy.html` | ✅ Dev |
| `loodi-mate` | — | 📝 À configurer |
| `loodi-mag` | — | 📝 À configurer |
| `loodi-places` | — | 📝 À configurer |
| `loodi-fest` | — | 📝 À configurer |
| `loodi-sessions` | — | 📝 À configurer |

## Architecture

- **Stack** : Capacitor 8 + React 19 + Vite 7 + Tailwind v4 + TypeScript 5.7
- **Modules PWA** : chargés dans des `<iframe>` cross-origin. Bridge via `postMessage`.
- **Détection shell** : le shell ajoute `?loodi-shell=1` à l'URL. Le module peut inclure `packages/@loodi/bridge` pour utiliser `BridgeClient`.
- **Thème** : 3 modes — Auto (suit `prefers-color-scheme`), Clair, Sombre. Toggle via page Paramètres. Broadcast `loodi:themechange` aux modules. Class-based Tailwind (`@custom-variant dark`).
- **MiniHeader** : 2 boutons flottants top-right (user + more). Le dropdown "more" contient un lien vers Paramètres.
- **Bottom nav** : pilule flottante centrée (max 448px), glassmorphism, indicateur coulissant. 1er bouton fixe = grille (ouvre le launcher).
- **Launcher** : bottom sheet avec grille 3 colonnes. Apps issues de `fetchAppsFromConfig()` + fallback local.
- **Paramètres** : page plein écran dans le shell (pas dans une iframe), rubrique "Affichage" avec radio thème.

## Bridge JS (`@loodi/bridge`)

- `BridgeClient` — classe typée pour les modules PWA
- `bridge.getUser()`, `bridge.getToken()`, `bridge.getCollection()`, `bridge.getNetworkStatus()`
- `bridge.openApp(appId, path?)`, `bridge.closeApp()`, `bridge.showAppSwitcher()`
- `bridge.setBottomNav(tabs[])`, `bridge.onBottomNavTap(callback)`, `bridge.queueAction(action)`
- Événements : `loodi:ready`, `loodi:titlechange`, `loodi:badgecount`, `loodi:headeractions`, `loodi:scroll`, `loodi:themechange`, `loodi:error`

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

### Ponytail simplifications

- iframes au lieu de WebViews natives (pas de SW dans iframes cross-origin)
- Auth mockée (`getUser`, `getToken` factices)
- Queue d'actions offline en mémoire (console.log)
- Thème : détection système uniquement (pas de toggle utilisateur)
- Scroll header : via bridge seulement (cross-origin iframe → pas de scroll natif)
