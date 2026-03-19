import { useState, createContext, useContext, useCallback, useMemo, ReactNode } from "react";

export type Language = "ko" | "en" | "vi" | "fr" | "ru" | "de" | "zh" | "hi";

export const languageNames: Record<Language, string> = {
  ko: "한국어",
  en: "English",
  vi: "Tiếng Việt",
  fr: "Français",
  ru: "Русский",
  de: "Deutsch",
  zh: "中文",
  hi: "हिन्दी",
};

export const languageFlags: Record<Language, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  vi: "🇻🇳",
  fr: "🇫🇷",
  ru: "🇷🇺",
  de: "🇩🇪",
  zh: "🇨🇳",
  hi: "🇮🇳",
};

const translations: Record<string, Partial<Record<Language, string>>> = {
  "Đang tải...": { ko: "로딩 중...", en: "Loading...", fr: "Chargement...", ru: "Загрузка...", de: "Laden...", zh: "加载中...", hi: "लोड हो रहा है..." },
  "Đã đăng xuất": { ko: "로그아웃 완료", en: "Signed out", fr: "Déconnecté", ru: "Вышли", de: "Abgemeldet", zh: "已退出", hi: "लॉग आउट हो गया" },
  "Thông tin cá nhân": { ko: "개인정보", en: "Personal Info", fr: "Infos personnelles", ru: "Личные данные", de: "Persönliche Daten", zh: "个人信息", hi: "व्यक्तिगत जानकारी" },
  "Phương thức thanh toán": { ko: "결제 수단", en: "Payment Methods", fr: "Moyens de paiement", ru: "Способы оплаты", de: "Zahlungsmethoden", zh: "支付方式", hi: "भुगतान विधियाँ" },
  "Đại lý Vip": { ko: "VIP 에이전트", en: "VIP Agent", fr: "Agent VIP", ru: "VIP-агент", de: "VIP-Agent", zh: "VIP代理", hi: "VIP एजेंट" },
  "Bảo mật": { ko: "보안", en: "Security", fr: "Sécurité", ru: "Безопасность", de: "Sicherheit", zh: "安全", hi: "सुरक्षा" },
  "Tài khoản": { ko: "계정", en: "Account", fr: "Compte", ru: "Аккаунт", de: "Konto", zh: "账户", hi: "खाता" },
  "Người dùng": { ko: "사용자", en: "User", fr: "Utilisateur", ru: "Пользователь", de: "Benutzer", zh: "用户", hi: "उपयोगकर्ता" },
  "HSD": { ko: "만료", en: "Exp", fr: "Exp", ru: "Срок", de: "Abl", zh: "到期", hi: "समाप्ति" },
  "Số dư tài khoản": { ko: "계좌 잔액", en: "Account Balance", fr: "Solde du compte", ru: "Баланс счёта", de: "Kontostand", zh: "账户余额", hi: "खाता शेष" },
  "Quản trị viên": { ko: "관리자", en: "Administrator", fr: "Administrateur", ru: "Администратор", de: "Administrator", zh: "管理员", hi: "व्यवस्थापक" },
  "Cài đặt": { ko: "설정", en: "Settings", fr: "Paramètres", ru: "Настройки", de: "Einstellungen", zh: "设置", hi: "सेटिंग्स" },
  "Chế độ tối": { ko: "다크 모드", en: "Dark Mode", fr: "Mode sombre", ru: "Тёмная тема", de: "Dunkelmodus", zh: "深色模式", hi: "डार्क मोड" },
  "Ngôn ngữ": { ko: "언어", en: "Language", fr: "Langue", ru: "Язык", de: "Sprache", zh: "语言", hi: "भाषा" },
  "Đăng xuất": { ko: "로그아웃", en: "Sign Out", fr: "Déconnexion", ru: "Выйти", de: "Abmelden", zh: "退出", hi: "लॉग आउट" },
  "Ví của tôi": { ko: "내 지갑", en: "My Wallet", fr: "Mon portefeuille", ru: "Мой кошелёк", de: "Meine Brieftasche", zh: "我的钱包", hi: "मेरा वॉलेट" },
  "Nạp tiền": { ko: "입금", en: "Deposit", fr: "Dépôt", ru: "Депозит", de: "Einzahlung", zh: "充值", hi: "जमा करें" },
  "Rút tiền": { ko: "출금", en: "Withdraw", fr: "Retrait", ru: "Вывод", de: "Abhebung", zh: "提款", hi: "निकासी" },
  "Số dư khả dụng": { ko: "사용 가능 잔액", en: "Available Balance", fr: "Solde disponible", ru: "Доступный баланс", de: "Verfügbares Guthaben", zh: "可用余额", hi: "उपलब्ध शेष" },
  "Tổng nạp": { ko: "총 입금", en: "Total Deposit", fr: "Total déposé", ru: "Всего внесено", de: "Gesamt eingezahlt", zh: "总充值", hi: "कुल जमा" },
  "Tổng rút": { ko: "총 출금", en: "Total Withdraw", fr: "Total retiré", ru: "Всего выведено", de: "Gesamt abgehoben", zh: "总提款", hi: "कुल निकासी" },
  "Chờ duyệt": { ko: "대기 중", en: "Pending", fr: "En attente", ru: "Ожидает", de: "Ausstehend", zh: "待审核", hi: "लंबित" },
  "Giao dịch": { ko: "거래", en: "Trade", fr: "Échanger", ru: "Торговля", de: "Handel", zh: "交易", hi: "व्यापार" },
  "Trang chủ": { ko: "홈", en: "Home", fr: "Accueil", ru: "Главная", de: "Startseite", zh: "首页", hi: "होम" },
  "Lịch sử": { ko: "기록", en: "History", fr: "Historique", ru: "История", de: "Verlauf", zh: "历史", hi: "इतिहास" },
  "Lịch sử giao dịch": { ko: "거래 내역", en: "Trade History", fr: "Historique des échanges", ru: "История сделок", de: "Handelsverlauf", zh: "交易历史", hi: "व्यापार इतिहास" },
  "Đăng nhập": { ko: "로그인", en: "Sign In", fr: "Connexion", ru: "Войти", de: "Anmelden", zh: "登录", hi: "लॉग इन" },
  "Đăng ký": { ko: "회원가입", en: "Sign Up", fr: "S'inscrire", ru: "Регистрация", de: "Registrieren", zh: "注册", hi: "साइन अप" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (vi: string, en?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  setLanguage: () => {},
  t: (vi) => vi,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<Language>(() => {
    return (localStorage.getItem("app-language") as Language) || "vi";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem("app-language", lang);
  }, []);

  const t = useCallback((vi: string, en?: string) => {
    if (language === "vi") return vi;
    const entry = translations[vi];
    if (entry && entry[language]) return entry[language]!;
    if (language === "en" && en) return en;
    if (entry?.en) return entry.en;
    if (en) return en;
    return vi;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
