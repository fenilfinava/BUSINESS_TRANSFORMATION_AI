-- Migration: Add context_description column and clean up team_size
-- Run this in your Supabase Dashboard SQL Editor

-- Add context_description to store business context for Gemini prompts
ALTER TABLE projects ADD COLUMN IF NOT EXISTS context_description TEXT;

-- Remove the team_size column (no longer used by frontend or backend)
ALTER TABLE projects DROP COLUMN IF EXISTS team_size;
