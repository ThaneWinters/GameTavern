-- Add IP and device fingerprint columns for anti-manipulation
ALTER TABLE public.game_ratings 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_game_ratings_ip_address ON public.game_ratings(ip_address);
CREATE INDEX IF NOT EXISTS idx_game_ratings_device_fingerprint ON public.game_ratings(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_game_ratings_created_at ON public.game_ratings(created_at);

-- Create a composite unique constraint to prevent same device/IP from rating same game
-- This is in addition to the existing guest_identifier constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_ratings_game_ip_device 
ON public.game_ratings(game_id, ip_address, device_fingerprint) 
WHERE ip_address IS NOT NULL AND device_fingerprint IS NOT NULL;