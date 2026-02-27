"use client";

import { useCallback, useEffect, useState } from "react";

interface InboxItem {
  captureId: string;
  capturedAt: string;
  source: string;
  rawText: string;
  status: "new" | "needs_review" | "accepted" | "archived" | "failed";
  suggestedDestination: string;
  normalizedText: string;
  error: string;
}

interface InboxResponse {
  rows: InboxItem[];
  counts: {
    total: number;
    new: number;
    needsReview: number;
    failed: number;
  };
}

export default function ReviewPage() {
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [destinationById, setDestinationById] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyCaptureId, setBusyCaptureId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/inbox")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch inbox");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (
    captureId: string,
    status: InboxItem["status"],
    suggestedDestination?: string
  ) => {
    setBusyCaptureId(captureId);
    setActionError(null);
    try {
      const res = await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId, status, suggestedDestination }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setActionError(payload.error || "Failed to update review item");
        return;
      }
      fetchData();
    } finally {
      setBusyCaptureId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load review queue</p>
      </div>
    );
  }

  const active = data.rows.filter((r) => ["new", "needs_review", "failed"].includes(r.status));
  const getDestination = (item: InboxItem): string =>
    destinationById[item.captureId] || item.suggestedDestination || "ideas";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-5">
            <h1 className="text-xl font-semibold">Review</h1>
            <p className="text-sm text-zinc-500">
              Resolve captured items before they affect analysis.
            </p>
          </header>

          <section className="grid grid-cols-4 gap-2 mb-5">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-lg font-semibold">{data.counts.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">New</p>
              <p className="text-lg font-semibold text-blue-400">{data.counts.new}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">Needs Review</p>
              <p className="text-lg font-semibold text-amber-400">{data.counts.needsReview}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">Failed</p>
              <p className="text-lg font-semibold text-red-400">{data.counts.failed}</p>
            </div>
          </section>

          {actionError && (
            <section className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">{actionError}</p>
            </section>
          )}

          {active.length === 0 ? (
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm">
              No pending captures.
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((item) => (
                <article key={item.captureId} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500">
                      {new Date(item.capturedAt).toLocaleString()} · {item.source}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : item.status === "needs_review"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{item.rawText}</p>
                  {item.suggestedDestination && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Suggested: {item.suggestedDestination}
                    </p>
                  )}
                  {item.error && <p className="text-xs text-red-400 mt-2">{item.error}</p>}
                  <div className="mt-3">
                    <label className="text-xs text-zinc-500">Route To</label>
                    <select
                      value={getDestination(item)}
                      onChange={(e) =>
                        setDestinationById((prev) => ({
                          ...prev,
                          [item.captureId]: e.target.value,
                        }))
                      }
                      disabled={busyCaptureId === item.captureId}
                      className="mt-1 block w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200"
                    >
                      <option value="ideas">ideas</option>
                      <option value="todos">todos</option>
                      <option value="reflections">reflections</option>
                      <option value="daily_signals">daily_signals</option>
                      <option value="manual">manual</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      disabled={busyCaptureId === item.captureId}
                      onClick={() =>
                        updateStatus(item.captureId, "accepted", getDestination(item))
                      }
                      className="px-3 py-1.5 text-xs rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                    >
                      Route + Accept
                    </button>
                    <button
                      disabled={busyCaptureId === item.captureId}
                      onClick={() =>
                        updateStatus(item.captureId, "needs_review", getDestination(item))
                      }
                      className="px-3 py-1.5 text-xs rounded bg-amber-500/15 border border-amber-500/40 text-amber-300"
                    >
                      Needs Review
                    </button>
                    <button
                      disabled={busyCaptureId === item.captureId}
                      onClick={() =>
                        updateStatus(item.captureId, "archived", getDestination(item))
                      }
                      className="px-3 py-1.5 text-xs rounded bg-zinc-700/40 border border-zinc-600 text-zinc-300"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
