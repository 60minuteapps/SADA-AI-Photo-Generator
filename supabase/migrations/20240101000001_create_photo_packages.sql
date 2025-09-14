-- Create photo packages table
CREATE TABLE IF NOT EXISTS photo_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'business', 'casual', 'professional', etc.
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unisex')),
  style_prompt TEXT NOT NULL, -- AI prompt for this package style
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_photo_packages_category ON photo_packages(category);
CREATE INDEX IF NOT EXISTS idx_photo_packages_gender ON photo_packages(gender);
CREATE INDEX IF NOT EXISTS idx_photo_packages_active ON photo_packages(is_active);

-- Insert default photo packages based on your AI model images
INSERT INTO photo_packages (name, description, category, gender, style_prompt, thumbnail_url) VALUES
('Female Business Casual', 'Professional business casual attire for women', 'business', 'female', 'professional business casual woman, modern office setting, confident pose, natural lighting', '/assets/ai_model_imgs/female_business_casual.png'),
('Female Business Suit', 'Formal business suit for professional women', 'business', 'female', 'professional woman in business suit, corporate environment, executive style, professional headshot', '/assets/ai_model_imgs/female_business_suit.png'),
('Female Office Professional', 'Modern office professional look for women', 'professional', 'female', 'professional office woman, contemporary workplace, business attire, confident and approachable', '/assets/ai_model_imgs/female_office_professional.png');

-- Enable RLS
ALTER TABLE photo_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous read access
CREATE POLICY "Allow anonymous read access to photo packages" ON photo_packages
  FOR SELECT USING (is_active = true);
