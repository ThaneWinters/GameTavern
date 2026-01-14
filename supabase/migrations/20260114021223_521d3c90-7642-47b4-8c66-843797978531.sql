-- Create condition enum for sale items
CREATE TYPE public.sale_condition AS ENUM (
  'New/Sealed',
  'Like New',
  'Very Good',
  'Good',
  'Acceptable'
);

-- Add sale fields to games table
ALTER TABLE public.games 
ADD COLUMN is_for_sale boolean NOT NULL DEFAULT false,
ADD COLUMN sale_price decimal(10,2),
ADD COLUMN sale_condition sale_condition;

-- Create index for for_sale filtering
CREATE INDEX idx_games_is_for_sale ON public.games(is_for_sale) WHERE is_for_sale = true;

-- Create messages table for inquiries
CREATE TABLE public.game_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages (for public contact form)
CREATE POLICY "Anyone can send messages"
ON public.game_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view messages"
ON public.game_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
ON public.game_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.game_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));