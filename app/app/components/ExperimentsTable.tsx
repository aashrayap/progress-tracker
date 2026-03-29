"use client";

import { useState } from "react";

interface CurrentExperiment {
  name: string;
  dayCount: number;
  durationDays: number;
  domain: string;
  isExpired: boolean;
}

interface PastExperiment {
  name: string;
  verdict: string;
  reflection: string;
  startDate: string;
}

interface Props {
  current: CurrentExperiment[];
  past: PastExperiment[];
}

export default function ExperimentsTable({ current, past }: Props) {
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-4 mb-3">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">Experiments</p>
        <div className="flex gap-3 ml-auto">
          <button
            onClick={() => setActiveTab("current")}
            className={`text-xs cursor-pointer pb-0.5 ${
              activeTab === "current"
                ? "text-zinc-100 border-b border-zinc-100"
                : "text-zinc-500"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`text-xs cursor-pointer pb-0.5 ${
              activeTab === "past"
                ? "text-zinc-100 border-b border-zinc-100"
                : "text-zinc-500"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {activeTab === "current" && (
        current.length === 0 ? (
          <p className="text-xs text-zinc-500">No active experiments</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 text-left">
                <th className="pb-1 font-normal">Name</th>
                <th className="pb-1 font-normal">Day</th>
                <th className="pb-1 font-normal">Domain</th>
              </tr>
            </thead>
            <tbody>
              {current.map((exp) => (
                <tr key={`${exp.name}-${exp.domain}`}>
                  <td className="py-1 text-zinc-200 pr-4">{exp.name}</td>
                  <td className={`py-1 pr-4 ${exp.isExpired ? "text-amber-400" : "text-zinc-300"}`}>
                    {exp.dayCount}/{exp.durationDays}
                  </td>
                  <td className="py-1 text-zinc-400">{exp.domain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === "past" && (
        past.length === 0 ? (
          <p className="text-xs text-zinc-500">No past experiments</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 text-left">
                <th className="pb-1 font-normal">Name</th>
                <th className="pb-1 font-normal">Verdict</th>
                <th className="pb-1 font-normal">Reflection</th>
              </tr>
            </thead>
            <tbody>
              {past.map((exp) => (
                <tr key={`${exp.name}-${exp.startDate}`}>
                  <td className="py-1 text-zinc-200 pr-4">{exp.name}</td>
                  <td className="py-1 text-zinc-300 pr-4">{exp.verdict}</td>
                  <td className="py-1 text-zinc-400">
                    {exp.reflection.length > 40
                      ? `${exp.reflection.slice(0, 40)}...`
                      : exp.reflection}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
