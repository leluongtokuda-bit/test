import { useState, useEffect, useMemo, useCallback, memo } from "react";
import upbitLogo from "@/assets/upbit-logo.svg";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Volume2, ChevronRight } from "lucide-react";
import MobileNavBar from "@/components/MobileNavBar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { cryptoAssets } from "@/data/assets";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type TabKey = "volume" | "gainers" | "losers";

// Hoisted constants
const TABS: { key: TabKey; label: string }[] = [
  { key: "volume", label: "Khối lượng" },
  { key: "gainers", label: "Tăng mạnh" },
  { key: "losers", label: "Giảm mạnh" },
];

const SPARKLINE_WIDTH = 56;
const SPARKLINE_HEIGHT = 24;

// Mini sparkline SVG component — memoized
const Sparkline = memo(({ data, isUp }: { data: number[]; isUp: boolean }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * SPARKLINE_WIDTH;
      const y = SPARKLINE_HEIGHT - ((v - min) / range) * (SPARKLINE_HEIGHT - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const color = isUp ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)";

  return (
    <svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
Sparkline.displayName = "Sparkline";

// Generate random sparkline history
const generateSparkData = (basePrice: number, points = 20): number[] => {
  const data: number[] = [basePrice];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.5) * basePrice * 0.005;
    data.push(data[i - 1] + change);
  }
  return data;
};

const formatVolume = (v: string) => {
  const n = parseInt(v);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return `${(n / 1e3).toFixed(0)}K`;
};

// Initial state factories (called once)
const initPrices = () =>
  Object.fromEntries(cryptoAssets.map(a => [a.id, {
    price: a.price,
    isUp: a.changePercent > 0,
    change: a.changePercent,
    volume: ((Math.random() * 500 + 50) * 1e6).toFixed(0),
  }]));

const initSparkData = () =>
  Object.fromEntries(cryptoAssets.map(a => [a.id, generateSparkData(a.price)]));

const initIndices = () => ({
  composite: { value: 10173.96, change: -0.40 },
  altcoin: { value: 2795.07, change: 0.44 },
  fearGreed: { value: 35, label: "Sợ hãi" },
  volume24h: { value: 2.39, change: -14.70 },
});

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabKey>("volume");
  const [prices, setPrices] = useState<Record<string, { price: number; isUp: boolean; change: number; volume: string }>>(initPrices);
  const [sparkData, setSparkData] = useState<Record<string, number[]>>(initSparkData);
  const [indices, setIndices] = useState(initIndices);

  // Fetch active announcements
  const { data: announcements } = useQuery({
    queryKey: ["activeAnnouncements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime for announcements
  useEffect(() => {
    const channel = supabase
      .channel("home-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activeAnnouncements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Single interval that batches all state updates via unstable_batchedUpdates-like behavior
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        cryptoAssets.forEach(asset => {
          const volatility = asset.price * 0.001;
          const change = (Math.random() - 0.5) * volatility;
          const newPrice = prev[asset.id].price + change;
          const newChange = parseFloat(((Math.random() - 0.3) * 4).toFixed(2));
          next[asset.id] = {
            price: parseFloat(newPrice.toFixed(asset.decimals)),
            isUp: newChange > 0,
            change: newChange,
            volume: ((Math.random() * 500 + 50) * 1e6).toFixed(0),
          };
        });
        return next;
      });

      setSparkData(prev => {
        const next = { ...prev };
        cryptoAssets.forEach(asset => {
          const arr = [...prev[asset.id]];
          arr.push(arr[arr.length - 1] + (Math.random() - 0.5) * asset.price * 0.003);
          if (arr.length > 20) arr.shift();
          next[asset.id] = arr;
        });
        return next;
      });

      setIndices(prev => ({
        composite: { value: prev.composite.value + (Math.random() - 0.5) * 10, change: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)) },
        altcoin: { value: prev.altcoin.value + (Math.random() - 0.5) * 5, change: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)) },
        fearGreed: { value: Math.max(0, Math.min(100, prev.fearGreed.value + Math.floor((Math.random() - 0.5) * 3))), label: prev.fearGreed.value < 30 ? "Rất sợ" : prev.fearGreed.value < 50 ? "Sợ hãi" : "Trung lập" },
        volume24h: { value: prev.volume24h.value + (Math.random() - 0.5) * 0.1, change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)) },
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Memoized sorted assets
  const sortedAssets = useMemo(() => {
    const entries = cryptoAssets.map(a => ({ ...a, ...prices[a.id] }));
    switch (activeTab) {
      case "gainers": return [...entries].sort((a, b) => b.change - a.change);
      case "losers": return [...entries].sort((a, b) => a.change - b.change);
      default: return [...entries].sort((a, b) => parseInt(b.volume) - parseInt(a.volume));
    }
  }, [prices, activeTab]);

  const handleTabChange = useCallback((key: TabKey) => setActiveTab(key), []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-background"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return null;

  const balance = profile?.balance ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={upbitLogo} alt="Upbit" className="w-8 h-8" />
            <span className="font-bold text-foreground text-lg">Upbit</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg">
            <span className="text-xs text-muted-foreground">Số dư</span>
            <span className="font-mono font-bold text-sm text-primary">
              {formatAmount(Number(balance))}
            </span>
          </div>
        </div>
      </header>

      {/* Market Indices Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-x-auto scrollbar-hide"
      >
        <div className="grid grid-cols-2 gap-px bg-border border-b border-border">
          {[
            { label: "Tổng hợp", value: indices.composite.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: indices.composite.change },
            { label: "Altcoin", value: indices.altcoin.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: indices.altcoin.change },
            { label: "Sợ hãi & Tham lam", value: `${indices.fearGreed.value}/100`, extra: indices.fearGreed.label },
            { label: "KL 24h", value: `${indices.volume24h.value.toFixed(2)}T`, change: indices.volume24h.change },
          ].map((item, i) => (
            <div key={i} className="bg-card px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-mono font-bold text-xs text-foreground">{item.value}</span>
                {item.change !== undefined && (
                  <span className={`text-[10px] font-mono font-semibold ${item.change >= 0 ? "text-profit" : "text-loss"}`}>
                    {item.change >= 0 ? "+" : ""}{item.change}%
                  </span>
                )}
                {item.extra && (
                  <span className="text-[10px] font-medium text-muted-foreground">{item.extra}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notice Ticker - Dynamic Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="bg-primary/5 border-y border-primary/20 overflow-hidden">
          <div className="flex items-center px-3 py-2.5 gap-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-full">TB</span>
            </div>
            <div className="overflow-hidden flex-1 relative">
              <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: Math.max(20, announcements.length * 10), repeat: Infinity, ease: "linear" }}
              >
                {[...Array(2)].map((_, repeat) => (
                  <div key={repeat} className="flex items-center gap-10 pr-10">
                    {announcements.map((ann: any, i: number) => (
                      <span key={`${repeat}-${i}`} className="inline-flex items-center gap-2 text-[12px] font-medium text-foreground">
                        <span className="text-primary text-lg leading-none">•</span>
                        <span>{ann.content}</span>
                      </span>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>
            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate("/trade")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95">
            <span className="text-xs font-semibold">Giao dịch</span>
          </button>
          <button onClick={() => navigate("/wallet")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary text-foreground hover:bg-muted transition-colors active:scale-95">
            <span className="text-xs font-medium">Nạp tiền</span>
          </button>
          <button onClick={() => navigate("/wallet")}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary text-foreground hover:bg-muted transition-colors active:scale-95">
            <span className="text-xs font-medium">Rút tiền</span>
          </button>
        </div>
      </div>

      {/* Market Tabs */}
      <div className="px-4">
        <div className="flex items-center gap-1 border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-3 mt-2">
        <div className="flex items-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1 pb-1.5">
          <span className="flex-1">Tên / Cặp</span>
          <span className="w-[72px] text-right">Giá</span>
          <span className="w-[60px] text-right">24h</span>
        </div>
      </div>

      {/* Market Table */}
      <div className="px-3">
        <div className="space-y-0">
          {sortedAssets.map((asset, index) => {
            const p = prices[asset.id];
            return (
              <motion.button
                key={asset.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/trade?asset=${asset.id}`)}
                className="w-full flex items-center py-3 px-1 border-b border-border/40 active:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    <img src={asset.iconUrl} alt={asset.name} className="w-6 h-6 object-contain" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-[13px] text-foreground leading-tight">{asset.symbol.split("/")[0]}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{asset.name}</p>
                  </div>
                </div>

                <div className="w-[56px] mx-2 shrink-0">
                  <Sparkline data={sparkData[asset.id] || []} isUp={p.isUp} />
                </div>

                <span className="w-[72px] text-right font-mono font-semibold text-[13px] text-foreground">
                  {asset.price >= 1
                    ? `$${p.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : `$${p.price.toFixed(asset.decimals)}`}
                </span>

                <div className={`w-[60px] ml-1 py-1 rounded text-center font-mono font-semibold text-[11px] ${
                  p.isUp ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                }`}>
                  {p.isUp ? "+" : ""}{p.change}%
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default Index;
