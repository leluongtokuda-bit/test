import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileNavBar from "@/components/MobileNavBar";
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, X, ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionRequests } from "@/hooks/useTransactionRequests";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

const HistoryPage = () => {
  const { user, loading } = useAuth();
  const { data: requests } = useTransactionRequests();
  const { data: profile } = useProfile();
  const { formatAmount } = useCurrency();
  const [filter, setFilter] = useState<"all" | "deposit" | "withdraw" | "pending">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const loadReceiptUrl = async (path: string) => {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (data?.signedUrl) setReceiptSignedUrl(data.signedUrl);
    else setReceiptSignedUrl(null);
  };

  const handleSelectTransaction = (req: any) => {
    setSelectedTransaction(req);
    setReceiptSignedUrl(null);
    if (req.receipt_image_url) loadReceiptUrl(req.receipt_image_url);
  };

  const filtered = requests?.filter((r: any) => {
    if (filter === "all") return true;
    if (filter === "pending") return r.status === "pending";
    return r.type === filter;
  }) || [];

  const approved = requests?.filter((r: any) => r.status === "approved") || [];
  const totalDeposit = approved.filter((r: any) => r.type === "deposit").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalWithdraw = approved.filter((r: any) => r.type === "withdraw").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const pendingCount = requests?.filter((r: any) => r.status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center px-4 h-14">
          <h1 className="font-bold text-lg text-foreground">Lịch sử nạp / rút</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Tổng nạp</p>
            <p className="font-bold text-sm font-mono text-profit">{formatAmount(totalDeposit)}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Tổng rút</p>
            <p className="font-bold text-sm font-mono text-loss">{formatAmount(totalWithdraw)}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Chờ duyệt</p>
            <p className="font-bold text-sm font-mono text-primary">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "Tất cả" },
          { key: "deposit", label: "Nạp tiền" },
          { key: "withdraw", label: "Rút tiền" },
          { key: "pending", label: "Chờ duyệt" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Không có giao dịch nào</div>
        ) : (
          filtered.map((req: any, index: number) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}>
              <button onClick={() => handleSelectTransaction(req)}
                className="w-full bg-card rounded-xl p-3 flex items-center justify-between border border-border text-left hover:border-primary/30 transition-colors">
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
                  <p className={`font-bold font-mono ${req.type === "deposit" ? "text-profit" : "text-loss"}`}>
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
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setSelectedTransaction(null)}>
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-card rounded-t-2xl w-full max-w-lg p-5 pb-24 border-t border-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Chi tiết giao dịch</h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col items-center mb-5">
              <p className={`text-2xl font-bold font-mono ${selectedTransaction.type === "deposit" ? "text-profit" : "text-loss"}`}>
                {selectedTransaction.type === "deposit" ? "+" : "-"}{formatAmount(Number(selectedTransaction.amount))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTransaction.type === "deposit" ? "Nạp tiền" : "Rút tiền"}
              </p>
            </div>

            <div className="bg-secondary rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                {selectedTransaction.status === "approved" ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-profit"><CheckCircle className="w-4 h-4" />Đã duyệt</span>
                ) : selectedTransaction.status === "rejected" ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-loss"><XCircle className="w-4 h-4" />Từ chối</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-yellow-500"><Clock className="w-4 h-4" />Chờ duyệt</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Mã giao dịch</p>
                <p className="text-sm font-mono text-foreground">{selectedTransaction.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Phương thức</p>
                <p className="text-sm text-foreground">{selectedTransaction.payment_method || "Chuyển khoản"}</p>
              </div>
              {selectedTransaction.bank_name && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Ngân hàng</p>
                  <p className="text-sm text-foreground">{selectedTransaction.bank_name}</p>
                </div>
              )}
              {selectedTransaction.bank_account_number && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Số tài khoản</p>
                  <p className="text-sm font-mono text-foreground">{selectedTransaction.bank_account_number}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Thời gian tạo</p>
                <p className="text-sm text-foreground">{new Date(selectedTransaction.created_at).toLocaleString("vi-VN")}</p>
              </div>
              {selectedTransaction.type === "withdraw" && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Hạn mức rút tiền</p>
                  <p className="text-sm font-mono text-foreground">{formatAmount(Number(profile?.withdrawal_limit ?? 1000))}</p>
                </div>
              )}
              {selectedTransaction.processed_at && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Thời gian xử lý</p>
                  <p className="text-sm text-foreground">{new Date(selectedTransaction.processed_at).toLocaleString("vi-VN")}</p>
                </div>
              )}
              {selectedTransaction.admin_note && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Thông báo của hệ thống</p>
                  <p className="text-sm text-foreground bg-card rounded-lg p-2">{selectedTransaction.admin_note}</p>
                </div>
               )}
               {selectedTransaction.receipt_image_url && receiptSignedUrl && (
                 <div>
                   <p className="text-xs text-muted-foreground mb-1">Hóa đơn giao dịch</p>
                   <button onClick={() => setViewReceiptOpen(true)} className="w-full">
                     <img src={receiptSignedUrl} alt="Hóa đơn" className="w-full rounded-lg border border-border max-h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
                   </button>
                 </div>
               )}
             </div>
           </motion.div>
         </div>
       )}

       {/* Full screen receipt viewer */}
       {viewReceiptOpen && receiptSignedUrl && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] px-4" onClick={() => setViewReceiptOpen(false)}>
           <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setViewReceiptOpen(false)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
             <img src={receiptSignedUrl} alt="Hóa đơn" className="w-full rounded-xl max-h-[80vh] object-contain" />
           </div>
         </div>
       )}

      <MobileNavBar />
    </div>
  );
};

export default HistoryPage;
