-- Create subscriptions table for pricing plans
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business', 'practice', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own subscription (for upgrading/downgrading)
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- Add platform fee tracking to pro_invoices
ALTER TABLE pro_invoices 
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC GENERATED ALWAYS AS (amount * platform_fee_percent / 100) STORED,
  ADD COLUMN IF NOT EXISTS pro_payout_amount NUMERIC GENERATED ALWAYS AS (amount - (amount * platform_fee_percent / 100)) STORED;

-- Add reviews table for pros
CREATE TABLE IF NOT EXISTS pro_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES pros(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(engagement_id)
);

-- Enable RLS on reviews
ALTER TABLE pro_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON pro_reviews FOR SELECT
  USING (true);

-- Only the reviewer can create their review
CREATE POLICY "Users can create their own reviews"
  ON pro_reviews FOR INSERT
  WITH CHECK (reviewer_user_id = auth.uid());

-- Add average rating to pros table for easier queries
ALTER TABLE pros 
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update pro ratings
CREATE OR REPLACE FUNCTION update_pro_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pros
  SET 
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM pro_reviews WHERE pro_id = NEW.pro_id),
    review_count = (SELECT COUNT(*) FROM pro_reviews WHERE pro_id = NEW.pro_id)
  WHERE id = NEW.pro_id;
  RETURN NEW;
END;
$$;

-- Trigger to update ratings when review is added
CREATE TRIGGER update_pro_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pro_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_pro_rating();