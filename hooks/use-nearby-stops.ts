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
  reliability: number;
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
            reliability: Math.round(stop.reliability * 100),
            status:
              stop.reliability > 0.9
                ? "on-time"
                : stop.reliability > 0.7
                  ? "delayed"
                  : "heavy-stress",
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
          (stop: RawNearbyStop) => ({
            ...stop,
            id: resolveStopId(stop),
            stop_id: stop.stop_id,
          reliability: Math.round(stop.reliability * 100),
          status:
            stop.reliability > 0.9
              ? "on-time"
              : stop.reliability > 0.7
                ? "delayed"
                : "heavy-stress",
          waitTime: Math.floor(Math.random() * 10) + 1, // Mock wait time for now since real-time GTFS isn't here yet
          }),
        );

        setStops(mappedStops);
      } catch (err: any) {
        const message =
          err?.message ||
          err?.details ||
          "Failed to fetch nearby stops. Showing demo data.";
        console.error("Error fetching nearby stops:", err);
        const fallback = getMockNearbyStops(lat, lng, radiusMeters);
        if (fallback.length > 0) {
          const mappedStops: StopItem[] = fallback.map((stop) => ({
            ...stop,
            reliability: Math.round(stop.reliability * 100),
            status:
              stop.reliability > 0.9
                ? "on-time"
                : stop.reliability > 0.7
                  ? "delayed"
                  : "heavy-stress",
            waitTime: Math.floor(Math.random() * 10) + 1,
          }));
          setStops(mappedStops);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyStops();
  }, [lat, lng, radiusMeters, supabase]);

  return { stops, loading, error };
}
