"use client";

import { useEffect, useState } from "react";
import type { TransitVehicle } from "@/types";
import { getMockVehicles } from "@/utils/mock-vehicles";

const REFRESH_MS = 2500;

export function useLiveVehicles() {
  const [vehicles, setVehicles] = useState<TransitVehicle[]>(() =>
    getMockVehicles(Date.now()),
  );

  useEffect(() => {
    const tick = () => setVehicles(getMockVehicles(Date.now()));
    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return { vehicles };
}
