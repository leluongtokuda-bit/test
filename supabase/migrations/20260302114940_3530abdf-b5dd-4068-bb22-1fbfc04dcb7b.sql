
CREATE OR REPLACE FUNCTION public.add_balance(_user_id uuid, _amount numeric)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE profiles
  SET balance = balance + _amount
  WHERE user_id = _user_id;
$$;
