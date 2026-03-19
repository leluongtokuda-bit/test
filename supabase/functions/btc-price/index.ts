import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get("symbol") || "BTCUSDT").toUpperCase();

    let price: number | null = null;
    let responseSymbol = symbol;

    // Non-Binance symbols (forex/commodities)
    const nonBinanceSymbols = ["XAUUSD", "EURUSD"];

    if (nonBinanceSymbols.includes(symbol)) {
      // Map to Yahoo Finance ticker
      const yahooTicker: Record<string, string> = {
        "XAUUSD": "GC=F",
        "EURUSD": "EURUSD=X",
      };
      const ticker = yahooTicker[symbol];

      try {
        const yRes = await fetch(
          `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (yRes.ok) {
          const yData = await yRes.json();
          const meta = yData?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            price = meta.regularMarketPrice;
          }
        }
      } catch {}

      // Fallback static prices if Yahoo fails
      if (!price) {
        const fallbacks: Record<string, number> = { "XAUUSD": 2925.50, "EURUSD": 1.135 };
        price = fallbacks[symbol] || null;
      }
    } else {
      // Binance symbols
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await res.json();
      if (res.ok && data?.price) {
        price = parseFloat(data.price);
        responseSymbol = data.symbol;
      }
    }

    if (!price) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch price for ${symbol}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ symbol: responseSymbol, price }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
