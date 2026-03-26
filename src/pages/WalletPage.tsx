import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  X, Clock, CheckCircle, XCircle, Eye, EyeOff, RefreshCw,
  Building2, ChevronDown, Search, Shield, Camera, ImageIcon, Copy, QrCode
} from "lucide-react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";

// --- MOCK DATA & HOOKS (Để đảm bảo tệp chạy được trong Preview) ---
// Trong dự án thực tế, các thành phần này sẽ nằm ở các tệp riêng biệt (@/hooks, @/components, ...)

const vietnamBanks = [
  { id: "vcb", name: "Vietcombank", shortName: "VCB", logo: "https://api.vietqr.io/img/VCB.png", bank_short_name: "vietcombank" },
  { id: "tcb", name: "Techcombank", shortName: "TCB", logo: "https://api.vietqr.io/img/TCB.png", bank_short_name: "techcombank" },
  { id: "mbb", name: "MB Bank", shortName: "MB", logo: "https://api.vietqr.io/img/MB.png", bank_short_name: "mbbank" },
];

// Giả lập Supabase client
const supabase = {
  from: (table: string) => ({
    select: () => ({ eq: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }), order: () => Promise.resolve({ data: [], error: null }), update: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    insert: () => Promise.resolve({ error: null }),
  }),
  storage: { from: (bucket: string) => ({ upload: () => Promise.resolve({ data: {}, error: null }), createSignedUrl: () => Promise.resolve({ data: { signedUrl: "" } }) }) },
  functions: { invoke: (name: string) => Promise.resolve({ data: { rate: 26000 }, error: null }) }
};

const useAuth = () => ({ user: { id: "user-123" }, loading: false });
const useProfile = () => ({ data: { balance: 1500, display_name: "Trader VN", bank_name: "MB", bank_account_number: "0000123456789", bank_account_holder: "NGUYEN VAN A" }, refetch: () => {} });
const useTransactionRequests = () => ({ data: [], refetch: () => {} });
const useCreateTransactionRequest = () => ({ mutateAsync: async () => {}, isPending: false });

const MobileNavBar = () => (
  <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 z-50">
    <div className="flex flex-col items-center gap-1 text-primary"><WalletIcon className="w-5 h-5" /><span className="text-[10px]">Ví</span></div>
  </div>
);

// --- COMPONENT CHÍNH ---

const BankLogo = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} bg-secondary flex items-center justify-center`}>
        <Building2 className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};

const BankLinkingForm = ({ userId, onLinked }: { userId: string; onLinked: () => void }) => {
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return vietnamBanks;
    const q = bankSearch.toLowerCase();
    return vietnamBanks.filter(b => b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q));
  }, [bankSearch]);

  const handleSubmit = async () => {
    setSubmitting(true);
    toast.success("Liên kết tài khoản ngân hàng thành công!");
    onLinked();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 p-4">
      <header className="mb-6"><h1 className="font-bold text-xl">Liên kết ngân hàng</h1></header>
      <div className="space-y-4">
        <button onClick={() => setShowBankDropdown(!showBankDropdown)} className="w-full p-3 bg-card border rounded-xl flex justify-between">
          {selectedBank ? selectedBank.shortName : "Chọn ngân hàng..."} <ChevronDown className="w-4 h-4" />
        </button>
        {showBankDropdown && (
          <div className="bg-card border rounded-xl p-2 max-h-40 overflow-auto">
            {filteredBanks.map(b => (
              <div key={b.id} onClick={() => { setSelectedBank(b); setShowBankDropdown(false); }} className="p-2 hover:bg-accent cursor-pointer">{b.shortName}</div>
            ))}
          </div>
        )}
        <input placeholder="Số tài khoản" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full p-3 bg-card border rounded-xl" />
        <input placeholder="Tên chủ tài khoản" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value.toUpperCase())} className="w-full p-3 bg-card border rounded-xl uppercase" />
        <button onClick={handleSubmit} className="w-full py-3 bg-primary text-white rounded-xl font-bold">Xác nhận</button>
      </div>
    </div>
  );
};

const WalletPage = () => {
  const { user, loading } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: requests, refetch: refetchRequests } = useTransactionRequests();
  const createRequest = useCreateTransactionRequest();
  
  // MOCK useCurrency logic
  const currency = "VND";
  const rate = 26000;
  const symbol = "₫";
  const formatAmount = (usd: number) => (usd * rate).toLocaleString("vi-VN") + "₫";

  const location = useLocation();
  const [showModal, setShowModal] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositQR, setShowDepositQR] = useState(false);
  const [depositAmountVnd, setDepositAmountVnd] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // FIX LỖI 404: Trả về tỉ giá cố định ngay lập tức
  const { data: exchangeRate } = useQuery({
    queryKey: ["usdVndRate"],
    queryFn: async () => 26000,
    staleTime: Infinity,
  });

  const usdToVnd = exchangeRate || 26000;

  const handleRefresh = useCallback(async () => {
    toast.success("Đã cập nhật dữ liệu ví");
  }, []);

  const handleSubmit = () => {
    if (showModal === "deposit") {
      setDepositAmountVnd(parseFloat(amount) * usdToVnd);
      setShowDepositQR(true);
      setShowModal(null);
    } else {
      toast.success("Yêu cầu rút tiền đã được gửi");
      setShowModal(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  const balance = profile?.balance ?? 0;
  const bankLinked = !!profile?.bank_name;

  if (!bankLinked) return <BankLinkingForm userId={user.id} onLinked={refetchProfile} />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
        <h1 className="font-bold text-lg">Ví của tôi</h1>
        <button onClick={handleRefresh} className="p-2 bg-secondary rounded-full"><RefreshCw className="w-4 h-4" /></button>
      </header>

      <div className="p-4">
        <motion.div className="rounded-2xl border border-primary/20 p-5 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><WalletIcon className="text-white w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Tài khoản</p>
              <p className="font-semibold text-sm">{profile?.display_name}</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
              <button onClick={() => setShowBalance(!showBalance)}>{showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
            </div>
            <p className="text-3xl font-bold text-primary">{showBalance ? formatAmount(balance) : "••••••"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowModal("deposit")} className="py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"><ArrowDownLeft className="w-4 h-4" /> Nạp tiền</button>
            <button onClick={() => setShowModal("withdraw")} className="py-3 border border-primary/30 rounded-xl font-bold flex items-center justify-center gap-2"><ArrowUpRight className="w-4 h-4" /> Rút tiền</button>
          </div>
        </motion.div>

        {/* Thông tin ngân hàng */}
        <div className="mt-4 p-3 bg-card border rounded-xl flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-bold text-sm">{profile?.bank_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{profile?.bank_account_number} · {profile?.bank_account_holder}</p>
          </div>
        </div>

        {/* Lịch sử giao dịch giả lập */}
        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Lịch sử giao dịch</h3>
          <div className="space-y-2">
            <div className="p-3 bg-card border rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center"><ArrowDownLeft className="w-4 h-4 text-profit" /></div>
                <div><p className="text-sm font-medium">Nạp tiền</p><p className="text-[10px] text-muted-foreground">26/03/2026</p></div>
              </div>
              <p className="font-bold text-profit">+1.000.000₫</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowModal(null)}>
            <motion.div className="bg-card w-full max-w-md p-6 rounded-t-3xl pb-20" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">{showModal === "deposit" ? "Nạp tiền" : "Rút tiền"}</h3>
              <input type="number" placeholder="Nhập số lượng USD" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-secondary rounded-xl mb-4" />
              <button onClick={handleSubmit} className="w-full py-3 bg-primary text-white rounded-xl font-bold">Tiếp tục</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code giả lập */}
      {showDepositQR && (
        <div className="fixed inset-0 bg-background z-50 p-6 flex flex-col items-center">
          <header className="w-full flex justify-between mb-8"><h3 className="font-bold text-lg">Quét mã nạp tiền</h3><X className="cursor-pointer" onClick={() => setShowDepositQR(false)} /></header>
          <div className="w-64 h-64 bg-white p-4 rounded-2xl shadow-lg flex items-center justify-center mb-6">
            <QrCode className="w-48 h-48 text-black" />
          </div>
          <div className="w-full space-y-3 bg-card p-4 rounded-xl border">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Số tiền</span><span className="font-bold">{depositAmountVnd.toLocaleString()}₫</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Nội dung</span><span className="font-bold text-primary uppercase">NAP {user.id.slice(0,8)}</span></div>
          </div>
          <button className="mt-8 w-full py-3 bg-primary text-white rounded-xl font-bold" onClick={() => { toast.success("Đã gửi yêu cầu nạp tiền"); setShowDepositQR(false); }}>Xác nhận đã chuyển khoản</button>
        </div>
      )}

      <MobileNavBar />
      <Toaster position="top-center" />
    </div>
  );
};

export default WalletPage;
