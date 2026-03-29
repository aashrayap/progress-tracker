"use client";

import { usePlan } from "../PlanProvider";
import MonthView from "../../components/MonthView";

export default function PlanMonthPage() {
  const { events, habits, focusDate, goTo, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return <MonthView events={events} habits={habits} focusDate={focusDate} onNavigate={goTo} />;
}
