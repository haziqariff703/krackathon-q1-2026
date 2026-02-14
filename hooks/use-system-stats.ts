"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

export interface SystemStats {
  totalReports: number;
  totalSimulations: number;
  totalUpvotes: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalReports: 0,
    totalSimulations: 0,
    totalUpvotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchStats = useCallback(async () => {
    try {
      const [reportsRes, simulationsRes, upvotesRes] = await Promise.all([
        supabase
          .from("incident_reports")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("route_simulations")
          .select("id", { count: "exact", head: true }),
        supabase.from("report_upvotes").select("id", { count: "exact", head: true }),
      ]);

      if (reportsRes.error || simulationsRes.error || upvotesRes.error) {
        throw (
          reportsRes.error ??
          simulationsRes.error ??
          upvotesRes.error ??
          new Error("Unknown stats query error")
        );
      }

      setStats({
        totalReports: Number(reportsRes.count ?? 0),
        totalSimulations: Number(simulationsRes.count ?? 0),
        totalUpvotes: Number(upvotesRes.count ?? 0),
      });
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();

    // Poll every 30 seconds or listen to changes
    const interval = setInterval(fetchStats, 30000);

    // Subscribe to incidents for immediate updates
    const incidentChannel = supabase
      .channel("system_stats_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_reports" },
        () => fetchStats(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "route_simulations" },
        () => fetchStats(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_upvotes" },
        () => fetchStats(),
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(incidentChannel);
    };
  }, [fetchStats, supabase]);

  return { stats, loading, refresh: fetchStats };
}
