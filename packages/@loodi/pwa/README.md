# @loodi/pwa

Socle PWA partagé de l’écosystème Loodi.

```tsx
import { LoodiPwa } from '@loodi/pwa'
import '@loodi/pwa/styles.css'

<LoodiPwa appName="Friends" standalone={!isShell} />
```

Le helper Vite configure le manifeste, le précache du shell et le service worker :

```ts
import { createLoodiPwaPlugin } from '@loodi/pwa/vite'

createLoodiPwaPlugin({ appName: 'Friends', themeColor: '#D84A77' })
```

## Tester la PWA en développement

Le service worker est désactivé en développement par défaut. Pour tester localement le manifeste, le service worker et le prompt d’installation, active le même opt-in dans Vite et le runtime :

```ts
const pwaDevelopment = true

// vite.config.ts
createLoodiPwaPlugin({ appName: 'Collec', development: pwaDevelopment })
```

```tsx
<LoodiPwa appName="Collec" standalone={!isShell} development={pwaDevelopment} />
```

Le runtime résout automatiquement l’URL interne du service worker de développement de `vite-plugin-pwa`; l’application ne fournit aucun chemin. Le serveur Vite doit être servi en HTTPS ou sur `localhost`. Chrome n’émet `beforeinstallprompt` que lorsqu’il juge l’application installable : l’événement n’est donc pas garanti à chaque rechargement. Tester également un build de production avant livraison.

Les couleurs de module peuvent servir aux icônes et fonds teintés. Les textes et actions utilisent l’orange Loodi lorsque le contraste du module n’atteint pas WCAG AA.

Le prompt d’installation réserve par défaut la place de la `BottomNav` Loodi (56 px). Une application sans navigation basse peut surcharger `--loodi-pwa-bottom-nav-height: 0px`.
