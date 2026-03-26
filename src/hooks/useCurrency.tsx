import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from "react";

export type CurrencyCode = "USD" | "VND";

// Tỉ giá cố định để tránh lỗi 404 từ Supabase Edge Functions
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
  // Lấy cấu hình tiền tệ từ máy người dùng, mặc định là VND
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem("app_currency") as CurrencyCode) || "VND";
  });

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("app_currency", c);
  }, []);

  // Hàm đổi từ USD sang VND (hoặc giữ nguyên nếu là USD)
  const convertFromUsd = useCallback((usdAmount: number) => {
    const amount = typeof usdAmount === 'number' ? usdAmount : 0;
    return currency === "VND" ? amount * FIXED_RATE : amount;
  }, [currency]);

  // Hàm định dạng hiển thị tiền tệ chuẩn VNĐ và USD
  const formatAmount = useCallback((usdAmount: number, opts?: { showSymbol?: boolean; decimals?: number }) => {
    const amount = typeof usdAmount === 'number' ? usdAmount : 0;
    const showSymbol = opts?.showSymbol !== false;
    
    if (currency === "VND") {
      const vnd = amount * FIXED_RATE;
      const formatted = Math.round(vnd).toLocaleString("vi-VN");
      return showSymbol ? `${formatted}₫` : formatted;
    }
    
    const decimals = opts?.decimals ?? 2;
    const formatted = amount.toLocaleString("en-US", { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return showSymbol ? `$${formatted}` : formatted;
  }, [currency]);

  const symbol = currency === "VND" ? "₫" : "$";
  const rate = currency === "VND" ? FIXED_RATE : 1;

  const value = useMemo(() => ({
    currency, 
    setCurrency, 
    formatAmount, 
    convertFromUsd, 
    symbol, 
    rate,
  }), [currency, setCurrency, formatAmount, convertFromUsd, symbol, rate]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
