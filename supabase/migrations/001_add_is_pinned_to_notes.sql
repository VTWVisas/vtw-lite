-- Migration to add is_pinned column to notes table
-- Run this if you have an existing notes table without the is_pinned column

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Update the index for better performance on pinned notes
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned);
