import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MobileNavBar from "@/components/MobileNavBar";
import { User, LogOut, ChevronRight, Settings, Sun, Moon, Globe, Lock, Crown, CreditCard, Check, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, languageNames, languageFlags, type Language } from "@/hooks/useLanguage";
import { useCurrency, type CurrencyCode } from "@/hooks/useCurrency";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const AccountPage = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, formatAmount } = useCurrency();
  const [showLangPicker, setShowLangPicker] = useState(false);
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">{t("Đang tải...", "Loading...")}</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("Đã đăng xuất", "Signed out"));
    navigate("/auth");
  };

  const menuItems = [
    { icon: <User className="w-5 h-5 text-foreground" />, title: t("Thông tin cá nhân", "Personal Info"), path: "/personal-info" },
    { icon: <CreditCard className="w-5 h-5 text-foreground" />, title: t("Phương thức thanh toán", "Payment Methods"), path: "/wallet" },
    { icon: <Crown className="w-5 h-5 text-foreground" />, title: t("Đại lý Vip", "VIP Agent"), path: "/vip-agent" },
    { icon: <Lock className="w-5 h-5 text-foreground" />, title: t("Bảo mật", "Security"), path: "/security" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex items-center justify-center px-4 h-14">
          <h1 className="font-bold text-lg text-foreground">{t("Tài khoản", "Account")}</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 text-center border border-border shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-1">
            {profile?.display_name || user?.email?.split("@")[0] || t("Người dùng", "User")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isAdmin &&
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Admin</span>
            }
            {profile?.vip_package && (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-medium">
                {profile.vip_package}
                {profile.vip_expires_at && ` · ${t("HSD", "Exp")}: ${new Date(profile.vip_expires_at).toLocaleDateString("vi-VN")}`}
              </span>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">{t("Số dư tài khoản", "Account Balance")}</p>
            <p className="font-bold text-2xl text-primary font-mono">
              {formatAmount(Number(profile?.balance ?? 0))}
            </p>
          </div>
        </motion.div>
      </div>

      {isAdmin &&
      <div className="px-4 mb-4">
          <button onClick={() => navigate("/admin")}
        className="bg-card rounded-xl p-4 w-full flex items-center justify-between border-2 border-primary/30 hover:bg-primary/5 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary">{t("Quản trị viên", "Administrator")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        </div>
      }

      <div className="px-4 mb-6">
        <div className="bg-card rounded-xl divide-y divide-border border border-border shadow-sm">
          {menuItems.map((item) =>
          <button key={item.title} onClick={() => navigate(item.path)}
          className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                {item.icon}
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Settings section */}
      <div className="px-4 mb-6">
        <p className="text-xs text-muted-foreground mb-2 px-1 uppercase tracking-wider font-semibold">{t("Cài đặt", "Settings")}</p>
        <div className="bg-card rounded-xl divide-y divide-border border border-border shadow-sm">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <p className="font-medium text-foreground text-sm">{t("Chế độ tối", "Dark Mode")}</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center justify-between w-full p-4"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground text-sm">{t("Ngôn ngữ", "Language")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{languageFlags[language]}</span>
                <span className="text-xs text-muted-foreground">{languageNames[language]}</span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showLangPicker ? "rotate-90" : ""}`} />
              </div>
            </button>

            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          language === lang
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="text-lg">{languageFlags[lang]}</span>
                        <span className="text-xs">{languageNames[lang]}</span>
                        {language === lang && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
           </div>

          {/* Currency selector */}
          <div className="relative">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground text-sm">{t("Tiền tệ", "Currency")}</p>
              </div>
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                {(["USD", "VND"] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      currency === c
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c === "USD" ? "$ USD" : "₫ VND"}
                  </button>
                ))}
              </div>
            </div>
            {currency === "VND" && (
              <p className="px-4 pb-3 text-[10px] text-muted-foreground">
                {t("Tỷ giá cố định: 1 USD = 26,000 VND", "Fixed rate: 1 USD = 26,000 VND")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4">
        <button onClick={handleSignOut}
        className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" /> {t("Đăng xuất", "Sign Out")}
        </button>
      </div>

      <p className="text-center mt-6 text-xs text-muted-foreground">Upbit v6.1.6</p>

      <MobileNavBar />
    </div>
  );
};

export default AccountPage;