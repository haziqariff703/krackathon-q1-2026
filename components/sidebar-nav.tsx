"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Shield, BarChart3, Users } from "lucide-react";

export function SidebarNav({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname();

  const items = [
    { icon: Map, label: "Commute", href: "/" },
    { icon: BarChart3, label: "Impact", href: "/impact" },
    { icon: Shield, label: "Safety", href: "/safety" },
    { icon: Users, label: "Community", href: "/community" },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {!isCollapsed && (
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-3 mb-2 animate-in fade-in duration-500">
          Main Menu
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-xl transition-all duration-200 group ${
              isCollapsed ? "p-3 justify-center" : "gap-3 px-3 py-2.5"
            } ${
              isActive
                ? "bg-zinc-950 text-white shadow-lg translate-x-1"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className="shrink-0"
            />
            {!isCollapsed && (
              <span
                className={`text-sm font-bold animate-in fade-in slide-in-from-left-1 duration-300 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-950"}`}
              >
                {item.label}
              </span>
            )}
            {!isCollapsed && isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
