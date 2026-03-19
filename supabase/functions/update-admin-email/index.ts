import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find the admin user
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });

  const adminUser = users.find(u => u.email === "admin123@admin.upbit.local");
  if (!adminUser) return new Response(JSON.stringify({ error: "Admin user not found" }), { status: 404 });

  // Update email to match phone login pattern
  const { error: updateErr } = await supabase.auth.admin.updateUserById(adminUser.id, {
    email: "888899999@upbit.local",
    email_confirm: true,
  });

  if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true, message: "Admin email updated to 888899999@upbit.local" }));
});
