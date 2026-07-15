# Lessons

## 2026-07-08 — Settings : pas de bouton X dans le header

**Failure** : Settings avait un bouton X de fermeture dans son propre header.

**Signal** : User a demandé de le retirer — MiniHeader a déjà `showBack` qui ferme Settings via `goBack()` (qui check `s.settingsOpen`).

**Prevention** : Un overlay plein écran ne doit pas dupliquer le contrôle de fermeture. MiniHeader avec `showBack` + `onBack={goBack}` est la seule mécanique de retour. Settings n'a pas besoin de `onClose` visuel dans son header (le handler Escape reste utile).

---

## 2026-07-08 — Settings : les lignes cliquables ouvrent une BottomSheet, pas un expand inline

**Failure** : Les pickers (Thème, App préférée) étaient rendus en expand inline sous la ligne cliquable, avec un alignement dégueulasse.

**Signal** : User a demandé de reprendre exactement le pattern Loodi — BottomSheet avec `rounded-t-[20px]`, options stylées `flex items-center gap-3 rounded-xl px-3 py-3`, icône 36×36 dans container `bg-black/5`, checkmark `#ca4a16`.

**Prevention** : Tout picker de sélection dans Settings suit le pattern BottomSheet (copié de Loodi's `src/components/BottomSheet.tsx`). Pas d'expand inline, pas de radio list dans la carte. Icônes inline SVG (pas Lucide — pas dans les dépendances).

---

## 2026-07-08 — Layout Settings : un seul bloc "Préférences"

**Failure** : Settings avait deux sections séparées "Application" et "Affichage" avec des radio lists directes.

**Signal** : User a demandé un seul bloc "Préférences" avec deux lignes cliquables (Thème, App préférée), chaque ligne avec icône + valeur courante en secondaire + chevron.

**Prevention** : Le pattern Loodi pour Settings est : `SectionCard` → `SectionHeader` → `Row` (icon + label + secondary + chevron). Pas de radio lists dans la section — les options sont dans la BottomSheet.
