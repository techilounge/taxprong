-- Add trial_ends_at column to subscriptions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_ends_at timestamp with time zone;
    END IF;
END $$;