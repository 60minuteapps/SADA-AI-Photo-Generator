-- Create generated photos table
CREATE TABLE IF NOT EXISTS generated_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  package_id UUID REFERENCES photo_packages(id) ON DELETE SET NULL,
  original_photo_url TEXT, -- User's uploaded photo
  generated_photo_url TEXT, -- AI generated result
  prompt_used TEXT, -- Full prompt used for generation
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT, -- If generation failed
  metadata JSONB, -- Additional generation parameters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_photos_session ON generated_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_package ON generated_photos(package_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_status ON generated_photos(generation_status);
CREATE INDEX IF NOT EXISTS idx_generated_photos_created ON generated_photos(created_at);

-- Enable RLS
ALTER TABLE generated_photos ENABLE ROW LEVEL SECURITY;

-- Create policy for session-based access (anonymous users can only see their own photos)
CREATE POLICY "Users can manage their own generated photos" ON generated_photos
  FOR ALL USING (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      OR session_id = (current_setting('request.headers', true)::json->>'x-session-id')::uuid
    )
  );
