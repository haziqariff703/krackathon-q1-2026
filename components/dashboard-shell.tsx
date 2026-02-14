"use client";

import React from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import * as lucide from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true); // Default to collapsed for "Map First"
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Sidebar Overlay - Desktop Only */}
      <aside
        className={`fixed left-4 top-4 bottom-4 z-70 flex-col pointer-events-none transition-all duration-500 ease-in-out hidden md:flex ${
          isCollapsed
            ? "w-0 opacity-0 -translate-x-full"
            : "w-64 opacity-100 translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-2xl border border-zinc-200/50 overflow-hidden pointer-events-auto">
          <div className="p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  A
                </div>
                <div className="font-black text-xl tracking-tighter text-zinc-950 uppercase italic">
                  Arus
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-colors"
                title="Hide Menu"
              >
                <lucide.X size={20} />
              </button>
            </div>

            <div className="flex-1">
              <SidebarNav isCollapsed={false} />
            </div>

            <div className="mt-auto pt-6 opacity-40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-2 w-16 bg-zinc-100 rounded-full mb-1" />
                  <div className="h-1.5 w-10 bg-zinc-50 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Floating Menu Trigger (Google-style Search/Menu) */}
      <div className="fixed top-6 left-6 z-65 hidden md:flex items-center gap-3 group pointer-events-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-xl border border-zinc-200 hover:border-zinc-300 transition-all pointer-events-auto group-hover:scale-105 active:scale-95 ${
            !isCollapsed
              ? "opacity-0 -translate-x-5 pointer-events-none"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white text-sm font-black italic">
            A
          </div>
          <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-950 transition-colors">
            Explore Arus
          </span>
          <lucide.Menu size={18} className="text-zinc-400 ml-4" />
        </button>
      </div>

      {/* Main Content Area (Full Bleed) */}
      <main className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header (Floating) */}
        <header className="md:hidden absolute top-4 left-4 right-4 z-90 flex items-center justify-between p-2 pl-3 glass-heavy rounded-full border-white/20 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-bold text-xs italic">
              A
            </div>
            <div className="font-bold text-sm tracking-tight italic uppercase">
              Arus
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-full bg-zinc-950 text-white shadow-lg active:scale-90 transition-transform"
          >
            <lucide.Menu size={16} />
          </button>
        </header>

        {/* Mobile Sidebar/Menu Drawer */}
        <div
          className={`fixed inset-0 z-1000 transition-opacity duration-300 md:hidden ${
            showMobileMenu
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer */}
          <div
            className={`absolute top-4 left-4 bottom-4 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-zinc-200/50 p-8 flex flex-col transition-transform duration-500 ease-out ${
              showMobileMenu ? "translate-x-0" : "-translate-x-[110%]"
            }`}
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  A
                </div>
                <div className="font-black text-xl tracking-tighter text-zinc-950 uppercase italic">
                  Arus
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-colors"
              >
                <lucide.X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarNav isCollapsed={false} />
            </div>

            <div className="mt-auto pt-6 opacity-40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-2 w-16 bg-zinc-100 rounded-full mb-1" />
                  <div className="h-1.5 w-10 bg-zinc-50 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* content container */}
        <div className="flex-1 relative w-full h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
