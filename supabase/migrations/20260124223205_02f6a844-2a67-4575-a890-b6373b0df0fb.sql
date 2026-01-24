-- Add CHECK constraints to game_sessions and game_session_players for input validation
-- This provides database-level defense against invalid/malicious data

-- game_sessions constraints
ALTER TABLE public.game_sessions 
  ADD CONSTRAINT check_duration_range
  CHECK (duration_minutes IS NULL OR (duration_minutes > 0 AND duration_minutes <= 1440));

ALTER TABLE public.game_sessions 
  ADD CONSTRAINT check_notes_length
  CHECK (notes IS NULL OR length(notes) <= 1000);

-- game_session_players constraints
ALTER TABLE public.game_session_players 
  ADD CONSTRAINT check_player_name_length
  CHECK (length(player_name) > 0 AND length(player_name) <= 100);

ALTER TABLE public.game_session_players 
  ADD CONSTRAINT check_score_range
  CHECK (score IS NULL OR (score >= -9999999 AND score <= 9999999));