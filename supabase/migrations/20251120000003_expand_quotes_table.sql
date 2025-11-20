-- Rename existing columns for clarity and consistency
ALTER TABLE quotes RENAME COLUMN photos TO original_photos;
ALTER TABLE quotes RENAME COLUMN detections TO ai_detected_items;
ALTER TABLE quotes RENAME COLUMN status TO outcome;
ALTER TABLE quotes RENAME COLUMN decline_reason TO lost_reason;

-- Update the outcome check constraint to match new values
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_outcome_check CHECK (outcome IN ('draft', 'sent', 'booked', 'lost', 'pending', 'accepted', 'declined')); -- added old values for backward compatibility

-- Add new columns for enhanced data logging
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS photo_quality_metrics JSONB,
  ADD COLUMN IF NOT EXISTS detection_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('mls', 'customer_upload', 'shareable_link')),
  ADD COLUMN IF NOT EXISTS recommended_truck_size TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
  ADD COLUMN IF NOT EXISTS home_size JSONB,
  ADD COLUMN IF NOT EXISTS actual_cubic_feet INTEGER,
  ADD COLUMN IF NOT EXISTS actual_hours INTEGER,
  ADD COLUMN IF NOT EXISTS missed_items TEXT,
  ADD COLUMN IF NOT EXISTS extra_items TEXT,
  ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10, 2);

-- Add comments for new columns to document their purpose
COMMENT ON COLUMN quotes.original_photos IS 'Array of URLs for the original photos used for detection';
COMMENT ON COLUMN quotes.ai_detected_items IS 'JSON with confidence scores for each detected item';
COMMENT ON COLUMN quotes.photo_quality_metrics IS 'JSON with metrics like resolution, lighting, angle';
COMMENT ON COLUMN quotes.detection_time_ms IS 'Time in milliseconds for AI detection';
COMMENT ON COLUMN quotes.source IS 'Source of the photos (MLS, customer upload, shareable link)';
COMMENT ON COLUMN quotes.recommended_truck_size IS 'Recommended truck size based on estimate';
COMMENT ON COLUMN quotes.estimated_hours IS 'Estimated hours for the move';
COMMENT ON COLUMN quotes.home_size IS 'JSON with beds, baths, sqft';
COMMENT ON COLUMN quotes.outcome IS 'Final outcome of the quote (draft, sent, booked, lost)';
COMMENT ON COLUMN quotes.actual_cubic_feet IS 'Actual cubic feet from the completed move';
COMMENT ON COLUMN quotes.actual_hours IS 'Actual hours taken for the move';
COMMENT ON COLUMN quotes.missed_items IS 'Text description of items missed by AI';
COMMENT ON COLUMN quotes.extra_items IS 'Text description of items not present that were detected';
COMMENT ON COLUMN quotes.actual_price IS 'Actual price charged for the completed move';
COMMENT ON COLUMN quotes.lost_reason IS 'Reason why the quote was lost to a competitor';
