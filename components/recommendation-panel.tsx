"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Navigation,
  ArrowRight,
} from "lucide-react";

interface RecommendationPanelProps {
  recommendation: {
    label: string;
    type: string;
    reason: string;
  };
  onCommit?: () => void;
  noBorder?: boolean;
  noGlass?: boolean;
}

export function RecommendationPanel({
  recommendation,
  onCommit,
  noBorder = false,
  noGlass = false,
}: RecommendationPanelProps) {
  const getIcon = () => {
    switch (recommendation.type) {
      case "success":
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case "warning":
        return <AlertCircle className="text-amber-500" size={20} />;
      case "danger":
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (recommendation.type) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "danger":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div
      className={`${
        noBorder
          ? "bg-white border-0 shadow-none"
          : noGlass
            ? `bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-2 ${getBgColor()}`
            : `glass border-2 ${getBgColor()}`
      } p-4 sm:p-5 rounded-3xl flex flex-col gap-3 group/panel`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white shadow-sm">{getIcon()}</div>
          <div className="font-black text-lg tracking-tight text-zinc-900 leading-none">
            {recommendation.label}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center bg-white shrink-0">
          <Navigation size={14} className="text-zinc-400 rotate-45" />
        </div>
      </div>

      <p className="text-xs font-medium text-zinc-500 leading-snug px-1">
        {recommendation.reason}
      </p>

      <button
        onClick={onCommit}
        className="w-full mt-4 bg-zinc-950 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
      >
        Commit to Journey
        <ArrowRight
          size={16}
          className="group-hover:translate-x-1 transition-transform"
        />
      </button>
    </div>
  );
}
