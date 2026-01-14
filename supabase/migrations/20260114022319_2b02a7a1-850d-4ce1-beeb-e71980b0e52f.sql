-- Add CHECK constraints for input validation on game_messages
ALTER TABLE public.game_messages 
ADD CONSTRAINT check_sender_name_length CHECK (length(sender_name) <= 100),
ADD CONSTRAINT check_sender_email_length CHECK (length(sender_email) <= 255),
ADD CONSTRAINT check_message_length CHECK (length(message) <= 2000),
ADD CONSTRAINT check_email_format CHECK (sender_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Add rate limiting tracking column
ALTER TABLE public.game_messages 
ADD COLUMN sender_ip text;

-- Create index for rate limiting lookups
CREATE INDEX idx_game_messages_ip_created ON public.game_messages(sender_ip, created_at) 
WHERE sender_ip IS NOT NULL;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can send messages" ON public.game_messages;

-- Create a more restrictive policy - only service role can insert (via edge function)
-- This forces all inserts to go through the edge function which handles rate limiting
CREATE POLICY "Service role can insert messages"
ON public.game_messages
FOR INSERT
TO service_role
WITH CHECK (true);