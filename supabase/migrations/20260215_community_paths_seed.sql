-- Fix: Drop existing community_paths (which uses a shelter_type enum) and recreate with plain TEXT

DROP TABLE IF EXISTS public.community_paths CASCADE;

CREATE TABLE public.community_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    shelter_level TEXT DEFAULT 'open',
    average_walk_time_minutes NUMERIC DEFAULT 10,
    average_heat_exposure_score NUMERIC DEFAULT 35,
    upvotes INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community paths are viewable by everyone"
    ON public.community_paths FOR SELECT USING (true);

-- Seed demo data
INSERT INTO public.community_paths (name, shelter_level, average_walk_time_minutes, average_heat_exposure_score, upvotes, is_verified) VALUES
    ('Bukit Bintang Covered Walkway',   'covered',  8,  28, 42, true),
    ('KL Sentral Indoor Link',          'indoor',   5,  18, 67, true),
    ('KLCC Shaded Garden Path',         'shaded',   12, 32, 31, true),
    ('Pasar Seni Tunnel Connector',     'tunnel',   6,  20, 23, false),
    ('TRX Skybridge Connector',         'indoor',   4,  15, 55, true);
