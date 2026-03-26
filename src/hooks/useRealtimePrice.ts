import { useState, useEffect, useRef } from "react";

/**
 * Lấy giá thời gian thực trực tiếp từ Binance API (Không qua Supabase Functions)
 * @param binanceSymbol ví dụ: "BTCUSDT", "ETHUSDT"  
 * @param fallbackPrice giá khởi tạo ban đầu
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
        // Gọi trực tiếp API công khai của Binance
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${symbolRef.current.toUpperCase()}`
        );

        if (response.ok) {
          const data = await response.json();
          if (active && data?.price && symbolRef.current === binanceSymbol) {
            setPrice(parseFloat(data.price));
          }
        } else {
          // Nếu Binance lỗi (ví dụ với mã XAUUSD), ta có thể dùng fallback hoặc API khác
          console.warn(`Không lấy được giá cho ${symbolRef.current}`);
        }
      } catch (error) {
        // Im lặng thất bại, giữ nguyên giá cũ
      }
    };

    fetchPrice();
    // Cập nhật mỗi 3 giây
    const interval = setInterval(fetchPrice, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [binanceSymbol]);

  return price;
}
