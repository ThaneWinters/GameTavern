-- Add feature flags to site_settings with default values
-- These can be overridden by admins at runtime

INSERT INTO public.site_settings (key, value) VALUES
  ('feature_play_logs', 'true'),
  ('feature_wishlist', 'true'),
  ('feature_for_sale', 'true'),
  ('feature_messaging', 'true'),
  ('feature_coming_soon', 'true')
ON CONFLICT (key) DO NOTHING;