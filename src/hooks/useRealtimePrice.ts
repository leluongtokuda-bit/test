import { useState, useEffect, useRef } from "react";

/**
 * Fetches real-time price from Binance via edge function every 3 seconds.
 * @param binanceSymbol e.g. "BTCUSDT", "ETHUSDT"  
 * @param fallbackPrice initial price before first fetch
 */
export function useRealtimePrice(binanceSymbol: string, fallbackPrice: number) {
  const [price, setPrice] = useState(fallbackPrice);
  const symbolRef = useRef(binanceSymbol);

  useEffect(() => {
    symbolRef.current = binanceSymbol;
    setPrice(fallbackPrice);
  }, [binanceSymbol, fallbackPrice]);

  useEffect(() => {
    let active = true;

    const fetchPrice = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/btc-price?symbol=${symbolRef.current}`,
          { headers: { "apikey": anonKey } }
        );

        if (res.ok) {
          const json = await res.json();
          if (active && json?.price && symbolRef.current === binanceSymbol) {
            setPrice(json.price);
          }
        }
      } catch {
        // Silently fail, keep last price
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [binanceSymbol]);

  return price;
}
