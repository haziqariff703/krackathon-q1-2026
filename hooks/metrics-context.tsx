"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
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
    const baselineReliability = (routeMetrics?.reliabilityScore ?? 100) / 100;
    const baselineStress = routeMetrics?.stressScore ?? 5;
    const baselineSavings = routeMetrics?.estimatedTimeSavedMinutes ?? 15;
    const baselineWalkingMinutes = Math.max(
      3,
      Math.round((routeMetrics?.walkingDistanceMeters ?? 800) / 80),
    );

    const delayPenalty = Math.min(0.4, (delayMinutes / 30) * 0.38);
    const heatPenalty = Math.min(
      0.18,
      Math.max(0, (heatIndex - 30) / 20) * 0.18,
    );
    const walkingPenalty = Math.min(
      0.12,
      Math.max(0, (walkingTime - baselineWalkingMinutes) / 20) * 0.12,
    );
    const safetyPenalty = Math.min(0.2, (safetyRisk / 10) * 0.2);
    const shelterBonus = isSheltered ? 0.06 : 0;

    const reliabilityScore = Math.max(
      0,
      Math.min(
        1,
        baselineReliability -
          delayPenalty -
          heatPenalty -
          walkingPenalty -
          safetyPenalty +
          shelterBonus,
      ),
    );

    const delayImpact = delayMinutes * 1.3;
    const effectiveHeat = isSheltered ? Math.max(26, heatIndex - 4) : heatIndex;
    const heatImpact = Math.max(0, effectiveHeat - 28) * 1.8;
    const walkingImpact =
      Math.max(0, walkingTime - baselineWalkingMinutes) * 2.1;
    const safetyImpact = safetyRisk * 3.2;
    const stressScore = Math.min(
      100,
      Math.round(
        baselineStress + delayImpact + heatImpact + walkingImpact + safetyImpact,
      ),
    );

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

    const heatLoadFactor = Math.max(0, (heatIndex - 28) / 12);
    const riskDrag = Math.round(safetyRisk * 0.8);
    const extraWalkingDrag = Math.max(0, walkingTime - baselineWalkingMinutes);
    const impact = {
      minutesSaved: Math.max(
        0,
        Math.round(
          baselineSavings - delayMinutes - extraWalkingDrag * 0.5 - riskDrag * 0.3,
        ),
      ),
      heatMinutesAvoided: isSheltered
        ? Math.round(Math.max(0, walkingTime * heatLoadFactor))
        : 0,
      communityImpactScore: Math.round(
        reliabilityScore * 45 +
          Math.max(0, baselineSavings - delayMinutes) * 1.8 +
          (isSheltered ? 16 : 0) -
          safetyRisk * 1.5,
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
