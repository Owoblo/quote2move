import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // This is an example of a Supabase edge function that can be used to send invitations.
  // The user needs to deploy it to their Supabase project.
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } })
  }

  try {
    const { email, full_name, role, company_id } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name,
          role,
          company_id,
        },
        redirectTo: `${Deno.env.get("SITE_URL")}/login`
      }
    )

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
