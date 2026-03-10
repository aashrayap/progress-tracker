"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuoteEntry, ResourceEntry } from "../lib/types";

const TYPE_FILTERS = ["All", "Book", "Essay", "Article", "Video", "Podcast"] as const;

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-zinc-700 text-zinc-300",
  reading: "bg-amber-900/60 text-amber-300",
  done: "bg-emerald-900/60 text-emerald-300",
};

type LibraryView = "resources" | "quotes";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [activeView, setActiveView] = useState<LibraryView>("resources");

  useEffect(() => {
    Promise.all([
      fetch("/api/resources").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch resources");
        return res.json();
      }),
      fetch("/api/quotes").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch quotes");
        return res.json();
      }),
    ])
      .then(([resourceRows, quoteRows]) => {
        setResources(resourceRows);
        setQuotes(quoteRows);
      })
      .catch((err) => console.error("Failed to load library:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredResources = useMemo(() => {
    return filter === "All"
      ? resources
      : resources.filter((r) => r.type.toLowerCase() === filter.toLowerCase());
  }, [filter, resources]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const itemCount = activeView === "resources" ? filteredResources.length : quotes.length;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold">Library</h1>
            <span className="text-sm text-zinc-500">{itemCount} items</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {([
                ["resources", "Resources"],
                ["quotes", "Quotes"],
              ] as [LibraryView, string][]).map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${
                    activeView === view
                      ? "border border-white/20 bg-zinc-800 text-zinc-100"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeView === "resources" && (
            <>
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

              {filteredResources.length === 0 && (
                <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-zinc-400 text-sm">
                    {resources.length === 0
                      ? "No resources yet. Add them to data/resources.csv."
                      : "No resources match this filter."}
                  </p>
                </div>
              )}

              {filteredResources.map((r, i) => (
                <div
                  key={`${r.title}-${i}`}
                  className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-zinc-100 font-medium">{r.title}</h2>
                      {r.author && <p className="text-sm text-zinc-400">{r.author}</p>}
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
                  {r.notes && <p className="text-sm text-zinc-500">{r.notes}</p>}
                </div>
              ))}
            </>
          )}

          {activeView === "quotes" && (
            <>
              {quotes.length === 0 && (
                <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-zinc-400 text-sm">No quotes yet. Add them to data/quotes.csv.</p>
                </div>
              )}

              {quotes.map((q, i) => (
                <div
                  key={q.id || i}
                  className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-zinc-200 text-base italic leading-relaxed flex-1">&ldquo;{q.text}&rdquo;</p>
                    <span className="text-xs text-zinc-600 font-mono shrink-0 mt-1">#{q.id}</span>
                  </div>
                  {(q.author || q.source) && (
                    <p className="text-sm text-zinc-400">
                      {q.author && <span>— {q.author}</span>}
                      {q.author && q.source && <span>, </span>}
                      {q.source && <span className="text-zinc-500">{q.source}</span>}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
