# Configurations des modules

- `apps.local.json` : catalogue des modules disponible dans une build locale. Les URLs sont saisies sur l'appareil via **Paramètres → Développement → Modules locaux** et ne sont jamais livrées en recette ou en production.
- `apps.android-device.json`, `apps.ios-device.json`, `apps.recette.json` et `apps.production.json` : fallback stable GitHub Pages. Le registre distant peut ensuite mettre à jour le catalogue au prochain lancement.

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

Les builds physiques n'embarquent aucune URL LAN : elles récupèrent le registre HTTPS publié, ce qui permet d'ajouter un module sans publier une nouvelle version de One.

## Origines du bridge strict

Les URL non nulles de chaque registre compilé forment l’allowlist exacte de `BridgeServer`. Le shell ne communique jamais avec `targetOrigin: '*'` : une iframe doit avoir une origine déclarée dans le registre de son environnement. Les surcharges de développement ne peuvent pas étendre implicitement cette allowlist ; ajouter une origine de test au fichier `apps.<environnement>.json` correspondant, avec son test, avant d’activer son bridge.

Le canal recette et production autorise uniquement `https://battlebenny.github.io`. Les modules sont publiés sous `https://battlebenny.github.io/loodione/modules/<module-id>/` ; un manifeste ne peut introduire ni HTTP ni une autre origine.

## Publication du registre distant

Le manifeste public est `https://battlebenny.github.io/loodione/config.json`. Chaque livraison d’un module publie son build statique dans `modules/<module-id>/`, puis met à jour ce fichier avec son URL HTTPS. One télécharge et valide le manifeste au démarrage, le conserve au plus 30 jours et ne l’applique qu’au lancement suivant. Si le téléchargement ou la validation échoue, le registre compilé reste utilisé.

Les URLs Vercel de preview peuvent servir aux tests navigateur, mais ne sont jamais ajoutées au registre ni à l’allowlist native.

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
| Sessions | `https://sessions.loodi.test:4007` |

Le premier module de test est lancé avec `npm run dev:dummy`. Ajouter les noms utilisés dans ce tableau à `/etc/hosts`, puis installer la CA mkcert et générer un certificat local couvrant `*.loodi.test` et `10.0.2.2` avant le premier lancement.

### Identifier un port occupé

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
kill <PID>
```

Utiliser `Ctrl+C` dans le terminal qui a lancé le serveur. `kill <PID>` ne doit être exécuté qu’après avoir identifié le processus : le port strict est volontairement un signal, pas une raison de tuer un autre serveur automatiquement.

## Émulateur Android

La build `npm run build:android-emulator` utilise `apps.emulator.json`. Le dummy est alors préconfiguré sur `https://10.0.2.2:4000` ; les autres modules utilisent les ports `4002–4007` à la même adresse.

```bash
npm run dev:dummy
npm run cap:sync:android-emulator
```

`10.0.2.2` est l’alias de l’émulateur Android vers le loopback du Mac. Installer la CA mkcert dans l’émulateur avant le premier test. La configuration Android ne fait confiance aux CA utilisateur qu’en build debug.

## Appareil Android physique

La build `npm run build:android-device` utilise le fallback GitHub Pages puis rafraîchit le registre distant. Les paramètres **Modules locaux** restent masqués et les anciennes surcharges sont ignorées. Une CA mkcert n’est nécessaire que pour les tests locaux sur émulateur, jamais pour ce canal HTTPS public.

## Simulateur iOS

La build `npm run build:ios-simulator` utilise `apps.ios-simulator.json`. Le simulateur iOS partage le loopback du Mac : le dummy est donc préconfiguré sur `https://localhost:4000` et les modules sur les ports `4002–4007`.

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
