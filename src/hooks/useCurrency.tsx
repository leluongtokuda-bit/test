import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export type CurrencyCode = "USD" | "VND";

const FIXED_RATE = 26000;

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatAmount: (usdAmount: number, opts?: { showSymbol?: boolean; decimals?: number }) => string;
  convertFromUsd: (usdAmount: number) => number;
  symbol: string;
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatAmount: () => "",
  convertFromUsd: (v) => v,
  symbol: "$",
  rate: 1,
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem("app_currency") as CurrencyCode) || "VND";
  });

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("app_currency", c);
  }, []);

  const convertFromUsd = useCallback((usdAmount: number) => {
    return currency === "VND" ? usdAmount * FIXED_RATE : usdAmount;
  }, [currency]);

  const formatAmount = useCallback((usdAmount: number, opts?: { showSymbol?: boolean; decimals?: number }) => {
    const showSymbol = opts?.showSymbol !== false;
    if (currency === "VND") {
      const vnd = usdAmount * FIXED_RATE;
      const formatted = vnd.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
      return showSymbol ? `${formatted}₫` : formatted;
    }
    const decimals = opts?.decimals ?? 2;
    const formatted = usdAmount.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return showSymbol ? `$${formatted}` : formatted;
  }, [currency]);

  const symbol = currency === "VND" ? "₫" : "$";
  const rate = currency === "VND" ? FIXED_RATE : 1;

  const value = useMemo(() => ({
    currency, setCurrency, formatAmount, convertFromUsd, symbol, rate,
  }), [currency, setCurrency, formatAmount, convertFromUsd, symbol, rate]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
