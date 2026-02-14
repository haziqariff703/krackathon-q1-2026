-- Phase 9: Route Simulation Backend
-- Adds simulation storage + RPC for simulation depth

-- 1. Route Simulations Table
CREATE TABLE IF NOT EXISTS public.route_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    origin_stop_id UUID NOT NULL REFERENCES public.transit_stops(id),
    destination_stop_id UUID NOT NULL REFERENCES public.transit_stops(id),
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    route_geom GEOMETRY(LINESTRING, 4326),
    distance_meters DOUBLE PRECISION NOT NULL,
    duration_minutes INTEGER NOT NULL,
    reliability_score NUMERIC NOT NULL,
    stress_score NUMERIC NOT NULL,
    simulation_depth INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.route_simulations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public simulations are viewable" ON public.route_simulations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert simulations" ON public.route_simulations
  FOR INSERT WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS route_simulations_geom_idx
  ON public.route_simulations USING GIST (route_geom);

CREATE INDEX IF NOT EXISTS route_simulations_created_at_idx
  ON public.route_simulations (created_at DESC);

-- 2. Simulation RPC
CREATE OR REPLACE FUNCTION public.simulate_route(
  origin_name TEXT,
  destination_name TEXT
)
RETURNS TABLE (
  simulation_id UUID,
  origin_name TEXT,
  destination_name TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  duration_minutes INTEGER,
  reliability_score NUMERIC,
  stress_score NUMERIC,
  simulation_depth INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  origin_stop RECORD;
  destination_stop RECORD;
  route_line GEOMETRY(LINESTRING, 4326);
  distance_m DOUBLE PRECISION;
  duration_min INTEGER;
  reliability NUMERIC;
  incident_count INTEGER;
  sheltered_count INTEGER;
  depth INTEGER;
  stress NUMERIC;
  simulation_id UUID;
BEGIN
  SELECT *
  INTO origin_stop
  FROM public.transit_stops
  WHERE is_active = true
    AND lower(name) = lower(origin_name)
  ORDER BY reliability DESC NULLS LAST
  LIMIT 1;

  IF origin_stop IS NULL THEN
    SELECT *
    INTO origin_stop
    FROM public.transit_stops
    WHERE is_active = true
      AND name ILIKE '%' || origin_name || '%'
    ORDER BY reliability DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF origin_stop IS NULL THEN
    RAISE EXCEPTION 'Origin stop not found';
  END IF;

  SELECT *
  INTO destination_stop
  FROM public.transit_stops
  WHERE is_active = true
    AND lower(name) = lower(destination_name)
  ORDER BY reliability DESC NULLS LAST
  LIMIT 1;

  IF destination_stop IS NULL THEN
    SELECT *
    INTO destination_stop
    FROM public.transit_stops
    WHERE is_active = true
      AND name ILIKE '%' || destination_name || '%'
    ORDER BY reliability DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF destination_stop IS NULL THEN
    RAISE EXCEPTION 'Destination stop not found';
  END IF;

  route_line := ST_MakeLine(
    origin_stop.location::geometry,
    destination_stop.location::geometry
  );

  distance_m := ST_Distance(
    origin_stop.location::geography,
    destination_stop.location::geography
  );

  duration_min := GREATEST(5, CEIL(distance_m / 1000.0 * 6.5 + 8));

  reliability := COALESCE(
    (origin_stop.reliability + destination_stop.reliability) / 2,
    0.9
  );

  incident_count := (
    SELECT COUNT(*)
    FROM public.incident_reports
    WHERE is_active = true
      AND ST_DWithin(location::geography, route_line::geography, 350)
  );

  sheltered_count := (
    SELECT COUNT(*)
    FROM public.sheltered_paths
    WHERE ST_DWithin(geom::geography, route_line::geography, 200)
  );

  depth := 1;
  depth := depth + 1; -- reliability
  IF incident_count > 0 THEN
    depth := depth + 1;
  END IF;
  IF sheltered_count > 0 THEN
    depth := depth + 1;
  END IF;
  depth := LEAST(depth, 3);

  stress := LEAST(
    100,
    GREATEST(0, ROUND(distance_m / 120.0 + incident_count * 8 - sheltered_count * 4))
  );

  INSERT INTO public.route_simulations (
    user_id,
    origin_stop_id,
    destination_stop_id,
    origin_name,
    destination_name,
    route_geom,
    distance_meters,
    duration_minutes,
    reliability_score,
    stress_score,
    simulation_depth
  )
  VALUES (
    auth.uid(),
    origin_stop.id,
    destination_stop.id,
    origin_stop.name,
    destination_stop.name,
    route_line,
    distance_m,
    duration_min,
    ROUND(reliability * 100),
    stress,
    depth
  )
  RETURNING id INTO simulation_id;

  RETURN QUERY
  SELECT
    simulation_id,
    origin_stop.name,
    destination_stop.name,
    ST_Y(origin_stop.location::geometry),
    ST_X(origin_stop.location::geometry),
    ST_Y(destination_stop.location::geometry),
    ST_X(destination_stop.location::geometry),
    distance_m,
    duration_min,
    ROUND(reliability * 100),
    stress,
    depth;
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_route(TEXT, TEXT) TO anon, authenticated;
