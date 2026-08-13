# @loodi/assets

Assets de marque et de shell versionnés pour l’écosystème Loodi.

```ts
import { brandAssets, resolveAssetUrl } from '@loodi/assets'

brandAssets.logo
resolveAssetUrl('brand/logo', { baseUrl: 'https://assets.example.com/loodi/v1' })
```

Sans `baseUrl`, les SVG sont inclus dans le livrable du consommateur. Les copies obtenues au build ne sont pas des sources éditables.
