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

`MiniHeader` consomme les SVG versionnés de `@loodi/assets`. Il n’attend aucun chemin à la racine de l’application hôte. Une PWA standalone peut sélectionner une base d’assets explicite :

```tsx
<MiniHeader assetBaseUrl="https://assets.example.com/loodi/v1" {...props} />
```

Sans `assetBaseUrl`, les assets sont inclus dans le livrable du consommateur. Le logo occupe le même slot que le retour ; le wordmark et le nom de module restent visibles sur les deux types de page.

## AuthBottomSheet et AccountBottomSheet

Les sheets d’authentification sont des composants de présentation contrôlés. Elles n’importent ni Supabase, ni clé, ni routeur et ne persistent aucune donnée personnelle : seuls les brouillons e-mail/pseudo existent pendant leur ouverture.

```tsx
import { AuthBottomSheet, AccountBottomSheet } from '@loodi/ui/auth-bottom-sheet'
import '@loodi/ui/auth-bottom-sheet.css'

const auth = useAuth() // fourni par @loodi/auth dans l’application hôte

<AuthBottomSheet
  open={authOpen}
  state={auth.state === 'handle-required' ? 'handle-required' : 'anonymous'}
  onClose={() => setAuthOpen(false)}
  onSignInWithGoogle={auth.signInWithGoogle}
  onSignInWithMagicLink={auth.signInWithMagicLink}
  onCompleteHandle={auth.completeHandle}
  onAbandonIncompleteAccount={auth.abandonIncompleteAccount}
/>
<AccountBottomSheet
  open={accountOpen}
  playerName={auth.session?.handle}
  onClose={() => setAccountOpen(false)}
  onOpenAccount={() => navigate('/account')}
  onSignOut={auth.signOut}
/>
```

`AuthBottomSheet` couvre Google, lien magique, erreurs, succès et le pseudo requis ; `AccountBottomSheet` couvre l’accès au compte et la confirmation de déconnexion. `onOverlayChange` permet au host de masquer sa navigation pendant une sheet. One relie `onOpenAccount` à sa page partagée ; une app standalone le relie à `/account`. `styles.css` inclut aussi ces styles.

## BottomNav

Par défaut, `BottomNav` conserve le modèle historique : quatre `tabs` au maximum et le bouton Applications/Loodi. `onAppsTap` reste alors requis.

```tsx
<BottomNav
  tabs={tabs}
  activeTab={activeTab}
  onTabTap={setActiveTab}
  onAppsTap={openLauncher}
/>
```

Pour une PWA sans launcher, `showApps={false}` affiche jusqu’à cinq onglets fournis et rend `onAppsTap` optionnel. Les icônes Lucide `settings`, `library-big`, `user` et `users`, ainsi que les icônes de navigation Loodi, sont reconnues.

```tsx
<BottomNav
  showApps={false}
  tabs={[{ id: 'settings', icon: 'settings', label: 'Paramètres', badgeCount: 3 }]}
  onTabTap={setActiveTab}
  onSwipeUp={openSheet}
/>
```

`badgeCount` s’affiche seulement au-dessus de zéro et est plafonné visuellement à `99+` ; le libellé accessible conserve le compte exact. `onSwipeUp` est un callback générique optionnel, déclenché par un glissement vertical vers le haut d’au moins 40px. Tous les styles de la navigation, y compris le badge (`status-danger` / `status-on-solid`), sont fournis par `@loodi/ui/bottom-nav.css` : aucune classe Tailwind hôte n’est requise.

La version publiée suit semver. Les changements incompatibles de props, de comportement ou de tokens imposent une version majeure.
