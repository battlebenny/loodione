---
name: Loodi One
description: Conteneur natif unifié pour l'écosystème Loodi de modules PWA
colors:
  brand-primary: "#ca4a16"
  brand-primary-hover: "#b33d0f"
  brand-link: "#1b2a4a"
  brand-accent: "#F5C842"
  bg-light: "#fafaf8"
  bg-dark: "#1a1a18"
  text-light: "#353533"
  text-dark: "#e8e7e4"
  text-primary: "#1A1A18"
  text-primary-dark: "{color.text-dark}"
  text-secondary: "#6B6B60"
  text-secondary-dark: "#A3A39A"
  surface-glass: "rgba(255,255,255,0.7)"
  surface-glass-dark: "rgba(17,24,39,0.7)"
  surface-subtle: "#F2F0EC"
  surface-subtle-dark: "#3A3A35"
  border-subtle: "rgba(0,0,0,0.05)"
  border-subtle-dark: "rgba(255,255,255,0.1)"
  settings-bg: "#f5f5f0"
  settings-bg-dark: "#161615"
  module-collec: "#ca4a16"
  module-mate: "#2E8B57"
  module-mag: "#3570A8"
  module-places: "#9B59B6"
  module-fest: "#E67E22"
    module-planner: "#007C91"
  module-friends: "#D84A77"
  module-dev: "#6B7280"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "clamp(1.25rem, 4vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  caption:
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
  mono:
    fontFamily: "'JetBrains Mono', monospace"
rounded:
  pill: "9999px"
  lg: "0.75rem"
  xl: "1rem"
  "2xl": "1.25rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  icon-button:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.pill}"
    size: "36px"
  bottom-nav:
    backgroundColor: "{colors.surface-glass}"
    rounded: "{rounded.pill}"
    height: "56px"
  launcher-sheet:
    backgroundColor: "{colors.surface-glass}"
    rounded: "{rounded.2xl}"
  settings-card:
    backgroundColor: "rgba(255,255,255,0.7)"
    rounded: "{rounded.xl}"
---

# Design System: Loodi One

## 1. Overview

**Creative North Star: « Le salon de jeu confiant »**

Loodi One est un cadre qui s'efface pour laisser la place aux modules. Comme une table de jeu bien conçue : solide, chaleureuse, discrète. Le design privilégie les surfaces vitreuses (glassmorphism), les bords doux et une palette terreuse rehaussée d'accents orangés.

Le shell ne fait pas spectacle — il crée un écrin pour que chaque module PWA (collection, mate, mag, places, fest, planner) exprime sa propre identité via sa couleur d'accent. L'unité vient du conteneur, la diversité des contenus.

**Ce que ce système rejette :** le SaaS froid (bleu-gris corporatif), le look « jouet » (pastel, arrondi excessif, cartoon), et les interfaces qui crient plus fort que le contenu.

**Key Characteristics:**
- Shell vitreux, modules pleins — la transparence signale le cadre, pas le contenu
- Palette chaude et naturelle (orange brûlé, ivoire, noir profond) — pas de primaires saturées dans le shell
- Typographie contrastée : sérif pour l'élégance, sans pour la lisibilité
- Transitions douces (spring, fade) — jamais de bounce ni d'élasticité
- Thème clair/sombre complet, respecte `prefers-color-scheme`

## 2. Colors

Une palette terreuse et chaleureuse, dominée par un orange brûlé (`#ca4a16`) qui sert d'ancre visuelle dans tout le shell. Les neutres sont chauds sans être crémeux — un beige pierre en clair, un anthracite profond en sombre.

### Primary
- **Orange Brûlé** (`#ca4a16` / oklch(0.54 0.145 45)) : bouton radio du thème, accent des interactions, lien avec le module Loodi principal.
- **Orange Brûlé Hover** (`#b33d0f`) : version foncée pour les états hover du primaire.

### Secondary
- **Navy Lien** (`#1b2a4a` / oklch(0.245 0.045 265)) : utilisé pour les liens et le texte des labels, ancre visuelle secondaire.

### Accent secondaire
- **Jaune pion** (`color.brand-accent` / `--color-brand-accent`, `#F5C842`) : accent de marque secondaire pour les logos, visuels, highlights et remplissages de graphiques. Il n’est jamais associé à du texte blanc et ne remplace pas l’orange brûlé pour les actions principales.

Aucun token de graphique dédié : les graphiques utilisent directement `color.brand-primary` ou `color.brand-accent`.

### Neutral
- **Blanc chaud** (`#fafaf8`) : fond du shell en mode clair, aligné sur Loodi Collec.
- **Ivoire** (`#f5f5f0`) : fond de la page Paramètres en mode clair.
- **Anthracite** (`#1a1a18` / oklch(0.17 0.005 110)) : fond du shell en mode sombre.
- **Noir doux** (`#161615`) : fond Paramètres en mode sombre.
- **Encre** (`#353533` / oklch(0.31 0.006 110)) : texte du corps en mode clair.
- **Papier** (`#e8e7e4` / oklch(0.90 0.005 100)) : texte du corps en mode sombre.

### Tokens Collec : surfaces et texte

Les tokens suivants prolongent le set Core sans modifier les tokens historiques. Ils reprennent les valeurs visibles de Collec : aucune couleur proche ne doit leur être substituée.

| Token | Clair | Sombre | Rôle |
| --- | --- | --- | --- |
| `--color-surface-base` | `#FFFFFF` | — | Surface opaque de base ; remplace le legacy « paper » de Loodi Collec. |
| `--color-surface-base-dark` | — | `rgb(255 255 255 / 5%)` | Équivalent sombre translucide de la surface opaque de base. |
| `--color-surface-subtle` | `#F2F0EC` | — | Fonds secondaires, contrôles groupés et zones discrètes. |
| `--color-surface-subtle-dark` | — | `#3A3A35` | Équivalent sombre des surfaces subtiles. |
| `--color-text-primary` | `#1A1A18` | — | Titres, valeurs et contenu des champs. |
| `--color-text-primary-dark` | — | alias de `--color-text-dark` (`#E8E7E4`) | Équivalent sombre du texte primaire. |
| `--color-text-secondary` | `#6B6B60` | — | Labels, aides et métadonnées. |
| `--color-text-secondary-dark` | — | `#A3A39A` | Équivalent sombre du texte secondaire. |

Les fonds de page réutilisent `--color-bg-light` (`#FAFAF8`) et `--color-bg-dark` (`#1A1A18`) : il n’existe pas de token `background-page`. `--color-surface-base` / `--color-surface-base-dark` remplacent le legacy « paper » de Collec ; ils ne réemploient pas `surface-glass`, dont l’opacité et l’usage restent réservés aux surfaces vitreuses du shell.

### Tokens résolus par thème

Les PWA consomment les alias `--color-theme-*` pour éviter de dupliquer des sélecteurs `:root` / `.dark`. Dans `tokens.css`, `:root` résout les valeurs claires et `.dark` leurs variantes sombres sans modifier les tokens canoniques.

| Alias | Clair | Sombre |
| --- | --- | --- |
| `--color-theme-bg` | `--color-bg-light` | `--color-bg-dark` |
| `--color-theme-surface-base` | `--color-surface-base` | `--color-surface-base-dark` |
| `--color-theme-surface-subtle` | `--color-surface-subtle` | `--color-surface-subtle-dark` |
| `--color-theme-text-primary` | `--color-text-primary` | `--color-text-primary-dark` |
| `--color-theme-text-secondary` | `--color-text-secondary` | `--color-text-secondary-dark` |
| `--color-theme-border-subtle` | `--color-border-subtle` | `--color-border-subtle-dark` |

Les six rôles de chaque statut sont de même résolus sous la forme `--color-theme-status-<statut>-<rôle>`.

### Statuts sémantiques

Les statuts préservent l’intention des palettes legacy red, amber, emerald et blue sans exposer une API de nuances numériques. Ils servent aux états et retours métier, jamais à remplacer l’action principale de marque.

| Rôle | Usage |
| --- | --- |
| `solid` / `solid-hover` | Fond d’un badge, d’une alerte ou d’une action explicitement liée à un statut ; `solid-hover` est réservé à son état interactif. |
| `surface` / `surface-strong` | Fond informatif discret / fond de mise en avant plus marqué. |
| `border` | Contour de l’alerte, du champ ou du badge statutaire. |
| `text` | Texte et icônes sur une surface de même statut. |
| `--color-status-on-solid` | Texte et icônes blancs sur tous les fonds `solid`. |

| Rôle | Danger | Warning | Success | Info |
| --- | --- | --- | --- | --- |
| `solid` | `#DC2626 / #DC2626` | `#B45309 / #B45309` | `#047857 / #047857` | `#2563EB / #2563EB` |
| `solid-hover` | `#B91C1C / #B91C1C` | `#92400E / #92400E` | `#065F46 / #065F46` | `#1D4ED8 / #1D4ED8` |
| `surface` | `#FEF2F2 / #450A0A` | `#FFFBEB / #451A03` | `#ECFDF5 / #022C22` | `#EFF6FF / #172554` |
| `surface-strong` | `#FEE2E2 / #7F1D1D` | `#FEF3C7 / #78350F` | `#D1FAE5 / #064E3B` | `#DBEAFE / #1E3A8A` |
| `border` | `#FECACA / #991B1B` | `#FDE68A / #92400E` | `#A7F3D0 / #065F46` | `#BFDBFE / #1E40AF` |
| `text` | `#B91C1C / #FECACA` | `#92400E / #FDE68A` | `#047857 / #A7F3D0` | `#1D4ED8 / #BFDBFE` |

Chaque paire est notée `clair / sombre`. Les contrastes vérifiés au minimum sont les suivants :

| Contraste | Danger | Warning | Success | Info |
| --- | --- | --- | --- | --- |
| `on-solid` sur `solid` | 4,83:1 | 5,02:1 | 5,48:1 | 5,17:1 |
| `text` sur `surface` (clair / sombre) | 5,91:1 / 11,16:1 | 6,84:1 / 12,03:1 | 5,21:1 / 11,81:1 | 6,16:1 / 10,34:1 |
| `text` sur `surface-strong` (clair / sombre) | 5,30:1 / 6,93:1 | 6,37:1 / 7,28:1 | 4,84:1 / 7,58:1 | 5,49:1 / 7,29:1 |

### Module Colors
Chaque module PWA possède sa propre couleur d'accent, utilisée comme fond d'icône dans le launcher et comme ring de sélection :
- **Loodi** `#ca4a16` (orange brûlé)
- **Mate** `#2E8B57` (vert forêt)
- **Mag** `#3570A8` (bleu ciel profond)
- **Places** `#9B59B6` (violet)
- **Fest** `#E67E22` (orange feu)
- **Planner** `#007C91` (turquoise cyan)
- **Friends** `#D84A77` (rose framboise)

La couleur Friends est réservée aux icônes, fonds teintés et rings de sélection. Elle ne doit pas être utilisée seule comme couleur de texte sur fond clair : son contraste est inférieur à WCAG AA.

### Named Rules
**La Règle de la Transparence.** Les surfaces du shell sont toujours partiellement transparentes (60–90% d'opacité) avec `backdrop-blur`. La transparence signale « ceci est le cadre » — les modules, eux, sont pleins et opaques.

## 3. Typography

**Display Font:** Playfair Display (avec Georgia, serif en fallback)
**Body Font:** DM Sans (avec Inter, system-ui, sans-serif en fallback)
**Mono Font:** JetBrains Mono (avec monospace en fallback)

**Character :** Un couple contrasté — Playfair Display apporte l'élégance éditoriale, DM Sans la lisibilité utilitaire. Le sérif est réservé aux titres (settings, launcher), le sans au corps et aux labels. Ensemble, ils disent « sérieux mais pas austère ».

### Hierarchy
- **Display** (Playfair Display 400, clamp(1.25rem, 4vw, 1.75rem), 1.2) : titres de page (Paramètres). Usage rare — un titre par écran maximum.
- **Body** (DM Sans 400, 0.9375rem, 1.5) : texte courant, descriptions. Max 65–75ch. Couleur `#353533` en clair, `#e8e7e4` en sombre.
- **Label** (DM Sans 500 0.75rem, 1.3, 0.05em letter-spacing, uppercase) : en-têtes de section (Applications, Affichage), badges de la bottom nav.
- **Caption** (DM Sans 500, 0.6875rem, 1.2) : labels des boutons de navigation (bottom nav tabs), noms d'apps dans le launcher.
- **Mono** (JetBrains Mono) : réservé au contenu technique.

## 4. Elevation

Loodi One utilise une approche **vitreuse** plutôt qu'ombragée. La profondeur est créée par la transparence et le flou (`backdrop-blur`), pas par des ombres portées. Les ombres existent mais sont secondaires — elles apportent une légère délimitation, pas une hiérarchie dramatique.

L'élévation se lit à trois niveaux :
1. **Le fond** — opaque, sans flou (le body)
2. **Les surfaces du shell** — translucides avec `backdrop-blur-md` à `backdrop-blur-xl` (MiniHeader, BottomNav, Launcher)
3. **Le backdrop de modale** — `bg-black/30 backdrop-blur-sm`, qui assombrit le contenu derrière le launcher

### Shadow Vocabulary
- **Ambient Low** (`0 1px 2px 0 rgba(0,0,0,0.05)` ou `shadow-sm`) : icônes du MiniHeader au repos.
- **Ambient Mid** (`0 10px 15px -3px rgba(0,0,0,0.05)` ou `shadow-lg`) : barre de navigation flottante.
- **Elevated** (`0 20px 25px -5px rgba(0,0,0,0.05)` ou `shadow-xl`) : bottom sheet du launcher.
- **Emphasis** (`0 0 25px 0 rgba(0,0,0,0.25)`) : halo centré pour signaler visuellement un bloc important. Ne pas l’utiliser comme focus ring ni comme ombre d’élévation.

## 5. Components

### Icon Buttons (MiniHeader)
- **Shape:** circular, 36×36px (`rounded-full`)
- **Rest:** fond `white/60` (clair) ou `white/10` (sombre), `backdrop-blur-md`, bordure `1px solid black/5` (clair) ou `white/10` (sombre)
- **Hover:** fond `white/80` (clair) ou `white/20` (sombre), transition de couleur 200ms
- **Dropdown menu:** `rounded-xl`, fond `white/80` (clair) ou `gray-900/80` (sombre), `backdrop-blur-xl`, items en `text-sm` avec icône Lucide 16px
- **Retour:** bouton fantôme 36×36px, sans fond ni bordure. Il utilise `chevron-left` de la bibliothèque Lucide connectée.
- **Logo:** le MiniHeader utilise l’asset `loodi-monogram.svg` / `loodi-monogram-dark.svg` (wordmark), jamais une approximation typographique.
- **Icônes:** toutes les icônes du shell proviennent de la bibliothèque Lucide connectée au fichier Penpot.

### Bottom Navigation
- **Shape:** pill flottante centrée, `border-radius: 9999px`, hauteur 56px, max-width 448px
- **Background:** `white/60` (clair) ou `gray-900/70` (sombre), bordure `1px solid black/5` (clair) ou `white/10` (sombre), ombre ambiante basse.
- **Mode launcher (défaut, `showApps=true`):** jusqu’à quatre onglets fournis, puis le bouton fixe **Loodi**.
- **Mode PWA (`showApps=false`):** jusqu’à cinq onglets fournis, sans bouton launcher ; `onAppsTap` est alors optionnel.
- **Bouton Loodi:** dernier élément du mode launcher, icône `grid-2x2` Lucide + label « Loodi » ; ouvre le launcher « Toutes les applications ».
- **Tabs:** colonne de largeur égale, hauteur 40px ; icône Lucide 20px (dont `settings`) + label 11px centré. Actif = orange brûlé `--color-brand-primary`, inactif = transparence de `text-light` / `text-primary-dark`.
- **Badge:** affiché uniquement pour `badgeCount > 0`, avec `99+` au-delà ; fond `--color-theme-status-danger-solid`, texte `--color-status-on-solid`. Son libellé accessible annonce le compte complet.
- **Swipe:** `onSwipeUp` est un callback présentationnel optionnel pour un glissement vers le haut d’au moins 40px ; il ne déclenche aucune navigation implicite.
- **Indicator:** barre coulissante, `bg-black/5` (clair) ou `bg-white/10` (sombre), `rounded-lg`, transition 300ms avec spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Bottom sheets et toasters avec navigation basse

Règle de fonctionnement obligatoire dans One et dans toute PWA embarquée :

- Toute BottomSheet, dès son ouverture, signale `onOverlayChange(true)` (ou `loodi:overlaychange` via le bridge) afin de masquer la BottomNav. À sa fermeture — bouton, backdrop, validation, annulation ou démontage — elle signale systématiquement `false`.
- Un toaster ne masque jamais la BottomNav. Il est affiché visuellement juste au-dessus d’elle, hors de la safe area basse : `bottom = safe-area-inset-bottom + hauteur de BottomNav + espacement` ; son z-index reste supérieur à celui de la navigation.
- Les BottomSheets respectent `--safe-area-inset-bottom` pour que leurs actions restent atteignables sur appareil natif.
- Les messages de succès sont courts ; les erreurs restent visibles plus longtemps. Ils utilisent le composant toaster partagé et les tokens de statut, jamais un message persistant dans la page.

### Launcher
- **Backdrop:** `bg-black/20 backdrop-blur-sm`, tap pour fermer
- **Sheet:** flottante, centrée, `max-width: 448px`, marge basse 16px, rayon 28px, fond `white/60` (clair) ou `gray-900/70` (sombre), `backdrop-blur-md`, bordure subtile et `shadow-lg`.
- **Drag handle:** barre 36×4px, `rounded-full`, `bg-black/20` (clair) ou `bg-white/20` (sombre)
- **Grid:** 4 colonnes fixes, `gap-3`.
- **App card:** conteneur d’icône 48×48px, `rounded-xl`, fond teinté (`app.color + '20'`), label 11px medium centré en `text-black/70`/`text-white/70`. L’icône et le label sont centrés dans leur axe pour conserver l’alignement quel que soit le nom du module.

### Settings Page
- **Full screen overlay:** `z-40`, fond `#f5f5f0` (clair) ou `#161615` (sombre)
- **Card:** `rounded-xl`, fond `white/70` (clair) ou `white/5` (sombre), bordure `1px solid black/5` (clair) ou `white/10` (sombre)
- **Radio button:** cercle 20px, bordure `2px`, sélectionné = `border-[#ca4a16]` + cercle intérieur `bg-[#ca4a16]` 10px
- **Divider:** `border-b border-black/5` (clair) ou `border-white/5` (sombre)

### Module Iframes
- Container: `absolute inset-0 w-full h-full border-0`
- Actif: `z-10` (visible, interactif)
- Inactif: `z-0 pointer-events-none opacity-0` (caché mais en mémoire)

## 6. Suivi migration Collec

Lot ultérieur, hors périmètre de cette livraison : adopter `surface-subtle`, `text-primary` et `text-secondary` dans les composants Paramètres de Collec ; conserver `bg-light` / `bg-dark` pour les fonds de page et `bg-white` / `bg-white/5` pour les surfaces opaques. Vérifier visuellement ce lot en modes clair et sombre avant livraison.

### Intégration One et exceptions volontaires

One consomme les tokens de `@loodi/ui` via `@loodi/ui/tokens.css`. Les couleurs strictement identiques ont été remplacées par les tokens de marque et de surface vitrée sombre ; les composants UI utilisent également `text-primary-dark`, alias de `text-dark`, sans changement de rendu.

Les éléments suivants ne consomment pas un token UI dédié, car aucun token existant ne reproduit leur rendu à l’identique : les transparences `black/*` et `white/*` des contrôles et textes de `Settings.tsx`, le backdrop et le handle de `BottomSheet.tsx`, les surfaces opaques `bg-white/70`, `bg-white/60` et `bg-white/5`, ainsi que `transparent`, `color-mix()` et `--app-color` dynamique dans les CSS de `@loodi/ui`. Ils restent volontaires : les remplacer par `surface-subtle`, `text-primary` ou `text-secondary` modifierait visuellement One.

## 7. Do's and Don'ts

### Do:
- **Do** utiliser `backdrop-blur` sur toutes les surfaces du shell pour signaler la couche « cadre »
- **Do** laisser chaque module exprimer sa couleur d'accent — le shell reste neutre (orange brûlé uniquement pour les interactions)
- **Do** privilégier les transitions `ease-out` avec spring subtil (`cubic-bezier(0.34, 1.56, 0.64, 1)`) pour les éléments coulissants
- **Do** respecter la hiérarchie de transparence : shell translucide, modules opaques
- **Do** utiliser `text-wrap: balance` sur les titres de page (Settings)
- **Do** réduire toutes les animations quand `prefers-reduced-motion: reduce` est actif

### Don't:
- **Don't** utiliser d'ombres portées lourdes comme principal signal d'élévation — préférer le flou et la transparence
- **Don't** utiliser le rose, le vert vif ou d'autres couleurs primaires saturées dans le shell (réservées aux modules)
- **Don't** ajouter de mascottes, d'illustrations décoratives ou d'éléments cartoon
- **Don't** utiliser de navbar opaque — le glassmorphism est une signature du shell
- **Don't** superposer des cards — le shell n'utilise pas de cards imbriquées
- **Don't** afficher de header natif lourd — le MiniHeader est minimal, deux icônes flottantes
- **Don't** utiliser de menus hamburger — toute la navigation est dans la BottomNav et le Launcher
