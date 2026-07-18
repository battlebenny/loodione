# Changelog

Toutes les évolutions notables de `@loodi/bridge` sont documentées ici.

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
