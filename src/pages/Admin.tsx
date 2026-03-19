import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, updateUserBalance } from "@/hooks/useAdmin";
import { useAllTransactionRequests, useProcessTransactionRequest } from "@/hooks/useTransactionRequests";
import { supabase } from "@/integrations/supabase/client";
import { vietnamBanks } from "@/data/vietnamBanks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Shield, Users, Wallet, BarChart3, Menu, X,
  CheckCircle, XCircle, Clock, Edit2, Plus, Minus,
  Key, Copy, Ban, CheckCheck, Search, Save, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, RefreshCw, Crown, Target, Eye, ImageIcon, Trash2,
  Megaphone, Power, Bell, Send
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getNextRoundCodes, getCountdown, getCurrentRoundCode } from "@/lib/roundCode";

type AdminTab = "transactions" | "members" | "trades" | "referrals" | "bank-settings" | "vip" | "announcements" | "send-notification";

const RATE = 26000;
const fmtVnd = (usdAmount: number) => `${(usdAmount * RATE).toLocaleString("vi-VN")}₫`;

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "transactions", label: "Nạp / Rút", icon: Wallet },
  { id: "members", label: "Thành viên", icon: Users },
  { id: "trades", label: "Giao dịch", icon: BarChart3 },
  { id: "vip", label: "Đại lý VIP", icon: Crown },
  { id: "referrals", label: "Mã giới thiệu", icon: Key },
  { id: "bank-settings", label: "Ngân hàng", icon: Shield },
  { id: "announcements", label: "Thông báo", icon: Megaphone },
  { id: "send-notification", label: "Gửi TB cá nhân", icon: Bell },
];

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("transactions");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, () => {
        queryClient.invalidateQueries({ queryKey: ["allTrades"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transaction_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "referral_codes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["referralCodes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "round_presets" }, () => {
        queryClient.invalidateQueries({ queryKey: ["roundPresets"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vip_registrations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["allVipRegistrations"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_bank_settings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["adminBankSettings"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/admin/login");
  }, [loading, isAdmin, navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-primary">Đang tải...</div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <item.icon className="h-5 w-5" />{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />Quay lại app
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-bold text-foreground">Admin</span></div>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {sidebarItems.map((item) => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"
                  )}>
                  <item.icon className="h-5 w-5" />{item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
                <ArrowLeft className="h-4 w-4" />Quay lại app
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-8 py-4 flex items-center gap-3">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-foreground" /></button>
          <h2 className="text-lg font-semibold text-foreground">{sidebarItems.find(i => i.id === activeTab)?.label}</h2>
          <span className="ml-auto text-[10px] text-profit font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />LIVE</span>
        </header>
        <div className="p-4 md:p-8">
          {activeTab === "transactions" && <TransactionRequests />}
          {activeTab === "members" && <MembersList />}
          {activeTab === "trades" && <TradesList />}
          {activeTab === "referrals" && <ReferralCodesManager />}
          {activeTab === "vip" && <VipRegistrationsManager />}
          {activeTab === "bank-settings" && <BankSettingsManager />}
          {activeTab === "announcements" && <AnnouncementsManager />}
          {activeTab === "send-notification" && <SendNotificationManager />}
        </div>
      </main>
    </div>
  );
};

// --- Transaction Requests Tab ---
const TransactionRequests = () => {
  const { data: requests, isLoading } = useAllTransactionRequests();
  const { data: profiles } = useAllProfiles();
  const processRequest = useProcessTransactionRequest();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [approveWithdrawReq, setApproveWithdrawReq] = useState<any>(null);
  const [adminReceiptFile, setAdminReceiptFile] = useState<File | null>(null);
  const [adminReceiptPreview, setAdminReceiptPreview] = useState<string | null>(null);
  const [uploadingAdminReceipt, setUploadingAdminReceipt] = useState(false);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllProcessed = async () => {
    setDeleting(true);
    try {
      const processedItems = requests?.filter((r: any) => r.status !== "pending") || [];
      const ids = processedItems.map((r: any) => r.id);
      const { error } = await supabase.from("transaction_requests").delete().in("id", ids);
      if (error) throw error;
      toast.success("Đã xóa toàn bộ lịch sử yêu cầu");
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setDeleting(false);
    setConfirmDeleteAll(null);
  };

  const getUserName = (userId: string) => profiles?.find((p: any) => p.user_id === userId)?.display_name || "Unknown";

  const handleProcess = async (id: string, userId: string, type: "deposit" | "withdraw", amount: number, action: "approved" | "rejected", receiptPath?: string) => {
    try {
      await processRequest.mutateAsync({ requestId: id, userId, type, amount, action, adminNote: adminNote || undefined, receiptImageUrl: receiptPath });
      toast.success(action === "approved" ? "Đã phê duyệt" : "Đã từ chối");
      setRejectId(null); setAdminNote("");
    } catch { toast.error("Lỗi khi xử lý"); }
  };

  const handleApproveWithdraw = async () => {
    if (!approveWithdrawReq) return;
    if (!adminReceiptFile) { toast.error("Vui lòng tải hóa đơn giao dịch"); return; }
    setUploadingAdminReceipt(true);
    try {
      const ext = adminReceiptFile.name.split(".").pop();
      const path = `admin/${approveWithdrawReq.id}/receipt-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, adminReceiptFile);
      if (upErr) throw upErr;
      await handleProcess(approveWithdrawReq.id, approveWithdrawReq.user_id, "withdraw", Number(approveWithdrawReq.amount), "approved", path);
      setApproveWithdrawReq(null); setAdminReceiptFile(null); setAdminReceiptPreview(null);
    } catch (e: any) { toast.error("Lỗi tải hóa đơn: " + e.message); }
    finally { setUploadingAdminReceipt(false); }
  };

  const handleAdminReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setAdminReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAdminReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleViewReceipt = async (path: string) => {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (data?.signedUrl) { setViewReceiptUrl(data.signedUrl); setViewReceiptOpen(true); }
  };

  const handleClickApprove = (req: any) => {
    if (req.type === "withdraw") {
      setApproveWithdrawReq(req);
    } else {
      handleProcess(req.id, req.user_id, req.type, Number(req.amount), "approved");
    }
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  const pending = requests?.filter((r: any) => r.status === "pending") || [];
  const processed = requests?.filter((r: any) => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tổng yêu cầu</p>
          <p className="text-2xl font-bold text-foreground">{requests?.length || 0}</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" /> Chờ phê duyệt ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((req: any) => {
              const userProfile = profiles?.find((p: any) => p.user_id === req.user_id);
              const isWithdraw = req.type === "withdraw";
              const totalWithdrawals = isWithdraw ? (requests?.filter((r: any) => r.user_id === req.user_id && r.type === "withdraw").length || 0) : 0;
              const amountUsd = Number(req.amount);
              const amountVnd = amountUsd * RATE;
              const limit = userProfile?.withdrawal_limit ?? 1000;
              const reqCode = `RT${req.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
              const isExpanded = viewDetailId === req.id;

              return (
                <div key={req.id}>
                  {/* Compact row */}
                  <div className="bg-card rounded-xl px-4 py-3 border border-border flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">{userProfile?.full_name || userProfile?.display_name || "Unknown"}</span>
                        <span className={`text-xs font-semibold ${isWithdraw ? "text-loss" : "text-profit"}`}>
                          {isWithdraw ? "Rút" : "Nạp"} {fmtVnd(amountUsd)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(req.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}
                        {req.bank_name ? ` · ${req.bank_name} - ${req.bank_account_number || ""}` : ""}
                      </p>
                    </div>
                    <button onClick={() => setViewDetailId(isExpanded ? null : req.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {isExpanded ? "Ẩn" : "Xem"}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="bg-card rounded-xl border border-border overflow-hidden mt-2 max-w-lg mx-auto">
                      <div className="border-b border-border px-5 py-3">
                        <h4 className="text-center font-bold text-foreground text-lg uppercase">
                          Chi tiết lệnh {isWithdraw ? "rút tiền" : "nạp tiền"}
                        </h4>
                      </div>
                      <div className="px-5 py-4">
                        <table className="w-full text-sm">
                          <tbody className="[&_tr]:border-b [&_tr]:border-border/50 [&_tr:last-child]:border-0">
                            <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Trạng thái:</td><td className="text-foreground font-medium py-2 text-right">Tạo lệnh</td></tr>
                            <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Họ & Tên:</td><td className="text-foreground font-semibold py-2 text-right">{userProfile?.full_name || userProfile?.display_name || "—"}</td></tr>
                            <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Số điện thoại:</td><td className="text-foreground font-semibold py-2 text-right">{userProfile?.phone || "—"}</td></tr>
                            <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Mã lệnh:</td><td className="text-foreground font-semibold py-2 text-right">{reqCode}</td></tr>
                            <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Thời gian:</td><td className="text-foreground font-medium py-2 text-right">{new Date(req.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</td></tr>
                            {isWithdraw && (
                              <>
                                <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Tổng số lần rút:</td><td className="text-foreground font-semibold py-2 text-right">{totalWithdrawals}</td></tr>
                                <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Hạn mức rút:</td><td className="text-profit font-bold py-2 text-right">{fmtVnd(Number(limit))}</td></tr>
                                <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">% thu:</td><td className="text-foreground font-medium py-2 text-right">0 %</td></tr>
                              </>
                            )}
                            <tr>
                              <td className="text-loss font-bold py-2 pr-4 whitespace-nowrap">{isWithdraw ? "Rút tiền:" : "Nạp tiền:"}</td>
                              <td className="text-right py-2">
                                <span className="text-loss font-bold">{isWithdraw ? "-" : "+"}{fmtVnd(amountUsd)}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {req.bank_name && (
                        <div className="border-t border-border px-5 py-4">
                          <h5 className="text-center font-bold text-foreground text-lg uppercase mb-3">Phương thức thanh toán</h5>
                          <table className="w-full text-sm">
                            <tbody className="[&_tr]:border-b [&_tr]:border-border/50 [&_tr:last-child]:border-0">
                              <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Tên ngân hàng:</td><td className="text-foreground font-semibold py-2 text-right">{req.bank_name}</td></tr>
                              <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Tên chủ thẻ:</td><td className="text-foreground font-semibold py-2 text-right">{req.bank_account_holder || "—"}</td></tr>
                              <tr><td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">Số tài khoản:</td><td className="text-foreground font-semibold py-2 text-right">{req.bank_account_number || "—"}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                      {req.receipt_image_url && (
                        <div className="border-t border-border px-5 py-3">
                          <button onClick={() => handleViewReceipt(req.receipt_image_url)}
                            className="text-xs text-primary flex items-center gap-1.5 hover:underline">
                            <ImageIcon className="w-3.5 h-3.5" /> Xem hóa đơn thành viên
                          </button>
                        </div>
                      )}
                      <div className="border-t border-border px-5 py-4 flex gap-3">
                        <button onClick={() => setRejectId(req.id)} disabled={processRequest.isPending}
                          className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-bold border border-border disabled:opacity-50 hover:bg-secondary/80 transition-colors">
                          Từ chối
                        </button>
                        <button onClick={() => handleClickApprove(req)} disabled={processRequest.isPending}
                          className="flex-1 py-2.5 rounded-lg bg-loss text-white text-sm font-bold disabled:opacity-50 hover:bg-loss/90 transition-colors">
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Lịch sử yêu cầu</h3>
            <button onClick={() => setConfirmDeleteAll("transactions")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-loss/10 text-loss text-xs font-semibold hover:bg-loss/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Xóa toàn bộ
            </button>
          </div>
          <div className="space-y-2">
            {processed.map((req: any) => (
              <div key={req.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{getUserName(req.user_id)}</span>
                    <span className={`ml-2 text-xs ${req.type === "deposit" ? "text-profit" : "text-loss"}`}>
                      {req.type === "deposit" ? "Nạp" : "Rút"} {fmtVnd(Number(req.amount))}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${req.status === "approved" ? "text-profit" : "text-loss"}`}>
                    {req.status === "approved" ? "✓ Đã duyệt" : "✕ Từ chối"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(req.created_at).toLocaleString("vi-VN")}
                  {req.bank_name && ` · ${req.bank_name} - ${req.bank_account_number}`}
                </p>
                {req.receipt_image_url && (
                  <button onClick={() => handleViewReceipt(req.receipt_image_url)}
                    className="text-xs text-primary flex items-center gap-1 mt-1.5 hover:underline">
                    <ImageIcon className="w-3.5 h-3.5" /> Xem hóa đơn
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm delete all modal */}
      {confirmDeleteAll === "transactions" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-2">Xóa toàn bộ lịch sử?</h3>
            <p className="text-sm text-muted-foreground mb-4">Hành động này sẽ xóa vĩnh viễn {processed.length} yêu cầu đã xử lý. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteAll(null)}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleDeleteAllProcessed} disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-loss text-white font-semibold text-sm disabled:opacity-50">
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-3">Từ chối yêu cầu</h3>
            <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Lý do từ chối (tùy chọn)"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectId(null); setAdminNote(""); }}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={() => {
                const req = requests?.find((r: any) => r.id === rejectId);
                if (req) handleProcess(req.id, req.user_id, req.type as any, Number(req.amount), "rejected");
              }}
                className="flex-1 py-2 rounded-lg bg-loss text-white font-semibold text-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve withdrawal with receipt upload modal */}
      {approveWithdrawReq && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => { setApproveWithdrawReq(null); setAdminReceiptFile(null); setAdminReceiptPreview(null); }}>
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-1">Duyệt lệnh rút tiền</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {getUserName(approveWithdrawReq.user_id)} · {fmtVnd(Number(approveWithdrawReq.amount))}
            </p>
            <p className="text-sm text-foreground font-medium mb-2">Tải hóa đơn giao dịch thành công</p>
            {adminReceiptPreview ? (
              <div className="relative mb-3">
                <img src={adminReceiptPreview} alt="Receipt" className="w-full rounded-lg border border-border max-h-48 object-contain" />
                <button onClick={() => { setAdminReceiptFile(null); setAdminReceiptPreview(null); }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><X className="w-4 h-4 text-white" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors mb-3">
                <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Chọn ảnh hóa đơn</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAdminReceiptChange} />
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setApproveWithdrawReq(null); setAdminReceiptFile(null); setAdminReceiptPreview(null); }}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleApproveWithdraw} disabled={uploadingAdminReceipt || !adminReceiptFile}
                className="flex-1 py-2 rounded-lg bg-profit text-white font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                {uploadingAdminReceipt ? "Đang tải..." : <><CheckCircle className="w-4 h-4" /> Xác nhận duyệt</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View receipt image modal */}
      {viewReceiptOpen && viewReceiptUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={() => setViewReceiptOpen(false)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewReceiptOpen(false)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
            <img src={viewReceiptUrl} alt="Receipt" className="w-full rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Members Tab (Full Edit + Balance +/- + Ban/Unban) ---
// Helper to load signed URLs for private bucket images
const useSignedUrl = (bucket: string, path: string | null | undefined) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [bucket, path]);
  return url;
};

const MembersList = () => {
  const { data: profiles, isLoading } = useAllProfiles();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [balanceAdjust, setBalanceAdjust] = useState<{ user: any; amount: string; type: "add" | "sub"; note: string; payment_method: string; currency: "VND" | "USD" } | null>(null);
  const [viewUser, setViewUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ user_id: deleteUser.user_id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Lỗi xóa tài khoản");
      toast.success("Đã xóa tài khoản thành viên");
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      setDeleteUser(null);
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = profiles?.filter((p: any) => {
    const q = search.toLowerCase();
    return !q || p.display_name?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q) || p.full_name?.toLowerCase().includes(q);
  });

  const handleSaveProfile = async () => {
    if (!editUser) return;
    const fieldsToSave = { ...editFields };
    if (fieldsToSave.withdrawal_limit === "" || fieldsToSave.withdrawal_limit === undefined) {
      fieldsToSave.withdrawal_limit = null;
    } else {
      fieldsToSave.withdrawal_limit = Number(fieldsToSave.withdrawal_limit);
    }
    const { error } = await supabase.from("profiles").update(fieldsToSave).eq("user_id", editUser.user_id);
    if (error) { toast.error("Lỗi: " + error.message); return; }
    toast.success("Đã cập nhật thông tin");
    queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
    setEditUser(null);
  };

  const handleBanToggle = async (userId: string, currentBan: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_banned: !currentBan }).eq("user_id", userId);
    if (error) { toast.error("Lỗi"); return; }
    toast.success(currentBan ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
  };

  const handleBalanceAdjust = async () => {
    if (!balanceAdjust || !balanceAdjust.amount || isNaN(Number(balanceAdjust.amount))) { toast.error("Số tiền không hợp lệ"); return; }
    if (balanceAdjust.type === "add" && !balanceAdjust.note.trim()) { toast.error("Vui lòng nhập lý do / ghi chú"); return; }
    const rawAmt = parseFloat(balanceAdjust.amount);
    const amt = balanceAdjust.currency === "VND" ? rawAmt / RATE : rawAmt;
    const currentBalance = Number(balanceAdjust.user.balance);
    const newBalance = balanceAdjust.type === "add" ? currentBalance + amt : currentBalance - amt;
    if (newBalance < 0) { toast.error("Số dư không thể âm"); return; }
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await supabase.rpc("add_balance", { _user_id: balanceAdjust.user.user_id, _amount: balanceAdjust.type === "add" ? amt : -amt });
      await supabase.from("transaction_requests").insert({
        user_id: balanceAdjust.user.user_id,
        type: balanceAdjust.type === "add" ? "deposit" : "withdraw",
        amount: amt,
        payment_method: balanceAdjust.payment_method.trim() || "Admin",
        admin_note: balanceAdjust.note.trim() || (balanceAdjust.type === "add" ? "Admin cộng tiền" : "Admin trừ tiền"),
        status: "approved",
        processed_at: new Date().toISOString(),
        processed_by: adminUser?.id || null,
      });
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["memberTransactions", balanceAdjust.user.user_id] });
      const displayAmt = balanceAdjust.currency === "VND" 
        ? `${rawAmt.toLocaleString("vi-VN")}₫` 
        : `$${rawAmt.toLocaleString()}`;
      toast.success(balanceAdjust.type === "add" ? `Đã cộng ${displayAmt}` : `Đã trừ ${displayAmt}`);
      setBalanceAdjust(null);
    } catch (e: any) { toast.error("Lỗi cập nhật: " + e.message); }
  };

  const openEdit = (p: any) => {
    setEditUser(p);
    setEditFields({
      display_name: p.display_name || "",
      full_name: p.full_name || "",
      phone: p.phone || "",
      address: p.address || "",
      date_of_birth: p.date_of_birth || "",
      id_card_number: p.id_card_number || "",
      withdrawal_limit: p.withdrawal_limit ?? "",
      bank_name: p.bank_name || "",
      bank_account_number: p.bank_account_number || "",
      bank_account_holder: p.bank_account_holder || "",
      vip_package: p.vip_package || "",
    });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Thành viên</p>
          <p className="text-2xl font-bold text-primary">{profiles?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tổng số dư</p>
          <p className="text-2xl font-bold text-profit font-mono">
            {fmtVnd(profiles?.reduce((s: number, p: any) => s + Number(p.balance), 0) || 0)}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, SĐT..."
          className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="space-y-2">
        {filtered?.map((p: any) => (
          <div key={p.id} className={cn("bg-card rounded-xl p-4 border", p.is_banned ? "border-loss/50 opacity-70" : "border-border")}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm truncate">{p.display_name || "Chưa đặt tên"}</p>
                  {p.is_banned && <span className="text-[10px] bg-loss/20 text-loss px-1.5 py-0.5 rounded font-semibold">Bị khóa</span>}
                  {p.vip_package && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-semibold">{p.vip_package}</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.phone || "Chưa có SĐT"} · Số dư: <span className="font-mono text-profit">{fmtVnd(Number(p.balance))}</span>
                  {" · "}{new Date(p.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="flex gap-1.5 ml-2">
                <button onClick={() => setViewUser(p)} title="Xem chi tiết"
                  className="p-2 rounded-lg bg-secondary text-primary hover:bg-primary/20 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => setBalanceAdjust({ user: p, amount: "", type: "add", note: "", payment_method: "", currency: "VND" })}
                  title="Cộng/Trừ tiền"
                  className="p-2 rounded-lg bg-secondary text-profit hover:bg-profit/20 transition-colors">
                  <Wallet className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(p)} title="Chỉnh sửa"
                  className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleBanToggle(p.user_id, p.is_banned)}
                  title={p.is_banned ? "Mở khóa" : "Khóa"}
                  className={cn("p-2 rounded-lg transition-colors", p.is_banned ? "bg-profit/20 text-profit hover:bg-profit/30" : "bg-secondary text-loss hover:bg-loss/20")}>
                  {p.is_banned ? <CheckCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </button>
                <button onClick={() => setDeleteUser(p)} title="Xóa tài khoản"
                  className="p-2 rounded-lg bg-secondary text-loss hover:bg-loss/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Member Detail Modal */}
      {viewUser && <MemberDetailModal user={viewUser} onClose={() => setViewUser(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-2">Xóa tài khoản thành viên</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Bạn có chắc muốn xóa tài khoản <span className="font-semibold text-foreground">{deleteUser.display_name}</span>?
            </p>
            <p className="text-xs text-loss mb-4">
              ⚠️ Toàn bộ dữ liệu (hồ sơ, giao dịch, lệnh nạp/rút, VIP) sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteUser(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleDeleteUser} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-loss text-white font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                {deleting ? "Đang xóa..." : <><Trash2 className="w-4 h-4" /> Xóa vĩnh viễn</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjust Modal */}
      {balanceAdjust && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-1">Cộng / Trừ tiền</h3>
            <p className="text-xs text-muted-foreground mb-1">{balanceAdjust.user.display_name}</p>
            <p className="text-sm font-mono text-profit mb-4">
              Số dư hiện tại: {balanceAdjust.currency === "VND" 
                ? `${(Number(balanceAdjust.user.balance) * RATE).toLocaleString("vi-VN")}₫` 
                : `$${Number(balanceAdjust.user.balance).toLocaleString()}`}
            </p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setBalanceAdjust({ ...balanceAdjust, type: "add" })}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors",
                  balanceAdjust.type === "add" ? "bg-profit text-white" : "bg-secondary text-muted-foreground")}>
                <Plus className="w-4 h-4" /> Cộng
              </button>
              <button onClick={() => setBalanceAdjust({ ...balanceAdjust, type: "sub" })}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors",
                  balanceAdjust.type === "sub" ? "bg-loss text-white" : "bg-secondary text-muted-foreground")}>
                <Minus className="w-4 h-4" /> Trừ
              </button>
            </div>
            <div className="flex gap-1 mb-2">
              <button onClick={() => setBalanceAdjust({ ...balanceAdjust, currency: "VND" })}
                className={cn("px-3 py-1 rounded text-xs font-bold transition-colors",
                  balanceAdjust.currency === "VND" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>₫ VND</button>
              <button onClick={() => setBalanceAdjust({ ...balanceAdjust, currency: "USD" })}
                className={cn("px-3 py-1 rounded text-xs font-bold transition-colors",
                  balanceAdjust.currency === "USD" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>$ USD</button>
            </div>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">{balanceAdjust.currency === "VND" ? "₫" : "$"}</span>
              <input type="number" value={balanceAdjust.amount} onChange={(e) => setBalanceAdjust({ ...balanceAdjust, amount: e.target.value })}
                placeholder="Nhập số tiền"
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
            </div>
            {balanceAdjust.currency === "VND" && balanceAdjust.amount && !isNaN(Number(balanceAdjust.amount)) && (
              <p className="text-[10px] text-muted-foreground mb-2">≈ ${(parseFloat(balanceAdjust.amount) / RATE).toFixed(2)} USD</p>
            )}
            {(balanceAdjust.currency !== "VND" || !balanceAdjust.amount || isNaN(Number(balanceAdjust.amount))) && <div className="mb-2" />}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Phương thức thanh toán</label>
              <input type="text" value={balanceAdjust.payment_method} onChange={(e) => setBalanceAdjust({ ...balanceAdjust, payment_method: e.target.value })}
                placeholder="VD: Chuyển khoản, USDT, Admin..."
                className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Lý do / Ghi chú <span className="text-loss">*</span></label>
              <textarea value={balanceAdjust.note} onChange={(e) => setBalanceAdjust({ ...balanceAdjust, note: e.target.value })}
                placeholder="Nhập lý do cộng/trừ tiền..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBalanceAdjust(null)}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleBalanceAdjust}
                className={cn("flex-1 py-2.5 rounded-lg font-semibold text-sm text-white",
                  balanceAdjust.type === "add" ? "bg-profit" : "bg-loss")}>
                {balanceAdjust.type === "add" ? "Cộng tiền" : "Trừ tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-md">
            <h3 className="font-bold text-foreground mb-4">Chỉnh sửa thông tin</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { key: "display_name", label: "Tên hiển thị" },
                { key: "full_name", label: "Họ tên đầy đủ" },
                { key: "phone", label: "Số điện thoại" },
                { key: "address", label: "Địa chỉ" },
                { key: "date_of_birth", label: "Ngày sinh", type: "date" },
                { key: "id_card_number", label: "Số CCCD/CMND" },
                { key: "bank_name", label: "Ngân hàng" },
                { key: "bank_account_number", label: "Số tài khoản ngân hàng" },
                { key: "bank_account_holder", label: "Chủ tài khoản ngân hàng" },
                { key: "vip_package", label: "Gói VIP" },
                { key: "withdrawal_limit", label: "Hạn mức rút tiền (₫)", type: "number", placeholder: "Mặc định: 26,000,000" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input type={f.type || "text"} value={editFields[f.key] ?? ""}
                    onChange={(e) => setEditFields({ ...editFields, [f.key]: e.target.value })}
                    placeholder={(f as any).placeholder || ""}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1">
                <Save className="w-4 h-4" /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Member Detail Modal ---
const MemberDetailModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const idFrontUrl = useSignedUrl("id-cards", user.id_card_front_url);
  const idBackUrl = useSignedUrl("id-cards", user.id_card_back_url);
  const bankFrontUrl = useSignedUrl("bank-cards", user.bank_card_image_url);
  const bankBackUrl = useSignedUrl("bank-cards", user.bank_card_back_image_url);
  const [detailTab, setDetailTab] = useState<"info" | "balance-history">("info");
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  // Edit/Add/Delete state
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: "", status: "", admin_note: "", type: "", payment_method: "", created_at: "", currency: "VND" as "VND" | "USD" });
  const [addingTx, setAddingTx] = useState(false);
  const [addForm, setAddForm] = useState({ type: "deposit", amount: "", payment_method: "", admin_note: "", created_at: "", currency: "VND" as "USD" | "VND" });
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch balance history data
  const { data: userTransactions, refetch: refetchTx } = useQuery({
    queryKey: ["memberTransactions", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_requests")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: userTrades } = useQuery({
    queryKey: ["memberTrades", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Combine into a unified timeline
  const balanceHistory = (() => {
    const items: { id?: string; table?: string; date: string; type: string; label: string; amount: number; status: string; detail?: string; raw?: any }[] = [];

    (userTransactions || []).forEach((t: any) => {
      items.push({
        id: t.id,
        table: "transaction_requests",
        date: t.created_at,
        type: t.type === "deposit" ? "deposit" : "withdraw",
        label: t.type === "deposit" ? "Nạp tiền" : "Rút tiền",
        amount: t.type === "deposit" ? Number(t.amount) : -Number(t.amount),
        status: t.status,
        detail: t.payment_method,
        raw: t,
      });
    });

    (userTrades || []).forEach((t: any) => {
      if (!t.result) return;
      const profit = Number(t.profit || 0);
      items.push({
        id: t.id,
        table: "trades",
        date: t.created_at,
        type: "trade",
        label: `${t.direction === "up" ? "Mua" : "Bán"} ${t.asset}`,
        amount: t.result === "win" ? profit : -Number(t.amount),
        status: t.result,
        detail: `${t.duration}s · $${Number(t.amount).toLocaleString()}`,
        raw: t,
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  })();

  const totalDeposit = balanceHistory.filter(i => i.type === "deposit" && i.status === "approved").reduce((s, i) => s + i.amount, 0);
  const totalWithdraw = balanceHistory.filter(i => i.type === "withdraw" && i.status === "approved").reduce((s, i) => s + Math.abs(i.amount), 0);
  const totalTradeProfit = balanceHistory.filter(i => i.type === "trade").reduce((s, i) => s + i.amount, 0);

  const handleStartEdit = (item: any) => {
    if (item.table !== "transaction_requests") return;
    setEditingTx(item.raw);
    setEditForm({
      amount: String(item.raw.amount),
      status: item.raw.status,
      admin_note: item.raw.admin_note || "",
      type: item.raw.type,
      payment_method: item.raw.payment_method || "",
      created_at: item.raw.created_at ? new Date(item.raw.created_at).toISOString().slice(0, 16) : "",
      currency: "VND",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setSaving(true);
    try {
      const rawAmt = parseFloat(editForm.amount);
      if (isNaN(rawAmt) || rawAmt <= 0) { toast.error("Số tiền không hợp lệ"); setSaving(false); return; }
      const newAmount = editForm.currency === "VND" ? rawAmt / RATE : rawAmt;

      const oldAmount = Number(editingTx.amount);
      const oldStatus = editingTx.status;
      const oldType = editingTx.type;

      // Update the record
      const { error } = await supabase.from("transaction_requests").update({
        amount: newAmount,
        status: editForm.status,
        admin_note: editForm.admin_note || null,
        type: editForm.type,
        payment_method: editForm.payment_method || "Admin",
        created_at: editForm.created_at ? new Date(editForm.created_at).toISOString() : editingTx.created_at,
        processed_at: editForm.status !== "pending" ? new Date().toISOString() : null,
        processed_by: editForm.status !== "pending" ? adminUser?.id : null,
      }).eq("id", editingTx.id);
      if (error) throw error;

      // Adjust balance if status/amount changed for approved transactions
      // Reverse old balance effect
      if (oldStatus === "approved") {
        const reverseAmt = oldType === "deposit" ? -oldAmount : oldAmount;
        await supabase.rpc("add_balance", { _user_id: user.user_id, _amount: reverseAmt });
      }
      // Apply new balance effect
      if (editForm.status === "approved") {
        const applyAmt = editForm.type === "deposit" ? newAmount : -newAmount;
        await supabase.rpc("add_balance", { _user_id: user.user_id, _amount: applyAmt });
      }

      toast.success("Đã cập nhật giao dịch");
      setEditingTx(null);
      refetchTx();
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setSaving(false);
  };

  const handleDeleteTx = async (id: string) => {
    setSaving(true);
    try {
      // Find the transaction to reverse balance
      const tx = (userTransactions || []).find((t: any) => t.id === id);
      if (tx && tx.status === "approved") {
        const reverseAmt = tx.type === "deposit" ? -Number(tx.amount) : Number(tx.amount);
        await supabase.rpc("add_balance", { _user_id: user.user_id, _amount: reverseAmt });
      }
      const { error } = await supabase.from("transaction_requests").delete().eq("id", id);
      if (error) throw error;
      toast.success("Đã xóa giao dịch");
      setDeletingTxId(null);
      refetchTx();
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setSaving(false);
  };

  const handleAddTx = async () => {
    setSaving(true);
    try {
      const rawAmount = parseFloat(addForm.amount);
      if (isNaN(rawAmount) || rawAmount <= 0) { toast.error("Số tiền không hợp lệ"); setSaving(false); return; }
      const amount = addForm.currency === "VND" ? rawAmount / RATE : rawAmount;

      const createdAt = addForm.created_at ? new Date(addForm.created_at).toISOString() : new Date().toISOString();

      const { error } = await supabase.from("transaction_requests").insert({
        user_id: user.user_id,
        type: addForm.type,
        amount,
        payment_method: addForm.payment_method.trim() || "Admin",
        admin_note: addForm.admin_note.trim() || null,
        status: "approved",
        processed_at: new Date().toISOString(),
        processed_by: adminUser?.id || null,
        created_at: createdAt,
      });
      if (error) throw error;

      // Adjust balance
      const balAmt = addForm.type === "deposit" ? amount : -amount;
      await supabase.rpc("add_balance", { _user_id: user.user_id, _amount: balAmt });

      toast.success("Đã thêm giao dịch");
      setAddingTx(false);
      setAddForm({ type: "deposit", amount: "", payment_method: "", admin_note: "", created_at: "", currency: "VND" });
      refetchTx();
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setSaving(false);
  };

  const infoRows = [
    { label: "Tên hiển thị", value: user.display_name },
    { label: "Họ tên đầy đủ", value: user.full_name },
    { label: "Số điện thoại", value: user.phone },
    { label: "Ngày sinh", value: user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString("vi-VN") : null },
    { label: "Địa chỉ", value: user.address },
    { label: "Số CCCD/CMND", value: user.id_card_number },
    { label: "Số dư", value: fmtVnd(Number(user.balance)) },
    { label: "Hạn mức rút", value: fmtVnd(Number(user.withdrawal_limit ?? 1000)) },
    { label: "Ngân hàng", value: user.bank_name },
    { label: "Số TK ngân hàng", value: user.bank_account_number },
    { label: "Chủ TK ngân hàng", value: user.bank_account_holder },
    { label: "Gói VIP", value: user.vip_package },
    { label: "VIP hết hạn", value: user.vip_expires_at ? new Date(user.vip_expires_at).toLocaleDateString("vi-VN") : null },
    { label: "Mã giới thiệu", value: user.referral_code_used },
    { label: "Ngày tạo", value: new Date(user.created_at).toLocaleString("vi-VN") },
    { label: "Trạng thái", value: user.is_banned ? "🔒 Bị khóa" : "✅ Hoạt động" },
  ];

  const statusLabel = (s: string) => s === "approved" ? "Đã duyệt" : s === "rejected" ? "Từ chối" : "Chờ duyệt";
  const statusColor = (s: string) => s === "approved" ? "text-profit" : s === "rejected" ? "text-loss" : "text-yellow-500";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 overflow-y-auto py-4">
      <div className="bg-card rounded-xl p-5 border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-lg">Chi tiết thành viên</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setDetailTab("info")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              detailTab === "info" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            Thông tin
          </button>
          <button onClick={() => setDetailTab("balance-history")}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
              detailTab === "balance-history" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            Biến động số dư
          </button>
        </div>

        {detailTab === "info" && (
          <>
            <div className="bg-secondary rounded-xl p-4 space-y-2.5 mb-4">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{row.label}</p>
                  <p className={cn("text-sm font-medium text-right break-all", "text-foreground")}>{row.value || "—"}</p>
                </div>
              ))}
            </div>

            {/* ID Card Images */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Ảnh CCCD/CMND
              </p>
              {(idFrontUrl || idBackUrl) ? (
                <div className="grid grid-cols-2 gap-2">
                  {idFrontUrl && (
                    <div className="relative">
                      <img src={idFrontUrl} alt="CCCD mặt trước" className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer" 
                        onClick={() => window.open(idFrontUrl, '_blank')} />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt trước</span>
                    </div>
                  )}
                  {idBackUrl && (
                    <div className="relative">
                      <img src={idBackUrl} alt="CCCD mặt sau" className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer"
                        onClick={() => window.open(idBackUrl, '_blank')} />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt sau</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Không có dữ liệu</p>
              )}
            </div>

            {/* Bank Card Images */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Ảnh thẻ ngân hàng
              </p>
              {(bankFrontUrl || bankBackUrl) ? (
                <div className="grid grid-cols-2 gap-2">
                  {bankFrontUrl && (
                    <div className="relative">
                      <img src={bankFrontUrl} alt="Thẻ mặt trước" className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer"
                        onClick={() => window.open(bankFrontUrl, '_blank')} />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt trước</span>
                    </div>
                  )}
                  {bankBackUrl && (
                    <div className="relative">
                      <img src={bankBackUrl} alt="Thẻ mặt sau" className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer"
                        onClick={() => window.open(bankBackUrl, '_blank')} />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-foreground font-medium">Mặt sau</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Không có dữ liệu</p>
              )}
            </div>
          </>
        )}

        {detailTab === "balance-history" && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Tổng nạp</p>
                <p className="font-bold text-xs font-mono text-profit">+{fmtVnd(totalDeposit)}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Tổng rút</p>
                <p className="font-bold text-xs font-mono text-loss">-{fmtVnd(totalWithdraw)}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Lãi/Lỗ cược</p>
                <p className={cn("font-bold text-xs font-mono", totalTradeProfit >= 0 ? "text-profit" : "text-loss")}>
                  {totalTradeProfit >= 0 ? "+" : ""}{fmtVnd(Math.abs(totalTradeProfit))}
                </p>
              </div>
            </div>

            {/* Add Transaction Button */}
            <button onClick={() => setAddingTx(true)}
              className="w-full mb-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Thêm giao dịch
            </button>

            {/* Add Transaction Form */}
            {addingTx && (
              <div className="bg-secondary rounded-xl p-4 mb-3 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Thêm giao dịch mới</h4>
                <div className="flex gap-2">
                  <button onClick={() => setAddForm({ ...addForm, type: "deposit" })}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      addForm.type === "deposit" ? "bg-profit text-white" : "bg-card text-muted-foreground")}>Nạp tiền</button>
                  <button onClick={() => setAddForm({ ...addForm, type: "withdraw" })}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      addForm.type === "withdraw" ? "bg-loss text-white" : "bg-card text-muted-foreground")}>Rút tiền</button>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Số tiền</label>
                  <div className="flex gap-2">
                    <input type="number" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                      placeholder="0" className="flex-1 px-3 py-2 rounded-lg bg-card text-foreground border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="flex rounded-lg overflow-hidden border border-border">
                      <button onClick={() => setAddForm({ ...addForm, currency: "VND" })}
                        className={cn("px-2.5 py-2 text-xs font-semibold transition-colors", addForm.currency === "VND" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>₫</button>
                      <button onClick={() => setAddForm({ ...addForm, currency: "USD" })}
                        className={cn("px-2.5 py-2 text-xs font-semibold transition-colors", addForm.currency === "USD" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>$</button>
                    </div>
                  </div>
                  {addForm.currency === "VND" && addForm.amount && !isNaN(parseFloat(addForm.amount)) && (
                    <p className="text-[10px] text-muted-foreground mt-1">≈ ${(parseFloat(addForm.amount) / RATE).toFixed(2)} USD</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Phương thức</label>
                  <input type="text" value={addForm.payment_method} onChange={(e) => setAddForm({ ...addForm, payment_method: e.target.value })}
                    placeholder="VD: Chuyển khoản, USDT..." className="w-full px-3 py-2 rounded-lg bg-card text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Ghi chú</label>
                  <input type="text" value={addForm.admin_note} onChange={(e) => setAddForm({ ...addForm, admin_note: e.target.value })}
                    placeholder="Ghi chú..." className="w-full px-3 py-2 rounded-lg bg-card text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Thời gian (để trống = hiện tại)</label>
                  <input type="datetime-local" value={addForm.created_at} onChange={(e) => setAddForm({ ...addForm, created_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-card text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setAddingTx(false); setAddForm({ type: "deposit", amount: "", payment_method: "", admin_note: "", created_at: "", currency: "VND" }); }}
                    className="flex-1 py-2 rounded-lg bg-card text-muted-foreground text-sm font-semibold">Hủy</button>
                  <button onClick={handleAddTx} disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                    {saving ? "Đang lưu..." : "Thêm"}
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {balanceHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Chưa có biến động</p>
              ) : (
                balanceHistory.map((item, idx) => (
                  <div key={idx} className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          item.type === "deposit" ? "bg-profit/10" : item.type === "withdraw" ? "bg-loss/10" : item.status === "win" ? "bg-profit/10" : "bg-loss/10"
                        )}>
                          {item.type === "deposit" ? <Plus className="w-3.5 h-3.5 text-profit" /> :
                           item.type === "withdraw" ? <Minus className="w-3.5 h-3.5 text-loss" /> :
                           item.status === "win" ? <TrendingUp className="w-3.5 h-3.5 text-profit" /> :
                           <TrendingDown className="w-3.5 h-3.5 text-loss" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.label}
                            {item.table === "transaction_requests" && item.status !== "approved" && (
                              <span className={cn("ml-1.5 text-[10px] font-semibold", statusColor(item.status))}>
                                ({statusLabel(item.status)})
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                            {item.detail && ` · ${item.detail}`}
                          </p>
                          {item.raw?.admin_note && (
                            <p className="text-[10px] text-primary mt-0.5">📝 {item.raw.admin_note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <p className={cn("font-bold text-sm font-mono",
                          item.amount >= 0 ? "text-profit" : "text-loss")}>
                          {item.amount >= 0 ? "+" : ""}{fmtVnd(Math.abs(item.amount))}
                        </p>
                        {item.table === "transaction_requests" && (
                          <div className="flex gap-0.5">
                            <button onClick={() => handleStartEdit(item)} title="Sửa"
                              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeletingTxId(item.id!)} title="Xóa"
                              className="p-1 rounded text-muted-foreground hover:text-loss transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <button onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm mt-4">Đóng</button>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-4">Chỉnh sửa giao dịch</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setEditForm({ ...editForm, type: "deposit" })}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    editForm.type === "deposit" ? "bg-profit text-white" : "bg-secondary text-muted-foreground")}>Nạp tiền</button>
                <button onClick={() => setEditForm({ ...editForm, type: "withdraw" })}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    editForm.type === "withdraw" ? "bg-loss text-white" : "bg-secondary text-muted-foreground")}>Rút tiền</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditForm({ ...editForm, currency: "VND" })}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    editForm.currency === "VND" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>VND</button>
                <button onClick={() => setEditForm({ ...editForm, currency: "USD" })}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    editForm.currency === "USD" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>USD</button>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Số tiền ({editForm.currency === "VND" ? "₫" : "$"})</label>
                <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                {editForm.currency === "VND" && editForm.amount && !isNaN(Number(editForm.amount)) && (
                  <p className="text-[10px] text-muted-foreground mt-1">≈ ${(Number(editForm.amount) / RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
                )}
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Trạng thái</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Phương thức</label>
                <input type="text" value={editForm.payment_method} onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                  placeholder="VD: Chuyển khoản, USDT..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Ghi chú admin</label>
                <textarea value={editForm.admin_note} onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })}
                  rows={2} placeholder="Ghi chú..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Thời gian</label>
                <input type="datetime-local" value={editForm.created_at} onChange={(e) => setEditForm({ ...editForm, created_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingTx(null)}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingTxId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-2">Xóa giao dịch</h3>
            <p className="text-sm text-muted-foreground mb-4">Bạn có chắc muốn xóa giao dịch này? Số dư sẽ được điều chỉnh tương ứng.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingTxId(null)} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={() => handleDeleteTx(deletingTxId)} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-loss text-white font-semibold text-sm disabled:opacity-50">
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Trades Tab (Edit win/lose + Round Presets) ---
const TradesList = () => {
  const queryClient = useQueryClient();
  const { data: trades, isLoading } = useQuery({
    queryKey: ["allTrades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Auto-resolve stale pending trades on mount
  useEffect(() => {
    const resolveStale = async () => {
      try {
        await supabase.functions.invoke("resolve-trades");
        queryClient.invalidateQueries({ queryKey: ["allTrades"] });
        queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      } catch {}
    };
    resolveStale();
  }, []);
  const { data: profiles } = useAllProfiles();
  const { data: existingPresets, refetch: refetchPresets } = useQuery({
    queryKey: ["roundPresets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("round_presets").select("*");
      if (error) throw error;
      return data;
    },
  });
  const [filter, setFilter] = useState<"all" | "pending" | "win" | "lose">("all");
  const [editTrade, setEditTrade] = useState<any>(null);
  const [countdown, setCountdown] = useState(() => getCountdown());
  const [futureRounds, setFutureRounds] = useState(() => getNextRoundCodes(10));
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllTrades = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("trades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Đã xóa toàn bộ lịch sử giao dịch");
      queryClient.invalidateQueries({ queryKey: ["allTrades"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setDeleting(false);
    setConfirmDeleteAll(false);
  };
  // Live countdown + future rounds refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown());
      setFutureRounds(getNextRoundCodes(10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getUserName = (userId: string) => profiles?.find((p: any) => p.user_id === userId)?.display_name || "Unknown";

  const getPresetForCode = (code: string) => existingPresets?.find((p: any) => p.round_code === code);

  const handleSetPreset = async (roundCode: string, presetResult: "up" | "down") => {
    const existing = getPresetForCode(roundCode);
    if (existing) {
      if (existing.preset_result === presetResult) {
        // Toggle off — delete preset
        await supabase.from("round_presets").delete().eq("id", existing.id);
        toast.success("Đã xóa preset");
      } else {
        // Update
        await supabase.from("round_presets").update({ preset_result: presetResult }).eq("id", existing.id);
        toast.success(presetResult === "up" ? "Đã chỉnh → Tăng" : "Đã chỉnh → Giảm");
      }
    } else {
      // Create
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("round_presets").insert({
        round_code: roundCode,
        preset_result: presetResult,
        created_by: user!.id,
      });
      toast.success(presetResult === "up" ? "Preset → Tăng" : "Preset → Giảm");
    }
    refetchPresets();
  };

  const handleSetResult = async (trade: any, result: "win" | "lose") => {
    const profit = result === "win" ? Number(trade.amount) * 0.95 : -Number(trade.amount);
    const exitPrice = Number(trade.entry_price) + (result === "win"
      ? (trade.direction === "up" ? 0.001 : -0.001)
      : (trade.direction === "up" ? -0.001 : 0.001));

    const { error } = await supabase.from("trades").update({
      result, profit, exit_price: exitPrice,
    }).eq("id", trade.id);
    if (error) { toast.error("Lỗi: " + error.message); return; }

    const userProfile = profiles?.find((p: any) => p.user_id === trade.user_id);
    if (userProfile) {
      const currentBalance = Number(userProfile.balance);
      const newBalance = result === "win"
        ? currentBalance + Number(trade.amount) + profit
        : currentBalance;
      if (result === "win") {
        await updateUserBalance(trade.user_id, newBalance);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["allTrades"] });
    queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
    toast.success(result === "win" ? "Đã chỉnh thắng" : "Đã chỉnh thua");
    setEditTrade(null);
  };

  const filteredTrades = trades?.filter((t: any) => {
    if (filter === "pending") return !t.result || t.result === "pending";
    if (filter === "win") return t.result === "win";
    if (filter === "lose") return t.result === "lose";
    return true;
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {/* Round Presets Section */}
      <div className="bg-card rounded-xl border border-primary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Điều khiển mã lệnh
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mã hiện tại:</span>
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{futureRounds[0]?.code}</span>
            <span className={`font-mono text-xs font-bold ${countdown <= 10 ? "text-loss animate-pulse" : "text-foreground"}`}>{countdown}s</span>
          </div>
        </div>
        
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {futureRounds.map((round, index) => {
            const preset = getPresetForCode(round.code);
            const isCurrent = index === 0;
            return (
              <div key={round.code} className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                isCurrent ? "bg-primary/10 border border-primary/30" : "bg-secondary"
              )}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("text-[10px] font-semibold shrink-0",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {isCurrent ? "ĐANG CHẠY" : `+${round.startsIn}s`}
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">{round.code}</span>
                  {preset && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold",
                      preset.preset_result === "up" ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
                    )}>
                      {preset.preset_result === "up" ? "→ TĂNG" : "→ GIẢM"}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleSetPreset(round.code, "up")}
                    className={cn("px-2.5 py-1 rounded text-[10px] font-bold transition-colors",
                      preset?.preset_result === "up" 
                        ? "bg-profit text-white" 
                        : "bg-secondary text-muted-foreground hover:bg-profit/20 hover:text-profit border border-border"
                    )}>
                    Tăng
                  </button>
                  <button
                    onClick={() => handleSetPreset(round.code, "down")}
                    className={cn("px-2.5 py-1 rounded text-[10px] font-bold transition-colors",
                      preset?.preset_result === "down" 
                        ? "bg-loss text-white" 
                        : "bg-secondary text-muted-foreground hover:bg-loss/20 hover:text-loss border border-border"
                    )}>
                    Giảm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          * Nếu không chỉnh: nhiều người đặt → bên nhiều tiền hơn thua. 1 người đặt → theo giá sàn.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Đang chờ</p>
          <p className="text-2xl font-bold text-yellow-500">{trades?.filter((t: any) => !t.result || t.result === "pending").length || 0}</p>
          {(trades?.filter((t: any) => !t.result || t.result === "pending").length || 0) > 0 && (
            <button onClick={async () => {
              try {
                await supabase.functions.invoke("resolve-trades");
                queryClient.invalidateQueries({ queryKey: ["allTrades"] });
                queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
                toast.success("Đã xử lý lệnh đang chờ");
              } catch { toast.error("Lỗi khi xử lý"); }
            }} className="mt-2 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-semibold hover:bg-primary/20 transition-colors">
              Xử lý ngay
            </button>
          )}
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Thắng</p>
          <p className="text-2xl font-bold text-profit">{trades?.filter((t: any) => t.result === "win").length || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Thua</p>
          <p className="text-2xl font-bold text-loss">{trades?.filter((t: any) => t.result === "lose").length || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {([["all", "Tất cả"], ["pending", "Chờ"], ["win", "Thắng"], ["lose", "Thua"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                filter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
        {trades && trades.length > 0 && (
          <button onClick={() => setConfirmDeleteAll(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-loss/10 text-loss text-xs font-semibold hover:bg-loss/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Xóa toàn bộ
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filteredTrades?.map((t: any) => (
          <div key={t.id} className="bg-card rounded-xl p-3 border border-border">
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground mr-2">#{t.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-sm font-medium text-foreground">{getUserName(t.user_id)}</span>
                <span className={`ml-2 text-xs font-bold ${t.direction === "up" ? "text-profit" : "text-loss"}`}>
                  {t.direction === "up" ? "↑ TĂNG" : "↓ GIẢM"}
                </span>
                <span className="ml-2 font-mono text-sm text-foreground">{fmtVnd(Number(t.amount))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-mono font-semibold",
                  t.result === "win" ? "text-profit" : t.result === "lose" ? "text-loss" : "text-yellow-500")}>
                  {t.result === "win" ? `+${fmtVnd(Number(t.profit || 0))}` : t.result === "lose" ? `-${fmtVnd(Number(t.amount))}` : "Đang chờ"}
                </span>
                <button onClick={() => setEditTrade(t)}
                  className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Điều chỉnh kết quả">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t.asset} · {new Date(t.created_at).toLocaleString("vi-VN")}</p>
          </div>
        ))}
        {(!filteredTrades || filteredTrades.length === 0) && (
          <p className="text-center text-muted-foreground py-8">Không có giao dịch nào</p>
        )}
      </div>

      {/* Confirm delete all trades modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-2">Xóa toàn bộ giao dịch?</h3>
            <p className="text-sm text-muted-foreground mb-4">Hành động này sẽ xóa vĩnh viễn {trades?.length || 0} giao dịch. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteAll(false)}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleDeleteAllTrades} disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-loss text-white font-semibold text-sm disabled:opacity-50">
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Result Modal */}
      {editTrade && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-1">Điều chỉnh kết quả</h3>
            <p className="text-xs text-muted-foreground mb-1">{getUserName(editTrade.user_id)}</p>
            <div className="bg-secondary rounded-lg p-3 mb-4 space-y-1">
              <p className="text-xs text-muted-foreground">Mã lệnh: <span className="font-mono font-bold text-foreground">#{editTrade.id.slice(0, 8).toUpperCase()}</span></p>
              <p className="text-xs text-muted-foreground">Lệnh: <span className={`font-bold ${editTrade.direction === "up" ? "text-profit" : "text-loss"}`}>
                {editTrade.direction === "up" ? "TĂNG" : "GIẢM"}
              </span> · {fmtVnd(Number(editTrade.amount))}</p>
              <p className="text-xs text-muted-foreground">Tài sản: {editTrade.asset}</p>
              <p className="text-xs text-muted-foreground">
                Trạng thái hiện tại: <span className={cn("font-semibold",
                  editTrade.result === "win" ? "text-profit" : editTrade.result === "lose" ? "text-loss" : "text-yellow-500")}>
                  {editTrade.result === "win" ? "Thắng" : editTrade.result === "lose" ? "Thua" : "Đang chờ"}
                </span>
              </p>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => handleSetResult(editTrade, "win")}
                className="flex-1 py-3 rounded-lg bg-profit text-white font-bold text-sm flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Thắng
              </button>
              <button onClick={() => handleSetResult(editTrade, "lose")}
                className="flex-1 py-3 rounded-lg bg-loss text-white font-bold text-sm flex items-center justify-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> Thua
              </button>
            </div>
            <button onClick={() => setEditTrade(null)}
              className="w-full py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Referral Codes Tab ---
const ReferralCodesManager = () => {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const { data: codes, isLoading } = useQuery({
    queryKey: ["referralCodes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { user } = useAuth();

  const handleCreate = async () => {
    if (!newCode.trim()) { toast.error("Vui lòng nhập mã"); return; }
    const { error } = await supabase.from("referral_codes").insert({
      code: newCode.trim().toUpperCase(),
      created_by: user!.id,
      max_uses: maxUses ? parseInt(maxUses) : null,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Mã đã tồn tại");
      else toast.error(error.message);
      return;
    }
    toast.success("Đã tạo mã giới thiệu");
    setNewCode(""); setMaxUses("");
    queryClient.invalidateQueries({ queryKey: ["referralCodes"] });
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await supabase.from("referral_codes").update({ is_active: !currentActive }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["referralCodes"] });
    toast.success(currentActive ? "Đã tắt mã" : "Đã kích hoạt mã");
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã");
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-3">Tạo mã giới thiệu mới</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã (VD: UPBIT2026)"
            className="flex-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number"
            placeholder="Giới hạn (trống = vô hạn)"
            className="w-full sm:w-40 px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleCreate}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1 justify-center">
            <Plus className="w-4 h-4" /> Tạo mã
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {codes?.map((c: any) => (
          <div key={c.id} className={`bg-card rounded-xl p-4 border ${c.is_active ? "border-primary/30" : "border-border opacity-60"} flex items-center justify-between`}>
            <div>
              <p className="font-bold font-mono text-foreground">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                Đã dùng: {c.current_uses}{c.max_uses ? `/${c.max_uses}` : ""} lần
                {" · "}{new Date(c.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleCopy(c.code)} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={() => handleToggle(c.id, c.is_active)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.is_active ? "bg-loss/20 text-loss" : "bg-profit/20 text-profit"}`}>
                {c.is_active ? "Tắt" : "Bật"}
              </button>
            </div>
          </div>
        ))}
        {(!codes || codes.length === 0) && (
          <p className="text-center text-muted-foreground py-8">Chưa có mã giới thiệu nào</p>
        )}
      </div>
    </div>
  );
};

// --- Bank Settings Manager ---
const BankSettingsManager = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminBankSettings"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_bank_settings").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const selectedBank = vietnamBanks.find(b => b.id === selectedBankId);
  const filteredBanks = vietnamBanks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.shortName.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedBankId || !accountNumber || !accountHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin"); return;
    }
    const bank = vietnamBanks.find(b => b.id === selectedBankId);
    if (!bank) return;
    setSaving(true);
    try {
      await supabase.from("admin_bank_settings").update({ is_active: false }).eq("is_active", true);
      const { error } = await supabase.from("admin_bank_settings").insert({
        bank_name: bank.name,
        bank_short_name: bank.id.toUpperCase(),
        account_number: accountNumber.trim(),
        account_holder: accountHolder.trim().toUpperCase(),
        is_active: true,
      });
      if (error) throw error;
      toast.success("Đã cập nhật thông tin ngân hàng");
      queryClient.invalidateQueries({ queryKey: ["adminBankSettings"] });
      setShowForm(false);
      setSelectedBankId(""); setAccountNumber(""); setAccountHolder(""); setBankSearch("");
    } catch { toast.error("Lỗi khi lưu"); }
    setSaving(false);
  };

  const activeSetting = settings?.find((s: any) => s.is_active);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Tài khoản ngân hàng nhận tiền</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          {showForm ? "Hủy" : activeSetting ? "Thay đổi" : "Thêm mới"}
        </button>
      </div>

      {/* Current active bank */}
      {activeSetting && !showForm && (
        <div className="bg-card rounded-xl p-5 border-2 border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-profit" />
            <span className="font-bold text-foreground">Đang hoạt động</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Ngân hàng</p>
              <p className="font-semibold text-foreground">{activeSetting.bank_name} ({activeSetting.bank_short_name})</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Số tài khoản</p>
              <p className="font-semibold text-foreground font-mono">{activeSetting.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chủ tài khoản</p>
              <p className="font-semibold text-foreground">{activeSetting.account_holder}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Chọn ngân hàng</label>
            <button type="button" onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary">
              {selectedBank ? (
                <div className="flex items-center gap-2">
                  <img src={selectedBank.logo} alt={selectedBank.shortName} className="w-6 h-6 object-contain rounded" />
                  <span>{selectedBank.shortName} - {selectedBank.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-- Chọn ngân hàng --</span>
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {bankDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Tìm ngân hàng..."
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus />
                </div>
                <div className="overflow-y-auto max-h-48">
                  {filteredBanks.map((bank) => (
                    <button key={bank.id} type="button"
                      onClick={() => { setSelectedBankId(bank.id); setBankDropdownOpen(false); setBankSearch(""); }}
                      className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-secondary transition-colors text-left ${
                        selectedBankId === bank.id ? "bg-primary/10" : ""
                      }`}>
                      <img src={bank.logo} alt={bank.shortName} className="w-6 h-6 object-contain rounded" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{bank.shortName}</p>
                        <p className="text-[10px] text-muted-foreground">{bank.name}</p>
                      </div>
                    </button>
                  ))}
                  {filteredBanks.length === 0 && (
                    <p className="text-center py-3 text-sm text-muted-foreground">Không tìm thấy</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Số tài khoản</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Nhập số tài khoản"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tên chủ tài khoản</label>
            <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN A"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu thông tin ngân hàng"}
          </button>
        </div>
      )}

      {/* History */}
      {settings && settings.filter((s: any) => !s.is_active).length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-2">Lịch sử</h4>
          <div className="space-y-2">
            {settings.filter((s: any) => !s.is_active).map((s: any) => (
              <div key={s.id} className="bg-card rounded-lg p-3 border border-border opacity-60">
                <p className="text-sm text-foreground">{s.bank_name} · {s.account_number} · {s.account_holder}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- VIP Registrations Manager ---
const VipRegistrationsManager = () => {
  const { data: profiles } = useAllProfiles();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAllVip = async () => {
    setDeletingAll(true);
    try {
      const processedItems = registrations?.filter((r: any) => r.status !== "pending") || [];
      const ids = processedItems.map((r: any) => r.id);
      const { error } = await supabase.from("vip_registrations").delete().in("id", ids);
      if (error) throw error;
      toast.success("Đã xóa toàn bộ lịch sử VIP");
      queryClient.invalidateQueries({ queryKey: ["allVipRegistrations"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setDeletingAll(false);
    setConfirmDeleteAll(false);
  };

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["allVipRegistrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-vip-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vip_registrations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["allVipRegistrations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getUserName = (userId: string) => profiles?.find((p: any) => p.user_id === userId)?.display_name || "Unknown";

  const vipDurations: Record<string, number> = { VIP1: 12, VIP2: 24, VIP3: 36 };

  const handleProcess = async (id: string, action: "approved" | "rejected") => {
    const reg = registrations?.find((r: any) => r.id === id);
    const { error } = await supabase.from("vip_registrations").update({
      status: action,
      admin_note: adminNote || null,
      processed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Lỗi: " + error.message); return; }

    // If approved, save VIP info to user profile
    if (action === "approved" && reg) {
      const months = vipDurations[reg.package_name] || 12;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);
      await supabase.from("profiles").update({
        vip_package: reg.package_name,
        vip_registered_at: new Date().toISOString(),
        vip_expires_at: expiresAt.toISOString(),
      }).eq("user_id", reg.user_id);
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
    }

    toast.success(action === "approved" ? "Đã duyệt đăng ký VIP" : "Đã từ chối đăng ký VIP");
    setRejectId(null);
    setAdminNote("");
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  const pending = registrations?.filter((r: any) => r.status === "pending") || [];
  const processed = registrations?.filter((r: any) => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Đã duyệt</p>
          <p className="text-2xl font-bold text-profit">{processed.filter((r: any) => r.status === "approved").length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tổng đăng ký</p>
          <p className="text-2xl font-bold text-foreground">{registrations?.length || 0}</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" /> Chờ duyệt ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((reg: any) => (
              <div key={reg.id} className="bg-card rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-foreground">{getUserName(reg.user_id)}</span>
                    <span className="ml-2 text-xs font-bold text-primary">{reg.package_name}</span>
                  </div>
                  <span className="font-bold font-mono text-foreground">{fmtVnd(Number(reg.package_price))}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(reg.created_at).toLocaleString("vi-VN")}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleProcess(reg.id, "approved")}
                    className="flex-1 py-2 rounded-lg bg-profit text-white text-sm font-bold flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Duyệt
                  </button>
                  <button onClick={() => setRejectId(reg.id)}
                    className="flex-1 py-2 rounded-lg bg-loss text-white text-sm font-bold flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Lịch sử đăng ký VIP</h3>
            <button onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-loss/10 text-loss text-xs font-semibold hover:bg-loss/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Xóa toàn bộ
            </button>
          </div>
          <div className="space-y-2">
            {processed.map((reg: any) => (
              <div key={reg.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{getUserName(reg.user_id)}</span>
                  <span className="ml-2 text-xs text-primary font-bold">{reg.package_name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{fmtVnd(Number(reg.package_price))}</span>
                </div>
                <span className={`text-xs font-medium ${reg.status === "approved" ? "text-profit" : "text-loss"}`}>
                  {reg.status === "approved" ? "✓ Đã duyệt" : "✕ Từ chối"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm delete all VIP modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-2">Xóa toàn bộ lịch sử VIP?</h3>
            <p className="text-sm text-muted-foreground mb-4">Hành động này sẽ xóa vĩnh viễn {processed.length} đăng ký đã xử lý. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteAll(false)}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={handleDeleteAllVip} disabled={deletingAll}
                className="flex-1 py-2 rounded-lg bg-loss text-white font-semibold text-sm disabled:opacity-50">
                {deletingAll ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-5 border border-border w-full max-w-sm">
            <h3 className="font-bold text-foreground mb-3">Từ chối đăng ký VIP</h3>
            <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Lý do từ chối (tùy chọn)"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectId(null); setAdminNote(""); }}
                className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground font-semibold text-sm">Hủy</button>
              <button onClick={() => handleProcess(rejectId, "rejected")}
                className="flex-1 py-2 rounded-lg bg-loss text-white font-semibold text-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Announcements Manager ---
const AnnouncementsManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleCreate = async () => {
    if (!newContent.trim()) { toast.error("Vui lòng nhập nội dung thông báo"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("announcements").insert({
        content: newContent.trim(),
        created_by: user!.id,
      });
      if (error) throw error;
      toast.success("Đã tạo thông báo");
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setSaving(false);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("announcements").update({ is_active: !currentActive }).eq("id", id);
    if (error) { toast.error("Lỗi"); return; }
    toast.success(currentActive ? "Đã tắt thông báo" : "Đã bật thông báo");
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Lỗi"); return; }
    toast.success("Đã xóa thông báo");
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Đang hoạt động</p>
          <p className="text-2xl font-bold text-profit">{announcements?.filter((a: any) => a.is_active).length || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tổng thông báo</p>
          <p className="text-2xl font-bold text-foreground">{announcements?.length || 0}</p>
        </div>
      </div>

      {/* Create new announcement */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo thông báo mới
        </h3>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Nhập nội dung thông báo hiển thị trên trang chủ..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <button onClick={handleCreate} disabled={saving || !newContent.trim()}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4" /> {saving ? "Đang tạo..." : "Đăng thông báo"}
        </button>
      </div>

      {/* Announcements list */}
      <div className="space-y-2">
        {announcements?.map((ann: any) => (
          <div key={ann.id} className={cn(
            "bg-card rounded-xl p-4 border",
            ann.is_active ? "border-profit/30" : "border-border opacity-60"
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground break-words">{ann.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {new Date(ann.created_at).toLocaleString("vi-VN")}
                  {ann.is_active ? (
                    <span className="ml-2 text-profit font-semibold">● Đang hiển thị</span>
                  ) : (
                    <span className="ml-2 text-muted-foreground font-semibold">● Đã tắt</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => handleToggle(ann.id, ann.is_active)}
                  title={ann.is_active ? "Tắt" : "Bật"}
                  className={cn("p-2 rounded-lg transition-colors",
                    ann.is_active
                      ? "bg-profit/10 text-profit hover:bg-profit/20"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}>
                  <Power className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(ann.id)}
                  title="Xóa"
                  className="p-2 rounded-lg bg-loss/10 text-loss hover:bg-loss/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {(!announcements || announcements.length === 0) && (
          <p className="text-center text-muted-foreground py-8">Chưa có thông báo nào</p>
        )}
      </div>
    </div>
  );
};

// --- Send Notification to Specific Members ---
const SendNotificationManager = () => {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useAllProfiles();
  const [message, setMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const filteredProfiles = (profiles || []).filter((p: any) =>
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredProfiles.map((p: any) => p.user_id));
    }
    setSelectAll(!selectAll);
  };

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Vui lòng nhập nội dung thông báo"); return; }
    if (selectedUsers.length === 0) { toast.error("Vui lòng chọn ít nhất 1 thành viên"); return; }
    setSending(true);
    try {
      const rows = selectedUsers.map((uid) => ({
        user_id: uid,
        message: message.trim(),
        created_by: user!.id,
      }));
      const { error } = await supabase.from("user_notifications").insert(rows);
      if (error) throw error;
      toast.success(`Đã gửi thông báo đến ${selectedUsers.length} thành viên`);
      setMessage("");
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (e: any) { toast.error("Lỗi: " + e.message); }
    setSending(false);
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4" /> Soạn thông báo
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập nội dung thông báo gửi cho thành viên..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Select members */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" /> Chọn thành viên ({selectedUsers.length}/{profiles?.length || 0})
          </h3>
          <button onClick={handleSelectAll}
            className="text-xs font-medium text-primary hover:underline">
            {selectAll ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thành viên..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredProfiles.map((p: any) => (
            <button
              key={p.user_id}
              onClick={() => handleToggleUser(p.user_id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                selectedUsers.includes(p.user_id)
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary/50 text-foreground hover:bg-secondary border border-transparent"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                selectedUsers.includes(p.user_id) ? "bg-primary border-primary" : "border-muted-foreground/40"
              )}>
                {selectedUsers.includes(p.user_id) && (
                  <CheckCheck className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{p.display_name}</span>
                {p.phone && <span className="ml-2 text-xs text-muted-foreground">{p.phone}</span>}
              </div>
            </button>
          ))}
          {filteredProfiles.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">Không tìm thấy thành viên</p>
          )}
        </div>
      </div>

      {/* Send button */}
      <button onClick={handleSend} disabled={sending || !message.trim() || selectedUsers.length === 0}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
        <Bell className="w-4 h-4" /> {sending ? "Đang gửi..." : `Gửi thông báo (${selectedUsers.length} người)`}
      </button>
    </div>
  );
};

export default Admin;
