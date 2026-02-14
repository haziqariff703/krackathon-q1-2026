"use client";

import React from "react";
import { Clock, Flame, Zap, TrendingUp } from "lucide-react";

interface ImpactStatsProps {
  totalMinutesSaved: number;
  totalHeatAvoided: number;
  communityScore: number;
}

export function ImpactStats({
  totalMinutesSaved,
  totalHeatAvoided,
  communityScore,
}: ImpactStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
      <div className="glass p-6 rounded-[2.5rem] border-2 border-emerald-500/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
            <Clock size={20} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            +12% vs last week
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-zinc-950 tracking-tighter">
            {totalMinutesSaved.toLocaleString()}m
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Collective Delay Offset
          </div>
        </div>
        <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-3/4 animate-pulse" />
        </div>
      </div>

      <div className="glass p-6 rounded-[2.5rem] border-2 border-orange-500/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Flame size={20} />
          </div>
          <TrendingUp size={16} className="text-orange-400" />
        </div>
        <div>
          <div className="text-3xl font-black text-zinc-950 tracking-tighter">
            {totalHeatAvoided.toLocaleString()}°C
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Heat Exposure Mitigated
          </div>
        </div>
        <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 w-1/2" />
        </div>
      </div>

      <div className="glass p-6 rounded-[2.5rem] border-2 border-indigo-500/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
            <Zap size={20} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
            Active Mesh
          </div>
        </div>
        <div>
          <div className="text-3xl font-black text-zinc-950 tracking-tighter">
            {communityScore.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Network Utility Score
          </div>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-zinc-400 shadow-sm"
            >
              {String.fromCharCode(64 + i)}
            </div>
          ))}
          <div className="w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-600 shadow-sm">
            +1k
          </div>
        </div>
      </div>
    </div>
  );
}
