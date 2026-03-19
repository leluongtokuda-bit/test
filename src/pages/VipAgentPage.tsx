import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileNavBar from "@/components/MobileNavBar";
import { ArrowLeft, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const vipPackages = [
{
  name: "VIP1",
  price: 2500,
  salary: 250,
  commission: 3,
  duration: 12,
  gradient: "bg-gradient-to-r from-blue-500 to-cyan-400",
},
{
  name: "VIP2",
  price: 5000,
  salary: 500,
  commission: 5,
  duration: 24,
  gradient: "bg-gradient-to-r from-purple-500 to-pink-400",
},
{
  name: "VIP3",
  price: 10000,
  salary: 1000,
  commission: 7,
  duration: 36,
  gradient: "bg-gradient-to-r from-amber-500 to-orange-400",
}];


const VipAgentPage = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const handleSelectPackage = async (pkg: typeof vipPackages[0]) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Create VIP registration record
      const { error } = await supabase.from("vip_registrations").insert({
        user_id: user.id,
        package_name: pkg.name,
        package_price: pkg.price,
      });
      if (error) throw error;

      toast.success(`Đã đăng ký ${pkg.name}, chuyển sang nạp tiền`);

      // Navigate to wallet with VIP deposit info
      navigate("/wallet", {
        state: {
          vipDeposit: true,
          amount: pkg.price,
          note: `${displayName} - Đăng ký ${pkg.name}`
        }
      });
    } catch (err: any) {
      toast.error("Lỗi đăng ký: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate("/account")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mr-3">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="font-bold text-lg text-foreground">Đại lý VIP</h1>
        </div>
      </header>

      <div className="px-4 pt-6">
        <p className="text-center text-sm font-semibold text-foreground mb-6">​CHÍNH SÁCH DÀNH CHO ĐẠI LÝ </p>

        <div className="space-y-4">
          {vipPackages.map((pkg, i) =>
          <motion.button
            key={pkg.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelectPackage(pkg)}
            disabled={submitting}
            className={`w-full rounded-2xl p-5 text-left ${pkg.gradient} text-white shadow-md active:scale-[0.98] transition-transform disabled:opacity-50`}>

              <h3 className="text-lg font-bold mb-2">
                {pkg.name}: {pkg.price.toLocaleString()}$ (đăng ký)
              </h3>
              <p className="text-sm text-white/80">
                Lương hàng tháng {pkg.salary}$ + hoa hồng {pkg.commission} tầng
              </p>
              <p className="text-sm text-white/80">
                Thời hạn: {pkg.duration} tháng
              </p>
            </motion.button>
          )}
        </div>
      </div>

      <MobileNavBar />
    </div>);

};

export default VipAgentPage;
