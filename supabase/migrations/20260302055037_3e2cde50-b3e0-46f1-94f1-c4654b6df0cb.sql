
-- Table for admin to pre-set win/lose results for future round codes
CREATE TABLE public.round_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_code TEXT NOT NULL UNIQUE,
  preset_result TEXT NOT NULL CHECK (preset_result IN ('all_win', 'all_lose')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.round_presets ENABLE ROW LEVEL SECURITY;

-- Only admins can manage presets
CREATE POLICY "Admins can manage round presets"
ON public.round_presets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can read presets (needed for trade resolution on client)
CREATE POLICY "Authenticated users can read round presets"
ON public.round_presets
FOR SELECT
USING (auth.uid() IS NOT NULL);
