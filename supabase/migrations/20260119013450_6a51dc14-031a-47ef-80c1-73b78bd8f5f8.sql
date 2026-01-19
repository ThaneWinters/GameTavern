-- Add inserts column to games table
ALTER TABLE public.games ADD COLUMN inserts boolean DEFAULT false;