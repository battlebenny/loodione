# Loodi One

Shell Capacitor qui intègre les modules PWA Loodi dans des iframes persistantes pendant le POC, puis dans des WebViews natives pour le MVP.

La documentation de référence est dans [`docs/`](docs/00_ARCHITECTURE_CURRENT.md), synchronisé avec le vault Obsidian.

## Environnements de modules

| Cible | Commande de build | Configuration |
| --- | --- | --- |
| Navigateur local Mac | `npm run dev` | `apps.local.json` |
| Android Emulator | `npm run build:android-emulator` | `apps.emulator.json` |
| Simulateur iOS | `npm run build:ios-simulator` | `apps.ios-simulator.json` |
| Recette | `npm run build:recette` | `apps.recette.json` |
| Production (`main`) | `npm run build` | `apps.production.json` |

La build émulateur s’installe avec `npm run cap:sync`, puis Android Studio. Elle expose le dummy sur `https://10.0.2.2:4000`.

Le simulateur iOS utilise `https://localhost:4000` pour le dummy, puis `localhost:4002–4007` pour les modules. Après `npm run build:ios-simulator && npm run cap:sync`, ouvrir Xcode avec `npm run cap:open:ios`.

## Packages npm partagés

Le monorepo est la source de `@loodi/bridge` (contrat shell ↔ module) et de `@loodi/ui` (composants présentationnels et design tokens). Les deux packages sont publiés publiquement sur npm ; les PWA dans leurs dépôts, dont Collec, les déclarent toujours avec une plage semver npm — jamais avec `file:`.

`@loodi/ui` conserve la feuille de style complète rétrocompatible. Dans une PWA, importer une seule fois :

```ts
import '@loodi/ui/styles.css'
```

Elle inclut les tokens et le CSS des composants ; aucune configuration Tailwind ni `@source` vers le monorepo n’est nécessaire.

Pour le chargement optimisé, importer les entrées ciblées et leur CSS :

```ts
import { MiniHeader } from '@loodi/ui/mini-header'
import { BottomNav } from '@loodi/ui/bottom-nav'
import { Launcher } from '@loodi/ui/launcher'

import '@loodi/ui/tokens.css'
import '@loodi/ui/mini-header.css'
import '@loodi/ui/bottom-nav.css'
import '@loodi/ui/launcher.css'
```

Les tokens DTCG pour Penpot/Open Design sont disponibles via `@loodi/ui/tokens.dtcg.json`.

### Développement One + Collec

Dans Collec, les manifestes et `package-lock.json` restent sur les versions npm publiées :

```bash
npm install @loodi/bridge@^0.1.0 @loodi/ui@^0.1.0
```

Pour substituer ces deux packages uniquement sur la machine locale :

```bash
# terminal dans loodi-one
cd packages/@loodi/bridge && npm link
cd ../ui && npm link
cd ../../..
npm run build:packages:watch

# terminal dans Collec
npm link @loodi/bridge @loodi/ui
```

Le watch génère `dist/` en continu ; Vite de Collec consomme alors ces artefacts liés. `npm link` ne doit pas modifier `package.json` ou `package-lock.json` de Collec. Avant un commit Collec, vérifier :

```bash
git diff -- package.json package-lock.json
```

Pour revenir aux versions publiées dans Collec, supprimer les liens sans les enregistrer puis reconstruire `node_modules` depuis le lockfile :

```bash
npm unlink --no-save @loodi/bridge @loodi/ui
npm ci
```

### Versionner et publier

La procédure détaillée — premier bootstrap, versionnage, CI/CD OIDC et incident de release — est dans [PACKAGES.md](PACKAGES.md). La recommandation est de publier depuis une CI GitHub Actions protégée ; le poste local ne sert qu'au bootstrap ou au secours.

Publier les packages séparément, après avoir choisi la version semver appropriée (`patch` pour correctif, `minor` pour ajout compatible, `major` pour rupture de contrat/API) :

```bash
npm run build:packages
npm run test:run -w @loodi/one

cd packages/@loodi/bridge
npm pack --dry-run
npm version patch
npm publish --access public

cd ../ui
npm pack --dry-run
npm version patch
npm publish --access public
```

`prepack` reconstruit chaque package et `files` limite les archives npm à `dist/` et au README. Une publication nécessite un compte npm authentifié et les droits sur le scope `@loodi` ; elle n'est jamais effectuée automatiquement par ce dépôt.

Après une modification de version, revenir à la racine et synchroniser `package-lock.json` avant de committer la release :

```bash
npm install --package-lock-only --ignore-scripts
```

## Serveurs locaux Mac

Les modules ont des URL stables sous `*.loodi.test`, avec des ports stricts :

| Serveur | URL |
| --- | --- |
| Dummy | `https://dummy.loodi.test:4000` |
| Loodi One | `https://one.loodi.test:4001` |
| Collec | `https://collec.loodi.test:4002` |
| Mate | `https://mate.loodi.test:4003` |
| Mag | `https://mag.loodi.test:4004` |
| Places | `https://places.loodi.test:4005` |
| Fest | `https://fest.loodi.test:4006` |
| Sessions | `https://sessions.loodi.test:4007` |

Le dummy se lance avec `npm run dev:dummy`. Chaque PWA adopte le même principe dans son `vite.config.ts` : hostname explicite, port dédié, `strictPort: true` et certificat mkcert partagé.

### Identifier ou arrêter un serveur

```bash
# Exemple : qui écoute le port du dummy ?
lsof -nP -iTCP:4000 -sTCP:LISTEN

# Après avoir identifié le PID et confirmé qu'il est bien orphelin :
kill <PID>
```

Un serveur lancé dans ton terminal se ferme proprement avec `Ctrl+C`. Ne jamais tuer un PID non identifié.

## Prérequis locaux

Les noms `*.loodi.test` doivent résoudre vers `127.0.0.1` dans `/etc/hosts`, et la CA mkcert doit être installée avec `mkcert -install`. Pour un émulateur ou un appareil Android de test, il faut aussi installer cette CA via ADB : voir [Installer la CA mkcert sur Android](docs/05_Developpement_Local_Modules.md#installer-la-ca-mkcert-sur-android). Voir le [guide local des modules](docs/05_Developpement_Local_Modules.md) pour la configuration de Collec et [la distribution](docs/04_Distribution.md) pour l’émulateur Android.
