import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } })
  }

  try {
    const { 
      companyName, 
      adminName, 
      adminEmail, 
      adminPassword, 
      adminPhone, 
      companyAddress, 
      truckCount, 
      serviceArea 
    } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );

    // 1. Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: false, // Set to true if you want email verification
      user_metadata: { full_name: adminName }
    })
    if (authError) throw authError;
    const adminUserId = authData.user.id;

    // The handle_new_user trigger will create the profile.

    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Create company and link admin using RPC function
    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('create_company_with_admin', {
        p_company_name: companyName,
        p_admin_id: adminUserId,
        p_admin_name: adminName,
        p_phone: adminPhone,
        p_address: companyAddress,
        p_truck_count: truckCount,
        p_service_area: serviceArea
      });

    if (rpcError || (rpcData && !rpcData.success)) {
      // If company creation fails, delete the user
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      throw rpcError || new Error(rpcData.error);
    }
    
    // The user is created, but not logged in.
    // The client will now log the user in.
    return new Response(
      JSON.stringify({ success: true, userId: adminUserId }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
