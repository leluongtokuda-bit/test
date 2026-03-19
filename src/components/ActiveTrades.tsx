import { ArrowUp, ArrowDown } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
export interface Trade {
  id: string;
  shortCode: string;
  direction: "up" | "down";
  amount: number;
  entryPrice: number;
  duration: number;
  startTime: number;
  result?: "win" | "lose" | "draw";
  profit?: number;
}

interface ActiveTradesProps {
  trades: Trade[];
  currentPrice: number;
  countdown: number;
}

const ActiveTrades = ({ trades, currentPrice, countdown }: ActiveTradesProps) => {
  const activeTrades = trades.filter((t) => !t.result);
  const recentResults = trades.filter((t) => t.result).slice(-5).reverse();
  const { formatAmount } = useCurrency();

  const getProgress = (trade: Trade) => {
    const elapsed = (Date.now() - trade.startTime) / 1000;
    return Math.min(1, elapsed / trade.duration);
  };

  if (trades.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Chưa có giao dịch nào
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {activeTrades.map((trade) => {
        const progress = getProgress(trade);
        const pnl =
          trade.direction === "up"
            ? currentPrice - trade.entryPrice
            : trade.entryPrice - currentPrice;
        const isPositive = pnl >= 0;

        return (
          <div
            key={trade.id}
            className="bg-secondary rounded-lg p-3 animate-slide-up"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {trade.direction === "up" ? (
                  <ArrowUp className="w-4 h-4 text-profit" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-loss" />
                )}
                <span className="font-mono text-sm font-semibold">
                  {formatAmount(trade.amount)}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  #{trade.shortCode}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {countdown}s
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-full rounded-full transition-all ${
                  isPositive ? "bg-profit" : "bg-loss"
                }`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        );
      })}

      {recentResults.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <span className="text-xs text-muted-foreground mb-1 block">Lịch sử</span>
          {recentResults.map((trade) => (
            <div
              key={trade.id}
              className="flex justify-between items-center py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                {trade.direction === "up" ? (
                  <ArrowUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="font-mono text-muted-foreground">
                  {formatAmount(trade.amount)}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  #{trade.shortCode}
                </span>
              </div>
              <span
                className={`font-mono font-semibold ${
                  trade.result === "win" ? "text-profit" : trade.result === "draw" ? "text-muted-foreground" : "text-loss"
                }`}
              >
                {trade.result === "win"
                  ? `+${formatAmount(trade.profit || 0)}`
                  : trade.result === "draw"
                  ? `${formatAmount(0)} (Hòa)`
                  : `-${formatAmount(trade.amount)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveTrades;
