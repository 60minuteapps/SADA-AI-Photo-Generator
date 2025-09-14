-- AI Photo Generator Database Setup
-- Run this script in your Supabase SQL Editor

-- 1. Create photo packages table
CREATE TABLE IF NOT EXISTS photo_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unisex')),
  style_prompt TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for photo packages
CREATE INDEX IF NOT EXISTS idx_photo_packages_category ON photo_packages(category);
CREATE INDEX IF NOT EXISTS idx_photo_packages_gender ON photo_packages(gender);
CREATE INDEX IF NOT EXISTS idx_photo_packages_active ON photo_packages(is_active);

-- 2. Create anonymous user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- 3. Create generated photos table
CREATE TABLE IF NOT EXISTS generated_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  package_id UUID REFERENCES photo_packages(id) ON DELETE SET NULL,
  original_photo_url TEXT,
  generated_photo_url TEXT,
  prompt_used TEXT,
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for generated photos
CREATE INDEX IF NOT EXISTS idx_generated_photos_session ON generated_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_package ON generated_photos(package_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_status ON generated_photos(generation_status);
CREATE INDEX IF NOT EXISTS idx_generated_photos_created ON generated_photos(created_at);

-- 4. Enable RLS on all tables
ALTER TABLE photo_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_photos ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for anonymous access

-- Photo packages: Allow anonymous read access to active packages
CREATE POLICY "Allow anonymous read access to photo packages" ON photo_packages
  FOR SELECT USING (is_active = true);

-- User sessions: Allow anonymous session management
CREATE POLICY "Allow anonymous session management" ON user_sessions
  FOR ALL USING (true);

-- Generated photos: Users can only access their own photos via session
CREATE POLICY "Users can manage their own generated photos" ON generated_photos
  FOR ALL USING (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE session_token = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'session_token',
        current_setting('request.headers', true)::json->>'x-session-id'
      )
    )
  );

-- 6. Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('user-photos', 'user-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-photos', 'generated-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 7. Create storage policies for anonymous access
CREATE POLICY "Allow anonymous upload to user-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Allow anonymous read from user-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-photos');

CREATE POLICY "Allow anonymous upload to generated-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'generated-photos');

CREATE POLICY "Allow anonymous read from generated-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-photos');

CREATE POLICY "Allow anonymous delete from user-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-photos');

CREATE POLICY "Allow anonymous delete from generated-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'generated-photos');

-- 8. Create utility functions

-- Function to create anonymous session
CREATE OR REPLACE FUNCTION create_anonymous_session(device_id_param TEXT DEFAULT NULL)
RETURNS TABLE(session_id UUID, session_token TEXT) AS $$
DECLARE
  new_session_id UUID;
  new_session_token TEXT;
BEGIN
  new_session_token := encode(gen_random_bytes(32), 'base64');
  
  INSERT INTO user_sessions (session_token, device_id)
  VALUES (new_session_token, device_id_param)
  RETURNING id INTO new_session_id;
  
  RETURN QUERY SELECT new_session_id, new_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(session_token_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions 
  SET last_active_at = NOW()
  WHERE session_token = session_token_param 
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION create_anonymous_session TO anon;
GRANT EXECUTE ON FUNCTION update_session_activity TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO anon;

-- 9. Insert default photo packages
INSERT INTO photo_packages (name, description, category, gender, style_prompt, thumbnail_url) VALUES
('Female Business Casual', 'Professional business casual attire for women', 'business', 'female', 'professional business casual woman, modern office setting, confident pose, natural lighting', '/assets/ai_model_imgs/female_business_casual.png'),
('Female Business Suit', 'Formal business suit for professional women', 'business', 'female', 'professional woman in business suit, corporate environment, executive style, professional headshot', '/assets/ai_model_imgs/female_business_suit.png'),
('Female Office Professional', 'Modern office professional look for women', 'professional', 'female', 'professional office woman, contemporary workplace, business attire, confident and approachable', '/assets/ai_model_imgs/female_office_professional.png')
ON CONFLICT DO NOTHING;

-- Database setup complete!
