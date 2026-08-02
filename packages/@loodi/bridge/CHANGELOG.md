# Changelog

Toutes les évolutions notables de `@loodi/bridge` sont documentées ici.

## [Unreleased]

### Changed

- Suppression des appels POC `getUser` et `getToken`. Les modules embarqués utilisent `getAuthSession` puis l’événement `loodi:authchange`.

## [0.4.0] - 2026-07-23

### Added

- Contrat de paramètres partagés v1 : `getSharedPreferences`, `updateSharedPreferences` et l’événement `loodi:preferenceschange`.
- Capacité de paramètres intégrés : `setSettingsCapability`, `loodi:settingsopen`, son accusé `loodi:settingsopenresult`, et `showShellSettings`.
- Navigation gestuelle opt-in : `setNavigationGestureCapability`, `loodi:navigationrequest` et réponse corrélée `loodi:navigationresult`.

## [0.2.2]

### Fixed

- Une navigation module non vide conserve le contrôle statique « Loodi » du shell ; `setBottomNav([])` masque toujours la navigation entière.

## [0.2.1]

### Fixed

- Publication corrective de la version `0.2.0`, sans modification du contrat public du bridge.

## [0.2.0]

### Added

- `BridgeClient.ready()` et `BridgeClient.navigate(path)`, qui émettent les messages legacy correspondants depuis une iframe et sont des no-ops en standalone.
- Validation de transport optionnelle : schéma, `event.source`, allowlist d'origines et `targetOrigin` explicite en mode strict.

### Compatibility

- Les messages legacy `loodi:ready`, `loodi:navigate` et `loodi:overlaychange` restent supportés pendant la migration des modules.
- Aucun contrat métier, permission, identité, token ou collection partagée n'est ajouté.

## [0.1.0]

### Added

- Contrat typé entre le shell Loodi One et les modules PWA.
- Client `BridgeClient` et événements de navigation, thème et état réseau.
