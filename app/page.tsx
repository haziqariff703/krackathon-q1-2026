"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricCard } from "@/components/metric-card";
import { DemoControls } from "@/components/demo-controls";
import { RecommendationPanel } from "@/components/recommendation-panel";
import { MapView } from "@/components/map/map-view";
import { StopList } from "@/components/stop-list";
import { ReportForm } from "@/components/report-form";
import { TransitRoutePanel } from "@/components/transit-route-panel";
import { JourneyActiveOverlay } from "@/components/journey-active-overlay";
import { Clock, MessageSquarePlus, X, Zap } from "lucide-react";
import { ScanningOverlay } from "@/components/scanning-overlay";
import { useMetrics } from "@/hooks/metrics-context";
import { useNearbyStops } from "@/hooks/use-nearby-stops";
import { useStopOptions } from "@/hooks/use-stop-options";
import { useSystemStats } from "@/hooks/use-system-stats";
import { useActiveCommunityPath } from "@/hooks/use-active-community-path";
import type { RouteMetrics, TransitRoute } from "@/types";
import {
  buildMetricsFromSimulation,
  buildRouteMetrics,
  buildFallbackRoute,
  findSimulatedRoute,
  TRANSIT_PLACE_OPTIONS,
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  TRANSIT_PLACE_POSITIONS,
} from "@/utils/transit-sim";

export default function ArusDashboard() {
  const {
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
    metrics,
    setRouteMetrics,
  } = useMetrics();

  const { reliabilityScore, stressScore, recommendation, impact } = metrics;
  const { stats: systemStats, refresh: refreshSystemStats } = useSystemStats();
  const { path: activeCommunityPath } = useActiveCommunityPath();

  const [showReport, setShowReport] = useState(false);
  const [isStopListCollapsed, setIsStopListCollapsed] = useState(true);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 3.1478, lng: 101.7117 });
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [route, setRoute] = useState<TransitRoute | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteMetrics | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [originMode, setOriginMode] = useState<"auto" | "manual">("auto");
  const routeTimeoutRef = React.useRef<number | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const { stops: nearbyStops } = useNearbyStops(
    mapCenter.lat,
    mapCenter.lng,
    6000,
  );
  const nearestStop = nearbyStops[0] ?? null;

  const { stops: allStops } = useStopOptions();
  const stopOptions = useMemo(() => {
    const names = allStops.map((stop) => stop.name);
    return Array.from(new Set([...names, ...TRANSIT_PLACE_OPTIONS]));
  }, [allStops]);

  const stopPositionLookup = useMemo(() => {
    const lookup = new Map<string, [number, number]>();
    Object.entries(TRANSIT_PLACE_POSITIONS).forEach(([label, position]) => {
      lookup.set(label.trim().toLowerCase(), position);
    });
    nearbyStops.forEach((stop) => {
      lookup.set(stop.name.trim().toLowerCase(), [
        stop.latitude,
        stop.longitude,
      ]);
    });
    return lookup;
  }, [nearbyStops]);

  const getStopPosition = React.useCallback(
    (label: string) => stopPositionLookup.get(label.trim().toLowerCase()),
    [stopPositionLookup],
  );

  type TransitStopRow = {
    id: string;
    name: string;
    reliability: number | string | null;
    location: string | null;
  };

  const parsePoint = React.useCallback(
    (value: unknown): [number, number] | null => {
      if (typeof value !== "string") return null;
      const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (!match) return null;
      const lng = Number(match[1]);
      const lat = Number(match[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng];
    },
    [],
  );

  const haversineMeters = React.useCallback(
    (a: [number, number], b: [number, number]) => {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const [lat1, lng1] = a;
      const [lat2, lng2] = b;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      return 6371000 * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    },
    [],
  );

  const findStopByName = React.useCallback(
    async (name: string): Promise<TransitStopRow | null> => {
      if (!supabase || !name.trim()) return null;

      const exact = await supabase
        .from("transit_stops")
        .select("id,name,reliability,location")
        .eq("is_active", true)
        .ilike("name", name.trim())
        .order("reliability", { ascending: false })
        .limit(1);

      if (!exact.error && exact.data && exact.data.length > 0) {
        return exact.data[0] as TransitStopRow;
      }

      const partial = await supabase
        .from("transit_stops")
        .select("id,name,reliability,location")
        .eq("is_active", true)
        .ilike("name", `%${name.trim()}%`)
        .order("reliability", { ascending: false })
        .limit(1);

      if (!partial.error && partial.data && partial.data.length > 0) {
        return partial.data[0] as TransitStopRow;
      }

      return null;
    },
    [supabase],
  );

  const resolveStopInput = React.useCallback(
    (input: string) => {
      const normalized = input.trim().toLowerCase();
      const direct = stopOptions.find((s) => s.toLowerCase() === normalized);
      if (direct)
        return { resolved: direct, position: getStopPosition(direct) };
      const partial = stopOptions.find((s) =>
        s.toLowerCase().includes(normalized),
      );
      if (partial)
        return { resolved: partial, position: getStopPosition(partial) };
      return { resolved: input, position: undefined };
    },
    [stopOptions, getStopPosition],
  );

  const resolvedOrigin = useMemo(
    () => resolveStopInput(origin),
    [origin, resolveStopInput],
  );
  const resolvedDestination = useMemo(
    () => resolveStopInput(destination),
    [destination, resolveStopInput],
  );

  const originHint = useMemo(() => {
    if (originMode === "auto" && nearestStop)
      return `Auto-set to ${nearestStop.name}`;
    if (resolvedOrigin.resolved !== origin)
      return `Matched to ${resolvedOrigin.resolved}`;
    return null;
  }, [originMode, nearestStop, origin, resolvedOrigin]);

  const destinationHint = useMemo(() => {
    if (resolvedDestination.resolved !== destination)
      return `Matched to ${resolvedDestination.resolved}`;
    return null;
  }, [destination, resolvedDestination]);

  useEffect(() => {
    if (originMode !== "auto" || !nearestStop) return;
    if (origin !== nearestStop.name) {
      setOrigin(nearestStop.name);
    }
  }, [originMode, nearestStop, origin]);

  const handleSimulateRoute = () => {
    if (routeTimeoutRef.current) window.clearTimeout(routeTimeoutRef.current);
    setIsRouting(true);
    setRouteError(null);

    routeTimeoutRef.current = window.setTimeout(() => {
      const run = async () => {
        let simulationDepth: number | undefined;
        let backendOrigin: [number, number] | undefined;
        let backendDestination: [number, number] | undefined;
        let backendMetrics: RouteMetrics | null = null;
        let finalSummary: RouteMetrics | null = null;
        let originStopId: string | null = null;
        let destinationStopId: string | null = null;

        if (supabase) {
          const [originStop, destinationStop] = await Promise.all([
            findStopByName(resolvedOrigin.resolved),
            findStopByName(resolvedDestination.resolved),
          ]);

          if (originStop) {
            originStopId = originStop.id;
            const point = parsePoint(originStop.location);
            if (point) backendOrigin = point;
          }

          if (destinationStop) {
            destinationStopId = destinationStop.id;
            const point = parsePoint(destinationStop.location);
            if (point) backendDestination = point;
          }

          if (backendOrigin && backendDestination) {
            const distanceMeters = haversineMeters(
              backendOrigin,
              backendDestination,
            );
            const durationMinutes = Math.max(
              5,
              Math.round((distanceMeters / 1000) * 6.5 + 8),
            );
            const originReliability = Number(originStop?.reliability ?? 0.9);
            const destinationReliability = Number(
              destinationStop?.reliability ?? 0.9,
            );
            const reliabilityPct = Math.round(
              Math.max(
                0,
                Math.min(1, (originReliability + destinationReliability) / 2),
              ) * 100,
            );
            const stressScore = Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  distanceMeters / 120 + (100 - reliabilityPct) * 0.35,
                ),
              ),
            );

            simulationDepth = originStop && destinationStop ? 3 : 2;
            backendMetrics = buildMetricsFromSimulation({
              duration_minutes: durationMinutes,
              distance_meters: distanceMeters,
              reliability_score: reliabilityPct,
              stress_score: stressScore,
              simulation_depth: simulationDepth,
            });
          }
        }

        const { route: nextRoute, error } = findSimulatedRoute(
          resolvedOrigin.resolved,
          resolvedDestination.resolved,
        );

        if (!nextRoute) {
          if (resolvedOrigin.position || backendOrigin) {
            const fallback = buildFallbackRoute(
              resolvedOrigin.resolved,
              resolvedDestination.resolved,
              backendOrigin ?? resolvedOrigin.position,
              backendDestination ?? resolvedDestination.position,
            );
            setRoute(fallback);
            const metricsSummary =
              backendMetrics ?? buildRouteMetrics(fallback, simulationDepth);
            finalSummary = metricsSummary;
            setRouteSummary(metricsSummary);
            setRouteMetrics(metricsSummary);

            // Synchronize walking slider with route baseline
            const walkMin = Math.round(
              metricsSummary.walkingDistanceMeters / 80,
            );
            setWalkingTime(walkMin);
          } else {
            setRouteError(error || "No route found. Try a different stop.");
            setRoute(null);
            setRouteSummary(null);
            setRouteMetrics(null);
          }
        } else {
          const metricsSummary =
            backendMetrics ?? buildRouteMetrics(nextRoute, simulationDepth);
          finalSummary = metricsSummary;
          setRoute(nextRoute);
          setRouteSummary(metricsSummary);
          setRouteMetrics(metricsSummary);

          // Synchronize walking slider with route baseline
          const walkMin = Math.round(metricsSummary.walkingDistanceMeters / 80);
          setWalkingTime(walkMin);
        }

        if (supabase && originStopId && destinationStopId) {
          const activeSummary = finalSummary ?? backendMetrics;

          if (activeSummary) {
            const approxDistanceMeters = Math.max(
              activeSummary.walkingDistanceMeters * 2,
              activeSummary.totalDurationMinutes * 500,
            );

            const { error: insertError } = await supabase
              .from("route_simulations")
              .insert({
                origin_stop_id: originStopId,
                destination_stop_id: destinationStopId,
                origin_name: resolvedOrigin.resolved,
                destination_name: resolvedDestination.resolved,
                distance_meters: approxDistanceMeters,
                duration_minutes: activeSummary.totalDurationMinutes,
                reliability_score: activeSummary.reliabilityScore,
                stress_score: activeSummary.stressScore,
                simulation_depth: activeSummary.simulationDepth ?? 2,
              });

            if (!insertError) {
              refreshSystemStats();
            } else {
              console.error("Failed to persist simulation:", insertError);
            }
          }
        }

        setIsRouting(false);
      };

      run().catch((err) => {
        console.error("Route simulation failed:", err);
        setRouteError("Simulation failed. Try again.");
        setIsRouting(false);
      });
    }, 700);
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    setOriginMode("manual");
    if (routeError) setRouteError(null);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    if (routeError) setRouteError(null);
  };

  const handleMapMove = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
  };

  const handleCommitToJourney = () => {
    if (!route) return;
    setIsJourneyActive(true);
  };

  const handleFinishJourney = () => {
    setIsJourneyActive(false);
  };

  return (
    <DashboardShell>
      <div className="relative w-full h-full">
        {/* Full Bleed Map Background */}
        <div className="absolute inset-0 z-0">
          <MapView
            metrics={{
              reliabilityScore,
              stressScore,
              impact,
              heatIndex,
            }}
            route={route}
            activeCommunityPath={activeCommunityPath}
            onMove={handleMapMove}
          />
        </div>

        {/* Mobile Backdrop */}
        {!isStopListCollapsed && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsStopListCollapsed(true)}
          />
        )}

        {/* Floating Stop List Panel */}
        <StopList
          isCollapsed={isStopListCollapsed}
          onToggle={() => setIsStopListCollapsed(!isStopListCollapsed)}
          lat={mapCenter.lat}
          lng={mapCenter.lng}
        />

        {/* Floating Simulation Controls Panel (Desktop only) */}
        <div className="absolute top-6 right-6 bottom-24 hidden xl:flex flex-col gap-6 w-80 overflow-y-auto custom-scrollbar scroll-mask scroll-smooth p-1 z-50 text-zinc-950 uppercase tracking-tighter italic">
          <TransitRoutePanel
            origin={origin}
            destination={destination}
            onOriginChange={handleOriginChange}
            onDestinationChange={handleDestinationChange}
            onSimulate={handleSimulateRoute}
            isRouting={isRouting}
            error={routeError}
            summary={routeSummary}
            route={route}
            placeOptions={stopOptions}
            originHint={originHint}
            destinationHint={destinationHint}
            compact={true}
          />
          <div>
            <DemoControls
              delayMinutes={delayMinutes}
              setDelayMinutes={setDelayMinutes}
              heatIndex={heatIndex}
              setHeatIndex={setHeatIndex}
              walkingTime={walkingTime}
              setWalkingTime={setWalkingTime}
              safetyRisk={safetyRisk}
              setSafetyRisk={setSafetyRisk}
              isSheltered={isSheltered}
              setIsSheltered={setIsSheltered}
              noGlass={true}
            />
          </div>

          <div>
            <MetricCard
              label="Simulation Depth"
              value={
                routeSummary?.simulationDepth ??
                systemStats.totalReports + systemStats.totalSimulations
              }
              unit={routeSummary?.simulationDepth ? "LVL" : "DATA"}
              icon={Clock}
              noGlass={true}
            />
          </div>

          <div className="pb-8">
            <RecommendationPanel
              recommendation={recommendation}
              noGlass={true}
              onCommit={handleCommitToJourney}
            />
          </div>
        </div>

        {/* Map FABs / Quick Actions Row (Bottom Left - Desktop Only) */}
        <div className="absolute bottom-8 left-8 z-10 hidden xl:flex flex-col items-start gap-3 pointer-events-auto transition-all animate-in slide-in-from-left duration-700">
          <button
            onClick={() => setShowReport(true)}
            className="bg-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-orange-500/20 text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95"
          >
            <MessageSquarePlus size={16} />
            Report friction
          </button>
          <div className="bg-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-zinc-950/10 hidden md:block shadow-xl">
            demo Particle Engine Active
          </div>
        </div>

        {/* Mobile FABs Row (Bottom) */}
        <div className="xl:hidden fixed bottom-28 right-4 z-1200 flex flex-col gap-3 pointer-events-auto">
          {/* Report Friction Button (Mobile) */}
          <button
            onClick={() => {
              const newState = !showReport;
              setShowReport(newState);
              if (newState) {
                setIsStopListCollapsed(true);
                setShowMobileControls(false);
              }
            }}
            className={`p-3.5 rounded-2xl shadow-xl transition-all duration-300 border ${
              showReport
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-orange-500 text-white border-orange-500/20"
            }`}
            title="Report Friction"
          >
            <MessageSquarePlus size={22} />
          </button>

          {/* Toggle Stop List (Mobile/Tablet Only) */}
          <button
            onClick={() => {
              const newState = !isStopListCollapsed;
              setIsStopListCollapsed(newState);
              if (!newState) {
                setShowReport(false);
                setShowMobileControls(false);
              }
            }}
            className={`p-3.5 rounded-2xl shadow-xl transition-all duration-300 border border-white/20 ${
              !isStopListCollapsed
                ? "bg-zinc-950 text-white"
                : "bg-white text-zinc-950"
            }`}
            title={isStopListCollapsed ? "Show Stops" : "Hide Stops"}
          >
            <Clock size={22} />
          </button>

          {/* Mobile Simulation Controls Toggle */}
          <button
            onClick={() => {
              const newState = !showMobileControls;
              setShowMobileControls(newState);
              if (newState) {
                setShowReport(false);
                setIsStopListCollapsed(true);
              }
            }}
            className={`p-3.5 rounded-2xl shadow-xl transition-all duration-300 border border-white/20 ${
              showMobileControls
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-zinc-950"
            }`}
            title="Simulation Controls"
          >
            <Zap
              className={showMobileControls ? "animate-pulse" : ""}
              size={22}
            />
          </button>
        </div>

        {/* Mobile Simulation Controls Drawer Backdrop */}
        {showMobileControls && (
          <div
            className="xl:hidden fixed inset-0 z-[1400] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setShowMobileControls(false)}
          />
        )}

        {/* Mobile Simulation Controls Drawer */}
        {showMobileControls && (
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[1500] max-h-[85vh] overflow-y-auto bg-white rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-zinc-100 animate-in slide-in-from-bottom duration-500 custom-scrollbar">
            <div className="sticky top-0 bg-white pt-4 pb-2 px-6 z-10">
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xl">
                    <Zap
                      className={
                        isRouting ? "animate-pulse text-emerald-400" : ""
                      }
                      size={20}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-950 italic uppercase tracking-tighter leading-none">
                      Live Simulator
                    </h3>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Spatial Depth:{" "}
                      {routeSummary?.simulationDepth ??
                        systemStats.totalReports + systemStats.totalSimulations}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileControls(false)}
                  className="p-2.5 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-950 transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 pt-2 space-y-8 pb-32">
              <TransitRoutePanel
                origin={origin}
                destination={destination}
                onOriginChange={handleOriginChange}
                onDestinationChange={handleDestinationChange}
                onSimulate={handleSimulateRoute}
                isRouting={isRouting}
                error={routeError}
                summary={routeSummary}
                route={route}
                placeOptions={stopOptions}
                originHint={originHint}
                destinationHint={destinationHint}
                compact={true}
              />
              <DemoControls
                delayMinutes={delayMinutes}
                setDelayMinutes={setDelayMinutes}
                heatIndex={heatIndex}
                setHeatIndex={setHeatIndex}
                walkingTime={walkingTime}
                setWalkingTime={setWalkingTime}
                safetyRisk={safetyRisk}
                setSafetyRisk={setSafetyRisk}
                isSheltered={isSheltered}
                setIsSheltered={setIsSheltered}
                isCompact={true}
                noBorder={true}
              />
              <div className="pt-2">
                <RecommendationPanel
                  recommendation={recommendation}
                  noBorder={true}
                  onCommit={handleCommitToJourney}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal / Forms */}
        {isRouting && <ScanningOverlay />}
        {isJourneyActive && (
          <JourneyActiveOverlay
            onFinish={handleFinishJourney}
            destination={destination}
            metrics={metrics}
          />
        )}
        {showReport && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              onClick={() => setShowReport(false)}
            />
            <div className="relative w-full max-w-md pointer-events-auto">
              <ReportForm onClose={() => setShowReport(false)} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
