"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { BarChart3, TrendingUp, Zap, Clock, Info } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { useMetrics } from "@/hooks/metrics-context";
import { useLiveImpact } from "@/hooks/use-live-impact";

// Simple counter component for hackathon simplicity
const CountUp = ({
  end,
  duration = 1000,
}: {
  end: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

export default function ImpactPage() {
  const { metrics, delayMinutes, routeMetrics } = useMetrics();
  const { impact, stressScore, reliabilityScore } = metrics;
  const liveImpact = useLiveImpact();

  const hasLiveData =
    liveImpact.totalSimulations > 0 || liveImpact.routeMetrics !== null;

  const activeImpact = hasLiveData ? liveImpact.impact : impact;
  const activeRouteMetrics = liveImpact.routeMetrics ?? routeMetrics;
  const activeStressScore = hasLiveData ? liveImpact.stressScore : stressScore;
  const activeReliabilityScore = hasLiveData
    ? liveImpact.reliabilityScore
    : reliabilityScore;
  const latestRouteName = liveImpact.latestRouteName ?? "Route name unavailable";
  const activeHeatAvoided = Math.max(
    0,
    Math.round(
      Math.max(
        Number(liveImpact.impact.heatMinutesAvoided || 0),
        Number(impact.heatMinutesAvoided || 0),
      ),
    ),
  );

  const hasJourney =
    delayMinutes > 0 || activeRouteMetrics !== null || hasLiveData;

  return (
    <DashboardShell>
      <div className="flex-1 p-4 pt-24 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 pb-32">
          {/* Header */}
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <BarChart3 size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-950">
                Measurable Impact
              </h1>
            </div>
            <p className="text-zinc-500 text-base sm:text-lg font-medium max-w-2xl">
              Quantifying the reduction in commuter stress and environmental
              exposure across the community.
            </p>
          </div>

          {!hasJourney ? (
            <div className="glass p-10 rounded-[3rem] border-2 border-zinc-100 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                <Info size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-zinc-950">
                  No Active Journey
                </h2>
                <p className="text-zinc-400 font-medium max-w-sm">
                  Simulate a journey on the dashboard to see your personal and
                  community impact metrics.
                </p>
                {liveImpact.loading && (
                  <p className="text-xs text-zinc-400 font-semibold">
                    Syncing live impact stream...
                  </p>
                )}
              </div>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-zinc-950 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-zinc-950/20 hover:scale-105 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Aggregate Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                <MetricCard
                  label="Community Depth"
                  value={<CountUp end={activeImpact.communityImpactScore} />}
                  unit="PTS"
                  description="Composite depth score from network simulations, verified reports, and commuter contributions."
                  icon={Clock}
                  trend={{ value: 12, isGood: true }}
                />
                <MetricCard
                  label="Heat Avoided"
                  value={<CountUp end={activeHeatAvoided} />}
                  unit="m"
                  description="Estimated outdoor heat-exposure minutes avoided through sheltered paths and route adjustments."
                  icon={TrendingUp}
                  trend={{ value: 8, isGood: true }}
                />
                <MetricCard
                  label="Stress Reduction"
                  value={activeStressScore}
                  description="Current route stress index based on delay, walking load, heat pressure, and safety friction."
                  icon={Zap}
                  variant="stress"
                  stressLevel={activeStressScore}
                />
              </div>

              {activeRouteMetrics && (
                <div className="glass p-5 sm:p-6 rounded-2xl sm:rounded-[3rem] border-2 border-zinc-100 space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-250">
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Latest Simulated Route
                  </div>
                  <div className="text-sm sm:text-base font-black text-zinc-900">
                    {latestRouteName}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-400 font-bold">
                        Duration
                      </div>
                      <div className="text-xl font-black text-zinc-950">
                        {activeRouteMetrics.totalDurationMinutes}m
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-400 font-bold">
                        Transfers
                      </div>
                      <div className="text-xl font-black text-zinc-950">
                        {activeRouteMetrics.numberOfTransfers}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-400 font-bold">
                        Walking
                      </div>
                      <div className="text-xl font-black text-zinc-950">
                        {(
                          activeRouteMetrics.walkingDistanceMeters / 1000
                        ).toFixed(2)}{" "}
                        km
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-400 font-bold">
                        Reliability
                      </div>
                      <div className="text-xl font-black text-zinc-950">
                        {activeRouteMetrics.reliabilityScore}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Breakdown */}
              <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border-2 border-zinc-100 space-y-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-zinc-950">
                      Journey Efficiency
                    </h3>
                    <p className="text-sm text-zinc-400 font-medium">
                      Performance score based on latest simulation data.
                    </p>
                  </div>
                  <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-80">
                      Reliability
                    </div>
                    <div className="text-2xl font-black leading-none">
                      {Math.round(activeReliabilityScore * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Reliability Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
                      <span>Reliability Score</span>
                      <span className="text-zinc-950">
                        {Math.round(activeReliabilityScore * 100)}/100
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${activeReliabilityScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Impact Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
                      <span>Optimization Value</span>
                      <span className="text-zinc-950">
                        {activeImpact.communityImpactScore}/100
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-950 transition-all duration-1000 ease-out"
                        style={{
                          width: `${activeImpact.communityImpactScore}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 italic">
                      &ldquo;Your choice to use a sheltered path avoided{" "}
                      <b>{activeHeatAvoided} minutes</b> of direct
                      UV exposure.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
