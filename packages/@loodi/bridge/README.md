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

## Développement local

Voir le guide racine de Loodi One pour le workflow `npm link`. Le lien substitue seulement le package installé localement : il ne doit jamais être enregistré dans le `package.json` ou le lockfile d'une PWA.
