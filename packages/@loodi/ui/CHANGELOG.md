# Changelog

Toutes les évolutions notables de `@loodi/ui` sont documentées ici.

## [Unreleased]

## [0.8.7] - 2026-08-09

### Fixed

- Le fond du MiniHeader atteint son opacité maximale après une hauteur de header (52 px), de façon cohérente entre les modules et les pages One.
- `BottomNav` rend l’icône Lucide `user-plus` utilisée par Friends au lieu de l’identifiant texte brut.

### Added

- `PlayerQrCodeSection`, section de paramètres présentationnelle avec export ESM et feuille CSS dédiés.

## [0.8.6] - 2026-08-07

### Fixed

- Le launcher affiche les variantes claire et sombre des icônes SVG distantes.
- Les paramètres affichent les icônes de modules référencées par une URL HTTPS.

## [0.8.5] - 2026-08-04

### Fixed

- Les bottom sheets du compte sont rendues hors du stacking context des paramètres.
- Le backdrop du compte conserve le `backdrop-filter` standard dans les bundles Android WebView.
- Le MiniHeader passe sous les overlays rendus dans les modules iframe.

## [0.8.2] - 2026-08-03

### Added

- `GlobalSettingsSection` peut masquer l’entrée shell « Autres paramètres » avec `showShellSettings={false}`.
- `AuthBottomSheet` et `AccountBottomSheet`, feuilles contrôlées et agnostiques du fournisseur d’authentification pour les parcours Google, lien magique, pseudo, compte et déconnexion.
- Sous-export ESM/CSS `@loodi/ui/auth-bottom-sheet` et `@loodi/ui/auth-bottom-sheet.css`.

## [0.8.0] - 2026-08-03

### Added

- Palette de 32 couleurs de profil et aperçu contrasté dans `LoodiAccountPage`.
- Gestion de la suppression de compte avec fosse accordéon et confirmation d’intention.
- Fermeture gestuelle partagée des bottom sheets, au doigt comme à la souris.

### Fixed

- Les bottom sheets signalent correctement leur présence au shell et laissent la navigation basse disponible après fermeture.

## [0.7.0]

### Added

- `LoodiAccountPage`, écran de compte indépendant du fournisseur d’authentification, réutilisable dans One et les modules standalone avec son export ESM et CSS dédié.

## [0.6.3]

### Fixed

- La BottomNav utilise désormais l’icône Lucide `library-big` pour les onglets de collection.
- Le MiniHeader passe derrière le backdrop du launcher.

## [0.6.2]

### Fixed

- Le MiniHeader dissocie désormais logo et wordmark : le logo partage le slot 36 px du retour, tandis que le nom du module est présenté comme une tuile compacte jaune pion légèrement inclinée.

## [0.6.1]

### Fixed

- Le nom accessible de `GlobalSettingsSection` annonce aussi sa description personnalisable.
- Les sous-exports `shared-preferences` et `global-settings` embarquent désormais leurs déclarations TypeScript.

## [0.6.0]

### Added

- `SharedPreferencesSection`, composant de présentation contrôlé pour les préférences Loodi communes (thème, ligne Langue en attente d'i18n), avec son entrée CSS dédiée.
- `GlobalSettingsSection`, entrée de navigation vers les paramètres One-only, avec ses exports ESM et CSS dédiés.

## [0.5.0]

### Added

- BottomNav étendue avec `showApps`, badges accessibles, l’icône `settings` et le callback optionnel `onSwipeUp`, sans modifier le mode launcher par défaut.

## [0.4.0]

### Added

- Surfaces opaques `surface-base` et `surface-base-dark`, remplaçant le legacy « paper » de Loodi Collec sans réemployer `surface-glass`.
- Alias CSS résolus par thème `color-theme-*` pour les fonds, surfaces, textes, bordures et rôles de statut.
- Palette sémantique `status-danger`, `status-warning`, `status-success` et `status-info` avec les rôles `solid`, `solid-hover`, `surface`, `surface-strong`, `border` et `text`, leurs variantes sombres et `status-on-solid`.

## [0.3.3]

### Added

- Token CSS et DTCG `color.brand-accent` (`#F5C842`), le Jaune pion destiné aux accents graphiques secondaires.

## [0.3.2]

### Added

- Token CSS et DTCG `shadow.emphasis` (`0 0 25px 0 rgba(0,0,0,0.25)`) pour mettre un bloc important en avant sans simuler son élévation.

## [0.3.1]

### Changed

- `bg-light` passe à `#FAFAF8` pour correspondre au fond existant de Loodi Collec ; `bg-dark` reste à `#1A1A18`.

## [0.3.0]

### Added

- Tokens CSS et DTCG `surface-subtle`, `text-primary` et `text-secondary`, avec leurs variantes sombres.
- Alias DTCG `text-primary-dark` vers `text-dark`.

### Changed

- Les composants UI emploient `text-primary-dark` en mode sombre sans modifier leur rendu.

## [0.2.1]

### Fixed

- Les labels de la bottom navigation sont à nouveau affichés sous leurs icônes.

## [0.2.0]

### Added

- Entrées ESM et CSS par composant, tokens CSS et export DTCG.
