"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isGood: boolean;
  };
  variant?: "default" | "stress" | "reliability";
  stressLevel?: number; // 0-100
  noGlass?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  variant = "default",
  stressLevel,
  noGlass = false,
}: MetricCardProps) {
  const getStressColor = (level?: number) => {
    if (level === undefined) return "text-zinc-400";
    if (level < 30) return "text-[var(--arus-safe)]";
    if (level < 70) return "text-[var(--arus-warning)]";
    return "text-[var(--arus-danger)]";
  };

  return (
    <div
      className={`${
        noGlass
          ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-100"
          : "glass"
      } p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] flex flex-col gap-3 group hover:scale-[1.02] transition-all duration-500`}
    >
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-2xl bg-zinc-100 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors duration-300">
          <Icon size={18} />
        </div>
        {trend && (
          <div
            className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.isGood ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-black tracking-tight ${variant === "stress" ? getStressColor(stressLevel) : "text-zinc-900"}`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs font-bold text-zinc-400">{unit}</span>
          )}
        </div>
      </div>

      {variant === "stress" && stressLevel !== undefined && (
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1">
          <div
            className="h-full transition-all duration-1000 ease-out"
            style={{
              width: `${stressLevel}%`,
              backgroundColor: `var(${stressLevel < 30 ? "--arus-safe" : stressLevel < 70 ? "--arus-warning" : "--arus-danger"})`,
            }}
          />
        </div>
      )}
    </div>
  );
}
