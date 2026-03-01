"use client";

import { useCallback, useEffect, useState } from "react";

interface Idea {
  captureId: string;
  capturedAt: string;
  rawText: string;
  status: string;
  normalizedText: string;
  error: string;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  logged: { label: "Queued", classes: "bg-zinc-700 text-zinc-300" },
  investigating: { label: "Investigating", classes: "bg-blue-900 text-blue-300" },
  shipped: { label: "Shipped", classes: "bg-emerald-900 text-emerald-300" },
  failed: { label: "Rejected", classes: "bg-red-900 text-red-300" },
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(() => {
    fetch("/api/ideas")
      .then((res) => res.json())
      .then((data) => {
        setIdeas(data.ideas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

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
        <div className="max-w-3xl mx-auto space-y-4">
          <header className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Ideas</h1>
            <span className="text-xs text-zinc-500">{ideas.length} total</span>
          </header>

          {ideas.length === 0 ? (
            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-xl text-center">
              <p className="text-zinc-400 text-sm">No ideas yet. Speak one into your phone.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Try: &quot;idea — add dark mode to the tracker&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => {
                const style = STATUS_STYLES[idea.status] || STATUS_STYLES.logged;
                const prUrl = idea.status === "shipped" ? idea.error : null;
                const failReason = idea.status === "failed" ? idea.error : null;

                return (
                  <div
                    key={idea.captureId}
                    className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-zinc-100 flex-1">{idea.rawText}</p>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${style.classes}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    {idea.normalizedText && (
                      <p className="mt-2 text-xs text-zinc-400">{idea.normalizedText}</p>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                      <span>
                        {new Date(idea.capturedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {prUrl && (
                        <a
                          href={prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View PR
                        </a>
                      )}
                      {failReason && <span className="text-red-400">{failReason}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
