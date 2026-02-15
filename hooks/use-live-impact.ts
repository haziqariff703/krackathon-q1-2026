"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RouteMetrics } from "@/types";
import { buildMetricsFromSimulation } from "@/utils/transit-sim";

type RouteSimulationRow = {
  duration_minutes: number;
  distance_meters: number;
  reliability_score: number;
  stress_score: number;
  simulation_depth: number | null;
  origin_name?: string | null;
  destination_name?: string | null;
};

type CommuterImpactRow = {
  total_minutes_saved: number | null;
  heat_minutes_avoided: number | null;
  contribution_count: number | null;
};

type LiveImpactState = {
  impact: {
    communityImpactScore: number;
    heatMinutesAvoided: number;
    minutesSaved: number;
  };
  stressScore: number;
  reliabilityScore: number;
  routeMetrics: RouteMetrics | null;
  latestRouteName: string | null;
  totalSimulations: number;
};

const DEFAULT_LIVE_IMPACT: LiveImpactState = {
  impact: {
    communityImpactScore: 0,
    heatMinutesAvoided: 0,
    minutesSaved: 0,
  },
  stressScore: 0,
  reliabilityScore: 0,
  routeMetrics: null,
  latestRouteName: null,
  totalSimulations: 0,
};

export function useLiveImpact() {
  const [state, setState] = useState<LiveImpactState>(DEFAULT_LIVE_IMPACT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchLiveImpact = useCallback(async () => {
    try {
      const [latestRes, recentRes, commuterRes] = await Promise.all([
        supabase
          .from("route_simulations")
          .select(
            "duration_minutes,distance_meters,reliability_score,stress_score,simulation_depth,origin_name,destination_name",
          )
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("route_simulations")
          .select("reliability_score,stress_score", {
            count: "exact",
          })
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("commuter_impact")
          .select(
            "total_minutes_saved,heat_minutes_avoided,contribution_count",
          ),
      ]);

      if (latestRes.error || recentRes.error || commuterRes.error) {
        const rootError =
          latestRes.error || recentRes.error || commuterRes.error;
        throw new Error(rootError?.message ?? "Failed to fetch live impact.");
      }

      const latest = (latestRes.data?.[0] ?? null) as RouteSimulationRow | null;
      const recent = (recentRes.data ?? []) as Array<{
        reliability_score: number;
        stress_score: number;
      }>;
      const commuter = (commuterRes.data ?? []) as CommuterImpactRow[];

      const totalSimulations = Number(
        recentRes.count ?? (latest ? 1 : recent.length),
      );

      const avgReliabilityRaw =
        recent.length > 0
          ? recent.reduce(
              (sum, row) => sum + Number(row.reliability_score || 0),
              0,
            ) / recent.length
          : latest
            ? Number(latest.reliability_score || 0)
            : 0;

      const avgStress =
        recent.length > 0
          ? recent.reduce((sum, row) => sum + Number(row.stress_score || 0), 0) /
            recent.length
          : latest
            ? Number(latest.stress_score || 0)
            : 0;

      const totalMinutesSaved = commuter.reduce(
        (sum, row) => sum + Number(row.total_minutes_saved ?? 0),
        0,
      );
      const totalHeatMinutesAvoided = commuter.reduce(
        (sum, row) => sum + Number(row.heat_minutes_avoided ?? 0),
        0,
      );
      const totalContributions = commuter.reduce(
        (sum, row) => sum + Number(row.contribution_count ?? 0),
        0,
      );

      const communityImpactScore = Math.min(
        100,
        Math.round(
          avgReliabilityRaw * 0.45 +
            Math.min(totalSimulations, 40) * 1.2 +
            Math.min(totalContributions, 40) * 0.8 +
            Math.min(totalMinutesSaved / 10, 20),
        ),
      );

      const routeMetrics = latest
        ? buildMetricsFromSimulation({
            duration_minutes: Number(latest.duration_minutes),
            distance_meters: Number(latest.distance_meters),
            reliability_score: Number(latest.reliability_score),
            stress_score: Number(latest.stress_score),
            simulation_depth: latest.simulation_depth ?? undefined,
          })
        : null;
      const latestRouteName =
        latest?.origin_name && latest?.destination_name
          ? `${latest.origin_name} -> ${latest.destination_name}`
          : null;

      setState({
        impact: {
          communityImpactScore,
          heatMinutesAvoided: Math.round(totalHeatMinutesAvoided),
          minutesSaved: Math.round(totalMinutesSaved),
        },
        stressScore: Math.round(routeMetrics?.stressScore ?? avgStress),
        reliabilityScore: Math.max(
          0,
          Math.min(1, (routeMetrics?.reliabilityScore ?? avgReliabilityRaw) / 100),
        ),
        routeMetrics,
        latestRouteName,
        totalSimulations,
      });
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch live impact.";
      setError(message);
      console.error("Failed to fetch live impact:", message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLiveImpact();

    const interval = window.setInterval(fetchLiveImpact, 30000);

    const channel = supabase
      .channel("impact_live_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "route_simulations" },
        () => fetchLiveImpact(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commuter_impact" },
        () => fetchLiveImpact(),
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveImpact, supabase]);

  return { ...state, loading, error, refresh: fetchLiveImpact };
}
