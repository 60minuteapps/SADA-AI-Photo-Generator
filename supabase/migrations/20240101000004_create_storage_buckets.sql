-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('user-photos', 'user-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-photos', 'generated-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Create storage policies for anonymous access
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
