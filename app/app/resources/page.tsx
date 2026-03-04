"use client";

import { useState, useEffect } from "react";
import type { ResourceEntry } from "../lib/types";

const TYPE_FILTERS = ["All", "Book", "Essay", "Article", "Video", "Podcast"] as const;

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-zinc-700 text-zinc-300",
  reading: "bg-amber-900/60 text-amber-300",
  done: "bg-emerald-900/60 text-emerald-300",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch resources");
        return res.json();
      })
      .then(setResources)
      .catch((err) => console.error("Failed to load resources:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? resources
      : resources.filter((r) => r.type.toLowerCase() === filter.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold">Resources</h1>
            <span className="text-sm text-zinc-500">{filtered.length} items</span>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filter === t
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <p className="text-zinc-400 text-sm">
                {resources.length === 0
                  ? "No resources yet. Add them to resources.csv."
                  : "No resources match this filter."}
              </p>
            </div>
          )}

          {filtered.map((r, i) => (
            <div
              key={`${r.title}-${i}`}
              className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-zinc-100 font-medium">{r.title}</h2>
                  {r.author && (
                    <p className="text-sm text-zinc-400">{r.author}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${
                    STATUS_COLORS[r.status] || "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="flex gap-2">
                {r.type && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-900/40 text-blue-300">
                    {r.type}
                  </span>
                )}
                {r.domain && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/40 text-purple-300">
                    {r.domain}
                  </span>
                )}
              </div>
              {r.notes && (
                <p className="text-sm text-zinc-500">{r.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
