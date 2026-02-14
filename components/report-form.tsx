"use client";

import React, { useState, useMemo } from "react";
import {
  Send,
  AlertTriangle,
  ShieldCheck,
  X,
  Camera,
  Tag,
  Users,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ReportFormProps {
  onClose: () => void;
  location?: [number, number];
}

const CATEGORY_TAGS: Record<string, string[]> = {
  transit: ["Late Arrival", "Full Bus", "Skipped Stop", "Route Mismatch"],
  heat: ["Broken AC", "No Shade", "Hot Shelter", "High UV"],
  safety: ["No Lighting", "Slippery Path", "Obstruction", "Blind Spot"],
};

export function ReportForm({ onClose, location }: ReportFormProps) {
  const [category, setCategory] = useState("transit");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const supabase = createClient();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Mock impact calculation: 15 commuters per report + bonus for tags/location
  const estimatedImpact = useMemo(() => {
    let base = 15;
    if (selectedTags.length > 0) base += selectedTags.length * 8;
    if (content.length > 30) base += 10;
    return base;
  }, [selectedTags, content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      let finalImageUrl = "";

      // 1. Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("category", category);

        const uploadRes = await fetch("/api/reports/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.message || "Upload failed");
        }
        finalImageUrl = uploadData.url;
      }

      // 2. Insert report
      const pointString = location
        ? `POINT(${location[1]} ${location[0]})`
        : `POINT(101.7117 3.1478)`;

      const { error } = await supabase.from("incident_reports").insert([
        {
          type: category,
          title: `${category.toUpperCase()} Report`,
          description: content,
          location: pointString,
          tags: selectedTags,
          image_url: finalImageUrl || null,
        },
      ]);

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Report submission failed:", err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] w-full max-w-md animate-in fade-in zoom-in duration-300 pointer-events-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <AlertTriangle size={20} />
          </div>
          <h2 className="font-black text-xl tracking-tight uppercase italic">
            Data Diode Report
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X size={20} className="text-zinc-400" />
        </button>
      </div>

      {status === "success" ? (
        <div className="py-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
            <ShieldCheck size={32} />
          </div>
          <div className="font-bold text-lg">Report Transmitted</div>
          <p className="text-sm text-zinc-500">
            Your community observation has been live-synced to the ARUS network.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Category Selector */}
          <div className="flex bg-zinc-100 p-1 rounded-2xl">
            {["transit", "heat", "safety"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setSelectedTags([]);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  category === cat
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tags / Sub-Categories */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Tag size={10} /> Friction Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS[category].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border-2 ${
                    selectedTags.includes(tag)
                      ? "bg-zinc-950 border-zinc-950 text-white"
                      : "bg-white border-zinc-100 text-zinc-500"
                  }`}
                >
                  #{tag.replace(/\s/g, "")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
              Describe Friction
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="E.g. Bus T402 skipped stop, or excessive heat at shelter..."
              className="w-full h-24 bg-white/50 border-2 border-transparent focus:border-zinc-950 rounded-2xl p-4 text-sm font-medium transition-all resize-none"
              required
            />
          </div>

          {/* Categorized Image Evidence */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Camera size={10} /> Photo Evidence (Optional)
            </label>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center p-4">
                  <UploadCloud size={24} className="text-zinc-400 mb-1" />
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                    Tap to select or drop image
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                />
              </label>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden border-2 border-zinc-100 bg-white">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-zinc-950 truncate uppercase tracking-tighter">
                      {selectedFile.name}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for{" "}
                      {category}/
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <p className="px-1 text-[8px] text-zinc-400 uppercase font-black tracking-widest">
              Images are auto-filtered into{" "}
              <span className="text-zinc-600 font-bold">{category}/</span>{" "}
              storage.
            </p>
          </div>

          {/* Impact Preview Card */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Network Reach
                </div>
                <div className="text-xl font-black text-emerald-700 leading-none">
                  ~{estimatedImpact} Commuters
                </div>
              </div>
            </div>
            <div className="text-[8px] max-w-20 text-emerald-500 font-bold uppercase text-right leading-tight">
              Projected real-time benefit
            </div>
          </div>

          {status === "error" && (
            <div className="text-xs font-bold text-red-500 text-center px-1">
              Submission failed. Database may need migration.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-950 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 group transition-all active:scale-95 shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>
                  {selectedFile ? "Uploading & Syncing..." : "Transmitting..."}
                </span>
              </>
            ) : (
              "Submit Community Report"
            )}
            {!isSubmitting && (
              <Send
                size={18}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
