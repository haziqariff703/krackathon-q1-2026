"use client";

import React from "react";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import type { RouteMetrics, TransitRoute } from "@/types";

type TransitRoutePanelProps = {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onSimulate: () => void;
  isRouting: boolean;
  error: string | null;
  summary: RouteMetrics | null;
  route?: TransitRoute | null;
  placeOptions: string[];
  originHint?: string | null;
  destinationHint?: string | null;
  description?: string;
  compact?: boolean;
};

export function TransitRoutePanel({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSimulate,
  isRouting,
  error,
  summary,
  route = null,
  placeOptions,
  originHint = null,
  destinationHint = null,
  description = "Choose origin and destination, then simulate to generate a route summary from active stop data.",
  compact = false,
}: TransitRoutePanelProps) {
  const listId = React.useId().replace(/:/g, "");
  const containerClasses = compact
    ? "glass p-4 rounded-2xl border border-zinc-100"
    : "glass p-5 rounded-3xl border border-zinc-100";
  const labelClasses =
    "text-[10px] font-bold text-zinc-400 uppercase tracking-widest";

  return (
    <div className={`${containerClasses} space-y-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-zinc-950">Transit Route</div>
          <p className="text-xs text-zinc-500 italic normal-case leading-relaxed">
            {description}
          </p>
        </div>
        {isRouting && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Routing...
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className={labelClasses}>Origin</label>
        <input
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          className="w-full rounded-2xl border border-zinc-100 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:outline-none"
          placeholder="KL Sentral"
          list={listId}
        />
        {originHint && (
          <div className="text-[10px] text-zinc-500">{originHint}</div>
        )}

        <label className={labelClasses}>Destination</label>
        <input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="w-full rounded-2xl border border-zinc-100 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:outline-none"
          placeholder="Bukit Bintang"
          list={listId}
        />
        {destinationHint && (
          <div className="text-[10px] text-zinc-500">{destinationHint}</div>
        )}

        <datalist id={listId}>
          {placeOptions.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={onSimulate}
          disabled={isRouting}
          className="w-full bg-zinc-950 text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          Simulate Route
          <ArrowRight size={16} />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle size={14} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4 space-y-3">
        <div className={labelClasses}>Route Summary</div>

        {summary ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/70 p-3">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Duration
              </div>
              <div className="text-lg font-black text-zinc-950">
                {summary.totalDurationMinutes}m
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Transfers
              </div>
              <div className="text-lg font-black text-zinc-950">
                {summary.numberOfTransfers}
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Walking
              </div>
              <div className="text-lg font-black text-zinc-950">
                {(summary.walkingDistanceMeters / 1000).toFixed(2)} km
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Reliability
              </div>
              <div className="text-lg font-black text-zinc-950">
                {summary.reliabilityScore}%
              </div>
            </div>
            <div className="col-span-2 rounded-2xl border border-zinc-100 bg-white/80 p-3 text-xs text-zinc-600">
              Arrives around{" "}
              <span className="font-bold text-zinc-900">
                {summary.arrivalTime}
              </span>{" "}
              with estimated{" "}
              <span className="font-bold text-zinc-900">
                {summary.estimatedTimeSavedMinutes}m
              </span>{" "}
              saved.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center space-y-2 animate-pulse">
            <div className="text-sm font-black text-zinc-400 uppercase tracking-tighter italic">
              Ready to Explore?
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-widest font-bold">
              Select an origin and destination above
              <br />
              to calculate community stress impact.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 pt-4 space-y-3">
        <div className={labelClasses}>Route Breakdown</div>

        {route ? (
          <div className="space-y-2">
            {route.steps.map((step, index) => {
              const isWalk = step.mode === "WALK";
              return (
                <div
                  key={`${route.id}-step-${index}`}
                  className="rounded-2xl border border-zinc-100 bg-white/70 px-3 py-2 text-xs text-zinc-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-zinc-950">
                      {isWalk ? "Walk" : (step.line ?? "Transit")}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-500">
                      {step.durationMin}m
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    {isWalk ? `${Math.round(step.distanceM ?? 0)}m` : step.mode}
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-zinc-100 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400">
              Stops:{" "}
              <span className="font-bold text-zinc-700 normal-case">
                {route.markers.map((marker) => marker.label).join(" → ")}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center">
            <p className="text-[9px] text-zinc-300 uppercase tracking-[0.2em] font-black">
              Waiting for Spatial Simulation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
