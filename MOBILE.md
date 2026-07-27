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
| Appareil Android physique | `npm run cap:sync:android-device` | `apps.android-device.json` | IPv4 LAN du Mac : `4000–4007` |
| Simulateur iOS | `npm run cap:sync:ios-simulator` | `apps.ios-simulator.json` | `localhost:4000–4002` |
| Appareil iOS physique | `npm run cap:sync:ios-device` | `apps.ios-device.json` | IPv4 LAN du Mac : `4000–4007` |
| Recette | `npm run build:recette` puis sync natif | `apps.recette.json` | selon la configuration de recette |
| Production | `npm run build` puis sync natif | `apps.production.json` | URLs publiques |

`10.0.2.2` est l’adresse spéciale de l’émulateur Android. Elle ne doit jamais être utilisée pour un Pixel physique.

## Bridge strict, origines et caméra

Le bridge est strict : One accepte uniquement un message dont `event.source` est la `contentWindow` de l’iframe enregistrée, dont `event.origin` correspond exactement à l’origine de son URL configurée, et dont le schéma est valide. Chaque message envoyé par One utilise cette même origine exacte comme `targetOrigin` — jamais `*`.

Les origines de modules acceptées proviennent des registres compilés sur les builds de développement, et du registre distant validé au lancement seulement en recette et production. Le port fait partie de l’origine.

| Cible | Origine de One | Allowlist des modules |
| --- | --- | --- |
| Navigateur Mac | `https://one.loodi.test:4001` | `https://collec.loodi.test:4002`, `https://mate.loodi.test:4003`, `https://mag.loodi.test:4004`, `https://places.loodi.test:4005`, `https://fest.loodi.test:4006`, `https://sessions.loodi.test:4007`, `https://dummy.loodi.test:4000` |
| Émulateur Android | `https://app` | `https://10.0.2.2:4002`, `https://10.0.2.2:4000` |
| Android physique | `https://app` | `https://*.loodi.test:4000–4007` |
| Simulateur iOS | `capacitor://app` | `https://localhost:4002`, `https://localhost:4000` |
| Appareil iOS physique | `capacitor://app` | `https://*.loodi.test:4000–4007` |
| Recette | `https://app` / `capacitor://app` selon la plateforme | fallback public + registre distant |
| Production native | Android : `https://app` ; iOS : `capacitor://app` | fallback public + registre distant |

Collec doit donc initialiser `BridgeClient` en mode strict avec l’origine de One de la cible comme `targetOrigin`. One calcule son allowlist séparément pour chaque build ; une URL saisie dans l’outil de développement ne l’élargit pas.

La caméra est demandée directement par Collec via les APIs web. One conserve `allow="camera"` sur chaque iframe, `android.permission.CAMERA` dans le manifest Android et `NSCameraUsageDescription` dans l’Info.plist iOS. Un refus reste un état métier affiché par Collec : One ne recharge pas l’iframe et ne remplace pas l’écran par sa home.

### Recette manuelle caméra — appareils réels

Après `npm run cap:sync:android-device` puis réinstallation depuis Android Studio, et `npm run cap:sync:ios-device` puis réinstallation depuis Xcode, valider sur un appareil de chaque plateforme :

1. Ouvrir Collec, aller au scanner et accepter la permission caméra ; scanner un code puis revenir à Collec.
2. Réinitialiser l’autorisation dans les réglages système, la refuser ; vérifier que l’erreur reste dans Collec, sans écran d’accueil One ni rechargement.
3. Revenir au scanner et demander à nouveau l’autorisation ; sur un refus définitif, vérifier le parcours vers les réglages système proposé par Collec.
4. Basculer vers la saisie manuelle puis revenir à la collection ; vérifier que le même runtime Collec est conservé (route, formulaire et navigation basse), y compris après l’apparition de la feuille de permission.

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

### Java et Android Studio

Gradle a besoin d’un JDK pour fonctionner en ligne de commande. Android Studio
embarque déjà le sien : il s’agit du **JDK intégré** (JetBrains Runtime), pas
d’un Java Runtime installé globalement sur macOS.

Si une commande comme `./gradlew assembleDebug` renvoie :

```text
The operation couldn’t be completed. Unable to locate a Java Runtime.
```

configurer temporairement le terminal pour utiliser le JDK d’Android Studio :

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

Pour conserver cette configuration dans les nouveaux terminaux, ajouter ces
deux lignes au fichier `~/.zshrc`. Le chemin peut différer si Android Studio
est installé ailleurs.

Dans Android Studio, vérifier aussi **Android Studio → Settings → Build,
Execution, Deployment → Build Tools → Gradle → Gradle JDK** et sélectionner
**Embedded JDK**. Sur macOS, le menu peut s’appeler **Android Studio →
Preferences**.

Il n’est donc pas nécessaire d’installer un Java Runtime séparé pour builder
depuis Android Studio.

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

Le script détecte l’IPv4 privée du Mac et compile les URLs HTTPS `https://<IP>:<port>`. Il régénère le certificat mkcert si cette IP n’est pas déjà couverte et injecte temporairement l’origine exacte dans la configuration Capacitor pendant le sync. Après une régénération, redémarrer les serveurs Vite des modules.

```bash
npm run cap:sync:android-device
npm run cap:open:android
```

S’il y a plusieurs interfaces réseau, forcer l’adresse :

```bash
LOODI_DEVICE_HOST=192.168.1.42 npm run cap:sync:android-device
```

Dans Android Studio, sélectionner le Pixel connecté et cliquer sur **Run** pour reconstruire et réinstaller l’APK. Une simple synchronisation ne met pas à jour l’APK déjà installé.

Pour générer l’APK depuis l’interface Android Studio, utiliser **Build →
Generate App Bundles or APKs → Generate APKs**. Android Studio utilise alors
son JDK intégré et produit l’équivalent de :

```bash
cd android
./gradlew assembleDebug
```

L’APK est générée dans
`android/app/build/outputs/apk/debug/app-debug.apk`. La notification affichée
par Android Studio après le build permet également d’utiliser **locate** pour
ouvrir directement le dossier. Pour l’installer avec Android Studio, utiliser
**Run** avec le Pixel sélectionné ; pour l’installer manuellement, transférer
le fichier sur le téléphone puis autoriser l’installation depuis cette source.

Ne modifier ni `config.json` ni le registre distant pour ce flux : il est réservé à recette et production. Les URL locales et le certificat mkcert doivent être testés avant une livraison de module.

## Workflow simulateur iOS

```bash
npm run cap:sync:ios-simulator
npm run cap:open:ios
```

Dans Xcode, choisir le simulateur puis lancer le scheme **App**. Les modules locaux utilisent `https://localhost:<port>`.

## Workflow appareil iOS physique

L’iPhone charge les modules sur l’IPv4 LAN détectée du Mac, avec le même mécanisme que la cible Android. Installer la CA mkcert sur l’iPhone et lui accorder la confiance complète.

```bash
npm run cap:sync:ios-device
npm run cap:open:ios
```

En cas de plusieurs interfaces réseau :

```bash
LOODI_DEVICE_HOST=192.168.1.42 npm run cap:sync:ios-device
```

Dans Xcode, choisir l’iPhone connecté, vérifier l’équipe de signature puis lancer le scheme **App**. Installer la CA mkcert sur l’iPhone et l’activer dans **Réglages → Général → Informations → Réglages de confiance des certificats**.

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

Pour tester rapidement sur un téléphone, aucune signature release n’est
nécessaire. Une APK debug est signée automatiquement avec le keystore de
debug Android.

Après `npm run cap:sync:<cible>`, deux parcours sont possibles.

Depuis Android Studio :

1. ouvrir le projet avec `npm run cap:open:android` ;
2. sélectionner le téléphone ou l’émulateur ;
3. cliquer sur **Run** pour construire et installer l’application.

Pour générer seulement l’APK, utiliser **Build → Generate App Bundles or APKs
→ Generate APKs**.

En ligne de commande, les commandes Gradle usuelles sont :

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

Pour une APK release distribuée hors du Play Store, créer une seule fois un
keystore privé :

```bash
keytool -genkey -v -keystore "$HOME/loodi-one.keystore" \
  -alias loodi-one -keyalg RSA -keysize 2048 -validity 10000
```

Puis ajouter une configuration `signingConfigs.release` dans
`android/app/build.gradle` et fournir les mots de passe via des variables
d’environnement. Ne jamais mettre le keystore ou les mots de passe dans Git.
Conserver le keystore dans un coffre-fort : il sera nécessaire pour publier
les futures mises à jour de la même application.

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
| Erreur TLS | CA non installée ou certificat sans l’IP actuelle | Réinstaller la CA ; relancer le sync device puis redémarrer les serveurs Vite si le certificat a été régénéré |
| `Unable to locate a Java Runtime` | Le terminal ne connaît pas le JDK embarqué par Android Studio | Définir `JAVA_HOME` vers `Android Studio.app/Contents/jbr/Contents/Home`, ou builder depuis Android Studio |
| Port déjà utilisé | Ancien serveur encore actif | Identifier le PID avec `lsof` avant toute fermeture |

## Fichiers de référence

- [package.json](package.json) : scripts racine ;
- [apps/one/package.json](apps/one/package.json) : scripts Vite et modes ;
- [apps/one/src/apps.ts](apps/one/src/apps.ts) : sélection de l’environnement ;
- [apps/one/src/config](apps/one/src/config) : registries par cible ;
- [capacitor.config.json](capacitor.config.json) : configuration Capacitor ; l’IP device est ajoutée uniquement pendant le sync ;
- [PACKAGES.md](PACKAGES.md) : publication des packages npm.
