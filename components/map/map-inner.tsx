"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TransitRoute } from "@/types";
import { type IncidentReport } from "@/hooks/use-live-reports";
import type { TransitVehicle } from "@/types";
import type { ActiveCommunityPath } from "@/hooks/use-active-community-path";

// Fix for default Leaflet icon marker issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Incident Reports
const CATEGORY_ICONS: Record<string, L.Icon> = {
  transit: L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  heat: L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  safety: L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

const CENTER: [number, number] = [3.147, 101.693]; // Kuala Lumpur

// Mock Community Paths GeoJSON (Sheltered/Safe walking routes)
const COMMUNITY_PATHS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Plaza Low Yat Sheltered Path", type: "sheltered" },
      geometry: {
        type: "LineString",
        coordinates: [
          [101.71, 3.144],
          [101.711, 3.145],
          [101.712, 3.146],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "KLCC Underground Connection", type: "sheltered" },
      geometry: {
        type: "LineString",
        coordinates: [
          [101.711, 3.155],
          [101.713, 3.157],
          [101.715, 3.158],
        ],
      },
    },
  ],
};

function MapEvents({
  onMove,
}: {
  onMove?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onMove) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    };

    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onMove]);

  return null;
}

function MapController() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

function RouteOverlay({ route }: { route: TransitRoute | null }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.polyline?.length) return;
    const bounds = L.latLngBounds(
      route.polyline.map((point) => L.latLng(point[0], point[1])),
    );
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, route]);

  if (!route?.polyline?.length) return null;

  return (
    <>
      <Polyline
        positions={route.polyline}
        pathOptions={{ color: "#0f766e", weight: 5, opacity: 0.9 }}
      />
      {route.markers.map((marker) => (
        <Marker
          key={`${marker.kind}-${marker.label}`}
          position={marker.position}
        >
          <Popup>
            <div className="p-1 font-sans text-xs font-semibold">
              {marker.label}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

interface MapInnerProps {
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
  route: TransitRoute | null;
  reports?: IncidentReport[];
  vehicles?: TransitVehicle[];
  activeCommunityPath?: ActiveCommunityPath | null;
  onMove?: (lat: number, lng: number) => void;
}

export default function MapInner({
  metrics,
  route,
  reports,
  vehicles,
  activeCommunityPath = null,
  onMove,
}: MapInnerProps) {
  const shelteredStyle = {
    color: "#10b981", // Emerald 500
    weight: 5,
    opacity: 0.6,
    dashArray: "10, 10",
    lineJoin: "round" as const,
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController />
        <MapEvents onMove={onMove} />

        <GeoJSON data={COMMUNITY_PATHS} style={shelteredStyle} />
        <RouteOverlay route={route} />

        {/* Live Community Reports */}
        {reports?.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={CATEGORY_ICONS[report.type] || DefaultIcon}
          >
            <Popup minWidth={180}>
              <div className="p-2 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      report.type === "heat"
                        ? "bg-red-500"
                        : report.type === "safety"
                          ? "bg-indigo-500"
                          : "bg-orange-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-950">
                    {report.type} IMPACT
                  </span>
                </div>
                <div className="font-bold text-sm mb-1">{report.title}</div>
                <p className="text-xs text-zinc-500 leading-relaxed italic">
                  &quot;{report.description}&quot;
                </p>
                <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    Community Validated
                  </span>
                  <div className="flex items-center gap-1 text-zinc-950 font-black text-[10px]">
                    <span className="text-emerald-600">↑</span>
                    <span>{report.upvotes}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Vehicle Positions (Mock) */}
        {vehicles?.map((vehicle) => (
          <CircleMarker
            key={vehicle.id}
            center={vehicle.position}
            radius={6}
            pathOptions={{
              color: vehicle.color,
              fillColor: vehicle.color,
              fillOpacity: 0.9,
              weight: 2,
            }}
            className="smooth-marker"
          >
            <Popup minWidth={160}>
              <div className="p-2 font-sans text-xs">
                <div className="font-black text-zinc-950">{vehicle.line}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400">
                  {vehicle.mode} vehicle
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                  <span>{vehicle.speedKph} km/h</span>
                  <span>
                    {new Date(vehicle.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Mock Transit Stop for Demo */}
        <Marker position={[3.15, 101.71]}>
          <Popup>
            <div className="p-1 font-sans">
              <div className="font-bold text-sm">KLCC Feeder Stop</div>
              <div className="text-xs text-zinc-500">RapidKL T402</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Status Overlays: Top Center (Desktop Only) */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-1000 hidden sm:flex max-w-[calc(100%-1.5rem)] pointer-events-none">
        <div className="glass-heavy px-3 sm:px-5 py-2 sm:py-3 rounded-2xl flex flex-row items-center gap-3 sm:gap-4 pointer-events-auto shadow-2xl animate-in fade-in slide-in-from-top duration-700 border border-white/20">
          <div className="flex items-center gap-1.5 sm:gap-2 sm:border-r border-zinc-100/50 pr-0 sm:pr-4">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-400 leading-none">
                Saved
              </span>
              <span className="text-[10px] sm:text-xs font-black text-zinc-950">
                {metrics.impact.minutesSaved}m
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 sm:border-r border-zinc-100/50 pr-0 sm:pr-4">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-500" />
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-400 leading-none">
                Heat
              </span>
              <span className="text-[10px] sm:text-xs font-black text-zinc-950">
                {metrics.heatIndex}°C
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-400 leading-none">
                Impact
              </span>
              <span className="text-[10px] sm:text-xs font-black text-zinc-950">
                {metrics.impact.communityImpactScore} PTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Map Overlays: Bottom Left on Mobile, Bottom Right on Desktop */}
      <div className="absolute bottom-28 left-4 sm:bottom-6 sm:right-6 sm:left-auto z-1000 flex flex-col gap-3 pointer-events-auto">
        <div className="glass px-4 py-3 rounded-2xl border-2 border-emerald-500/20 flex flex-col gap-1 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-950">
              Active Community Path
            </span>
          </div>
          <div className="text-[9px] font-medium text-emerald-600 uppercase tracking-tighter mb-1">
            {activeCommunityPath?.name ?? "Optimized for Heat Avoidance"}
          </div>
          {activeCommunityPath && (
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
              {activeCommunityPath.isVerified ? "Verified" : "Unverified"} •{" "}
              {activeCommunityPath.upvotes} upvotes
            </div>
          )}

          {/* Mobile-Only Trip Status Feed */}
          <div className="flex sm:hidden items-center gap-4 mt-2 pt-2 border-t border-emerald-500/10">
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-zinc-400 leading-none mb-0.5">
                Saved
              </span>
              <span className="text-[10px] font-black text-zinc-950 italic">
                {metrics.impact.minutesSaved}m
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-100" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-zinc-400 leading-none mb-0.5">
                Heat
              </span>
              <span className="text-[10px] font-black text-zinc-950 italic">
                {metrics.heatIndex}°C
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-100" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-zinc-400 leading-none mb-0.5">
                Impact
              </span>
              <span className="text-[10px] font-black text-zinc-950 italic">
                {metrics.impact.communityImpactScore} PTS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
