"use client";

import { useState, useEffect } from "react";

interface MindEntry {
  date: string;
  trigger: string;
  thought: string;
  action: string;
  circumstance: string;
  category: string;
}

interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

interface MindData {
  entries: MindEntry[];
  reflections: ReflectionEntry[];
}

export default function MindPage() {
  const [data, setData] = useState<MindData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mind")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch mind data");
        return res.json();
      })
      .then(setData)
      .catch((err) => console.error("Failed to load mind data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold">Mind</h1>

          <section className="space-y-3">
            <h2 className="text-xs uppercase text-zinc-400">Recent Entries</h2>
            {data.entries.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-center">
                <p className="text-sm text-zinc-400">
                  No mind entries yet. They'll appear here after your daily check-in.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.entries.map((entry, i) => (
                  <article
                    key={`${entry.date}-${i}`}
                    className="rounded-xl border border-white/10 bg-zinc-900/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs text-zinc-500">{entry.date}</p>
                      {entry.category && (
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200 font-medium">
                      {entry.trigger.replace(/_/g, " ")}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-400">
                      {entry.thought && (
                        <p>
                          <span className="text-zinc-500">thought:</span> {entry.thought}
                        </p>
                      )}
                      {entry.action && (
                        <p>
                          <span className="text-zinc-500">action:</span> {entry.action}
                        </p>
                      )}
                      {entry.circumstance && (
                        <p>
                          <span className="text-zinc-500">circumstance:</span> {entry.circumstance}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {data.reflections.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase text-zinc-400">Reflections</h2>
              <div className="space-y-2">
                {data.reflections.map((r, i) => (
                  <article
                    key={`${r.date}-${r.domain}-${i}`}
                    className="rounded-xl border border-white/10 bg-zinc-900/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs text-zinc-500">{r.date}</p>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {r.domain}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {r.win && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">win:</span> {r.win}
                        </p>
                      )}
                      {r.lesson && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">lesson:</span> {r.lesson}
                        </p>
                      )}
                      {r.change && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">change:</span> {r.change}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
