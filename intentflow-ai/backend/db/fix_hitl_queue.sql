-- Migration: Add extracted_tasks column to hitl_queue if missing
-- Run this in Supabase SQL Editor if you get "column extracted_tasks does not exist" error

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hitl_queue' 
        AND column_name = 'extracted_tasks'
    ) THEN
        ALTER TABLE public.hitl_queue ADD COLUMN extracted_tasks jsonb;
        RAISE NOTICE 'Added extracted_tasks column to hitl_queue';
    ELSE
        RAISE NOTICE 'extracted_tasks column already exists';
    END IF;
END $$;

-- Also add raw_input column if missing (needed for voice transcripts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hitl_queue' 
        AND column_name = 'raw_input'
    ) THEN
        ALTER TABLE public.hitl_queue ADD COLUMN raw_input text;
        RAISE NOTICE 'Added raw_input column to hitl_queue';
    ELSE
        RAISE NOTICE 'raw_input column already exists';
    END IF;
END $$;
