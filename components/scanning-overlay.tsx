"use client";

import React from "react";
import { Zap } from "lucide-react";

export function ScanningOverlay() {
  return (
    <div className="fixed inset-0 z-[3000] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Dark tint backdrop */}
      <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px]" />

      {/* Scanning Laser Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan-y opacity-80" />

      {/* Grid Pulse */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(52,211,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse-slow" />

      {/* Central Status Node */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-emerald-400 shadow-2xl border border-emerald-500/30">
          <Zap className="animate-pulse" size={32} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-black text-white uppercase tracking-[0.2em] italic drop-shadow-lg">
            Analyzing Spatial Data
          </div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest opacity-80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Calculating Community Stress
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-y {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .animate-scan-y {
          animation: scan-y 2.5s linear infinite;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
