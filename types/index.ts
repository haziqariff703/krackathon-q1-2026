// Shared types that can be expanded as the app grows.
export type AppUser = {
  id: string;
  email: string | null;
};

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export type RouteMetrics = {
  totalDurationMinutes: number;
  arrivalTime: string;
  numberOfTransfers: number;
  walkingDistanceMeters: number;
  reliabilityScore: number;
  stressScore: number;
  estimatedTimeSavedMinutes: number;
  simulationDepth?: number;
};

export type TransitStep = {
  mode: "WALK" | "TRANSIT";
  durationMin: number;
  distanceM?: number;
  line?: string;
};

export type TransitMarker = {
  label: string;
  position: [number, number];
  kind: "origin" | "destination" | "transfer";
};

export type TransitRoute = {
  id: string;
  originLabel: string;
  destinationLabel: string;
  polyline: [number, number][];
  steps: TransitStep[];
  markers: TransitMarker[];
};

export type TransitVehicle = {
  id: string;
  line: string;
  mode: "MRT" | "LRT" | "BUS";
  position: [number, number];
  heading: number;
  speedKph: number;
  updatedAt: string;
  color: string;
};
