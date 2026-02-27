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
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchIdeas = useCallback(() => {
    fetch("/api/ideas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ideas");
        return res.json();
      })
      .then((rows: Idea[]) => {
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

  const counts = useMemo(() => {
    const out: Record<IdeaStatus, number> = {
      inbox: 0,
      reviewed: 0,
      building: 0,
      archived: 0,
    };
    for (const idea of ideas) out[idea.status] += 1;
    return out;
  }, [ideas]);

  const visibleIdeas = useMemo(() => {
    if (showArchived) return ideas;
    return ideas.filter((idea) => idea.status !== "archived");
  }, [ideas, showArchived]);

  const updateStatus = async (idea: Idea, status: IdeaStatus) => {
    if (idea.status === status) return;
    setBusyId(idea.id);
    try {
      const res = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, status }),
      });
      if (!res.ok) throw new Error("Failed to update idea status");
      setIdeas((prev) =>
        prev.map((row) => (row.id === idea.id ? { ...row, status } : row))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

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
        <div className="max-w-3xl mx-auto">
          <header className="mb-5 space-y-2">
            <h1 className="text-xl font-semibold">Action Backlog</h1>
            <p className="text-sm text-zinc-500">
              Primary analysis and action creation now lives in Reflect. This page is a compact backlog manager.
            </p>
            <a href="/reflect" className="inline-block text-sm text-blue-300 hover:text-blue-200">
              Open Reflect Workspace
            </a>
          </header>

          <section className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <p className="text-xs uppercase text-zinc-500 mb-2">Status Counts</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <span
                  key={status}
                  className="px-2 py-1 rounded text-xs border bg-zinc-800 border-zinc-700 text-zinc-300"
                >
                  {status}: {counts[status]}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="px-2 py-1 text-xs rounded border bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-zinc-100"
              >
                {showArchived ? "Hide archived" : "Show archived"}
              </button>
            </div>
          </section>

          <section className="space-y-2">
            {visibleIdeas.length === 0 && (
              <p className="text-sm text-zinc-600">No actions in this view.</p>
            )}
            {visibleIdeas.map((idea) => (
              <article key={idea.id} className="p-3 rounded border border-zinc-800 bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {idea.title || "Untitled action"}
                    </p>
                    {idea.details && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{idea.details}</p>
                    )}
                    <p className="text-[11px] text-zinc-500 mt-2">
                      {idea.domain} · {new Date(idea.createdAt).toLocaleDateString()} · source: {idea.source || "unknown"}
                    </p>
                  </div>
                  <label className="text-xs text-zinc-500">
                    <span className="sr-only">Action status</span>
                    <select
                      value={idea.status}
                      disabled={busyId === idea.id}
                      onChange={(e) => updateStatus(idea, e.target.value as IdeaStatus)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded px-2 py-1"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
