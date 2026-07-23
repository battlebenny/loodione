# @loodi/bridge

Contrat typé entre le shell Loodi One et un module PWA. Il ne dépend ni de React ni de Capacitor.

```ts
import { BridgeClient } from '@loodi/bridge'

const bridge = new BridgeClient()
await bridge.call('setBottomNav', [{ id: 'home', icon: 'home', label: 'Accueil' }])

bridge.on('loodi:themechange', ({ theme }) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
})
```

La version publiée suit semver. Les ajouts rétrocompatibles sont mineurs ; toute rupture du contrat shell ↔ module impose une version majeure.

## Navigation et disponibilité

`ready()` et `navigate(path)` reprennent exactement les messages legacy déjà compris par One : `loodi:ready` et `loodi:navigate`.

```ts
bridge.ready()
bridge.navigate('/scanner')
```

Depuis une iframe, ils les envoient au shell. En standalone, ils sont volontairement des no-ops : l'API métier du module et ses routes ne changent pas.

`setBottomNav([])` masque toute la navigation du shell, y compris son contrôle « Loodi ». Une liste non vide déclare les onglets du module ; One les complète avec son contrôle statique « Loodi », qui ouvre le launcher des applications.

Les événements et appels legacy restent pris en charge pendant la migration : header (`setHeaderActions`, `setHeaderOptions`, `loodi:headeraction`), retour (`loodi:back`), thème, onglets, scroll et `loodi:overlaychange`.

## Gestes de navigation

Un module qui sait traiter les gestes de navigation le déclare explicitement ; sans cette déclaration, One conserve le geste. Cette capacité est indépendante de `setHeaderOptions({ canGoBack })`.

```ts
await bridge.setNavigationGestureCapability(true)

bridge.on('loodi:navigationrequest', ({ requestId, direction, source }) => {
  const handled = direction === 'back' ? router.back() : router.forward()
  bridge.respondToNavigationRequest({ requestId, handled })
})
```

Chaque `loodi:navigationresult` doit reprendre exactement le `requestId` reçu et contenir un booléen `handled`. One ignore les réponses invalides, non corrélées, tardives ou émises par un autre module. Il attend au plus 500 ms ; indisponibilité du bridge, délai dépassé ou réponse invalide sont traités comme `handled: false` sans fermer l’app. Un back non géré ne ferme One que sur Android natif ; il est absorbé sur le Web et iOS. Un forward non géré est toujours un no-op.

## Transport strict (opt-in)

Le POC conserve le transport legacy (`'*'`) par défaut. Avant de faire transiter identité, token, collection ou handoff, activer le mode strict des deux côtés : le client vérifie `event.source`, `event.origin` et le schéma ; One vérifie la source, l'allowlist et le schéma puis calcule un `targetOrigin` depuis l'URL de l'iframe.

```ts
const bridge = new BridgeClient({
  targetOrigin: 'https://one.loodi.test:4001',
  security: { mode: 'strict' },
})
```

Dans One, la configuration correspondante est :

```ts
new BridgeServer(callbacks, {
  security: {
    mode: 'strict',
    allowedOrigins: ['https://collec.loodi.test:4002'],
  },
})
```

Origines actuellement documentées pour les essais locaux : shell `https://one.loodi.test:4001`, Collec `https://collec.loodi.test:4002` et dummy `https://dummy.loodi.test:4000`. L'origine effective du shell dans chaque WebView de recette et de production doit être arrêtée et ajoutée à cette allowlist avant toute donnée réelle ; le mode strict reste désactivé tant que cette décision n'est pas versionnée. Le transport reste compatible avec une iframe persistante et avec une WebView persistante qui expose le même contrat `postMessage`.

## Développement local

Voir le guide racine de Loodi One pour le workflow `npm link`. Le lien substitue seulement le package installé localement : il ne doit jamais être enregistré dans le `package.json` ou le lockfile d'une PWA.
