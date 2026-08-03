# Changelog

Toutes les évolutions notables de `@loodi/auth` sont documentées ici.

## [Unreleased]

## [0.2.0] - 2026-08-03

### Added

- Gestion partagée des sessions Supabase, profils Loodi, liens magiques et connexion Google.
- Association et dissociation d’une identité Google avec rafraîchissement du profil.
- Mise à jour de l’e-mail et de la couleur de profil.
- `deleteAccount()`, qui appelle l’Edge Function `delete-account` puis déconnecte la session locale.

### Fixed

- Les builds publiés n’embarquent plus les fichiers de test compilés.
