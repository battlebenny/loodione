# Changelog

Toutes les évolutions notables de `@loodi/ui` sont documentées ici.

## [Unreleased]

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
