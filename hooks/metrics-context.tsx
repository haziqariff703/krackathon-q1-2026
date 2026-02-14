"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import type { RouteMetrics } from "@/types";

interface MetricsContextType {
  delayMinutes: number;
  setDelayMinutes: (val: number) => void;
  heatIndex: number;
  setHeatIndex: (val: number) => void;
  walkingTime: number;
  setWalkingTime: (val: number) => void;
  safetyRisk: number;
  setSafetyRisk: (val: number) => void;
  isSheltered: boolean;
  setIsSheltered: (val: boolean) => void;
  routeMetrics: RouteMetrics | null;
  setRouteMetrics: (val: RouteMetrics | null) => void;
  metrics: {
    reliabilityScore: number;
    stressScore: number;
    recommendation: {
      label: string;
      type: string;
      reason: string;
    };
    impact: {
      minutesSaved: number;
      heatMinutesAvoided: number;
      communityImpactScore: number;
    };
  };
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [heatIndex, setHeatIndex] = useState(28);
  const [walkingTime, setWalkingTime] = useState(10);
  const [safetyRisk, setSafetyRisk] = useState(2);
  const [isSheltered, setIsSheltered] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const metrics = useMemo(() => {
    // Baseline from route or defaults
    const baselineReliability = (routeMetrics?.reliabilityScore ?? 100) / 100;
    const baselineStress = routeMetrics?.stressScore ?? 5;
    const baselineSavings = routeMetrics?.estimatedTimeSavedMinutes ?? 15;

    // Reliability Logic: 1.0 (perfect) down to 0.0
    const reliabilityScore = Math.max(
      0,
      baselineReliability - delayMinutes / 30,
    );

    // Stress Score Logic: 0–100 (Lower is better)
    // Base components (scaled to contribution points)
    const delayImpact = (delayMinutes / 30) * 40;
    const heatImpact = ((heatIndex - 25) / 20) * 30;
    const walkingImpact = (walkingTime / 20) * 20;
    const safetyImpact = (safetyRisk / 10) * 10;

    // Apply shelter reduction (50% reduction in heat impact if sheltered)
    const effectiveHeatImpact = isSheltered ? heatImpact * 0.5 : heatImpact;

    // Total Stress = Baseline + User-modified impacts
    const stressScore = Math.min(
      100,
      Math.round(
        baselineStress +
          delayImpact +
          effectiveHeatImpact +
          walkingImpact +
          safetyImpact,
      ),
    );

    // Recommendation Logic
    let recommendation = {
      label: "Optimal Flow",
      type: "success",
      reason: "Current conditions are ideal for your last-mile journey.",
    };

    if (heatIndex > 33) {
      recommendation = {
        label: "Sheltered Path Advised",
        type: "warning",
        reason:
          "High heat exposure detected. Use the community-validated shaded route.",
      };
    }

    if (delayMinutes > 8) {
      recommendation = {
        label: "Delay Buffer Active",
        type: "warning",
        reason:
          "Minor transit drag. Consider slowing your pace to sync with arrival.",
      };
    }

    if (delayMinutes > 20 || reliabilityScore < 0.4) {
      recommendation = {
        label: "Alternative Advised",
        type: "danger",
        reason:
          "Significant drag detected. E-scooter or ride-share recommended.",
      };
    }

    if (safetyRisk > 7) {
      recommendation = {
        label: "Safety Alert",
        type: "danger",
        reason:
          "Friction reported in your path. Stick to well-lit major arteries.",
      };
    }

    // Impact Metrics
    const impact = {
      minutesSaved: Math.max(0, baselineSavings - delayMinutes),
      heatMinutesAvoided: isSheltered ? walkingTime : 0,
      communityImpactScore: Math.round(
        reliabilityScore * 40 +
          Math.max(0, baselineSavings - delayMinutes) * 2 +
          (isSheltered ? 20 : 0),
      ),
    };

    return {
      reliabilityScore,
      stressScore,
      recommendation,
      impact,
    };
  }, [
    delayMinutes,
    heatIndex,
    walkingTime,
    safetyRisk,
    isSheltered,
    routeMetrics,
  ]);

  return (
    <MetricsContext.Provider
      value={{
        delayMinutes,
        setDelayMinutes,
        heatIndex,
        setHeatIndex,
        walkingTime,
        setWalkingTime,
        safetyRisk,
        setSafetyRisk,
        isSheltered,
        setIsSheltered,
        routeMetrics,
        setRouteMetrics,
        metrics,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error("useMetrics must be used within a MetricsProvider");
  }
  return context;
}
