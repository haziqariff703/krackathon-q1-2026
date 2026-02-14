"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type ActiveCommunityPath = {
  id: string;
  name: string;
  shelterLevel: string | null;
  averageWalkTimeMinutes: number | null;
  averageHeatExposureScore: number | null;
  upvotes: number;
  isVerified: boolean;
};

export function useActiveCommunityPath() {
  const [path, setPath] = useState<ActiveCommunityPath | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchActivePath = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_paths")
        .select(
          "id,name,average_walk_time_minutes,average_heat_exposure_score,upvotes,is_verified,created_at",
        )
        .order("is_verified", { ascending: false })
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const top = data?.[0];
      if (!top) {
        const fallback = await supabase
          .from("sheltered_paths")
          .select("id,name,type,is_verified,created_at")
          .order("is_verified", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1);

        if (fallback.error || !fallback.data?.[0]) {
          setPath(null);
          return;
        }

        const pathRow = fallback.data[0] as {
          id: string;
          name: string;
          type: string | null;
          is_verified: boolean | null;
        };
        setPath({
          id: pathRow.id,
          name: pathRow.name,
          shelterLevel: pathRow.type ?? null,
          averageWalkTimeMinutes: null,
          averageHeatExposureScore: null,
          upvotes: 0,
          isVerified: Boolean(pathRow.is_verified),
        });
        return;
      }

      setPath({
        id: top.id,
        name: top.name,
        shelterLevel: null,
        averageWalkTimeMinutes:
          top.average_walk_time_minutes !== null
            ? Number(top.average_walk_time_minutes)
            : null,
        averageHeatExposureScore:
          top.average_heat_exposure_score !== null
            ? Number(top.average_heat_exposure_score)
            : null,
        upvotes: Number(top.upvotes ?? 0),
        isVerified: Boolean(top.is_verified),
      });
    } catch (err) {
      console.error("Failed to fetch active community path:", err);
      setPath(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchActivePath();

    const channel = supabase
      .channel("active_community_path_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_paths" },
        () => fetchActivePath(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sheltered_paths" },
        () => fetchActivePath(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivePath, supabase]);

  return { path, loading, refresh: fetchActivePath };
}
