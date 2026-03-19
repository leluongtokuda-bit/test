import { useEffect, useRef, memo } from "react";

interface TradingChartProps {
  tvSymbol?: string;
  onPriceUpdate?: (price: number) => void;
}

const TradingChart = memo(({ tvSymbol = "BINANCE:BTCUSDT", onPriceUpdate }: TradingChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Embed TradingView widget — re-render when symbol changes
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "1",
      timezone: "Asia/Ho_Chi_Minh",
      theme: "light",
      style: "1",
      locale: "vi_VN",
      hide_top_toolbar: false,
      hide_legend: true,
      allow_symbol_change: false,
      save_image: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div className="relative w-full h-full bg-card overflow-hidden">
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full"
      />
    </div>
  );
});

TradingChart.displayName = "TradingChart";

export default TradingChart;
