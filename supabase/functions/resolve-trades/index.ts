import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateRoundCode(epochMinute: number): string {
  let x = epochMinute;
  let result = "";
  for (let i = 0; i < 11; i++) {
    x = ((x * 1103515245 + 12345) & 0x7fffffff);
    result += (x % 10).toString();
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Find all pending trades that have expired
  const { data: pendingTrades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("result", "pending");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const now = Date.now();
  const staleTrades = (pendingTrades || []).filter((t: any) => {
    const expiresAt = new Date(t.created_at).getTime() + t.duration * 1000;
    return expiresAt < now;
  });

  if (staleTrades.length === 0) {
    return new Response(JSON.stringify({ resolved: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Fetch current BTC price for market fallback
  let marketPrice = 0;
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await res.json();
    marketPrice = parseFloat(data.price);
  } catch { marketPrice = 0; }

  // Group trades by round (epoch minute)
  const roundResults = new Map<string, "up" | "down">();

  // First pass: check if any trade in the same round already has a result
  for (const trade of staleTrades) {
    const createdAt = new Date(trade.created_at).getTime();
    const epochMinute = Math.floor(createdAt / 60000);
    const roundKey = String(epochMinute);

    if (roundResults.has(roundKey)) continue;

    const roundStartMs = epochMinute * 60000;
    const roundEndMs = roundStartMs + 60000;

    // Check for already-resolved trades in this round
    const { data: resolved } = await supabase
      .from("trades")
      .select("direction, result")
      .gte("created_at", new Date(roundStartMs).toISOString())
      .lt("created_at", new Date(roundEndMs).toISOString())
      .in("result", ["win", "lose"])
      .limit(1);

    if (resolved && resolved.length > 0) {
      const ref = resolved[0];
      const winDir = ref.result === "win" ? ref.direction : (ref.direction === "up" ? "down" : "up");
      roundResults.set(roundKey, winDir as "up" | "down");
      continue;
    }

    // Check preset
    const roundCode = generateRoundCode(epochMinute);
    const { data: preset } = await supabase
      .from("round_presets")
      .select("preset_result")
      .eq("round_code", roundCode)
      .maybeSingle();

    if (preset?.preset_result) {
      roundResults.set(roundKey, preset.preset_result as "up" | "down");
      continue;
    }

    // Volume matching
    const { data: roundTrades } = await supabase
      .from("trades")
      .select("direction, amount, user_id")
      .gte("created_at", new Date(roundStartMs).toISOString())
      .lt("created_at", new Date(roundEndMs).toISOString());

    const uniqueUsers = new Set(roundTrades?.map((t: any) => t.user_id) || []);
    if (uniqueUsers.size <= 1) {
      // Single user — use market price
      const entryPrice = Number(staleTrades.find((t: any) => Math.floor(new Date(t.created_at).getTime() / 60000) === epochMinute)?.entry_price || 0);
      const winDir = marketPrice > entryPrice ? "up" : "down";
      roundResults.set(roundKey, winDir);
    } else {
      const upVol = roundTrades?.filter((t: any) => t.direction === "up").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
      const downVol = roundTrades?.filter((t: any) => t.direction === "down").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
      if (upVol !== downVol) {
        roundResults.set(roundKey, upVol > downVol ? "down" : "up");
      } else {
        const entryPrice = Number(staleTrades.find((t: any) => Math.floor(new Date(t.created_at).getTime() / 60000) === epochMinute)?.entry_price || 0);
        roundResults.set(roundKey, marketPrice > entryPrice ? "up" : "down");
      }
    }
  }

  // Second pass: resolve each trade
  let resolvedCount = 0;
  for (const trade of staleTrades) {
    const createdAt = new Date(trade.created_at).getTime();
    const epochMinute = Math.floor(createdAt / 60000);
    const roundKey = String(epochMinute);
    const winDir = roundResults.get(roundKey);
    if (!winDir) continue;

    const direction = trade.direction as "up" | "down";
    const amount = Number(trade.amount);
    const entryPrice = Number(trade.entry_price);
    const won = direction === winDir;
    const profit = won ? amount * 0.95 : 0;
    const resultStr = won ? "win" : "lose";

    // Compute display price
    let displayPrice = marketPrice || entryPrice * 1.001;
    const nudge = entryPrice * 0.0001 || 0.01;
    const wantHigher = (won && direction === "up") || (!won && direction === "down");
    if (displayPrice === entryPrice) {
      displayPrice = wantHigher ? entryPrice + nudge : entryPrice - nudge;
    } else {
      const priceWentUp = displayPrice > entryPrice;
      if (wantHigher !== priceWentUp) {
        const diff = Math.abs(displayPrice - entryPrice);
        displayPrice = wantHigher ? entryPrice + diff : entryPrice - diff;
      }
    }
    displayPrice = Math.round(displayPrice * 100) / 100;

    await supabase.from("trades").update({
      exit_price: displayPrice,
      result: resultStr,
      profit,
    }).eq("id", trade.id);

    if (won) {
      await supabase.rpc("add_balance", { _user_id: trade.user_id, _amount: amount + profit });
    }

    resolvedCount++;
  }

  return new Response(JSON.stringify({ resolved: resolvedCount }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
