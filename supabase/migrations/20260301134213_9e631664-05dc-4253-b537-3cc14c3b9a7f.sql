
-- Create admin bank settings table
CREATE TABLE public.admin_bank_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  bank_short_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_bank_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage bank settings"
ON public.admin_bank_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read active settings
CREATE POLICY "Users can read active bank settings"
ON public.admin_bank_settings FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_admin_bank_settings_updated_at
BEFORE UPDATE ON public.admin_bank_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
