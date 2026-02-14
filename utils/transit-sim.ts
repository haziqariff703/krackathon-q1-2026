import type { RouteMetrics, TransitRoute } from "@/types";

type Place = {
  label: string;
  position: [number, number];
};

const PLACES: Place[] = [
  { label: "KL Sentral", position: [3.1341, 101.6861] },
  { label: "Pasar Seni", position: [3.1412, 101.695] },
  { label: "Bukit Bintang", position: [3.1466, 101.7101] },
  { label: "KLCC", position: [3.1579, 101.7123] },
];

export const TRANSIT_PLACE_OPTIONS = PLACES.map((place) => place.label);
export const DEFAULT_ORIGIN = "KL Sentral";
export const DEFAULT_DESTINATION = "Bukit Bintang";
export const BASELINE_MINUTES = 45;

const ROUTES: TransitRoute[] = [
  {
    id: "kl-sentral-bukit-bintang",
    originLabel: "KL Sentral",
    destinationLabel: "Bukit Bintang",
    polyline: [
      [3.1341, 101.6861],
      [3.1398, 101.6918],
      [3.1412, 101.695],
      [3.1448, 101.7035],
      [3.1466, 101.7101],
    ],
    steps: [
      { mode: "WALK", durationMin: 5, distanceM: 420 },
      { mode: "TRANSIT", durationMin: 12, line: "MRT Kajang" },
      { mode: "WALK", durationMin: 4, distanceM: 320 },
    ],
    markers: [
      { label: "KL Sentral", position: [3.1341, 101.6861], kind: "origin" },
      { label: "Pasar Seni", position: [3.1412, 101.695], kind: "transfer" },
      {
        label: "Bukit Bintang",
        position: [3.1466, 101.7101],
        kind: "destination",
      },
    ],
  },
  {
    id: "kl-sentral-klcc",
    originLabel: "KL Sentral",
    destinationLabel: "KLCC",
    polyline: [
      [3.1341, 101.6861],
      [3.1412, 101.695],
      [3.1502, 101.7072],
      [3.1579, 101.7123],
    ],
    steps: [
      { mode: "WALK", durationMin: 6, distanceM: 480 },
      { mode: "TRANSIT", durationMin: 10, line: "LRT Kelana Jaya" },
      { mode: "TRANSIT", durationMin: 6, line: "MRT Kajang" },
      { mode: "WALK", durationMin: 5, distanceM: 350 },
    ],
    markers: [
      { label: "KL Sentral", position: [3.1341, 101.6861], kind: "origin" },
      { label: "Pasar Seni", position: [3.1412, 101.695], kind: "transfer" },
      { label: "KLCC", position: [3.1579, 101.7123], kind: "destination" },
    ],
  },
  {
    id: "bukit-bintang-klcc",
    originLabel: "Bukit Bintang",
    destinationLabel: "KLCC",
    polyline: [
      [3.1466, 101.7101],
      [3.1524, 101.7114],
      [3.1579, 101.7123],
    ],
    steps: [
      { mode: "WALK", durationMin: 4, distanceM: 300 },
      { mode: "TRANSIT", durationMin: 6, line: "MRT Kajang" },
      { mode: "WALK", durationMin: 5, distanceM: 420 },
    ],
    markers: [
      {
        label: "Bukit Bintang",
        position: [3.1466, 101.7101],
        kind: "origin",
      },
      { label: "KLCC", position: [3.1579, 101.7123], kind: "destination" },
    ],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

const resolvePlaceLabel = (input: string) => {
  const normalized = normalize(input);
  const exact = PLACES.find((place) => normalize(place.label) === normalized);
  if (exact) return exact.label;
  const partial = PLACES.find((place) =>
    normalized.includes(normalize(place.label)),
  );
  return partial?.label ?? null;
};

export const TRANSIT_PLACE_POSITIONS = PLACES.reduce<
  Record<string, [number, number]>
>((acc, place) => {
  acc[place.label] = place.position;
  return acc;
}, {});

export const findSimulatedRoute = (
  originInput: string,
  destinationInput: string,
) => {
  const originLabel =
    resolvePlaceLabel(originInput) ?? originInput.trim() ?? "";
  const destinationLabel =
    resolvePlaceLabel(destinationInput) ?? destinationInput.trim() ?? "";

  if (!originLabel || !destinationLabel) {
    return { route: null, error: "Enter both origin and destination." };
  }

  const route =
    ROUTES.find(
      (item) =>
        item.originLabel === originLabel &&
        item.destinationLabel === destinationLabel,
    ) ?? null;

  if (!route) {
    return { route: null, error: "No demo route found for that pair yet." };
  }

  return { route, error: null };
};

export const buildFallbackRoute = (
  originLabel: string,
  destinationLabel: string,
  originPosition?: [number, number],
  destinationPosition?: [number, number],
): TransitRoute => {
  const safeOrigin: [number, number] = originPosition ?? [3.147, 101.693];
  const safeDestination: [number, number] = destinationPosition ?? [
    safeOrigin[0] + 0.012,
    safeOrigin[1] + 0.009,
  ];

  const toRad = (value: number) => (value * Math.PI) / 180;
  const haversineMeters = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const distanceMeters = haversineMeters(
    safeOrigin[0],
    safeOrigin[1],
    safeDestination[0],
    safeDestination[1],
  );
  const walkingDistance = Math.max(200, Math.round(distanceMeters * 0.35));
  const transitDistance = Math.max(0, distanceMeters - walkingDistance);
  const walkingSpeedMPerMin = 80;
  const transitSpeedMPerMin = 500;
  const walkOneDistance = Math.round(walkingDistance / 2);
  const walkTwoDistance = walkingDistance - walkOneDistance;
  const walkOneMinutes = Math.max(2, Math.round(walkOneDistance / walkingSpeedMPerMin));
  const walkTwoMinutes = Math.max(2, Math.round(walkTwoDistance / walkingSpeedMPerMin));
  const transitMinutes = Math.max(5, Math.round(transitDistance / transitSpeedMPerMin));

  return {
    id: `${normalize(originLabel)}-${normalize(destinationLabel)}-fallback`,
    originLabel,
    destinationLabel,
    polyline: [safeOrigin, safeDestination],
    steps: [
      { mode: "WALK", durationMin: walkOneMinutes, distanceM: walkOneDistance },
      { mode: "TRANSIT", durationMin: transitMinutes, line: "Demo Express" },
      { mode: "WALK", durationMin: walkTwoMinutes, distanceM: walkTwoDistance },
    ],
    markers: [
      { label: originLabel, position: safeOrigin, kind: "origin" },
      { label: destinationLabel, position: safeDestination, kind: "destination" },
    ],
  };
};

export const buildRouteMetrics = (
  route: TransitRoute,
  simulationDepth?: number,
): RouteMetrics => {
  const totalDurationMinutes = route.steps.reduce(
    (sum, step) => sum + step.durationMin,
    0,
  );

  const walkingDistanceMeters = route.steps
    .filter((step) => step.mode === "WALK")
    .reduce((sum, step) => sum + (step.distanceM ?? 0), 0);

  const transitSteps = route.steps.filter((step) => step.mode === "TRANSIT")
    .length;
  const numberOfTransfers = Math.max(0, transitSteps - 1);

  const stressScore = Math.round(
    numberOfTransfers * 10 + walkingDistanceMeters / 100,
  );
  const reliabilityScore = Math.max(0, Math.min(100, 100 - stressScore));
  const estimatedTimeSavedMinutes = Math.max(
    0,
    BASELINE_MINUTES - totalDurationMinutes,
  );

  const derivedDepth = Math.min(3, Math.max(1, route.steps.length));

  const arrivalTime = new Date(
    Date.now() + totalDurationMinutes * 60_000,
  ).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return {
    totalDurationMinutes,
    arrivalTime,
    numberOfTransfers,
    walkingDistanceMeters,
    reliabilityScore,
    stressScore,
    estimatedTimeSavedMinutes,
    simulationDepth: simulationDepth ?? derivedDepth,
  };
};

export const buildMetricsFromSimulation = (payload: {
  duration_minutes: number;
  distance_meters: number;
  reliability_score: number;
  stress_score: number;
  simulation_depth?: number;
}): RouteMetrics => {
  const totalDurationMinutes = Math.max(1, Math.round(payload.duration_minutes));
  const distanceMeters = Math.max(0, payload.distance_meters);
  const walkingDistanceMeters = Math.max(0, Math.round(distanceMeters * 0.35));
  const numberOfTransfers =
    distanceMeters > 6000 ? 2 : distanceMeters > 2500 ? 1 : 0;

  const estimatedTimeSavedMinutes = Math.max(
    0,
    BASELINE_MINUTES - totalDurationMinutes,
  );

  const arrivalTime = new Date(
    Date.now() + totalDurationMinutes * 60_000,
  ).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return {
    totalDurationMinutes,
    arrivalTime,
    numberOfTransfers,
    walkingDistanceMeters,
    reliabilityScore: Math.max(0, Math.min(100, payload.reliability_score)),
    stressScore: Math.max(0, Math.min(100, payload.stress_score)),
    estimatedTimeSavedMinutes,
    simulationDepth: payload.simulation_depth,
  };
};
