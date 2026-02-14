"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { MOCK_STOP_OPTIONS } from "@/utils/mock-stops";

type StopOption = {
  name: string;
};

const uniqueNames = (names: string[]) =>
  Array.from(new Set(names.filter(Boolean)));

export function useStopOptions() {
  const [stops, setStops] = useState<StopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    let isActive = true;

    async function fetchStops() {
      setLoading(true);
      try {
        if (!supabase) {
          const fallback = uniqueNames(MOCK_STOP_OPTIONS);
          if (isActive) {
            setStops(fallback.map((name) => ({ name })));
            setError(null);
          }
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("transit_stops")
          .select("name")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        const names = uniqueNames((data ?? []).map((row) => row.name));
        if (isActive) {
          setStops(names.map((name) => ({ name })));
          setError(null);
        }
      } catch (err: any) {
        const fallback = uniqueNames(MOCK_STOP_OPTIONS);
        if (isActive) {
          setStops(fallback.map((name) => ({ name })));
          setError(err?.message ?? "Failed to load stop options.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetchStops();
    return () => {
      isActive = false;
    };
  }, [supabase]);

  return { stops, loading, error };
}
