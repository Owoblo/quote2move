-- Create table for user-customizable upsells
-- This allows users to create and manage their own upsell service templates

CREATE TABLE IF NOT EXISTS custom_upsells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT, -- e.g., 'insurance', 'packing', 'specialty', 'other'
  recommended_by_default BOOLEAN DEFAULT false,
  auto_select BOOLEAN DEFAULT false, -- Auto-select when conditions are met
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_upsells_user_id ON custom_upsells(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_upsells_user_active ON custom_upsells(user_id, is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_upsells ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own custom upsells" ON custom_upsells;
DROP POLICY IF EXISTS "Users can insert their own custom upsells" ON custom_upsells;
DROP POLICY IF EXISTS "Users can update their own custom upsells" ON custom_upsells;
DROP POLICY IF EXISTS "Users can delete their own custom upsells" ON custom_upsells;

-- Create RLS policies
CREATE POLICY "Users can view their own custom upsells"
  ON custom_upsells
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom upsells"
  ON custom_upsells
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom upsells"
  ON custom_upsells
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom upsells"
  ON custom_upsells
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE custom_upsells IS 'Stores user-defined upsell service templates';
COMMENT ON COLUMN custom_upsells.name IS 'Display name of the upsell service';
COMMENT ON COLUMN custom_upsells.description IS 'Description shown to customers';
COMMENT ON COLUMN custom_upsells.price IS 'Price for this upsell service';
COMMENT ON COLUMN custom_upsells.category IS 'Category for grouping upsells (insurance, packing, specialty, other)';
COMMENT ON COLUMN custom_upsells.recommended_by_default IS 'Whether this upsell should be marked as recommended';
COMMENT ON COLUMN custom_upsells.auto_select IS 'Whether this upsell should be auto-selected when conditions are met';
COMMENT ON COLUMN custom_upsells.is_active IS 'Whether this upsell template is currently active';
COMMENT ON COLUMN custom_upsells.display_order IS 'Order in which upsells should be displayed';

