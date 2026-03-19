import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  message: string;
  created_at: string;
}

export const UserNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch unread notifications on mount
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("id, message, created_at")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    };

    fetchUnread();

    // Realtime: listen for new notifications
    const channel = supabase
      .channel(`user-notifs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          if (!n.is_read) {
            setNotifications((prev) => [
              { id: n.id, message: n.message, created_at: n.created_at },
              ...prev,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismiss = async (id: string) => {
    // Mark as read
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!user || notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300, delay: i * 0.1 }}
            className="pointer-events-auto w-full max-w-lg mx-4 mt-2"
          >
            <div className="bg-card border border-primary/30 rounded-xl shadow-lg shadow-primary/10 p-4 flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground break-words">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
