# @loodi/ui

Design system React public de Loodi : composants présentationnels et tokens partagés. Les composants reçoivent exclusivement des props et des callbacks ; le bridge, le router, les stores, Dexie et Capacitor restent dans l'application consommatrice.

```tsx
import { BottomNav, MiniHeader } from '@loodi/ui'
import '@loodi/ui/styles.css'
```

L'import historique reste disponible : `styles.css` est compilé et inclut les tokens ainsi que le CSS des trois composants. Aucun réglage Tailwind n'est requis côté consommateur.

Pour une PWA optimisée, charger les seuls composants utilisés :

```tsx
import { MiniHeader } from '@loodi/ui/mini-header'
import { BottomNav } from '@loodi/ui/bottom-nav'
import { Launcher } from '@loodi/ui/launcher'

import '@loodi/ui/tokens.css'
import '@loodi/ui/mini-header.css'
import '@loodi/ui/bottom-nav.css'
import '@loodi/ui/launcher.css'
```

Les tokens sont disponibles sans React via `@loodi/ui/tokens.css`. Le fichier `@loodi/ui/tokens.dtcg.json` est l'export DTCG destiné à Penpot/Open Design. Les deux artefacts sont générés depuis `src/tokens.source.json` ; ne pas les modifier à la main.

Les bundles ESM externalisent `react`, `react-dom` et `lucide-react`.

`MiniHeader` attend les assets `/loodi-monogram.svg` et `/loodi-monogram-dark.svg` dans l'application hôte.

La version publiée suit semver. Les changements incompatibles de props, de comportement ou de tokens imposent une version majeure.
