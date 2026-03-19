-- Enable realtime for remaining tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_presets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_bank_settings;