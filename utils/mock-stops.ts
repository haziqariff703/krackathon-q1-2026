type RawStop = {
  id: string;
  name: string;
  lines: string[];
  reliability: number;
  latitude: number;
  longitude: number;
};

type NearbyStop = RawStop & {
  distance_meters: number;
};

const MOCK_STOPS: RawStop[] = [
  {
    id: "stop-bukit-bintang",
    name: "Bukit Bintang MRT",
    lines: ["Kajang Line", "Bus Feeder T402"],
    reliability: 0.98,
    latitude: 3.1478,
    longitude: 101.7117,
  },
  {
    id: "stop-kl-sentral",
    name: "KL Sentral",
    lines: ["LRT Kelana Jaya", "KLIA Express", "MRT Kajang"],
    reliability: 0.85,
    latitude: 3.1342,
    longitude: 101.6865,
  },
  {
    id: "stop-klcc",
    name: "KLCC",
    lines: ["LRT Kelana Jaya", "Bus Feeder T402"],
    reliability: 0.92,
    latitude: 3.1553,
    longitude: 101.7131,
  },
  {
    id: "stop-pasar-seni",
    name: "Pasar Seni",
    lines: ["Kajang Line", "LRT Kelana Jaya"],
    reliability: 0.72,
    latitude: 3.1425,
    longitude: 101.6953,
  },
  {
    id: "stop-trx",
    name: "TRX",
    lines: ["MRT Kajang", "MRT Putrajaya", "Bus Feeder T301"],
    reliability: 0.94,
    latitude: 3.1429,
    longitude: 101.7188,
  },
  {
    id: "stop-muzium-negara",
    name: "Muzium Negara",
    lines: ["MRT Kajang", "Bus Feeder T407"],
    reliability: 0.78,
    latitude: 3.1363,
    longitude: 101.6886,
  },
  {
    id: "stop-masjid-jamek",
    name: "Masjid Jamek",
    lines: ["LRT Ampang", "LRT Kelana Jaya", "Bus Feeder T300"],
    reliability: 0.88,
    latitude: 3.1506,
    longitude: 101.6962,
  },
  {
    id: "stop-titiwangsa",
    name: "Titiwangsa",
    lines: ["LRT Ampang", "Monorail", "Bus Feeder T410"],
    reliability: 0.81,
    latitude: 3.1749,
    longitude: 101.7085,
  },
  {
    id: "stop-imbi",
    name: "Imbi",
    lines: ["Monorail", "Bus Feeder T401"],
    reliability: 0.7,
    latitude: 3.1471,
    longitude: 101.7106,
  },
  {
    id: "stop-cochrane",
    name: "Cochrane",
    lines: ["MRT Kajang", "Bus Feeder T301"],
    reliability: 0.75,
    latitude: 3.1389,
    longitude: 101.7209,
  },
];

export const MOCK_STOP_OPTIONS = Array.from(
  new Set(MOCK_STOPS.map((stop) => stop.name)),
);

const toRad = (value: number) => (value * Math.PI) / 180;

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
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
}

export function getMockNearbyStops(
  lat: number,
  lng: number,
  radiusMeters: number = 2000,
): NearbyStop[] {
  return MOCK_STOPS.map((stop) => ({
    ...stop,
    distance_meters: haversineMeters(
      lat,
      lng,
      stop.latitude,
      stop.longitude,
    ),
  }))
    .filter((stop) => stop.distance_meters <= radiusMeters)
    .sort((a, b) => a.distance_meters - b.distance_meters);
}
