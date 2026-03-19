
-- Add VIP info columns to profiles
ALTER TABLE public.profiles
ADD COLUMN vip_package TEXT,
ADD COLUMN vip_registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN vip_expires_at TIMESTAMP WITH TIME ZONE;
