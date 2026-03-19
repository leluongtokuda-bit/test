import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      // Get admin user IDs to exclude from member list
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminRoles || []).map((r) => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Filter out admin accounts
      return (data || []).filter((p) => !adminIds.includes(p.user_id));
    },
  });
};

export const updateUserBalance = async (userId: string, balance: number) => {
  const { error } = await supabase
    .from("profiles")
    .update({ balance })
    .eq("user_id", userId);
  if (error) throw error;
};
