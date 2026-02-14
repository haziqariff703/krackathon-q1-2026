"use client";

import React from "react";
import {
  Sliders,
  Clock,
  Thermometer,
  User,
  Shield,
  ShieldAlert,
} from "lucide-react";

interface DemoControlsProps {
  delayMinutes: number;
  setDelayMinutes: (val: number) => void;
  heatIndex: number;
  setHeatIndex: (val: number) => void;
  walkingTime: number;
  setWalkingTime: (val: number) => void;
  safetyRisk: number;
  setSafetyRisk: (val: number) => void;
  isSheltered: boolean;
  setIsSheltered: (val: boolean) => void;
  isCompact?: boolean;
  noBorder?: boolean;
  noGlass?: boolean;
  description?: string;
}

export function DemoControls({
  delayMinutes,
  setDelayMinutes,
  heatIndex,
  setHeatIndex,
  walkingTime,
  setWalkingTime,
  safetyRisk,
  setSafetyRisk,
  isSheltered,
  setIsSheltered,
  isCompact = false,
  noBorder = false,
  noGlass = false,
  description = "Adjust assumptions to preview how delay, heat, walking time, and safety risk can change trip output.",
}: DemoControlsProps) {
  return (
    <div
      className={`${
        noBorder
          ? "bg-transparent border-0 shadow-none p-0"
          : noGlass
            ? `bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-100 ${isCompact ? "p-3 sm:p-4 gap-3" : "p-4 sm:p-5 gap-4"}`
            : `glass ${isCompact ? "p-3 sm:p-4 gap-3" : "p-4 sm:p-5 gap-4"}`
      } rounded-2xl sm:rounded-[2rem] w-full flex flex-col animate-in slide-in-from-right duration-500`}
    >
      <div
        className={`flex items-center justify-between ${isCompact ? "mb-1" : "mb-2"}`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg bg-zinc-950 text-white ${isCompact ? "scale-90" : ""}`}
          >
            <Sliders size={isCompact ? 14 : 16} />
          </div>
          <h2
            className={`font-black tracking-tight uppercase ${isCompact ? "text-xs" : "text-base"}`}
          >
            Simulation
          </h2>
        </div>

        {/* Sheltered Path Toggle */}
        <button
          onClick={() => setIsSheltered(!isSheltered)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            isSheltered
              ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
              : "bg-white text-zinc-400 border-zinc-100"
          }`}
        >
          <Shield size={isCompact ? 10 : 12} />
          <span className="text-[8px] font-black uppercase tracking-widest">
            Sheltered
          </span>
        </button>
      </div>

      <p
        className={`${isCompact ? "text-[9px]" : "text-[10px]"} text-zinc-500 italic normal-case leading-relaxed`}
      >
        {description}
      </p>

      <div className={`${isCompact ? "space-y-3" : "space-y-4"}`}>
        {/* Delay Control */}
        <div className={`${isCompact ? "space-y-1" : "space-y-2"}`}>
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-zinc-500">
              <Clock size={isCompact ? 10 : 12} />
              <span
                className={`${isCompact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-widest`}
              >
                Delay
              </span>
            </div>
            <span
              className={`${isCompact ? "text-[10px]" : "text-xs"} font-black text-zinc-950`}
            >
              {delayMinutes}m
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(parseInt(e.target.value))}
            className="w-full arus-slider"
          />
        </div>

        {/* Heat Control */}
        <div className={`${isCompact ? "space-y-1" : "space-y-2"}`}>
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-zinc-500">
              <Thermometer size={isCompact ? 10 : 12} />
              <span
                className={`${isCompact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-widest`}
              >
                Heat
              </span>
            </div>
            <span
              className={`${isCompact ? "text-[10px]" : "text-xs"} font-black text-zinc-950`}
            >
              {heatIndex}°C
            </span>
          </div>
          <input
            type="range"
            min="25"
            max="45"
            step="1"
            value={heatIndex}
            onChange={(e) => setHeatIndex(parseInt(e.target.value))}
            className="w-full arus-slider"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Walking Time Control */}
          <div className={`${isCompact ? "space-y-1" : "space-y-2"}`}>
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-zinc-500">
                <User size={isCompact ? 10 : 12} />
                <span
                  className={`${isCompact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-widest`}
                >
                  Walk
                </span>
              </div>
              <span
                className={`${isCompact ? "text-[10px]" : "text-xs"} font-black text-zinc-950`}
              >
                {walkingTime}m
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={walkingTime}
              onChange={(e) => setWalkingTime(parseInt(e.target.value))}
              className="w-full arus-slider"
            />
          </div>

          {/* Safety Risk Control */}
          <div className={`${isCompact ? "space-y-1" : "space-y-2"}`}>
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-zinc-500">
                <ShieldAlert size={isCompact ? 10 : 12} />
                <span
                  className={`${isCompact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-widest`}
                >
                  Risk
                </span>
              </div>
              <span
                className={`${isCompact ? "text-[10px]" : "text-xs"} font-black text-zinc-950`}
              >
                {safetyRisk}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={safetyRisk}
              onChange={(e) => setSafetyRisk(parseInt(e.target.value))}
              className="w-full arus-slider"
            />
          </div>
        </div>
      </div>

      <div className={`${isCompact ? "pt-0.5" : "pt-1"}`}>
        <p
          className={`${isCompact ? "text-[7px]" : "text-[8px]"} font-bold text-zinc-400 leading-tight uppercase tracking-widest opacity-60`}
        >
          Rocket Effect Engine Active
        </p>
      </div>
    </div>
  );
}
