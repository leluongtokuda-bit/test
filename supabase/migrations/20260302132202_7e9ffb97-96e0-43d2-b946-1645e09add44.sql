
-- Allow admins to delete trades
CREATE POLICY "Admins can delete all trades"
ON public.trades
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete transaction_requests
CREATE POLICY "Admins can delete all requests"
ON public.transaction_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete vip_registrations
CREATE POLICY "Admins can delete all vip registrations"
ON public.vip_registrations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
