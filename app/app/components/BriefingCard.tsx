"use client";

import { useCallback, useState } from "react";

interface BriefingData {
  state: "momentum" | "recovery" | "neutral" | "danger" | "explore" | "disruption";
  insight: string;
  priorities: string[];
  quote: { text: string; author: string };
  generated_at: string;
  input_hash: string;
  verified: boolean;
}

interface FallbackInsight {
  streak: string;
  warning: string | null;
  momentum: string;
}

interface FallbackQuote {
  text: string;
  author: string;
}

const STATE_COLORS: Record<string, string> = {
  momentum: "border-l-emerald-500",
  neutral: "border-l-amber-500",
  danger: "border-l-red-500",
  recovery: "border-l-zinc-500",
  explore: "border-l-blue-500",
  disruption: "border-l-blue-500",
};

const STATE_BADGE_COLORS: Record<string, string> = {
  momentum: "bg-emerald-500/20 text-emerald-400",
  neutral: "bg-amber-500/20 text-amber-400",
  danger: "bg-red-500/20 text-red-400",
  recovery: "bg-zinc-500/20 text-zinc-400",
  explore: "bg-blue-500/20 text-blue-400",
  disruption: "bg-blue-500/20 text-blue-400",
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isStale(isoStr: string): boolean {
  return Date.now() - new Date(isoStr).getTime() > 24 * 60 * 60 * 1000;
}

export default function BriefingCard({
  briefing,
  fallbackInsight,
  fallbackQuote,
}: {
  briefing: BriefingData | null;
  fallbackInsight: FallbackInsight;
  fallbackQuote: FallbackQuote | null;
}) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const sendFeedback = useCallback(
    async (rating: "good" | "bad") => {
      setFeedbackSent(true);
      try {
        await fetch("/api/hub/briefing-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, text: feedbackText }),
        });
      } catch {
        // silent — feedback is best-effort
      }
    },
    [feedbackText]
  );

  // Fallback: no briefing or stale
  if (!briefing || isStale(briefing.generated_at)) {
    const quote = fallbackQuote;
    return (
      <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 border-l-4 border-l-zinc-500 rounded-xl">
        <div className="space-y-2">
          <p className="text-sm text-zinc-200">{fallbackInsight.streak}</p>
          <p className="text-sm text-zinc-400">{fallbackInsight.momentum}</p>
          {fallbackInsight.warning && (
            <p className="text-sm text-red-300">{fallbackInsight.warning}</p>
          )}
        </div>
        {quote && (
          <>
            <div className="my-3 border-t border-white/5" />
            <p className="text-xs text-zinc-600 italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
              <span className="not-italic"> — {quote.author}</span>
            </p>
          </>
        )}
        {!briefing && (
          <p className="mt-2 text-[10px] text-zinc-600">
            Run the briefing pipeline to get AI-generated insights.
          </p>
        )}
      </section>
    );
  }

  const accentColor = STATE_COLORS[briefing.state] || "border-l-zinc-500";
  const badgeColor = STATE_BADGE_COLORS[briefing.state] || "bg-zinc-500/20 text-zinc-400";

  return (
    <section className={`p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 border-l-4 ${accentColor} rounded-xl`}>
      {/* State badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
          {briefing.state}
        </span>
        <span className="text-[10px] text-zinc-600">
          Updated {timeAgo(briefing.generated_at)}
        </span>
      </div>

      {/* Insight */}
      <p className="text-sm text-zinc-200 leading-relaxed">{briefing.insight}</p>

      {/* Priorities */}
      {briefing.priorities.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Today</p>
          <ul className="space-y-1">
            {briefing.priorities.map((p, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                <span className="text-zinc-600">·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quote */}
      <div className="my-3 border-t border-white/5" />
      <p className="text-xs text-zinc-500 italic leading-relaxed">
        &ldquo;{briefing.quote.text}&rdquo;
        <span className="not-italic"> — {briefing.quote.author}</span>
      </p>

      {/* Feedback */}
      <div className="my-3 border-t border-white/5" />
      {feedbackSent ? (
        <p className="text-[10px] text-zinc-600">Thanks for the feedback.</p>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => sendFeedback("good")}
            className="text-zinc-500 hover:text-emerald-400 transition-colors text-sm"
            aria-label="Good briefing"
          >
            ✓
          </button>
          <button
            onClick={() => sendFeedback("bad")}
            className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
            aria-label="Bad briefing"
          >
            ✗
          </button>
          <input
            type="text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="optional feedback..."
            className="flex-1 bg-transparent text-xs text-zinc-400 placeholder-zinc-700 outline-none border-b border-zinc-800 focus:border-zinc-600 py-0.5"
          />
        </div>
      )}
    </section>
  );
}
