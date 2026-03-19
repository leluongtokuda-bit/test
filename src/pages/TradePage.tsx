import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import TradingChart from "@/components/TradingChart";
import TradeControls from "@/components/TradeControls";
import ActiveTrades from "@/components/ActiveTrades";
import { type Trade } from "@/components/ActiveTrades";
import MobileNavBar from "@/components/MobileNavBar";
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getCurrentRoundCode, getCountdown, generateRoundCode } from "@/lib/roundCode";
import { cryptoAssets, getAssetById, defaultAsset, type Asset } from "@/data/assets";
import { motion } from "framer-motion";
import { useRealtimePrice } from "@/hooks/useRealtimePrice";
import { useCurrency } from "@/hooks/useCurrency";

const TradePage = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const assetId = searchParams.get("asset") || defaultAsset.id;
  const selectedAsset = getAssetById(assetId) || defaultAsset;

  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeResult, setTradeResult] = useState<{ show: boolean; result: "win" | "lose"; amount: number; profit: number } | null>(null);

  // Derive Binance symbol from tvSymbol (e.g. "BINANCE:BTCUSDT" → "BTCUSDT")
  const binanceSymbol = selectedAsset.tvSymbol.includes(":")
    ? selectedAsset.tvSymbol.split(":")[1]
    : selectedAsset.tvSymbol;
  const realtimePrice = useRealtimePrice(binanceSymbol, selectedAsset.price);

  const currentPriceRef = useRef(realtimePrice);
  const [currentPrice, setCurrentPrice] = useState(realtimePrice);
  const [countdown, setCountdown] = useState(() => getCountdown());
  const [roundCode, setRoundCode] = useState(() => getCurrentRoundCode());
  // Cache winning direction per round to prevent race conditions
  const roundOutcomes = useRef<Map<string, { winningDirection: "up" | "down"; resolving?: Promise<void> }>>(new Map());

  // Sync realtime price to state and ref
  useEffect(() => {
    currentPriceRef.current = realtimePrice;
    setCurrentPrice(realtimePrice);
  }, [realtimePrice]);

  // Fetch trade history
  const { data: tradeHistory } = useQuery({
    queryKey: ["tradeHistory", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Determine winning direction for a round with serialization lock
  const determineRoundOutcome = async (
    roundKey: string, roundStartMs: number, roundEndMs: number,
    tradeId: string, tradeRoundCode: string, entryPrice: number, finalPrice: number
  ): Promise<"up" | "down"> => {
    // If another trade is currently resolving this round, wait for it
    const existing = roundOutcomes.current.get(roundKey);
    if (existing?.resolving) {
      await existing.resolving;
      const cached = roundOutcomes.current.get(roundKey);
      if (cached?.winningDirection) return cached.winningDirection;
    }

    // If already resolved, return cached
    if (existing?.winningDirection) return existing.winningDirection;

    // Create a lock promise for this round
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((r) => { resolveLock = r; });
    roundOutcomes.current.set(roundKey, { winningDirection: undefined as any, resolving: lockPromise });

    try {
      let winDir: "up" | "down";

      const { data: resolvedInRound } = await supabase
        .from("trades").select("direction, result")
        .gte("created_at", new Date(roundStartMs).toISOString())
        .lt("created_at", new Date(roundEndMs).toISOString())
        .neq("id", tradeId).in("result", ["win", "lose"]).limit(1);

      if (resolvedInRound && resolvedInRound.length > 0) {
        const ref = resolvedInRound[0];
        winDir = (ref.result === "win" ? ref.direction : (ref.direction === "up" ? "down" : "up")) as "up" | "down";
      } else {
        const { data: preset } = await supabase.from("round_presets")
          .select("preset_result").eq("round_code", tradeRoundCode).maybeSingle();
        if (preset?.preset_result) {
          winDir = preset.preset_result as "up" | "down";
        } else {
          const { data: roundTrades } = await supabase.from("trades")
            .select("direction, amount, user_id")
            .gte("created_at", new Date(roundStartMs).toISOString())
            .lt("created_at", new Date(roundEndMs).toISOString());
          const uniqueUsers = new Set(roundTrades?.map(t => t.user_id) || []);
          if (uniqueUsers.size <= 1) {
            winDir = finalPrice > entryPrice ? "up" : "down";
          } else {
            const upVol = roundTrades?.filter(t => t.direction === "up").reduce((s, t) => s + Number(t.amount), 0) || 0;
            const downVol = roundTrades?.filter(t => t.direction === "down").reduce((s, t) => s + Number(t.amount), 0) || 0;
            if (upVol !== downVol) { winDir = upVol > downVol ? "down" : "up"; }
            else { winDir = finalPrice > entryPrice ? "up" : "down"; }
          }
        }
      }

      roundOutcomes.current.set(roundKey, { winningDirection: winDir });
      return winDir;
    } finally {
      resolveLock!();
    }
  };

  // Helper to resolve a trade using the full priority logic
  const resolveTradeNormally = async (trade: any, userId: string) => {
    const entryPrice = Number(trade.entry_price);
    const finalPrice = currentPriceRef.current;
    const direction = trade.direction as "up" | "down";
    const amount = Number(trade.amount);

    const tradeCreatedAt = new Date(trade.created_at);
    const roundStartMs = Math.floor(tradeCreatedAt.getTime() / 60000) * 60000;
    const roundEndMs = roundStartMs + 60000;
    const roundKey = String(roundStartMs);
    const tradeRoundCode = generateRoundCode(Math.floor(tradeCreatedAt.getTime() / 60000));

    const winDir = await determineRoundOutcome(roundKey, roundStartMs, roundEndMs, trade.id, tradeRoundCode, entryPrice, finalPrice);
    const won = direction === winDir;
    const profit = won ? amount * 0.95 : 0;
    const resultStr = won ? "win" : "lose";
    let displayPrice = finalPrice;
    const nudge = entryPrice * 0.0001 || 0.01;
    const wantHigher = (won && direction === "up") || (!won && direction === "down");
    if (finalPrice === entryPrice) {
      displayPrice = wantHigher ? entryPrice + nudge : entryPrice - nudge;
    } else {
      const priceWentUp = finalPrice > entryPrice;
      if (wantHigher !== priceWentUp) {
        const diff = Math.abs(finalPrice - entryPrice);
        displayPrice = wantHigher ? entryPrice + diff : entryPrice - diff;
      }
    }
    displayPrice = Math.round(displayPrice * 100) / 100;

    setTrades((prev) => prev.map((t) => t.id === trade.id ? { ...t, result: won ? "win" : "lose", profit } : t));
    setTradeResult({ show: true, result: won ? "win" : "lose", amount, profit: won ? profit : amount });

    await supabase.from("trades").update({ exit_price: displayPrice, result: resultStr, profit }).eq("id", trade.id);
    if (won) {
      await supabase.rpc("add_balance", { _user_id: userId, _amount: amount + profit });
    }
  };

  // Restore active & resolve stale pending trades on page load
  useEffect(() => {
    if (!user || !tradeHistory) return;

    const pendingTrades = tradeHistory.filter((t: any) => t.result === "pending");
    if (pendingTrades.length === 0) return;

    const now = Date.now();

    for (const trade of pendingTrades) {
      const createdAt = new Date(trade.created_at).getTime();
      const expiresAt = createdAt + trade.duration * 1000;
      const remainingMs = expiresAt - now;

      if (remainingMs > 0) {
        // Trade is still active — restore it to local state and set up resolution timer
        const alreadyTracked = trades.some((t) => t.id === trade.id);
        if (!alreadyTracked) {
          const restoredTrade: Trade = {
            id: trade.id,
            shortCode: trade.asset,
            direction: trade.direction as "up" | "down",
            amount: Number(trade.amount),
            entryPrice: Number(trade.entry_price),
            duration: trade.duration,
            startTime: createdAt,
          };
          setTrades((prev) => {
            if (prev.some((t) => t.id === trade.id)) return prev;
            return [...prev, restoredTrade];
          });

          // Set timeout to resolve when time is up
          setTimeout(async () => {
            // Re-fetch to check if admin already resolved
            const { data: dbTrade } = await supabase
              .from("trades")
              .select("result, profit, exit_price")
              .eq("id", trade.id)
              .single();

            if (dbTrade?.result && dbTrade.result !== "pending") {
              const r = dbTrade.result as "win" | "lose";
              const p = Number(dbTrade.profit || 0);
              setTrades((prev) => prev.map((t) => t.id === trade.id ? { ...t, result: r, profit: p } : t));
              setTradeResult({ show: true, result: r, amount: Number(trade.amount), profit: r === "win" ? p : Number(trade.amount) });
              if (r === "win") {
                await supabase.rpc("add_balance", { _user_id: user!.id, _amount: Number(trade.amount) + p });
              }
            } else {
              // Resolve using same logic as normal trade resolution
              await resolveTradeNormally(trade, user!.id);
            }
            queryClient.invalidateQueries({ queryKey: ["tradeHistory"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }, remainingMs + 500); // small buffer
        }
      } else {
        // Stale trade — resolve immediately using full priority logic
        resolveTradeNormally(trade, user!.id).then(() => {
          queryClient.invalidateQueries({ queryKey: ["tradeHistory"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["tradeHistory"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [user, tradeHistory]);

  const balance = profile?.balance ?? 0;

  // Sync countdown and round code to wall clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown());
      setRoundCode(getCurrentRoundCode());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handlePriceUpdate = useCallback((price: number) => {
    currentPriceRef.current = price;
    setCurrentPrice(price);
  }, []);

  const handleSelectAsset = (asset: Asset) => {
    setSearchParams({ asset: asset.id });
    setShowAssetPicker(false);
  };

  const handleTrade = useCallback(
    async (direction: "up" | "down", amount: number, _duration: number) => {
      if (!user || amount > balance) return;

      const entryPrice = currentPriceRef.current;
      const remainingTime = countdown;
      const tradeRoundCode = roundCode;

      // Optimistically deduct balance immediately to avoid lag
      queryClient.setQueryData(["profile", user.id], (old: any) => 
        old ? { ...old, balance: Number(old.balance) - amount } : old
      );

      // Fire DB calls in parallel
      const [, insertResult] = await Promise.all([
        supabase.from("profiles").update({ balance: balance - amount }).eq("user_id", user.id),
        supabase.from("trades")
          .insert({ user_id: user.id, direction, amount, entry_price: entryPrice, duration: remainingTime, result: "pending", asset: selectedAsset.symbol, round_code: tradeRoundCode } as any)
          .select().single(),
      ]);

      const tradeData = insertResult.data;
      const tradeId = tradeData?.id ?? crypto.randomUUID();

      const trade: Trade = {
        id: tradeId,
        shortCode: roundCode,
        direction, amount, entryPrice, duration: remainingTime, startTime: Date.now(),
      };

      setTrades((prev) => [...prev, trade]);

      // Resolve trade after remaining countdown time
      setTimeout(async () => {
        if (!tradeData) return;

        const { data: dbTrade } = await supabase
          .from("trades")
          .select("result, profit, exit_price")
          .eq("id", tradeData.id)
          .single();

        let finalResult: string;
        let finalProfit: number;
        let finalExitPrice: number | undefined;

        if (dbTrade?.result && dbTrade.result !== "pending") {
          const adminResult = dbTrade.result as "win" | "lose";
          const adminProfit = Number(dbTrade.profit || 0);
          finalResult = adminResult;
          finalProfit = adminResult === "win" ? adminProfit : 0;
          finalExitPrice = dbTrade.exit_price ? Number(dbTrade.exit_price) : undefined;
          setTrades((prev) =>
            prev.map((t) => t.id === trade.id ? { ...t, result: adminResult, profit: finalProfit } : t)
          );
          setTradeResult({ show: true, result: adminResult, amount, profit: adminResult === "win" ? adminProfit : amount });
          if (adminResult === "win") {
            await supabase.rpc("add_balance", { _user_id: user!.id, _amount: amount + adminProfit });
          }
        } else {
          const finalPrice = currentPriceRef.current;

          const tradeCreatedAt = new Date(tradeData.created_at);
          const roundStartMs = Math.floor(tradeCreatedAt.getTime() / 60000) * 60000;
          const roundEndMs = roundStartMs + 60000;
          const roundKey = String(roundStartMs);

          const winDir = await determineRoundOutcome(roundKey, roundStartMs, roundEndMs, tradeData.id, tradeRoundCode, entryPrice, finalPrice);
          const won = direction === winDir;

          finalProfit = won ? amount * 0.95 : 0;
          finalResult = won ? "win" : "lose";

          let displayPrice = finalPrice;
          const nudge = entryPrice * 0.0001 || 0.01;
          const wantHigher = (won && direction === "up") || (!won && direction === "down");
          if (finalPrice === entryPrice) {
            displayPrice = wantHigher ? entryPrice + nudge : entryPrice - nudge;
          } else {
            const priceWentUp = finalPrice > entryPrice;
            if (wantHigher !== priceWentUp) {
              const diff = Math.abs(finalPrice - entryPrice);
              displayPrice = wantHigher ? entryPrice + diff : entryPrice - diff;
            }
          }
          displayPrice = Math.round(displayPrice * 100) / 100;
          finalExitPrice = displayPrice;

          setTrades((prev) =>
            prev.map((t) => t.id === trade.id ? { ...t, result: won ? "win" : "lose", profit: finalProfit } : t)
          );
          setTradeResult({ show: true, result: won ? "win" : "lose", amount, profit: won ? finalProfit : amount });

          await supabase.from("trades").update({
            exit_price: displayPrice, result: finalResult, profit: finalProfit,
          }).eq("id", tradeData.id);

          if (won) {
            const refundAmount = amount + finalProfit;
            await supabase.rpc("add_balance", { _user_id: user!.id, _amount: refundAmount });
          }
        }

        // Optimistically update tradeHistory cache immediately
        queryClient.setQueryData(["tradeHistory", user!.id], (old: any[]) => {
          if (!old) return old;
          return old.map((t: any) => t.id === tradeData.id ? {
            ...t,
            result: finalResult,
            profit: finalProfit,
            exit_price: finalExitPrice ?? t.exit_price,
          } : t);
        });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["tradeHistory"] });
      }, remainingTime * 1000);
    },
    [balance, user, queryClient, countdown, roundCode, selectedAsset]
  );

  if (loading) return <div className="flex items-center justify-center h-screen bg-background"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return null;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAssetPicker(true)}
            className="flex items-center gap-1.5 hover:bg-secondary px-2 py-1 rounded-lg transition-colors"
          >
            <img src={selectedAsset.iconUrl} alt={selectedAsset.name} className="w-5 h-5 rounded-full" />
            <span className="font-semibold text-sm text-foreground">{selectedAsset.symbol}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-secondary px-3 py-1.5 rounded-lg">
            <span className="font-mono font-bold text-sm text-primary">
              ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: selectedAsset.decimals, maximumFractionDigits: selectedAsset.decimals })}
            </span>
          </div>
          <div className="bg-secondary px-3 py-1.5 rounded-lg">
            <span className="font-mono font-bold text-sm text-foreground">
              {formatAmount(Number(balance))}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <TradingChart tvSymbol={selectedAsset.tvSymbol} onPriceUpdate={handlePriceUpdate} />
      </div>

      <div className="max-h-40 overflow-y-auto border-t border-border">
        <ActiveTrades trades={trades} currentPrice={currentPrice} countdown={countdown} />
      </div>

      <div className="border-t border-border">
        <TradeControls onTrade={handleTrade} countdown={countdown} tradingLocked={countdown <= 10} roundCode={roundCode} />
      </div>

      {/* Trade History Toggle */}
      <div className="border-t border-border mb-16">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Lịch sử đặt lệnh</span>
          {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        {showHistory && tradeHistory && (
          <div className="max-h-60 overflow-y-auto px-3 pb-3 space-y-1.5">
            {tradeHistory.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">Chưa có lệnh nào</p>
            ) : (
              tradeHistory.map((trade: any) => {
                const displayTrend: "up" | "down" =
                  trade.exit_price != null && Number(trade.exit_price) !== Number(trade.entry_price)
                    ? (Number(trade.exit_price) > Number(trade.entry_price) ? "up" : "down")
                    : trade.direction === "up" ? "up" : "down";

                return (
                <div key={trade.id} className="bg-secondary/50 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded flex items-center justify-center ${
                      displayTrend === "up" ? "bg-profit/20" : "bg-loss/20"
                    }`}>
                      {displayTrend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-profit" /> 
                        : <TrendingDown className="w-3.5 h-3.5 text-loss" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{trade.asset}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          trade.result === "win" ? "bg-profit/20 text-profit" :
                          trade.result === "lose" ? "bg-loss/20 text-loss" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {trade.result === "win" ? "Thắng" : trade.result === "lose" ? "Thua" : "Chờ"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(trade.created_at).toLocaleString("vi-VN")}
                      </div>
                      {trade.exit_price != null && (
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className="text-muted-foreground">Vào: <span className="font-mono text-foreground">${Number(trade.entry_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-muted-foreground">Ra: <span className={`font-mono ${Number(trade.exit_price) > Number(trade.entry_price) ? "text-profit" : Number(trade.exit_price) < Number(trade.entry_price) ? "text-loss" : "text-foreground"}`}>${Number(trade.exit_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
                          {Number(trade.exit_price) > Number(trade.entry_price) ? (
                            <TrendingUp className="w-2.5 h-2.5 text-profit" />
                          ) : Number(trade.exit_price) < Number(trade.entry_price) ? (
                            <TrendingDown className="w-2.5 h-2.5 text-loss" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-medium text-foreground">{formatAmount(Number(trade.amount))}</p>
                    {trade.result === "win" ? (
                      <p className="text-[10px] font-mono text-profit">+{formatAmount(Number(trade.profit || 0))}</p>
                    ) : trade.result === "lose" ? (
                      <p className="text-[10px] font-mono text-loss">-{formatAmount(Number(trade.amount))}</p>
                    ) : null}
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Trade Result Notification */}
      {tradeResult?.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6"
          onClick={() => setTradeResult(null)}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`w-full max-w-xs rounded-2xl border-2 p-6 text-center ${
              tradeResult.result === "win"
                ? "bg-card border-profit/50"
                : "bg-card border-loss/50"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              tradeResult.result === "win" ? "bg-profit/20" : "bg-loss/20"
            }`}>
              {tradeResult.result === "win"
                ? <TrendingUp className="w-8 h-8 text-profit" />
                : <TrendingDown className="w-8 h-8 text-loss" />}
            </div>
            <h3 className={`text-xl font-bold mb-1 ${
              tradeResult.result === "win" ? "text-profit" : "text-loss"
            }`}>
              {tradeResult.result === "win" ? "Thắng lệnh! 🎉" : "Thua lệnh"}
            </h3>
            <p className={`text-2xl font-bold font-mono mb-1 ${
              tradeResult.result === "win" ? "text-profit" : "text-loss"
            }`}>
              {tradeResult.result === "win" ? `+${formatAmount(tradeResult.profit)}` : `-${formatAmount(tradeResult.profit)}`}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {tradeResult.result === "win"
                ? "Lợi nhuận đã được cộng vào số dư"
                : "Số tiền đặt lệnh đã bị trừ"}
            </p>
            <button
              onClick={() => setTradeResult(null)}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white ${
                tradeResult.result === "win" ? "bg-profit" : "bg-loss"
              }`}
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}

      <MobileNavBar />

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col" onClick={() => setShowAssetPicker(false)}>
          <div
            className="mt-auto bg-card rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-foreground">Chọn cặp giao dịch</h3>
              <button onClick={() => setShowAssetPicker(false)} className="text-muted-foreground text-sm">Đóng</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {cryptoAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 hover:bg-accent/50 transition-colors ${
                    asset.id === selectedAsset.id ? "bg-primary/10" : ""
                  }`}
                >
                  <img src={asset.iconUrl} alt={asset.name} className="w-8 h-8 rounded-full" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{asset.symbol}</p>
                    <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">+{asset.payout}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePage;
