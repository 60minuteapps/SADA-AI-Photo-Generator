-- Create training images table
CREATE TABLE IF NOT EXISTS training_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_path TEXT, -- Storage path for cleanup
  display_order INTEGER DEFAULT 0, -- Order for display (0, 1, 2)
  metadata JSONB DEFAULT '{}', -- Additional metadata like dimensions, file size, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_training_images_session_id ON training_images(session_id);
CREATE INDEX IF NOT EXISTS idx_training_images_order ON training_images(session_id, display_order);

-- Enable RLS
ALTER TABLE training_images ENABLE ROW LEVEL SECURITY;

-- Create policy for session-based access
CREATE POLICY "Users can manage their own training images" ON training_images
  FOR ALL USING (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Create policy for anonymous access (fallback)
CREATE POLICY "Allow anonymous training image management" ON training_images
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_training_images_updated_at
  BEFORE UPDATE ON training_images
  FOR EACH ROW
  EXECUTE FUNCTION update_training_images_updated_at();
