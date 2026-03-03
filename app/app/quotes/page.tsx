"use client";

import { useState, useEffect } from "react";
import type { QuoteEntry } from "../lib/types";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quotes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch quotes");
        return res.json();
      })
      .then(setQuotes)
      .catch((err) => console.error("Failed to load quotes:", err))
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="text-2xl font-bold">Quotes</h1>

          {quotes.length === 0 && (
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <p className="text-zinc-400 text-sm">No quotes yet. Add them to quotes.csv.</p>
            </div>
          )}

          {quotes.map((q, i) => (
            <div
              key={q.id || i}
              className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3"
            >
              <p className="text-zinc-200 text-base italic leading-relaxed">
                &ldquo;{q.text}&rdquo;
              </p>
              {(q.author || q.source) && (
                <p className="text-sm text-zinc-400">
                  {q.author && <span>— {q.author}</span>}
                  {q.author && q.source && <span>, </span>}
                  {q.source && (
                    <span className="text-zinc-500">{q.source}</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
