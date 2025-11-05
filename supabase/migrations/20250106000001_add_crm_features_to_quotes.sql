-- Add CRM features to quotes table
-- This migration adds fields for quote customization, tracking, calendar integration, and more

-- Add new columns for CRM features
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS move_time_confirmed TIME,
ADD COLUMN IF NOT EXISTS price_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS email_tracking JSONB DEFAULT '{"opens": [], "last_opened": null, "first_opened": null}'::jsonb,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_by TEXT, -- 'customer' or 'sales_rep'
ADD COLUMN IF NOT EXISTS declined_by TEXT, -- 'customer' or 'sales_rep'
ADD COLUMN IF NOT EXISTS sales_rep_notes TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'invoice_sent', 'paid', 'overdue')),
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_due_date DATE,
ADD COLUMN IF NOT EXISTS job_notes JSONB DEFAULT '[]'::jsonb, -- Auto-generated notes for calendar (boxes, special handling, etc.)
ADD COLUMN IF NOT EXISTS customer_agreement_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_agreement_accepted_at TIMESTAMPTZ;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_quotes_lead_source ON quotes(lead_source);
CREATE INDEX IF NOT EXISTS idx_quotes_follow_up_date ON quotes(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);
CREATE INDEX IF NOT EXISTS idx_quotes_payment_due_date ON quotes(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_quotes_calendar_synced ON quotes(calendar_synced);

-- Create a table for email tracking events (more detailed tracking)
CREATE TABLE IF NOT EXISTS quote_email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'accepted', 'declined', 'question_submitted', 'agreement_viewed')),
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_quote_id ON quote_email_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON quote_email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON quote_email_events(created_at DESC);

-- Create a table for follow-up reminders
CREATE TABLE IF NOT EXISTS quote_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  follow_up_type TEXT DEFAULT 'automatic' CHECK (follow_up_type IN ('automatic', 'manual')),
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_quote_id ON quote_follow_ups(quote_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON quote_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_up_date ON quote_follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_completed ON quote_follow_ups(completed);

-- Enable RLS on new tables
ALTER TABLE quote_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_follow_ups ENABLE ROW LEVEL SECURITY;

-- RLS policies for quote_email_events (anyone can insert for tracking, but only quote owners can view)
CREATE POLICY "Anyone can insert email events"
  ON quote_email_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view email events for their quotes"
  ON quote_email_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_email_events.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS policies for quote_follow_ups
CREATE POLICY "Users can view their own follow-ups"
  ON quote_follow_ups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow-ups"
  ON quote_follow_ups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON quote_follow_ups
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comment to document the new fields
COMMENT ON COLUMN quotes.lead_source IS 'Where the customer heard about us (e.g., "Google Search", "Referral", "Facebook", etc.)';
COMMENT ON COLUMN quotes.decline_reason IS 'Reason provided when quote was declined';
COMMENT ON COLUMN quotes.move_time_confirmed IS 'Confirmed move time if different from move_date';
COMMENT ON COLUMN quotes.price_override IS 'Whether the price was manually overridden';
COMMENT ON COLUMN quotes.original_total_amount IS 'Original calculated amount before override';
COMMENT ON COLUMN quotes.follow_up_date IS 'Date when follow-up should happen (default: next day)';
COMMENT ON COLUMN quotes.email_tracking IS 'JSON object tracking email opens and interactions';
COMMENT ON COLUMN quotes.job_notes IS 'Auto-generated notes for calendar (boxes needed, special equipment, etc.)';

