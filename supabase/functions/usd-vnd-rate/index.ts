import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use exchangerate.host free API
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD'
    );
    const data = await response.json();

    if (data.result === 'success' && data.rates?.VND) {
      return new Response(JSON.stringify({ rate: data.rates.VND, updated_at: data.time_last_update_utc }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback rate
    return new Response(JSON.stringify({ rate: 25000, updated_at: new Date().toISOString(), fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return new Response(JSON.stringify({ rate: 25000, updated_at: new Date().toISOString(), fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
