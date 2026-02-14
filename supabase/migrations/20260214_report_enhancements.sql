-- Add tags and image_url to incident_reports
ALTER TABLE public.incident_reports 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for report images (public)
-- You may need to run this separately or via the Supabase Dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket (Assuming 'report-images' bucket exists)
-- Allow public read access to images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'report-images' );

-- Allow authenticated or public uploads for demo purposes
CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'report-images' );
