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
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newDomain, setNewDomain] = useState<IdeaDomain>("system");

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

  const moveIdea = async (id: number, status: IdeaStatus) => {
    const res = await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    fetchIdeas();
  };

  const createIdea = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        details: newDetails.trim(),
        domain: newDomain,
        status: "inbox",
        source: "manual",
      }),
    });
    if (!res.ok) return;
    setNewTitle("");
    setNewDetails("");
    setNewDomain("system");
    fetchIdeas();
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
        <div className="max-w-5xl mx-auto">
          <header className="mb-5">
            <h1 className="text-xl font-semibold">Ideas</h1>
            <p className="text-sm text-zinc-500">Triage and move ideas through the pipeline.</p>
          </header>

          <section className="mb-5 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Add Idea</p>
            <div className="space-y-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm"
              />
              <textarea
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Details"
                rows={3}
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as IdeaDomain)}
                  className="px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm"
                >
                  <option value="system">system</option>
                  <option value="app">app</option>
                  <option value="health">health</option>
                  <option value="life">life</option>
                </select>
                <button
                  onClick={createIdea}
                  className="px-4 py-2 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </section>

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
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {STATUSES.filter((s) => s !== idea.status).map((next) => (
                          <button
                            key={next}
                            onClick={() => moveIdea(idea.id, next)}
                            className="px-2 py-1 text-[11px] rounded bg-zinc-700/60 border border-zinc-600 text-zinc-300"
                          >
                            {next}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

