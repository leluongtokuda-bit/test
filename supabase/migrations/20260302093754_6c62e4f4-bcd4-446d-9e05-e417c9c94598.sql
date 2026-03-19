-- Update existing data to new format
UPDATE public.round_presets SET preset_result = 'up' WHERE preset_result = 'all_win';
UPDATE public.round_presets SET preset_result = 'down' WHERE preset_result = 'all_lose';

-- Add new constraint
ALTER TABLE public.round_presets ADD CONSTRAINT round_presets_preset_result_check CHECK (preset_result IN ('up', 'down'));