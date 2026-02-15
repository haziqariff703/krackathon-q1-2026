"use client";

import React from "react";
import { Clock, Flame, Zap, TrendingUp } from "lucide-react";

interface ImpactStatsProps {
  totalMinutesSaved: number;
  totalHeatAvoided: number;
  communityScore: number;
  delayDescription?: string;
  heatDescription?: string;
  communityDescription?: string;
}

export function ImpactStats({
  totalMinutesSaved,
  totalHeatAvoided,
  communityScore,
  delayDescription = "Estimated commuter minutes recovered from route coordination and live transit signals.",
  heatDescription = "Estimated outdoor heat exposure minutes avoided through shaded or validated safer paths.",
  communityDescription = "Composite utility score from simulations, community contributions, and verified upvotes.",
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
          <p className="text-[10px] text-zinc-500 font-medium mt-2 leading-relaxed normal-case tracking-normal">
            {delayDescription}
          </p>
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
            {totalHeatAvoided.toLocaleString()}m
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Heat Exposure Mitigated
          </div>
          <p className="text-[10px] text-zinc-500 font-medium mt-2 leading-relaxed normal-case tracking-normal">
            {heatDescription}
          </p>
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
          <p className="text-[10px] text-zinc-500 font-medium mt-2 leading-relaxed normal-case tracking-normal">
            {communityDescription}
          </p>
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
