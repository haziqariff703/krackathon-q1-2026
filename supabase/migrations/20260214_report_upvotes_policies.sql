-- Phase 11: report_upvotes RLS policies
-- report_upvotes has RLS enabled and needs explicit policies for anon/authenticated.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'report_upvotes'
      AND policyname = 'Allow public read upvotes'
  ) THEN
    CREATE POLICY "Allow public read upvotes"
      ON public.report_upvotes
      FOR SELECT
      USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'report_upvotes'
      AND policyname = 'Allow public insert upvotes'
  ) THEN
    CREATE POLICY "Allow public insert upvotes"
      ON public.report_upvotes
      FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$;
