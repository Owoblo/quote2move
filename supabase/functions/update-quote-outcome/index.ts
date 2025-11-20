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
    const { quoteId, actualCubicFeet, actualHours, missedItems, extraItems, actualPrice, lostReason } = await req.json()

    if (!quoteId) {
      throw new Error("Quote ID is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );
    
    const updateData: any = {};
    if (actualCubicFeet) updateData.actual_cubic_feet = actualCubicFeet;
    if (actualHours) updateData.actual_hours = actualHours;
    if (missedItems) updateData.missed_items = missedItems;
    if (extraItems) updateData.extra_items = extraItems;
    if (actualPrice) updateData.actual_price = actualPrice;
    if (lostReason) updateData.lost_reason = lostReason;

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();

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
