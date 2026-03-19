import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useTransactionRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`transaction-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_requests",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["transactionRequests", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ["transactionRequests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateTransactionRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: {
      type: "deposit" | "withdraw";
      amount: number;
      payment_method: string;
      bank_name?: string;
      bank_account_number?: string;
      bank_account_holder?: string;
      receipt_image_url?: string;
    }) => {
      const { error } = await supabase.from("transaction_requests").insert({
        user_id: user!.id,
        type: request.type,
        amount: request.amount,
        payment_method: request.payment_method,
        bank_name: request.bank_name || null,
        bank_account_number: request.bank_account_number || null,
        bank_account_holder: request.bank_account_holder || null,
        receipt_image_url: request.receipt_image_url || null,
      });
      if (error) throw error;

      // Deduct balance immediately for withdrawal requests
      if (request.type === "withdraw") {
        const { error: balError } = await supabase.rpc("add_balance", {
          _user_id: user!.id,
          _amount: -request.amount,
        });
        if (balError) throw balError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

// Admin hooks
export const useAllTransactionRequests = () => {
  return useQuery({
    queryKey: ["allTransactionRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useProcessTransactionRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId, userId, type, amount, action, adminNote, receiptImageUrl,
    }: {
      requestId: string; userId: string; type: "deposit" | "withdraw";
      amount: number; action: "approved" | "rejected"; adminNote?: string; receiptImageUrl?: string;
    }) => {
      // Update request status
      const updateData: any = {
        status: action,
        admin_note: adminNote || null,
        processed_at: new Date().toISOString(),
        processed_by: user!.id,
      };
      if (receiptImageUrl) {
        updateData.receipt_image_url = receiptImageUrl;
      }
      const { error: reqError } = await supabase
        .from("transaction_requests")
        .update(updateData)
        .eq("id", requestId);
      if (reqError) throw reqError;

      // For deposits: add balance when approved
      // For withdrawals: balance was already deducted at creation time
      //   - If rejected: refund the balance back
      //   - If approved: no balance change needed (already deducted)
      if (action === "approved" && type === "deposit") {
        const { error: balError } = await supabase.rpc("add_balance", { _user_id: userId, _amount: amount });
        if (balError) throw balError;
      }
      if (action === "rejected" && type === "withdraw") {
        const { error: balError } = await supabase.rpc("add_balance", { _user_id: userId, _amount: amount });
        if (balError) throw balError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTransactionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
