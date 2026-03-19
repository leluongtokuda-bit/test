import { useState, useMemo, useCallback, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MobileNavBar from "@/components/MobileNavBar";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  X, Clock, CheckCircle, XCircle, Eye, EyeOff, RefreshCw,
  Building2, ChevronDown, Search, Shield, Camera, ImageIcon, Copy, QrCode
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTransactionRequests, useCreateTransactionRequest } from "@/hooks/useTransactionRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { vietnamBanks, type VietnamBank } from "@/data/vietnamBanks";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/hooks/useCurrency";

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
  const [selectedBank, setSelectedBank] = useState<VietnamBank | null>(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bankCardFrontFile, setBankCardFrontFile] = useState<File | null>(null);
  const [bankCardFrontPreview, setBankCardFrontPreview] = useState<string | null>(null);
  const [bankCardBackFile, setBankCardBackFile] = useState<File | null>(null);
  const [bankCardBackPreview, setBankCardBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return vietnamBanks;
    const q = bankSearch.toLowerCase();
    return vietnamBanks.filter(b =>
      b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  const handleSubmit = async () => {
    if (!selectedBank) { toast.error("Vui lòng chọn ngân hàng"); return; }
    if (!accountNumber.trim() || accountNumber.trim().length < 6) { toast.error("Số tài khoản không hợp lệ"); return; }
    if (!accountHolder.trim() || accountHolder.trim().length < 3) { toast.error("Vui lòng nhập họ tên chủ tài khoản"); return; }

    setSubmitting(true);
    try {
      let frontPath: string | null = null;
      let backPath: string | null = null;

      if (bankCardFrontFile || bankCardBackFile) {
        setUploading(true);
        if (bankCardFrontFile) {
          const frontExt = bankCardFrontFile.name.split('.').pop();
          frontPath = `${userId}/bank-card-front-${Date.now()}.${frontExt}`;
          const { error: frontErr } = await supabase.storage.from('bank-cards').upload(frontPath, bankCardFrontFile);
          if (frontErr) throw frontErr;
        }
        if (bankCardBackFile) {
          const backExt = bankCardBackFile.name.split('.').pop();
          backPath = `${userId}/bank-card-back-${Date.now()}.${backExt}`;
          const { error: backErr } = await supabase.storage.from('bank-cards').upload(backPath, bankCardBackFile);
          if (backErr) throw backErr;
        }
        setUploading(false);
      }

      const { error } = await supabase.from("profiles").update({
        bank_name: selectedBank.shortName,
        bank_account_number: accountNumber.trim(),
        bank_account_holder: accountHolder.trim().toUpperCase(),
        ...(frontPath && { bank_card_image_url: frontPath }),
        ...(backPath && { bank_card_back_image_url: backPath }),
        bank_linked_at: new Date().toISOString(),
      }).eq("user_id", userId);

      if (error) throw error;
      toast.success("Liên kết tài khoản ngân hàng thành công!");
      onLinked();
    } catch {
      toast.error("Lỗi khi liên kết tài khoản ngân hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center px-4 h-14">
          <h1 className="font-bold text-lg text-foreground">Liên kết ngân hàng</h1>
        </div>
      </header>

      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Bank Selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Chọn ngân hàng</label>
            <button
              onClick={() => setShowBankDropdown(!showBankDropdown)}
              className="w-full px-3 py-3 rounded-xl bg-card border border-border flex items-center justify-between text-sm"
            >
              {selectedBank ? (
                <div className="flex items-center gap-3">
                  <BankLogo src={selectedBank.logo} alt={selectedBank.shortName} className="w-8 h-8 object-contain rounded" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{selectedBank.shortName}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedBank.name}</p>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Chọn ngân hàng...</span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showBankDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showBankDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 bg-card border border-border rounded-xl overflow-hidden"
                >
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <input
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Tìm ngân hàng..."
                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => { setSelectedBank(bank); setShowBankDropdown(false); setBankSearch(""); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors ${
                          selectedBank?.id === bank.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <BankLogo src={bank.logo} alt={bank.shortName} className="w-8 h-8 object-contain rounded" />
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm text-foreground">{bank.shortName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{bank.name}</p>
                        </div>
                      </button>
                    ))}
                    {filteredBanks.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">Không tìm thấy ngân hàng</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account Number */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Số tài khoản</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Nhập số tài khoản ngân hàng"
              maxLength={20}
              className="w-full px-3 py-3 rounded-xl bg-card border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Account Holder */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Họ và tên chủ tài khoản</label>
            <input
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN A"
              maxLength={50}
              className="w-full px-3 py-3 rounded-xl bg-card border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            />
          </div>

          {/* Bank Card Image Upload - Front & Back */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ảnh thẻ ngân hàng</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Front */}
              <div
                onClick={() => document.getElementById('bank-card-front-input')?.click()}
                className="rounded-xl bg-card border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
              >
                {bankCardFrontPreview ? (
                  <div className="relative">
                    <img src={bankCardFrontPreview} alt="Mặt trước" className="w-full h-28 object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setBankCardFrontFile(null); setBankCardFrontPreview(null); }}
                      className="absolute top-1 right-1 w-6 h-6 bg-background/80 backdrop-blur rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt trước</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-foreground">Mặt trước</p>
                    <p className="text-[10px] text-muted-foreground">Tối đa 5MB</p>
                  </div>
                )}
              </div>
              {/* Back */}
              <div
                onClick={() => document.getElementById('bank-card-back-input')?.click()}
                className="rounded-xl bg-card border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
              >
                {bankCardBackPreview ? (
                  <div className="relative">
                    <img src={bankCardBackPreview} alt="Mặt sau" className="w-full h-28 object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setBankCardBackFile(null); setBankCardBackPreview(null); }}
                      className="absolute top-1 right-1 w-6 h-6 bg-background/80 backdrop-blur rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt sau</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-foreground">Mặt sau</p>
                    <p className="text-[10px] text-muted-foreground">Tối đa 5MB</p>
                  </div>
                )}
              </div>
            </div>
            <input id="bank-card-front-input" type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
                setBankCardFrontFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setBankCardFrontPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
            <input id="bank-card-back-input" type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
                setBankCardBackFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setBankCardBackPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          {/* Preview */}
          {selectedBank && accountNumber && accountHolder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Xem trước thông tin</p>
              <div className="flex items-center gap-3 mb-3">
                <BankLogo src={selectedBank.logo} alt={selectedBank.shortName} className="w-10 h-10 object-contain rounded" />
                <p className="font-bold text-foreground">{selectedBank.shortName}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Số TK</span>
                  <span className="text-sm font-mono font-semibold text-foreground">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Chủ TK</span>
                  <span className="text-sm font-semibold text-foreground">{accountHolder.toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedBank || !accountNumber || !accountHolder}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận liên kết"}
          </button>
        </motion.div>
      </div>

      <MobileNavBar />
    </div>
  );
};

const BankCardImages = ({ frontPath, backPath }: { frontPath?: string | null; backPath?: string | null }) => {
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadUrls = async () => {
      if (frontPath) {
        const { data } = await supabase.storage.from("bank-cards").createSignedUrl(frontPath, 3600);
        if (data?.signedUrl) setFrontUrl(data.signedUrl);
      }
      if (backPath) {
        const { data } = await supabase.storage.from("bank-cards").createSignedUrl(backPath, 3600);
        if (data?.signedUrl) setBackUrl(data.signedUrl);
      }
    };
    loadUrls();
  }, [frontPath, backPath]);

  if (!frontUrl && !backUrl) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Ảnh thẻ ngân hàng</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {frontUrl && (
            <div className="relative">
              <img src={frontUrl} alt="Mặt trước" className="w-full h-24 object-cover rounded-lg" />
              <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt trước</span>
            </div>
          )}
          {backUrl && (
            <div className="relative">
              <img src={backUrl} alt="Mặt sau" className="w-full h-24 object-cover rounded-lg" />
              <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt sau</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WalletPage = () => {
  const { user, loading } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: requests, refetch: refetchRequests } = useTransactionRequests();
  const createRequest = useCreateTransactionRequest();
  const { formatAmount, currency, symbol, rate, convertFromUsd } = useCurrency();
  const location = useLocation();

  const [showModal, setShowModal] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositQR, setShowDepositQR] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAmountVnd, setDepositAmountVnd] = useState(0);
  
  const [vipNote, setVipNote] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Handle VIP deposit from navigation state
  useEffect(() => {
    const state = location.state as { vipDeposit?: boolean; amount?: number; note?: string } | null;
    if (state?.vipDeposit && state.amount) {
      setAmount(state.amount.toString());
      setVipNote(state.note || null);
      setShowModal("deposit");
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch admin bank settings
  const { data: adminBank } = useQuery({
    queryKey: ["adminBankSettings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_bank_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();
      return data;
    },
  });

  // Fetch real-time USD/VND exchange rate
  const { data: exchangeRate } = useQuery({
    queryKey: ["usdVndRate"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("usd-vnd-rate");
      if (error) throw error;
      return data?.rate || 25000;
    },
    refetchInterval: 60000, // refresh every 60s
    staleTime: 30000,
  });

  const usdToVnd = exchangeRate || 25000;

  const stats = useMemo(() => {
    if (!requests) return { totalDeposit: 0, totalWithdraw: 0, pendingCount: 0 };
    const approved = requests.filter((r: any) => r.status === "approved");
    return {
      totalDeposit: approved.filter((r: any) => r.type === "deposit").reduce((s: number, r: any) => s + Number(r.amount), 0),
      totalWithdraw: approved.filter((r: any) => r.type === "withdraw").reduce((s: number, r: any) => s + Number(r.amount), 0),
      pendingCount: requests.filter((r: any) => r.status === "pending").length,
    };
  }, [requests]);

  const handleConfirmDeposit = useCallback(async () => {
    if (!receiptFile) {
      toast.error("Vui lòng tải lên hóa đơn giao dịch trước khi xác nhận");
      return;
    }
    setUploadingReceipt(true);
    try {
      const amountNum = parseFloat(depositAmount);
      
      // Upload receipt first
      const ext = receiptFile.name.split('.').pop();
      const path = `${user!.id}/receipt-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("receipts").upload(path, receiptFile);
      if (uploadErr) throw uploadErr;

      // Create transaction request with receipt attached
      await createRequest.mutateAsync({
        type: "deposit",
        amount: amountNum,
        payment_method: "bank_transfer",
        receipt_image_url: path,
      } as any);

      setShowDepositQR(false);
      setReceiptFile(null);
      setReceiptPreview(null);
      setVipNote(null);
      toast.success("Yêu cầu nạp tiền đã được gửi. Vui lòng chờ Admin xác nhận.");
      refetchRequests();
    } catch {
      toast.error("Lỗi khi gửi yêu cầu nạp tiền");
    } finally {
      setUploadingReceipt(false);
    }
  }, [receiptFile, depositAmount, user, refetchRequests, createRequest]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchRequests()]);
    toast.success("Đã cập nhật dữ liệu ví");
  }, [refetchProfile, refetchRequests]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Show bank linking form if not linked yet
  const bankLinked = profile?.bank_name && profile?.bank_account_number && profile?.bank_account_holder;
  if (profile && !bankLinked) {
    return <BankLinkingForm userId={user.id} onLinked={() => refetchProfile()} />;
  }

  const balance = profile?.balance ?? 0;

  const handleSubmit = async () => {
    if (!amount || !showModal) {
      toast.error("Vui lòng nhập số tiền"); return;
    }
    const inputNum = parseFloat(amount);
    // Convert to USD if user entered VND
    const amountUsd = currency === "VND" ? inputNum / rate : inputNum;
    if (showModal === "withdraw") {
      const hasPendingWithdraw = requests?.some((r: any) => r.type === "withdraw" && r.status === "pending");
      if (hasPendingWithdraw) {
        toast.error("Bạn đang có lệnh rút tiền chờ xử lý. Vui lòng đợi lệnh hiện tại được duyệt hoặc hoàn về ví trước khi tạo lệnh mới.");
        return;
      }
      if (amountUsd > Number(balance)) {
        toast.error("Số dư không đủ"); return;
      }
    }
    if (showModal === "deposit") {
      // For deposit: only show QR screen, don't create request yet
      setDepositAmount(amountUsd.toString());
      // Store original VND amount to avoid double conversion with mismatched rates
      setDepositAmountVnd(currency === "VND" ? inputNum : Math.round(inputNum * usdToVnd));
      setShowDepositQR(true);
      setShowModal(null); setAmount(""); setSelectedMethod(null);
      return;
    }
    try {
      await createRequest.mutateAsync({
        type: "withdraw",
        amount: amountUsd,
        payment_method: "bank_transfer",
        bank_name: profile?.bank_name || "",
        bank_account_number: profile?.bank_account_number || "",
        bank_account_holder: profile?.bank_account_holder || "",
      });
      toast.success(`Yêu cầu rút ${formatAmount(amountUsd)} đang chờ phê duyệt`);
      setShowModal(null); setAmount(""); setSelectedMethod(null); setVipNote(null);
    } catch { toast.error("Lỗi khi gửi yêu cầu"); }
  };

  const pendingRequests = requests?.filter((r: any) => r.status === "pending") || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-lg text-foreground">Ví của tôi</h1>
          <button onClick={handleRefresh} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Linked Bank Info */}
      {bankLinked && (
        <div className="px-4 pt-4 space-y-3">
          <div className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
            {(() => {
              const bank = vietnamBanks.find(b => b.shortName === profile?.bank_name);
              return bank ? <BankLogo src={bank.logo} alt={bank.shortName} className="w-8 h-8 object-contain rounded" /> :
                <Building2 className="w-5 h-5 text-muted-foreground" />;
            })()}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{profile?.bank_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{profile?.bank_account_number} · {profile?.bank_account_holder}</p>
            </div>
            <CheckCircle className="w-4 h-4 text-profit shrink-0" />
          </div>

          {/* Bank Card Images */}
          {(profile?.bank_card_image_url || profile?.bank_card_back_image_url) && (
            <BankCardImages frontPath={profile?.bank_card_image_url} backPath={profile?.bank_card_back_image_url} />
          )}
        </div>
      )}

      {/* Balance Card */}
      <div className="px-4 pt-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <WalletIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tài khoản</p>
                  <p className="font-semibold text-sm text-foreground">{profile?.display_name || 'Trader'}</p>
                </div>
              </div>
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
                <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground">
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-3xl font-bold text-primary font-mono">
                {showBalance ? formatAmount(Number(balance)) : "••••••"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowModal("deposit")}
                className="py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
                <ArrowDownLeft className="w-5 h-5" /> Nạp tiền
              </button>
              <button onClick={() => setShowModal("withdraw")}
                className="py-3 rounded-xl border border-primary/30 text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10">
                <ArrowUpRight className="w-5 h-5" /> Rút tiền
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Tổng nạp", value: formatAmount(stats.totalDeposit), color: "text-profit" },
          { label: "Tổng rút", value: formatAmount(stats.totalWithdraw), color: "text-loss" },
          { label: "Chờ duyệt", value: stats.pendingCount.toString(), color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
            <p className={`font-bold text-sm font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Transaction History */}
      <div className="px-4 mt-5">
        <h3 className="font-semibold text-sm text-foreground mb-2">Lịch sử giao dịch</h3>
        {(!requests || requests.length === 0) ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 10).map((req: any) => (
              <div key={req.id} className="bg-card rounded-xl p-3 flex items-center justify-between border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${req.type === "deposit" ? "bg-profit/10" : "bg-loss/10"}`}>
                    {req.type === "deposit" ? <ArrowDownLeft className="w-4 h-4 text-profit" /> : <ArrowUpRight className="w-4 h-4 text-loss" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{req.type === "deposit" ? "Nạp tiền" : "Rút tiền"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-mono text-sm ${req.type === "deposit" ? "text-profit" : "text-loss"}`}>
                    {req.type === "deposit" ? "+" : "-"}{formatAmount(Number(req.amount))}
                  </p>
                  {req.status === "approved" ? (
                    <span className="text-xs text-profit flex items-center gap-1 justify-end"><CheckCircle className="w-3 h-3" />Đã duyệt</span>
                  ) : req.status === "rejected" ? (
                    <span className="text-xs text-loss flex items-center gap-1 justify-end"><XCircle className="w-3 h-3" />Từ chối</span>
                  ) : (
                    <span className="text-xs text-yellow-500 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />Chờ duyệt</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      {pendingRequests.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="font-semibold text-sm text-foreground mb-2">Yêu cầu đang chờ</h3>
          <div className="space-y-2">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="bg-card rounded-xl p-3 flex items-center justify-between border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${req.type === "deposit" ? "bg-profit/10" : "bg-loss/10"}`}>
                    {req.type === "deposit" ? <ArrowDownLeft className="w-4 h-4 text-profit" /> : <ArrowUpRight className="w-4 h-4 text-loss" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{req.type === "deposit" ? "Nạp tiền" : "Rút tiền"}</p>
                    <p className="text-xs text-muted-foreground">{req.payment_method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-mono ${req.type === "deposit" ? "text-profit" : "text-loss"}`}>
                    {req.type === "deposit" ? "+" : "-"}{formatAmount(Number(req.amount))}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-500"><Clock className="w-3 h-3" /><span className="text-xs">Chờ duyệt</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Deposit/Withdraw Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowModal(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card rounded-t-2xl w-full max-w-lg p-5 pb-24 border-t border-border max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">
                  {showModal === "deposit" ? "Nạp tiền" : "Rút tiền"}
                </h3>
                <button onClick={() => setShowModal(null)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Show linked bank for withdraw */}
              {showModal === "withdraw" && bankLinked && (
                <div className="mb-4 flex items-center gap-3 bg-secondary rounded-xl p-3">
                  {(() => {
                    const bank = vietnamBanks.find(b => b.shortName === profile?.bank_name);
                    return bank ? <BankLogo src={bank.logo} alt={bank.shortName} className="w-8 h-8 object-contain rounded" /> : null;
                  })()}
                  <div>
                    <p className="font-semibold text-sm text-foreground">{profile?.bank_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{profile?.bank_account_number} · {profile?.bank_account_holder}</p>
                  </div>
                </div>
              )}


              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Số tiền ({symbol})</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tiền" min="1"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="flex gap-2 mt-2">
                  {(currency === "VND" ? [1000000, 5000000, 10000000, 50000000] : [50, 100, 500, 1000]).map((v) => (
                    <button key={v} onClick={() => setAmount(v.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        amount === v.toString() ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}>{currency === "VND" ? `${(v / 1000000)}tr` : `$${v}`}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmit} disabled={createRequest.isPending || !amount}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                  showModal === "deposit"
                    ? "bg-primary text-primary-foreground"
                    : "bg-loss text-white"
                }`}>
                {createRequest.isPending ? "Đang xử lý..." : showModal === "deposit" ? "Nạp ngay" : "Gửi yêu cầu rút tiền"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit QR Code Screen */}
      <AnimatePresence>
        {showDepositQR && adminBank && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowDepositQR(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card rounded-t-2xl w-full max-w-lg p-5 pb-24 border-t border-border max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Thông tin chuyển khoản</h3>
                <button onClick={() => setShowDepositQR(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* QR Code */}
              <div className="bg-background rounded-xl p-4 flex flex-col items-center mb-4">
                <img
                  src={`https://img.vietqr.io/image/${adminBank.bank_short_name}-${adminBank.account_number}-compact.png?amount=${depositAmountVnd}&addInfo=${encodeURIComponent(vipNote || `NAP ${user?.id?.slice(0, 8).toUpperCase()}`)}&accountName=${encodeURIComponent(adminBank.account_holder)}`}
                  alt="QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-2">Quét mã QR để chuyển khoản</p>
              </div>

              {/* Bank Info */}
              <div className="bg-secondary rounded-xl p-4 space-y-3 mb-4">
                {[
                  { label: "Ngân hàng", value: adminBank.bank_name },
                  { label: "Số tài khoản", value: adminBank.account_number, copyable: true },
                  { label: "Chủ tài khoản", value: adminBank.account_holder },
                  { label: "Số tiền", value: `${depositAmountVnd.toLocaleString("vi-VN")} VND`, copyable: true },
                  { label: "Nội dung CK", value: vipNote || `NAP ${user?.id?.slice(0, 8).toUpperCase()}`, copyable: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{item.value}</p>
                    </div>
                    {item.copyable && (
                      <button onClick={() => { navigator.clipboard.writeText(String(item.value)); toast.success(`Đã sao chép ${item.label}`); }}
                        className="p-2 rounded-lg bg-card hover:bg-primary/10 transition-colors">
                        <Copy className="w-4 h-4 text-primary" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Receipt Upload */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tải hóa đơn giao dịch</label>
                <div
                  onClick={() => document.getElementById('receipt-upload-input')?.click()}
                  className="rounded-xl bg-secondary border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                >
                  {receiptPreview ? (
                    <div className="relative">
                      <img src={receiptPreview} alt="Hóa đơn" className="w-full h-40 object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setReceiptFile(null); setReceiptPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Nhấn để tải ảnh hóa đơn</p>
                      <p className="text-[10px] text-muted-foreground">Chụp hoặc chọn ảnh giao dịch thành công · Tối đa 5MB</p>
                    </div>
                  )}
                </div>
                <input id="receipt-upload-input" type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
                    setReceiptFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Vui lòng chuyển khoản, tải hóa đơn lên và ấn <span className="font-bold text-foreground">xác nhận nạp tiền</span> để Admin xét duyệt lệnh nạp.
                </p>
              </div>

              <button onClick={handleConfirmDeposit} disabled={uploadingReceipt || !receiptFile}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all disabled:opacity-50">
                {uploadingReceipt ? "Đang xử lý..." : "✅ Xác nhận nạp tiền"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNavBar />
    </div>
  );
};

export default WalletPage;
