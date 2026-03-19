
-- Drop the existing unrestricted user update policy
DROP POLICY "Users can update own profile" ON public.profiles;

-- Create a restricted update policy that only allows safe columns
CREATE POLICY "Users can update own safe profile fields"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND balance = (SELECT p.balance FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_banned = (SELECT p.is_banned FROM public.profiles p WHERE p.user_id = auth.uid())
  AND withdrawal_limit IS NOT DISTINCT FROM (SELECT p.withdrawal_limit FROM public.profiles p WHERE p.user_id = auth.uid())
  AND vip_package IS NOT DISTINCT FROM (SELECT p.vip_package FROM public.profiles p WHERE p.user_id = auth.uid())
  AND vip_expires_at IS NOT DISTINCT FROM (SELECT p.vip_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND vip_registered_at IS NOT DISTINCT FROM (SELECT p.vip_registered_at FROM public.profiles p WHERE p.user_id = auth.uid())
);
