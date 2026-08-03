import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function response(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authorization = request.headers.get('Authorization')
  if (!authorization) return response(401, { error: 'Authentification requise.' })

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceRoleKey) return response(500, { error: 'Configuration serveur incomplète.' })

  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: userError } = await caller.auth.getUser()
  if (userError || !user) return response(401, { error: 'Session invalide.' })

  // auth.admin.deleteUser triggers PostgreSQL's ON DELETE CASCADE constraints.
  // Every Loodi domain table owned by a user must reference auth.users(id)
  // (directly or through profiles) with ON DELETE CASCADE.
  const admin = createClient(url, serviceRoleKey)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return response(500, { error: 'Impossible de supprimer ce compte. Réessaie dans un instant.' })

  return response(200, { status: 'deleted' })
})
