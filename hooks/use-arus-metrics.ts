"use client";

import { useMemo } from "react";

/**
 * Arus Metrics Hook
 * Implements the core business logic as defined in the Project Rules (arus.md).
 */

interface ArusMetricInput {
  delayMinutes: number;
  heatIndex: number; // degrees Celsius
  walkingTime: number; // minutes
  safetyRisk: number; // 0-10
  isSheltered?: boolean; // New: whether the commuter is on a sheltered path
}

export function useArusMetrics({
  delayMinutes,
  heatIndex,
  walkingTime,
  safetyRisk,
  isSheltered = false,
}: ArusMetricInput) {
  // 1. Reliability Score Logic
  // reliability_score = 1 - (delay_minutes / 30), clamped 0-1
  const reliabilityScore = useMemo(() => {
    const score = 1 - delayMinutes / 30;
    return Math.max(0, Math.min(1, score));
  }, [delayMinutes]);

  // 2. Commuter Stress Score Formula
  // Base components:
  // - Delay impact (0–40 pts) -> delay / 30 * 40
  // - Heat exposure (0–30 pts) -> (heatIndex - 25) / 10 * 30 (normalized from 25°C-35°C)
  // - Walking discomfort (0–20 pts) -> walkingTime / 20 * 20
  // - Safety risk (0–10 pts) -> safetyRisk (already 0-10)
  const stressScore = useMemo(() => {
    const delayImpact = Math.min(40, (delayMinutes / 30) * 40);
    let heatImpact = Math.min(30, Math.max(0, ((heatIndex - 25) / 10) * 30));

    // If sheltered, reduce heat impact significantly (simulating shade/AC)
    if (isSheltered) {
      heatImpact = heatImpact * 0.3;
    }

    const walkingImpact = Math.min(20, (walkingTime / 20) * 20);
    const safetyImpact = Math.min(10, safetyRisk);

    return Math.round(delayImpact + heatImpact + walkingImpact + safetyImpact);
  }, [delayMinutes, heatIndex, walkingTime, safetyRisk, isSheltered]);

  // 3. Decision Recommendation Logic
  const recommendation = useMemo(() => {
    if (heatIndex > 33 && !isSheltered) {
      return {
        label: "Suggest sheltered path",
        type: "warning",
        reason:
          "Extreme heat exposure. Switch to a community-verified sheltered path.",
      };
    }
    if (delayMinutes > 20) {
      return {
        label: "Suggest alternative transport",
        type: "danger",
        reason: "Significant bus delay exceeds 20 minutes.",
      };
    }
    if (reliabilityScore < 0.6) {
      return {
        label: "Suggest delayed departure",
        type: "info",
        reason:
          "Low reliability score (< 60%). Wait for a more stable particle flow.",
      };
    }
    return {
      label: "Optimal departure window",
      type: "success",
      reason: isSheltered
        ? "Excellent conditions. Sheltered path is mitigating environmental heat."
        : "High reliability and comfortable environmental conditions.",
    };
  }, [reliabilityScore, delayMinutes, heatIndex, isSheltered]);

  // Impact Metrics (Quantifiable Community Benefit)
  const impact = useMemo(() => {
    return {
      minutesSaved: Math.max(0, 15 - delayMinutes),
      heatMinutesAvoided: isSheltered ? walkingTime : 0,
      communityImpactScore: Math.round(
        reliabilityScore * 40 +
          Math.max(0, 15 - delayMinutes) * 2 +
          (isSheltered ? 20 : 0),
      ),
    };
  }, [delayMinutes, walkingTime, reliabilityScore, isSheltered]);

  return {
    reliabilityScore,
    stressScore,
    recommendation,
    impact,
  };
}
