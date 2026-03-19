import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime: auto-refresh when admin changes profile
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) { console.error("Error fetching profile:", error); return null; }
      return data;
    },
    enabled: !!user,
  });
};
