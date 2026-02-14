-- Phase 10: System Stats RPC

CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE (
  total_reports BIGINT,
  total_simulations BIGINT,
  total_upvotes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.incident_reports WHERE is_active = true),
    (SELECT COUNT(*) FROM public.route_simulations),
    (SELECT COUNT(*) FROM public.report_upvotes);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_stats() TO anon, authenticated;
