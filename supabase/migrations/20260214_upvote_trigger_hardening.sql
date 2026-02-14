-- Phase 12: Upvote trigger hardening
-- Ensures incident_reports.upvotes increments reliably under RLS.

CREATE OR REPLACE FUNCTION public.handle_upvote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.incident_reports
    SET upvotes = COALESCE(upvotes, 0) + 1
    WHERE id = NEW.report_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_upvote_added ON public.report_upvotes;

CREATE TRIGGER on_upvote_added
AFTER INSERT ON public.report_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_upvote();
