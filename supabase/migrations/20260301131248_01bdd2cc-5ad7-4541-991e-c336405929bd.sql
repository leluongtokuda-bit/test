
-- Add bank info columns to profiles (one-time, non-editable by user after first set)
ALTER TABLE public.profiles
ADD COLUMN bank_name text,
ADD COLUMN bank_account_number text,
ADD COLUMN bank_account_holder text,
ADD COLUMN bank_linked_at timestamp with time zone;
