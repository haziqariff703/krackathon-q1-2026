import React from "react";
import dynamic from "next/dynamic";
import type { TransitRoute } from "@/types";
import { useLiveReports, type IncidentReport } from "@/hooks/use-live-reports";
import { useLiveVehicles } from "@/hooks/use-live-vehicles";
import type { ActiveCommunityPath } from "@/hooks/use-active-community-path";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
        <div className="text-zinc-400 font-medium text-sm">
          Initializing Spatial Engine...
        </div>
      </div>
    </div>
  ),
});

interface MapViewProps {
  metrics: {
    reliabilityScore: number;
    stressScore: number;
    impact: {
      minutesSaved: number;
      heatMinutesAvoided: number;
      communityImpactScore: number;
    };
    heatIndex: number;
  };
  route?: TransitRoute | null;
  activeCommunityPath?: ActiveCommunityPath | null;
  onMove?: (lat: number, lng: number) => void;
}

export function MapView({
  metrics,
  route,
  activeCommunityPath = null,
  onMove,
}: MapViewProps) {
  const { reports } = useLiveReports();
  const { vehicles } = useLiveVehicles();

  return (
    <MapInner
      metrics={metrics}
      route={route ?? null}
      activeCommunityPath={activeCommunityPath}
      reports={reports}
      vehicles={vehicles}
      onMove={onMove}
    />
  );
}
