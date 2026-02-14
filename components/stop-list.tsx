"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Clock,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";
import { useNearbyStops } from "@/hooks/use-nearby-stops";

export function StopList({
  isCollapsed,
  onToggle,
  lat = 3.1478, // Default to Bukit Bintang
  lng = 101.7117,
  onPickStop,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  lat?: number;
  lng?: number;
  onPickStop?: (stopName: string, target: "origin" | "destination") => void;
}) {
  const { stops, loading, error } = useNearbyStops(lat, lng);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "on-time" | "delayed" | "heavy-stress"
  >("all");
  const [pickTarget, setPickTarget] = useState<"origin" | "destination">(
    "origin",
  );

  const filteredStops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stops.filter((stop) => {
      if (statusFilter !== "all" && stop.status !== statusFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = `${stop.name} ${stop.lines.join(" ")}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [stops, query, statusFilter]);

  return (
    <div className="fixed left-0 top-24 bottom-24 z-60 pointer-events-none overflow-visible">
      <div
        className={`flex flex-col h-full bg-white rounded-r-[2.5rem] shadow-2xl border-y border-r border-zinc-200/50 transition-all duration-500 ease-in-out w-[85vw] sm:w-96 pointer-events-auto relative ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Toggle Button (Desktop/Tablet) */}
        <button
          onClick={onToggle}
          className="xl:flex hidden absolute top-1/2 left-full -translate-y-1/2 w-8 h-24 bg-white rounded-r-2xl border border-l-0 border-zinc-200/50 items-center justify-center text-zinc-400 hover:text-zinc-950 transition-all pointer-events-auto shadow-xl group"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <div
            className={`transition-transform duration-500 ${isCollapsed ? "" : "rotate-180"}`}
          >
            <ChevronRight
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </div>
        </button>
        {/* Search & Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">
              Nearby Stops
            </h2>
          </div>

          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-950 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search stations or lines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-950 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-xl bg-zinc-50 p-1">
              <button
                type="button"
                onClick={() => setPickTarget("origin")}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  pickTarget === "origin"
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Pick Origin
              </button>
              <button
                type="button"
                onClick={() => setPickTarget("destination")}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  pickTarget === "destination"
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Pick Destination
              </button>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "on-time" | "delayed" | "heavy-stress",
                  )
                }
                className="bg-zinc-50 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              >
                <option value="all">All Status</option>
                <option value="on-time">On Time</option>
                <option value="delayed">Delayed</option>
                <option value="heavy-stress">Heavy Stress</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stop List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Scanning Particle Grid...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center">
              Mesh Link Failed: {error}
            </div>
          ) : filteredStops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <MapPin className="w-8 h-8 text-zinc-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                No stops match your filter
              </p>
            </div>
          ) : (
            filteredStops.map((stop) => (
              <button
                key={stop.id}
                onClick={() => onPickStop?.(stop.name, pickTarget)}
                className="w-full text-left bg-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-4 rounded-2xl border-2 border-transparent hover:border-zinc-950 transition-all group flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        stop.status === "on-time"
                          ? "bg-emerald-500"
                          : stop.status === "delayed"
                            ? "bg-amber-500"
                            : "bg-red-50"
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {stop.status.replace("-", " ")}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-zinc-300 group-hover:text-zinc-950 transition-colors"
                  />
                </div>

                <div>
                  <h3 className="font-black text-sm text-zinc-950">
                    {stop.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {stop.lines.map((line) => (
                      <span
                        key={line}
                        className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-zinc-400" />
                    <span className="text-xs font-black text-zinc-950">
                      {stop.waitTime}m
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">
                        Reliability
                      </span>
                      <span
                        className={`text-xs font-black ${
                          stop.reliability > 80
                            ? "text-emerald-600"
                            : stop.reliability > 60
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {stop.reliability}%
                      </span>
                    </div>
                    {(stop as any).distance_meters !== undefined && (
                      <div className="ml-2 border-l border-zinc-100 pl-2">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">
                          Range
                        </span>
                        <span className="block text-xs font-black text-zinc-950">
                          {Math.round((stop as any).distance_meters)}m
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
