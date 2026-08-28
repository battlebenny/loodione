# Configurations des modules

- `apps.local.json` : catalogue des modules disponible dans une build locale. Les URLs sont saisies sur l'appareil via **Paramètres → Développement → Modules locaux** et ne sont jamais livrées en recette ou en production.
- `apps.android-device.json` et `apps.ios-device.json` : réseau de développement des appareils physiques ; `{{DEVICE_HOST}}` est remplacé par l’IPv4 LAN du Mac au build.
- `apps.recette.json` et `apps.production.json` : fallback public livré avec One ; le registre distant peut ensuite mettre à jour le catalogue au prochain lancement.

## Builds

```bash
npm run dev            # navigateur, configuration locale
npm run build:local    # build native locale
npm run build:android-emulator # build Android Emulator
npm run build:android-device   # build Android appareil physique
npm run build:ios-simulator    # build Simulateur iOS
npm run build:recette  # build de recette
npm run build          # build de production
```

Les builds physiques restent sur le réseau de développement et ne téléchargent jamais le registre distant : elles permettent de tester les PWA et les APIs natives réelles avant livraison. L’IP LAN est détectée automatiquement ; en cas de plusieurs interfaces, forcer le choix avec `LOODI_DEVICE_HOST=192.168.1.42 npm run cap:sync:android-device`.

## Origines du bridge strict

Les URL non nulles de chaque registre compilé forment l’allowlist exacte de `BridgeServer`. Le shell ne communique jamais avec `targetOrigin: '*'` : une iframe doit avoir une origine déclarée dans le registre de son environnement. Les surcharges de développement ne peuvent pas étendre implicitement cette allowlist ; ajouter une origine de test au fichier `apps.<environnement>.json` correspondant, avec son test, avant d’activer son bridge.

Pour recette et production, le bridge dérive ses origines exactes du registre actif. Le registre distant est l’autorité de confiance : ses modules doivent avoir une URL HTTPS, puis chaque message reste vérifié contre l’origine exacte de l’iframe. Les builds device compilent l’allowlist exacte de l’IP LAN sélectionnée.

## Publication du registre distant

Le manifeste public est `https://battlebenny.github.io/loodione/config.json`. Chaque livraison d’un module met à jour ce fichier avec son URL HTTPS Vercel (ou son futur hébergeur). One télécharge et valide le manifeste au démarrage, le conserve au plus 30 jours et ne l’applique qu’au lancement suivant. Si le téléchargement ou la validation échoue, le registre compilé reste utilisé.

### Publier `config.json` avec GitHub Pages

1. Dans GitHub, ouvrir **Settings → Pages** du dépôt `battlebenny/loodione` et choisir **Source: GitHub Actions**.
2. Le workflow `.github/workflows/deploy-public-pages.yml` publie uniquement `public/` à chaque push de ce dossier sur `main`.
3. Modifier `public/config.json`, pousser sur `main` et attendre la fin du workflow **Deploy public assets to GitHub Pages**.
4. Vérifier que `https://battlebenny.github.io/loodione/config.json` répond `200` et contient uniquement des URLs HTTPS de modules livrables.
   Les icônes du registre public doivent utiliser `https://battlebenny.github.io/loodione/icons/<module>.svg` ; elles sont générées dans `public/icons/` par `node apps/one/scripts/colorize-icons.mjs`.
5. Installer ou relancer la build recette/production : le registre est téléchargé puis appliqué au lancement suivant.

`allowNavigation` autorise `https://*.vercel.app` dans Capacitor afin qu’un nouveau module Vercel puisse être chargé sans livraison store. Ajouter un module sur un autre hébergeur exigera une nouvelle version native, ou un domaine commun stabilisé. Ne mettre dans le registre que des déploiements Vercel destinés à rester accessibles.

## Convention locale Mac

Chaque serveur local utilise une URL fixe `https://<module>.loodi.test:<port>`. Le port est volontairement réservé et strict : une bascule automatique de Vite vers un autre port rendrait la configuration du shell fausse.

| Serveur | URL |
| --- | --- |
| Dummy | `https://dummy.loodi.test:4000` |
| Loodi One | `https://one.loodi.test:4001` |
| collec | `https://collec.loodi.test:4002` |
| Mate | `https://mate.loodi.test:4003` |
| Mag | `https://mag.loodi.test:4004` |
| Places | `https://places.loodi.test:4005` |
| Fest | `https://fest.loodi.test:4006` |
| Planner | `https://planner.loodi.test:4007` |
| Friends | `https://friends.loodi.test:4008` |

Le premier module de test est lancé avec `npm run dev:dummy`. Ajouter les noms utilisés dans ce tableau à `/etc/hosts`, puis installer la CA mkcert et générer un certificat local couvrant `*.loodi.test` et `10.0.2.2` avant le premier lancement.

### Identifier un port occupé

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
kill <PID>
```

Utiliser `Ctrl+C` dans le terminal qui a lancé le serveur. `kill <PID>` ne doit être exécuté qu’après avoir identifié le processus : le port strict est volontairement un signal, pas une raison de tuer un autre serveur automatiquement.

## Émulateur Android

La build `npm run build:android-emulator` utilise `apps.emulator.json`. Le dummy est alors préconfiguré sur `https://10.0.2.2:4000` ; les autres modules utilisent les ports `4002–4008` à la même adresse.

```bash
npm run dev:dummy
npm run cap:sync:android-emulator
```

`10.0.2.2` est l’alias de l’émulateur Android vers le loopback du Mac. Installer la CA mkcert dans l’émulateur avant le premier test. La configuration Android ne fait confiance aux CA utilisateur qu’en build debug.

## Appareil Android physique

La build `npm run build:android-device` utilise `apps.android-device.json` et l’IPv4 LAN détectée. Les paramètres **Modules locaux** restent masqués et les anciennes surcharges sont ignorées. `npm run cap:sync:android-device` ajoute temporairement cette IP à `allowNavigation` lors du sync Capacitor, sans modifier le fichier suivi. Installer la CA mkcert sur chaque appareil de test ; si l’IP a changé, le certificat est régénéré et les serveurs Vite doivent être redémarrés.

## Simulateur iOS

La build `npm run build:ios-simulator` utilise `apps.ios-simulator.json`. Le simulateur iOS partage le loopback du Mac : le dummy est donc préconfiguré sur `https://localhost:4000` et les modules sur les ports `4002–4008`.

```bash
npm run dev:dummy
npm run cap:sync:ios-simulator
npm run cap:open:ios
```

## Caméra dans les builds natives

Les modules doivent demander la caméra avec `navigator.mediaDevices.getUserMedia({ video: true })`.
One conserve `allow="camera"` sur chaque iframe ; Capacitor relaie ensuite la demande au système.
Les builds Android et iOS déclarent respectivement `android.permission.CAMERA` et `NSCameraUsageDescription`.
Les URLs de modules doivent rester en HTTPS, notamment pour les tests locaux avec le certificat mkcert.

Pour intégrer une nouvelle PWA, suivre le guide complet [`docs/13_GUIDE_AJOUT_APPLICATION.md`](../../../../docs/13_GUIDE_AJOUT_APPLICATION.md). Friends utilise actuellement le domaine local `friends.loodi.test` et le port réservé `4008`.

## Formatage des registres

Les registres JSON sont formatés avec Prettier, utilisable directement dans VSCodium via l’extension **Prettier - Code formatter** :

```bash
npx prettier --check apps/one/src/config/*.json
npx prettier --write apps/one/src/config/*.json
```
