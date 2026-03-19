
-- Create VIP registrations table
CREATE TABLE public.vip_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_name TEXT NOT NULL,
  package_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view own registrations
CREATE POLICY "Users can view own vip registrations"
ON public.vip_registrations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own registrations
CREATE POLICY "Users can insert own vip registrations"
ON public.vip_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all vip registrations"
ON public.vip_registrations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all
CREATE POLICY "Admins can update all vip registrations"
ON public.vip_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_registrations;
