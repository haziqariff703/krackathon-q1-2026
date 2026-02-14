import type { TransitVehicle } from "@/types";

type MockLine = {
  id: string;
  name: string;
  mode: TransitVehicle["mode"];
  color: string;
  path: [number, number][];
  vehicleCount: number;
  periodSeconds: number;
  speedKph: number;
};

const LINES: MockLine[] = [
  {
    id: "mrt-kajang",
    name: "MRT Kajang",
    mode: "MRT",
    color: "#2563eb",
    vehicleCount: 3,
    periodSeconds: 240,
    speedKph: 42,
    path: [
      [3.1341, 101.6861],
      [3.1398, 101.6918],
      [3.1412, 101.695],
      [3.1466, 101.7101],
      [3.1532, 101.7062],
      [3.1579, 101.7123],
    ],
  },
  {
    id: "lrt-kelana-jaya",
    name: "LRT Kelana Jaya",
    mode: "LRT",
    color: "#16a34a",
    vehicleCount: 3,
    periodSeconds: 210,
    speedKph: 36,
    path: [
      [3.1297, 101.6814],
      [3.1341, 101.6861],
      [3.1412, 101.695],
      [3.1502, 101.7072],
      [3.1579, 101.7123],
      [3.1626, 101.707],
    ],
  },
  {
    id: "bus-feeder-t402",
    name: "Bus Feeder T402",
    mode: "BUS",
    color: "#f97316",
    vehicleCount: 2,
    periodSeconds: 180,
    speedKph: 28,
    path: [
      [3.1502, 101.7072],
      [3.1545, 101.7064],
      [3.1579, 101.7123],
      [3.1561, 101.7182],
      [3.1512, 101.7168],
      [3.1486, 101.711],
    ],
  },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function bearing(from: [number, number], to: [number, number]) {
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLon = toRad(to[1] - from[1]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function pointAlongPath(
  path: [number, number][],
  progress: number,
): { position: [number, number]; heading: number } {
  if (path.length === 1) {
    return { position: path[0], heading: 0 };
  }
  const clamped = ((progress % 1) + 1) % 1;
  const scaled = clamped * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(scaled));
  const localT = scaled - index;
  const from = path[index];
  const to = path[index + 1];
  const position: [number, number] = [
    lerp(from[0], to[0], localT),
    lerp(from[1], to[1], localT),
  ];
  return { position, heading: bearing(from, to) };
}

export function getMockVehicles(nowMs: number = Date.now()): TransitVehicle[] {
  return LINES.flatMap((line) => {
    const base = nowMs / 1000 / line.periodSeconds;
    return Array.from({ length: line.vehicleCount }, (_, idx) => {
      const progress = base + idx / line.vehicleCount;
      const { position, heading } = pointAlongPath(line.path, progress);
      return {
        id: `${line.id}-${idx + 1}`,
        line: line.name,
        mode: line.mode,
        position,
        heading,
        speedKph: line.speedKph,
        updatedAt: new Date(nowMs).toISOString(),
        color: line.color,
      } satisfies TransitVehicle;
    });
  });
}
