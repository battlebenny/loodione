# Build et livraison mobile

Ce guide décrit le cycle complet de Loodi-One : choisir une cible, construire le shell, synchroniser les assets dans Capacitor, lancer l’application native et préparer une livraison.

Toutes les commandes sont à lancer depuis la racine `loodi-one/`.

## La règle à retenir

Une build Vite choisit la registry des modules selon son mode. `npx cap sync` ne reconstruit pas le shell : il copie simplement le dernier contenu de `apps/one/dist/` dans le projet natif.

Pour éviter de synchroniser une ancienne build émulateur sur un appareil physique, utiliser les commandes `cap:sync:<cible>` qui enchaînent build et sync.

| Cible | Commande recommandée | Registry | URLs locales |
| --- | --- | --- | --- |
| Navigateur Mac | `npm run dev` | `apps.local.json` | `*.loodi.test` |
| Émulateur Android | `npm run cap:sync:android-emulator` | `apps.emulator.json` | `10.0.2.2:4000–4002` |
| Appareil Android physique | `npm run cap:sync:android-device` | `apps.android-device.json` | IP LAN du Mac, actuellement `192.168.0.109` |
| Simulateur iOS | `npm run cap:sync:ios-simulator` | `apps.ios-simulator.json` | `localhost:4000–4002` |
| Recette | `npm run build:recette` puis sync natif | `apps.recette.json` | selon la configuration de recette |
| Production | `npm run build` puis sync natif | `apps.production.json` | URLs publiques |

`10.0.2.2` est l’adresse spéciale de l’émulateur Android. Elle ne doit jamais être utilisée pour un Pixel physique.

## Préparer l’environnement local

Installer les dépendances et vérifier le projet :

```bash
npm ci
npm run test:run
```

Les modules locaux doivent être démarrés séparément. Le dummy de développement se lance depuis ce dépôt :

```bash
npm run dev:dummy
```

Les serveurs PWA utilisent les ports suivants :

| Module | Port | Navigateur Mac |
| --- | ---: | --- |
| Dummy | 4000 | `https://dummy.loodi.test:4000` |
| Loodi-One | 4001 | `https://one.loodi.test:4001` |
| Collec | 4002 | `https://collec.loodi.test:4002` |
| Mate | 4003 | `https://mate.loodi.test:4003` |
| Mag | 4004 | `https://mag.loodi.test:4004` |
| Places | 4005 | `https://places.loodi.test:4005` |
| Fest | 4006 | `https://fest.loodi.test:4006` |
| Sessions | 4007 | `https://sessions.loodi.test:4007` |

Pour vérifier qu’un serveur écoute :

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
lsof -nP -iTCP:4002 -sTCP:LISTEN
```

## Workflow navigateur Mac

```bash
npm run dev
```

Ce workflow utilise le mode Vite `development`, donc `apps.local.json`. Il ne nécessite ni build de production ni synchronisation Capacitor.

## Workflow Android émulateur

```bash
npm run cap:sync:android-emulator
npm run cap:open:android
```

Dans Android Studio, sélectionner l’émulateur puis lancer l’application avec **Run**. Les modules locaux sont chargés via `https://10.0.2.2:<port>`.

## Workflow Android appareil physique

Le Mac et le Pixel doivent être sur le même réseau Wi-Fi. Vérifier l’adresse LAN du Mac, puis la reporter dans [apps.android-device.json](apps/one/src/config/apps.android-device.json) et dans le certificat si elle a changé.

```bash
npm run cap:sync:android-device
npm run cap:open:android
```

Dans Android Studio, sélectionner le Pixel connecté et cliquer sur **Run** pour reconstruire et réinstaller l’APK. Une simple synchronisation ne met pas à jour l’APK déjà installé.

La configuration actuelle expose :

- Collec : `https://192.168.0.109:4002` ;
- Dummy : `https://192.168.0.109:4000`.

Pour un appareil physique, installer une fois la CA mkcert sur le Pixel :

```bash
mkcert -install
adb devices
adb -s <SERIAL> push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/Download/loodi-rootCA.crt
```

Puis installer le certificat depuis les paramètres de sécurité du Pixel. Le certificat du projet doit couvrir `192.168.0.109` :

```bash
mkdir -p .certs
mkcert -cert-file .certs/cert.pem -key-file .certs/key.pem \
  localhost '*.loodi.test' 10.0.2.2 192.168.0.109
```

Les fichiers `.certs/` ne doivent jamais être commités.

## Workflow simulateur iOS

```bash
npm run cap:sync:ios-simulator
npm run cap:open:ios
```

Dans Xcode, choisir le simulateur puis lancer le scheme **App**. Les modules locaux utilisent `https://localhost:<port>`.

## Recette et production

La build de recette ne possède pas de commande de sync dédiée :

```bash
npm run build:recette
npx cap sync android
# ou : npx cap sync ios
```

La build de production construit aussi les packages partagés :

```bash
npm run build
npx cap sync android
npx cap sync ios
```

Après le sync, ouvrir le projet natif avec `npm run cap:open:android` ou `npm run cap:open:ios`, puis produire l’artefact depuis l’IDE.

## Ce que font exactement build et sync

```text
build:<cible>
  └─ tsc + vite build --mode <cible>
     └─ apps/one/dist/ avec la registry de la cible

cap sync <plateforme>
  └─ copie apps/one/dist/ dans android/ ou ios/
     └─ met à jour les plugins Capacitor
```

Commandes utiles :

```bash
# Construire uniquement les packages partagés
npm run build:packages

# Construire le shell en production
npm run build

# Synchroniser le dernier dist sans le reconstruire
npx cap sync android
npx cap sync ios

# Ouvrir les projets natifs
npm run cap:open:android
npm run cap:open:ios
```

Éviter `npm run cap:sync` seul après avoir travaillé sur plusieurs cibles : il synchronise le dernier `dist`, quelle que soit la cible qui l’a produit.

## Livraison native

### Android

Le debug se fait normalement depuis Android Studio après `cap:sync:<cible>`. En ligne de commande, les commandes Gradle usuelles sont :

```bash
cd android
./gradlew assembleDebug
./gradlew installDebug
```

Une livraison signée nécessite de configurer la signature Android dans Gradle et de garder les keystores hors du dépôt. Ensuite, produire selon le canal visé :

```bash
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB pour le Play Store
```

### iOS

Après `npm run cap:sync:ios-simulator`, ouvrir Xcode avec `npm run cap:open:ios`, sélectionner l’équipe et les profils de signature, puis utiliser **Product → Archive** et **Distribute App**. Les certificats et profils de signature restent gérés par Xcode, jamais dans Git.

## Checklist avant livraison

- lancer `npm run test:run` ;
- choisir explicitement la cible mobile ;
- utiliser `npm run cap:sync:<cible>` ;
- vérifier le réseau, les ports et le certificat ;
- lancer l’application depuis Android Studio ou Xcode pour réinstaller la build ;
- tester au moins l’ouverture de Collec, le dummy, le bridge et le retour dans le shell ;
- vérifier que les secrets, certificats et keystores ne sont pas suivis par Git.

## Dépannage rapide

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| L’app utilise `10.0.2.2` sur le Pixel | Dernière build produite en mode émulateur | Relancer `npm run cap:sync:android-device`, puis **Run** dans Android Studio |
| Les modifications ne changent pas dans l’app | `cap sync` a copié un ancien `dist` ou l’APK n’a pas été réinstallé | Refaire le workflow complet de la cible |
| Écran blanc ou iframe inaccessible | PWA arrêtée, mauvais port ou Mac/Pixel sur des réseaux différents | Vérifier les processus avec `lsof`, le Wi-Fi et l’URL LAN |
| Erreur TLS | CA non installée ou certificat sans l’IP actuelle | Réinstaller la CA et régénérer `.certs/cert.pem` |
| Port déjà utilisé | Ancien serveur encore actif | Identifier le PID avec `lsof` avant toute fermeture |

## Fichiers de référence

- [package.json](package.json) : scripts racine ;
- [apps/one/package.json](apps/one/package.json) : scripts Vite et modes ;
- [apps/one/src/apps.ts](apps/one/src/apps.ts) : sélection de l’environnement ;
- [apps/one/src/config](apps/one/src/config) : registries par cible ;
- [capacitor.config.json](capacitor.config.json) : configuration Capacitor ;
- [PACKAGES.md](PACKAGES.md) : publication des packages npm.
