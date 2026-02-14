"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getMockNearbyStops } from "@/utils/mock-stops";

export interface StopItem {
  id: string;
  stop_id?: string;
  name: string;
  lines: string[];
  reliability: number;
  status: "on-time" | "delayed" | "heavy-stress";
  waitTime: number;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

type RawNearbyStop = {
  id?: string;
  stop_id?: string;
  name: string;
  lines: string[];
  reliability: number | string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
};

function resolveStopId(stop: RawNearbyStop) {
  if (stop.stop_id) return stop.stop_id;
  if (stop.id) return stop.id;
  return `${stop.name}-${stop.latitude}-${stop.longitude}`;
}

function describeRpcError(err: unknown) {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function toReliabilityPercent(value: number | string | null | undefined) {
  const parsed = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed <= 1) return Math.round(Math.max(0, Math.min(1, parsed)) * 100);
  return Math.round(Math.max(0, Math.min(100, parsed)));
}

function reliabilityToStatus(
  reliability: number,
): "on-time" | "delayed" | "heavy-stress" {
  if (reliability >= 85) return "on-time";
  if (reliability >= 65) return "delayed";
  return "heavy-stress";
}

export function useNearbyStops(
  lat: number,
  lng: number,
  radiusMeters: number = 2000,
) {
  const [stops, setStops] = useState<StopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    async function fetchNearbyStops() {
      setLoading(true);
      try {
        if (!supabase) {
          const fallback = getMockNearbyStops(lat, lng, radiusMeters);
          const mappedStops: StopItem[] = fallback.map((stop) => ({
            ...stop,
            reliability: toReliabilityPercent(stop.reliability),
            status: reliabilityToStatus(toReliabilityPercent(stop.reliability)),
            waitTime: Math.floor(Math.random() * 10) + 1,
          }));
          setStops(mappedStops);
          setError(null);
          return;
        }

        const { data, error } = await supabase.rpc("get_nearby_stops", {
          lat,
          lng,
          radius_meters: radiusMeters,
        });

        if (error) {
          const errorPayload = {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          };
          throw new Error(describeRpcError(errorPayload));
        }

        // Map database status if needed (we'll derive it from reliability for now)
        const mappedStops: StopItem[] = (Array.isArray(data) ? data : []).map(
          (stop: RawNearbyStop) => {
            const reliability = toReliabilityPercent(stop.reliability);
            return {
            ...stop,
            id: resolveStopId(stop),
            stop_id: stop.stop_id,
              reliability,
              status: reliabilityToStatus(reliability),
              waitTime: Math.floor(Math.random() * 10) + 1,
            };
          },
        );

        setStops(mappedStops);
        setError(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch nearby stops.";
        console.error("Error fetching nearby stops:", err);
        // If Supabase is configured, prefer real data only and surface the failure.
        // Demo fallback is only for environments without Supabase keys.
        if (supabase) {
          setStops([]);
          setError(message);
          return;
        }

        const fallback = getMockNearbyStops(lat, lng, radiusMeters);
        const mappedStops: StopItem[] = fallback.map((stop) => ({
          ...stop,
          reliability: toReliabilityPercent(stop.reliability),
          status: reliabilityToStatus(toReliabilityPercent(stop.reliability)),
          waitTime: Math.floor(Math.random() * 10) + 1,
        }));
        setStops(mappedStops);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyStops();
  }, [lat, lng, radiusMeters, supabase]);

  return { stops, loading, error };
}
