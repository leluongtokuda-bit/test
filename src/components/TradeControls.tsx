import { useState, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface TradeControlsProps {
  onTrade: (direction: "up" | "down", amount: number, duration: number) => void;
  disabled?: boolean;
  countdown?: number;
  tradingLocked?: boolean;
  roundCode?: string;
}

const FIXED_DURATION = 60;
const PRESET_AMOUNTS_VND = [30000, 60000, 90000, 120000];
const PRESET_AMOUNTS_USD = [1, 3, 5, 10];
const CUSTOM_AMOUNTS_VND = [1000000, 2000000, 5000000, 10000000];
const CUSTOM_AMOUNTS_USD = [20, 50, 100];

const TradeControls = ({ onTrade, disabled, countdown, tradingLocked, roundCode }: TradeControlsProps) => {
  const [amount, setAmount] = useState<number | "">("");
  const [useCustom, setUseCustom] = useState(false);
  const { formatAmount, symbol, currency, rate } = useCurrency();
  const duration = FIXED_DURATION;

  // amount state is always in display currency; convert to USD for trade
  const parsedAmount = typeof amount === "number" ? amount : 0;
  const amountInUsd = currency === "VND" ? parsedAmount / rate : parsedAmount;

  const presets = currency === "VND" ? PRESET_AMOUNTS_VND : PRESET_AMOUNTS_USD;
  const customPresets = currency === "VND" ? CUSTOM_AMOUNTS_VND : CUSTOM_AMOUNTS_USD;

  const fmtLabel = (val: number) =>
    currency === "VND" ? val.toLocaleString("vi-VN") + "₫" : `$${val.toLocaleString("en-US")}`;

  const handlePreset = (val: number) => {
    setUseCustom(false);
    setAmount(val);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg animate-slide-up">
      {/* Amount */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Số tiền đầu tư</label>
        <div className="flex gap-1.5 mb-2">
          {presets.map((val) => (
            <button
              key={val}
              onClick={() => handlePreset(val)}
              className={`flex-1 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
              !useCustom && amount === val ?
              "bg-primary text-primary-foreground" :
              "bg-secondary text-secondary-foreground hover:bg-accent"}`
              }>
                {fmtLabel(val)}
              </button>
          ))}
          <button
            onClick={() => {setUseCustom(true);setAmount("");}}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            useCustom ?
            "bg-primary text-primary-foreground" :
            "bg-secondary text-secondary-foreground hover:bg-accent"}`
            }>
            Tự nhập
          </button>
        </div>
        {useCustom && (
          <div>
            <div className="flex gap-1.5 mb-2">
              {customPresets.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                    amount === val
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {fmtLabel(val)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">{symbol}</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                placeholder="Nhập số tiền..."
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === "" ? "" : Number(val));
                }}
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-secondary text-foreground font-mono font-semibold text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Duration - Fixed 1 minute */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Thời gian: <span className={`font-mono font-semibold ${tradingLocked ? "text-loss animate-pulse" : "text-foreground"}`}>{countdown !== undefined ? `${countdown}s` : "1 phút"}</span>
          {tradingLocked && <span className="text-[10px] text-loss font-semibold ml-1">Khóa đặt lệnh</span>}
        </label>
        {roundCode &&
        <span className="font-mono text-[11px] text-muted-foreground">Mã: <span className="text-foreground font-semibold">{roundCode}</span></span>
        }
      </div>

      {/* Trade Buttons */}
      <div className="flex gap-3 mt-1">
        <button
          onClick={() => parsedAmount > 0 && onTrade("up", amountInUsd, duration)}
          disabled={disabled || parsedAmount <= 0 || tradingLocked}
          className="flex-1 trade-btn-up py-4 rounded-lg flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50">

          <ArrowUp className="w-5 h-5" />
          TĂNG
        </button>
        <button
          onClick={() => parsedAmount > 0 && onTrade("down", amountInUsd, duration)}
          disabled={disabled || parsedAmount <= 0 || tradingLocked}
          className="flex-1 trade-btn-down py-4 rounded-lg flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50">

          <ArrowDown className="w-5 h-5" />
          GIẢM
        </button>
      </div>

      {/* Payout info */}
      <div className="text-center text-xs text-muted-foreground">
        Lợi nhuận: <span className="text-profit font-mono font-semibold">+95%</span>
      </div>
    </div>
  );
};

export default TradeControls;