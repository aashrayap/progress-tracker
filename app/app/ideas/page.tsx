"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type IdeaStatus = "inbox" | "reviewed" | "building" | "archived";
type IdeaDomain = "app" | "health" | "life" | "system";

interface Idea {
  id: number;
  createdAt: string;
  title: string;
  details: string;
  domain: IdeaDomain;
  status: IdeaStatus;
  source: string;
  captureId: string;
}

const STATUSES: IdeaStatus[] = ["inbox", "reviewed", "building", "archived"];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(() => {
    fetch("/api/ideas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ideas");
        return res.json();
      })
      .then((rows) => {
        setIdeas(rows);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const byStatus = useMemo(() => {
    const result: Record<IdeaStatus, Idea[]> = {
      inbox: [],
      reviewed: [],
      building: [],
      archived: [],
    };
    for (const idea of ideas) result[idea.status].push(idea);
    return result;
  }, [ideas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-5">
            <h1 className="text-xl font-semibold">Ideas</h1>
            <p className="text-sm text-zinc-500">
              Read-only idea board. Capture through voice/CLI and resolve routing in Review.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {STATUSES.map((status) => (
              <div key={status} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <p className="text-xs uppercase text-zinc-500 mb-3">
                  {status} ({byStatus[status].length})
                </p>
                <div className="space-y-2">
                  {byStatus[status].map((idea) => (
                    <article key={idea.id} className="p-3 rounded border border-zinc-700 bg-zinc-800/60">
                      <p className="text-sm font-medium text-zinc-200">{idea.title}</p>
                      {idea.details && <p className="text-xs text-zinc-400 mt-1">{idea.details}</p>}
                      <p className="text-[11px] text-zinc-500 mt-2">
                        {idea.domain} · {new Date(idea.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-2">source: {idea.source || "unknown"}</p>
                    </article>
                  ))}
                  {byStatus[status].length === 0 && (
                    <p className="text-xs text-zinc-600">No ideas in this state.</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
