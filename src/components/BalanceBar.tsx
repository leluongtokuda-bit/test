import { Wallet } from "lucide-react";
import upbitLogo from "@/assets/upbit-logo.svg";
import { useCurrency } from "@/hooks/useCurrency";

interface BalanceBarProps {
  balance: number;
}

const BalanceBar = ({ balance }: BalanceBarProps) => {
  const { formatAmount } = useCurrency();
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <img src={upbitLogo} alt="Upbit" className="w-8 h-8" />
        <span className="font-semibold text-sm text-foreground">Upbit</span>
      </div>
      <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="font-mono font-bold text-sm text-foreground">
          {formatAmount(balance)}
        </span>
      </div>
    </header>
  );
};

export default BalanceBar;
