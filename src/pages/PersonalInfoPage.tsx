import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileNavBar from "@/components/MobileNavBar";
import { ArrowLeft, User, CreditCard, MapPin, Phone, Mail, Calendar, Shield, Camera, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PersonalInfoPage = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      if (profile?.id_card_front_url) {
        const { data } = await supabase.storage.from("id-cards").createSignedUrl(profile.id_card_front_url, 3600);
        if (data?.signedUrl) setIdFrontUrl(data.signedUrl);
      }
      if (profile?.id_card_back_url) {
        const { data } = await supabase.storage.from("id-cards").createSignedUrl(profile.id_card_back_url, 3600);
        if (data?.signedUrl) setIdBackUrl(data.signedUrl);
      }
    };
    if (profile) loadImages();
  }, [profile]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const infoItems = [
    { icon: User, label: "Họ và tên", value: profile?.full_name || "Chưa cập nhật" },
    { icon: Phone, label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
    { icon: Mail, label: "Email", value: user?.email || "Chưa cập nhật" },
    { icon: Calendar, label: "Ngày sinh", value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("vi-VN") : "Chưa cập nhật" },
    { icon: MapPin, label: "Địa chỉ", value: profile?.address || "Chưa cập nhật" },
    { icon: CreditCard, label: "Số CCCD", value: profile?.id_card_number || "Chưa cập nhật" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate("/account")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mr-3">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="font-bold text-lg text-foreground">Thông tin cá nhân</h1>
        </div>
      </header>

      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Avatar & Name */}
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="font-bold text-lg text-foreground">{profile?.full_name || profile?.display_name || "Người dùng"}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>

          {/* Info List */}
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ID Card Images */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Ảnh CCCD</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Front */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 text-center">Mặt trước</p>
                {idFrontUrl ? (
                  <img src={idFrontUrl} alt="CCCD mặt trước" className="w-full h-28 object-cover rounded-lg border border-border" />
                ) : (
                  <div
                    onClick={() => document.getElementById('cccd-front-input')?.click()}
                    className="w-full h-28 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-primary" />
                    <p className="text-[10px] text-muted-foreground">Tải ảnh</p>
                  </div>
                )}
              </div>
              {/* Back */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 text-center">Mặt sau</p>
                {idBackUrl ? (
                  <img src={idBackUrl} alt="CCCD mặt sau" className="w-full h-28 object-cover rounded-lg border border-border" />
                ) : (
                  <div
                    onClick={() => document.getElementById('cccd-back-input')?.click()}
                    className="w-full h-28 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-primary" />
                    <p className="text-[10px] text-muted-foreground">Tải ảnh</p>
                  </div>
                )}
              </div>
            </div>
            <input id="cccd-front-input" type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
                setUploading(true);
                try {
                  const ext = file.name.split('.').pop();
                  const path = `${user.id}/front-${Date.now()}.${ext}`;
                  const { error: upErr } = await supabase.storage.from('id-cards').upload(path, file);
                  if (upErr) throw upErr;
                  await supabase.from('profiles').update({ id_card_front_url: path }).eq('user_id', user.id);
                  const { data } = await supabase.storage.from('id-cards').createSignedUrl(path, 3600);
                  if (data?.signedUrl) setIdFrontUrl(data.signedUrl);
                  toast.success("Đã tải ảnh CCCD mặt trước");
                } catch { toast.error("Lỗi khi tải ảnh"); }
                setUploading(false);
              }}
            />
            <input id="cccd-back-input" type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
                setUploading(true);
                try {
                  const ext = file.name.split('.').pop();
                  const path = `${user.id}/back-${Date.now()}.${ext}`;
                  const { error: upErr } = await supabase.storage.from('id-cards').upload(path, file);
                  if (upErr) throw upErr;
                  await supabase.from('profiles').update({ id_card_back_url: path }).eq('user_id', user.id);
                  const { data } = await supabase.storage.from('id-cards').createSignedUrl(path, 3600);
                  if (data?.signedUrl) setIdBackUrl(data.signedUrl);
                  toast.success("Đã tải ảnh CCCD mặt sau");
                } catch { toast.error("Lỗi khi tải ảnh"); }
                setUploading(false);
              }}
            />
          </div>
        </motion.div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default PersonalInfoPage;
