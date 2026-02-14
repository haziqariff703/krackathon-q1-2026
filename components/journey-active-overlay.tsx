"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Navigation, Clock, Zap } from "lucide-react";

interface JourneyActiveOverlayProps {
  onFinish: () => void;
  destination: string;
  metrics: {
    reliabilityScore: number;
    stressScore: number;
  };
}

export function JourneyActiveOverlay({
  onFinish,
  destination,
  metrics,
}: JourneyActiveOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-3000 flex items-end sm:items-center justify-center p-4 sm:p-6 pointer-events-none">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] animate-in fade-in duration-500" />

      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/20 p-6 sm:p-8 pointer-events-auto animate-in slide-in-from-bottom duration-700 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white animate-pulse">
              <Navigation size={20} className="rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 leading-none">
                Journey In Progress
              </span>
              <h2 className="text-xl font-black text-zinc-950 italic uppercase tracking-tighter">
                Heading to {destination}
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Elapsed
            </span>
            <span className="text-xl font-mono font-black text-zinc-950">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col gap-1 border border-zinc-100">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Zap size={10} className="text-amber-500" />
              Live Reliability
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-950">
                {Math.round(metrics.reliabilityScore * 100)}
              </span>
              <span className="text-[10px] font-black text-zinc-400">%</span>
            </div>
          </div>
          <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col gap-1 border border-zinc-100">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Clock size={10} className="text-indigo-500" />
              Stress Buffered
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-950">
                {Math.round(100 - metrics.stressScore)}
              </span>
              <span className="text-[10px] font-black text-zinc-400">PTS</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50 text-[11px] font-medium text-emerald-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Currently tracking optimal path for heat avoidance.
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed px-1">
            Stay on high-impact routes to maximize your community reliability
            score and reduce overall urban stress.
          </p>
        </div>

        <button
          onClick={onFinish}
          className="w-full bg-zinc-950 text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group"
        >
          Arrival Confirmed
          <CheckCircle2
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}
