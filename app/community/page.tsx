"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Users,
  Flame,
  MapPin,
  Share2,
  ArrowBigUp,
  TrendingUp,
  AlertTriangle,
  Zap,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useLiveReports } from "@/hooks/use-live-reports";
import { useLiveImpact } from "@/hooks/use-live-impact";
import { useSystemStats } from "@/hooks/use-system-stats";
import { ImpactStats } from "@/components/impact-stats";

type IncidentFilter = "all" | "safety" | "transit" | "heat";

export default function CommunityPage() {
  const { reports, loading, upvoteReport } = useLiveReports();
  const liveImpact = useLiveImpact();
  const { stats: systemStats, loading: statsLoading } = useSystemStats();
  const PAGE_SIZE_OPTIONS = [6, 12, 24];
  const INCIDENT_FILTERS: IncidentFilter[] = [
    "all",
    "safety",
    "transit",
    "heat",
  ];
  const [pageSize, setPageSize] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<IncidentFilter>("all");
  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const savedVotes = localStorage.getItem("arus_votes");
      return savedVotes ? new Set(JSON.parse(savedVotes)) : new Set();
    }
    return new Set();
  });

  const handleUpvote = async (id: string) => {
    if (votedIds.has(id)) return;

    const res = await upvoteReport(id);
    if (res.success) {
      const newVotedIds = new Set([...votedIds, id]);
      setVotedIds(newVotedIds);
      localStorage.setItem(
        "arus_votes",
        JSON.stringify(Array.from(newVotedIds)),
      );
      toast.success("Community upvote recorded!");
    } else {
      toast.error(res.message || "Failed to upvote");
    }
  };

  const aggregateStats = useMemo(() => {
    const reportUpvoteScore = reports.reduce(
      (acc, report) => acc + Number(report.upvotes || 0),
      0,
    );
    const backendScore =
      liveImpact.impact.communityImpactScore +
      systemStats.totalUpvotes +
      systemStats.totalSimulations;

    return {
      minutesSaved: Math.round(liveImpact.impact.minutesSaved),
      heatAvoided: Math.round(liveImpact.impact.heatMinutesAvoided),
      communityScore: Math.max(backendScore, reportUpvoteScore),
    };
  }, [liveImpact, reports, systemStats]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const upvoteDiff = Number(b.upvotes || 0) - Number(a.upvotes || 0);
        if (upvoteDiff !== 0) return upvoteDiff;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }),
    [reports],
  );

  const filteredReports = useMemo(
    () =>
      activeFilter === "all"
        ? sortedReports
        : sortedReports.filter((report) => report.type === activeFilter),
    [activeFilter, sortedReports],
  );

  const trending = filteredReports.length > 0 ? filteredReports[0] : null;
  const feedReports = trending
    ? filteredReports.filter((report) => report.id !== trending.id)
    : filteredReports;
  const totalPages = Math.max(1, Math.ceil(feedReports.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFeedReports = feedReports.slice(
    startIndex,
    startIndex + pageSize,
  );
  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) items.push("ellipsis-left");
    for (let page = windowStart; page <= windowEnd; page += 1) {
      items.push(page);
    }
    if (windowEnd < totalPages - 1) items.push("ellipsis-right");
    items.push(totalPages);

    return items;
  }, [currentPage, totalPages]);

  const isLiveLoading = loading || liveImpact.loading || statsLoading;

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, activeFilter]);

  return (
    <DashboardShell>
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-4 pt-24 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-12 pb-32 uppercase tracking-tighter">
          {/* Header */}
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-700">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <Users size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 italic uppercase tracking-tighter">
                Community Portal
              </h1>
            </div>
            <p className="text-zinc-500 text-base sm:text-lg font-medium max-w-2xl">
              The aggregate intelligence of thousands of commuters, helping each
              other navigate Kuala Lumpur via the ARUS data-mesh.
            </p>
          </div>

          <ImpactStats
            totalMinutesSaved={aggregateStats.minutesSaved}
            totalHeatAvoided={aggregateStats.heatAvoided}
            communityScore={aggregateStats.communityScore}
          />

          {isLiveLoading && reports.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-zinc-100 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                Syncing with Live Feed...
              </p>
            </div>
          ) : sortedReports.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">
                  Filter Incident Type
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {INCIDENT_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeFilter === filter
                          ? "bg-zinc-950 border-zinc-950 text-white"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {trending ? (
                <>
                  {/* Featured Contribution */}
                  <div className="glass p-6 sm:p-10 rounded-3xl sm:rounded-[4rem] border-2 border-amber-500/10 bg-amber-500/2 flex flex-col md:flex-row items-center gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Flame size={200} />
                    </div>

                    <div className="flex-1 space-y-6 relative z-10">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Flame size={20} fill="currentColor" />
                        <span className="font-black uppercase tracking-widest text-xs">
                          Trending Insight
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                        {trending.title}
                      </h2>
                      <p className="text-zinc-500 font-medium italic">
                        &ldquo;{trending.description}&rdquo;
                      </p>

                      {/* Tags display */}
                      {trending.tags && trending.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {trending.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200"
                            >
                              #{tag.replace(/\s/g, "")}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <button className="bg-zinc-950 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-zinc-950/20 uppercase tracking-widest text-[10px]">
                          <Share2 size={16} />
                          Verify Insight
                        </button>
                        {trending.image_url && (
                          <a
                            href={trending.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border-2 border-zinc-100 text-zinc-950 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all uppercase tracking-widest text-[10px]"
                          >
                            <Camera size={16} />
                            View Evidence
                          </a>
                        )}
                        <button
                          onClick={() => handleUpvote(trending.id)}
                          disabled={votedIds.has(trending.id)}
                          className={`px-6 py-3 sm:py-4 rounded-2xl font-bold flex items-center gap-2 border-2 transition-all ${
                            votedIds.has(trending.id)
                              ? "bg-amber-100 border-amber-200 text-amber-600"
                              : "bg-white border-zinc-100 text-zinc-950 hover:bg-zinc-50 shadow-sm"
                          }`}
                        >
                          <ArrowBigUp
                            size={20}
                            fill={
                              votedIds.has(trending.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                          <span className="text-lg font-black">
                            {trending.upvotes}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-64 aspect-square rounded-2xl sm:rounded-[3rem] bg-amber-50/50 border-4 border-white shadow-2xl flex items-center justify-center relative z-10">
                      <div className="flex flex-col items-center gap-2 text-amber-600">
                        {trending.type === "heat" ? (
                          <Flame size={48} />
                        ) : trending.type === "safety" ? (
                          <Zap size={48} />
                        ) : (
                          <AlertTriangle size={48} />
                        )}
                        <span className="font-black text-[10px] uppercase">
                          {trending.type} Area
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Other Contributions */}
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">
                        Live Incident Feed
                      </h3>
                      <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                        <TrendingUp size={12} />
                        Active Mesh
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginatedFeedReports.map((item) => (
                        <div
                          key={item.id}
                          className="glass p-6 rounded-[2rem] border-2 border-zinc-100 flex flex-col justify-between gap-6"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                {new Date(item.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              <div
                                className={`w-2 h-2 rounded-full animate-pulse ${
                                  item.type === "heat"
                                    ? "bg-red-500"
                                    : item.type === "safety"
                                      ? "bg-indigo-500"
                                      : "bg-orange-500"
                                }`}
                              />
                            </div>
                            <h4 className="font-black text-lg text-zinc-950 leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                              &ldquo;{item.description}&rdquo;
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[8px] font-bold uppercase tracking-widest border border-zinc-200/50"
                                  >
                                    #{tag.replace(/\s/g, "")}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {item.image_url && (
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 text-center text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
                              >
                                <Camera size={12} className="inline mr-1" />{" "}
                                View Evidence
                              </a>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                              <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-zinc-400" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  {item.type} Vector
                                </span>
                              </div>
                              <button
                                onClick={() => handleUpvote(item.id)}
                                disabled={votedIds.has(item.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                                  votedIds.has(item.id)
                                    ? "bg-amber-100 border-amber-200 text-amber-600 shadow-sm shadow-amber-500/10"
                                    : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-950 hover:border-zinc-200"
                                }`}
                              >
                                <ArrowBigUp
                                  size={16}
                                  fill={
                                    votedIds.has(item.id)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                                <span className="text-xs font-black">
                                  {item.upvotes}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {feedReports.length > pageSize && (
                      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                          >
                            First
                          </button>
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                          >
                            Previous
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {pageItems.map((item, index) =>
                            typeof item === "number" ? (
                              <button
                                key={`page-${item}`}
                                onClick={() => setCurrentPage(item)}
                                className={`min-w-8 px-2 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                                  currentPage === item
                                    ? "bg-zinc-950 border-zinc-950 text-white"
                                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                }`}
                              >
                                {item}
                              </button>
                            ) : (
                              <span
                                key={`ellipsis-${index}`}
                                className="px-1 text-zinc-400 text-xs font-black"
                              >
                                ...
                              </span>
                            ),
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Rows
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) =>
                              setPageSize(Number(e.target.value))
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-700"
                          >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {startIndex + 1}-
                            {Math.min(
                              startIndex + pageSize,
                              feedReports.length,
                            )}{" "}
                            / {feedReports.length}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1),
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                          >
                            Next
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 glass rounded-[3rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center gap-4">
                  <AlertTriangle size={40} className="text-zinc-300" />
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-zinc-950 uppercase tracking-tighter">
                      No {activeFilter} Incidents
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">
                      Try switching filter to view other live reports.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 glass rounded-[3rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center gap-4">
              <AlertTriangle size={48} className="text-zinc-300" />
              <div className="space-y-1">
                <h3 className="font-black text-xl text-zinc-950 uppercase tracking-tighter">
                  Mesh Idle
                </h3>
                <p className="text-sm text-zinc-500 font-medium">
                  No live community reports found in your current vector.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
