"use client";

import { usePlan } from "../PlanProvider";
import YearView from "../../components/YearView";

export default function PlanYearPage() {
  const { events, habits, focusDate, goTo, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return <YearView events={events} habits={habits} focusDate={focusDate} onNavigate={goTo} />;
}
