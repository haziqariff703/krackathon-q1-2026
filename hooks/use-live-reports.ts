"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

export interface IncidentReport {
  id: string;
  created_at: string;
  type: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  upvotes: number;
  tags?: string[];
  image_url?: string;
}

export function useLiveReports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data, error }, upvoteRowsRes] = await Promise.all([
        supabase
          .from("incident_reports")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("report_upvotes").select("report_id"),
      ]);

      if (error) throw error;

      const upvoteCounts = new Map<string, number>();
      if (!upvoteRowsRes.error && Array.isArray(upvoteRowsRes.data)) {
        for (const row of upvoteRowsRes.data as Array<{ report_id: string }>) {
          if (!row?.report_id) continue;
          upvoteCounts.set(
            row.report_id,
            Number(upvoteCounts.get(row.report_id) || 0) + 1,
          );
        }
      }

      const parsedReports = (data || []).map((report: any) => {
        let lat = 0;
        let lng = 0;

        if (
          typeof report.location === "string" &&
          report.location.includes("POINT")
        ) {
          const coords = report.location
            .replace("POINT(", "")
            .replace(")", "")
            .split(" ");
          lng = parseFloat(coords[0]);
          lat = parseFloat(coords[1]);
        }

        return {
          ...report,
          upvotes: Math.max(
            Number(report.upvotes ?? 0),
            Number(upvoteCounts.get(report.id) ?? 0),
          ),
          lat,
          lng,
        } as IncidentReport;
      });

      setReports(parsedReports);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getAnonymousVoterId = () => {
    if (typeof window === "undefined") return null;

    const storageKey = "arus_voter_id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "00000000-0000-4000-8000-000000000000";

    window.localStorage.setItem(storageKey, generated);
    return generated;
  };

  const upvoteReport = async (reportId: string, userId?: string) => {
    try {
      const voterId = userId ?? getAnonymousVoterId();
      if (!voterId) {
        return { success: false, message: "Unable to identify voter session." };
      }

      const { error } = await supabase
        .from("report_upvotes")
        .insert([{ report_id: reportId, user_id: voterId }]);

      if (error) {
        if (error.code === "23505") {
          // Unique violation
          return { success: false, message: "Already upvoted" };
        }
        if (error.code === "42501") {
          return {
            success: false,
            message: "Upvote blocked by database policy (RLS).",
          };
        }
        throw error;
      }
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? { ...report, upvotes: Number(report.upvotes || 0) + 1 }
            : report,
        ),
      );
      return { success: true };
    } catch (err) {
      if (err && typeof err === "object") {
        const e = err as {
          message?: string;
          code?: string;
          details?: string;
          hint?: string;
        };
        console.error("Upvote failed:", {
          message: e.message,
          code: e.code,
          details: e.details,
          hint: e.hint,
        });
      } else {
        console.error("Upvote failed:", err);
      }
      return { success: false, message: "Failed to upvote" };
    }
  };

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("public:incident_reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_reports" },
        () => fetchReports(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_upvotes" },
        () => fetchReports(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports, supabase]);

  return { reports, loading, refresh: fetchReports, upvoteReport };
}
