# Configurations des modules

- `apps.local.json` : catalogue des modules disponible dans une build locale. Les URLs sont saisies sur l'appareil via **Paramètres → Développement → Modules locaux** et ne sont jamais livrées en recette ou en production.
- `apps.android-device.json` : configuration compilée pour un appareil Android physique. Elle contient uniquement Collec sur `https://192.168.0.109:4002`.
- `apps.recette.json` : URLs des déploiements de recette. Renseigner ici les domaines Vercel associés à chaque branche ou à leurs aliases de recette.
- `apps.production.json` : URLs publiques correspondant à la branche GitHub `main`.

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

Pour un appareil physique, saisir les URLs HTTPS joignables depuis cet appareil : IP LAN du Mac ou URL de tunnel. `localhost` ne cible pas le Mac depuis un téléphone Android.

## Origines du bridge strict

Les URL non nulles de chaque registre compilé forment l’allowlist exacte de `BridgeServer`. Le shell ne communique jamais avec `targetOrigin: '*'` : une iframe doit avoir une origine déclarée dans le registre de son environnement. Les surcharges de développement ne peuvent pas étendre implicitement cette allowlist ; ajouter une origine de test au fichier `apps.<environnement>.json` correspondant, avec son test, avant d’activer son bridge.

`apps.recette.json` ne contient actuellement aucune URL : le bridge strict y est donc deny-all. Renseigner l’origine de recette validée dans ce fichier avant tout test intégré ; ne pas substituer une valeur approchée ou un wildcard.

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

La build `npm run build:android-device` utilise `apps.android-device.json` et Collec sur `https://192.168.0.109:4002`. L’adresse `192.168.0.109` est l’IP LAN du Mac ; le Pixel doit être sur le même réseau. `10.0.2.2` ne doit pas être utilisée dans cette build : elle est réservée à l’émulateur Android.

Les paramètres **Modules locaux** sont masqués dans cette build. Les anciennes valeurs de `loodi:localModuleUrls`, notamment une ancienne URL `10.0.2.2`, sont ignorées ; elles ne peuvent pas remplacer l’URL LAN compilée. Le bridge strict utilise exclusivement l’allowlist compilée et contient exactement `https://192.168.0.109:4002`.

Le certificat partagé `.certs/cert.pem` doit contenir les noms suivants : `localhost`, `*.loodi.test`, `10.0.2.2` et `192.168.0.109`. Ne jamais committer le certificat ni la clé privée. Avant de régénérer un certificat existant, en conserver une copie de sauvegarde puis utiliser :

```bash
mkdir -p .certs
mkcert -cert-file .certs/cert.pem -key-file .certs/key.pem \
  localhost '*.loodi.test' 10.0.2.2 192.168.0.109
```

Installer la CA sur le Pixel :

```bash
adb devices
adb -s <SERIAL> push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/Download/loodi-rootCA.crt
```

Puis ouvrir **Paramètres → Sécurité et confidentialité → Plus de paramètres de sécurité → Chiffrement et identifiants → Installer un certificat** et sélectionner le fichier copié.

Commandes complètes :

```bash
npm run build:android-device
npm run cap:sync:android-device
```

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
