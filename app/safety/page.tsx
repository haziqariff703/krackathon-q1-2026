"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Eye,
  Plus,
  Loader2,
} from "lucide-react";
import { MapView } from "@/components/map/map-view";
import { ReportForm } from "@/components/report-form";
import { useMetrics } from "@/hooks/metrics-context";
import { createClient } from "@/utils/supabase/client";

interface Report {
  id: string;
  title: string;
  area: string;
  created_at: string;
}

export default function SafetyPage() {
  const { metrics, heatIndex } = useMetrics();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchReports = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("incident_reports")
        .select("id,title,description,created_at")
        .eq("type", "safety")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error(
          "Supabase Error [fetching reports]:",
          error.message,
          error.details,
          error.hint,
        );
        throw error;
      }
      const normalized: Report[] = (data || []).map(
        (item: {
          id: string;
          title: string;
          description?: string;
          created_at: string;
        }) => ({
          id: item.id,
          title: item.title,
          area: item.description || "Unknown area",
          created_at: item.created_at,
        }),
      );
      setReports(normalized);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        console.error(
          "General Error [fetching reports]:",
          (err as { message: string }).message,
        );
      } else {
        console.error("General Error [fetching reports]:", err);
      }
      // Fallback to local demo values if fetch fails
      setReports([
        {
          id: "1",
          title: "Poor Lighting",
          area: "Brickfields",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Uneven Pavement",
          area: "KLCC Area",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const riskZones = new Set(reports.map((r) => r.area)).size;
  const watcherDensity = reports.length * 12; // Simulated multiplier

  return (
    <DashboardShell>
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* Spatial Layer */}
        <div className="absolute inset-0 z-0 opacity-40 grayscale pointer-events-none">
          <MapView metrics={{ ...metrics, heatIndex }} />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex-1 p-4 pt-24 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-12 pb-32">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-in fade-in slide-in-from-top duration-700">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                    <Shield size={24} />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-950">
                    Safety Engine
                  </h1>
                </div>
                <p className="text-zinc-500 text-base sm:text-lg font-medium max-w-2xl">
                  Spatial risk assessment and community-reported incident
                  mapping.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-950 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-zinc-950/20 shrink-0"
              >
                <Plus size={20} />
                Report Friction
              </button>
            </div>

            {/* Risk Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border-2 border-red-500/10 space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">
                    High Risk Zones
                  </span>
                </div>
                <div className="text-5xl font-black tracking-tighter">
                  {loading ? "..." : riskZones.toString().padStart(2, "0")}
                </div>
                <p className="text-zinc-400 text-sm font-medium">
                  Areas with reported friction in the last 24 hours.
                </p>
              </div>

              <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border-2 border-zinc-100 space-y-4">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Eye size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">
                    Watcher Density
                  </span>
                </div>
                <div className="text-5xl font-black tracking-tighter text-zinc-950">
                  {loading ? "..." : watcherDensity}
                </div>
                <p className="text-zinc-400 text-sm font-medium">
                  Community members active in high-risk zones.
                </p>
              </div>
            </div>

            {/* Recent Incidents List */}
            <div className="glass overflow-hidden rounded-2xl sm:rounded-[3rem] border-2 border-zinc-100 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <div className="p-4 sm:p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500">
                  Recent Safety Reports
                </h3>
                {loading && (
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                )}
              </div>
              <div className="divide-y divide-zinc-100">
                {reports.length === 0 && !loading ? (
                  <div className="p-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                    No reports found. All paths clear.
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 sm:p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950">
                            {report.title}
                          </div>
                          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                            {report.area}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-zinc-400">
                        {new Date(report.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md pointer-events-auto">
            <ReportForm
              onClose={() => {
                setIsModalOpen(false);
                fetchReports();
              }}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
