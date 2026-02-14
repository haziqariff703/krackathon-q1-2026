-- Phase 8: Data Mesh Expansion
-- Adds persistent transit infrastructure and spatial query functions

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Transit Stops Table
CREATE TABLE IF NOT EXISTS public.transit_stops (
    stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    lines TEXT[] DEFAULT '{}',
    reliability DECIMAL DEFAULT 0.95,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If a legacy "id" column exists, prefer renaming it to stop_id to keep a single PK column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transit_stops'
          AND column_name = 'id'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transit_stops'
          AND column_name = 'stop_id'
    ) THEN
        ALTER TABLE public.transit_stops RENAME COLUMN id TO stop_id;
    END IF;
END;
$$;

-- Ensure columns exist if the table was created earlier without them
ALTER TABLE public.transit_stops
    ADD COLUMN IF NOT EXISTS stop_id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS lines TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS reliability DECIMAL DEFAULT 0.95,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Ensure stop_id has a default for inserts that omit it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transit_stops'
          AND column_name = 'stop_id'
    ) THEN
        ALTER TABLE public.transit_stops
            ALTER COLUMN stop_id SET DEFAULT gen_random_uuid();
    END IF;
END;
$$;

-- Enable RLS
ALTER TABLE public.transit_stops ENABLE ROW LEVEL SECURITY;

-- 2. Sheltered Paths Table
CREATE TABLE IF NOT EXISTS public.sheltered_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('shaded', 'indoor', 'underground', 'tunnel')),
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sheltered_paths ENABLE ROW LEVEL SECURITY;

-- 3. Leaderboard / Global Impact Table
CREATE TABLE IF NOT EXISTS public.commuter_impact (
    user_id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    total_minutes_saved INTEGER DEFAULT 0,
    heat_minutes_avoided INTEGER DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.commuter_impact ENABLE ROW LEVEL SECURITY;

-- 4. Spatial Helper Functions
-- Finds stops within a given radius (meters) of a point
CREATE OR REPLACE FUNCTION get_nearby_stops(
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION, 
  radius_meters DOUBLE PRECISION DEFAULT 1000
)
RETURNS TABLE (
  stop_id TEXT,
  name TEXT,
  lines TEXT[],
  reliability DECIMAL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.stop_id::text,
    s.name,
    s.lines,
    s.reliability,
    ST_Y(s.location::geometry) as latitude,
    ST_X(s.location::geometry) as longitude,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_Point(lng, lat), 4326)::geography
    ) as distance_meters
  FROM 
    public.transit_stops s
  WHERE 
    ST_DWithin(
      s.location,
      ST_SetSRID(ST_Point(lng, lat), 4326)::geography,
      radius_meters
    )
    AND s.is_active = true
  ORDER BY 
    distance_meters ASC;
END;
$$;

-- 5. RLS Policies
-- Everyone can read stops and paths
CREATE POLICY "Public stops are viewable by everyone" ON public.transit_stops FOR SELECT USING (true);
CREATE POLICY "Public paths are viewable by everyone" ON public.sheltered_paths FOR SELECT USING (true);
CREATE POLICY "Impact stats are viewable by everyone" ON public.commuter_impact FOR SELECT USING (true);

-- Indices for spatial performance
CREATE INDEX IF NOT EXISTS transit_stops_location_idx ON public.transit_stops USING GIST (location);
CREATE INDEX IF NOT EXISTS sheltered_paths_geom_idx ON public.sheltered_paths USING GIST (geom);

-- 6. Sample Data (Kuala Lumpur Area)
INSERT INTO public.transit_stops (name, location, lines, reliability) VALUES
('Bukit Bintang MRT', 'SRID=4326;POINT(101.7117 3.1478)', '{Kajang Line}', 0.98),
('KL Sentral', 'SRID=4326;POINT(101.6865 3.1342)', '{LRT Kelana Jaya, KLIA Express, MRT Kajang}', 0.85),
('KLCC', 'SRID=4326;POINT(101.7131 3.1553)', '{LRT Kelana Jaya, Bus Feeder T402}', 0.92),
('Pasar Seni', 'SRID=4326;POINT(101.6953 3.1425)', '{Kajang Line, LRT Kelana Jaya}', 0.72),
('TRX', 'SRID=4326;POINT(101.7188 3.1429)', '{MRT Kajang, MRT Putrajaya}', 0.94);
