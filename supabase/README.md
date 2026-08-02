# Supabase Loodi One

Appliquer les migrations avec la CLI Supabase liée au projet :

```bash
supabase db push
```

## Annulation d’un onboarding OAuth

La fonction `abandon-incomplete-account` supprime uniquement l’utilisateur Auth
connecté qui ne possède pas encore de ligne `public.profiles`. Elle est appelée
lorsqu’un utilisateur abandonne le choix de son nom de joueur après Google OAuth.

```bash
supabase functions deploy abandon-incomplete-account
```

La CLI fournit `SUPABASE_URL`, `SUPABASE_ANON_KEY` et
`SUPABASE_SERVICE_ROLE_KEY` à la fonction : ne crée ni clé ni secret navigateur.

Les handles réservés sont administrables sans modification de l’application :

```sql
insert into public.reserved_module_names (name) values ('friends');
insert into public.reserved_handles (handle, reason) values ('loodi_official', 'brand');
```

`reserved_module_names` réserve automatiquement `loodifriends`,
`loodi_friends` et `loodi-friends`. Les tables ne sont pas exposées aux
clients : ces opérations se font depuis le SQL Editor ou une fonction serveur.
