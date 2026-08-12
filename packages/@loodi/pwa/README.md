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

Les couleurs de module peuvent servir aux icônes et fonds teintés. Les textes et actions utilisent l’orange Loodi lorsque le contraste du module n’atteint pas WCAG AA.

Le prompt d’installation réserve par défaut la place de la `BottomNav` Loodi (56 px). Une application sans navigation basse peut surcharger `--loodi-pwa-bottom-nav-height: 0px`.
