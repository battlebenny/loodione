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

  const admin = createClient(url, serviceRoleKey)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) return response(500, { error: 'Impossible de vérifier le profil.' })
  if (profile) return response(409, { error: 'Ce compte Loodi est déjà finalisé.' })

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return response(500, { error: 'Impossible de supprimer ce compte incomplet.' })

  return response(200, { status: 'deleted' })
})
