# @loodi/auth

Services React et Supabase partagés pour l’authentification Loodi. Le package centralise la session, le profil, les identités Google, les liens magiques et la suppression de compte ; l’application hôte fournit sa configuration Supabase.

```tsx
import { createClient } from '@supabase/supabase-js'
import { AuthProvider, useAuth } from '@loodi/auth'

const client = createClient(supabaseUrl, supabaseAnonKey)

<AuthProvider client={client}>
  <App />
</AuthProvider>
```

```tsx
const auth = useAuth()

await auth.signInWithMagicLink('joueur@loodi.fr')
await auth.linkGoogleIdentity()
await auth.deleteAccount()
```

`deleteAccount()` appelle l’Edge Function `delete-account`, qui doit être déployée dans le projet Supabase concerné. Les données métier doivent référencer `auth.users` avec `ON DELETE CASCADE`; les futures relations entre utilisateurs doivent supprimer l’association, jamais l’autre compte.

Le package requiert React 19 et `@supabase/supabase-js`.
