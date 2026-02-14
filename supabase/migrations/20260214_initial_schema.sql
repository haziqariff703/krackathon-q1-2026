-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Incident Reports Table
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL, -- 'delay', 'heat', 'safety', 'other'
    title TEXT NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    user_id UUID DEFAULT auth.uid(),
    is_active BOOLEAN DEFAULT true
);

-- Upvotes Tracking Table (to prevent double upvoting)
CREATE TABLE IF NOT EXISTS public.report_upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    report_id UUID REFERENCES public.incident_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- For demo we might use a session id or random uuid if not authed
    UNIQUE(report_id, user_id)
);

-- RLS Policies
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_upvotes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access" ON public.incident_reports
    FOR SELECT USING (true);

-- Public write access (for demo purposes)
CREATE POLICY "Allow public insert" ON public.incident_reports
    FOR INSERT WITH CHECK (true);

-- Upvotes triggers/logic
CREATE OR REPLACE FUNCTION handle_upvote()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.incident_reports
    SET upvotes = upvotes + 1
    WHERE id = NEW.report_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_upvote_added
AFTER INSERT ON public.report_upvotes
FOR EACH ROW EXECUTE FUNCTION handle_upvote();
