"use client";

import { usePlan } from "../PlanProvider";
import DayView from "../../components/DayView";

export default function PlanDayPage() {
  const { events, habits, focusDate, refresh, todos, setTodos, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <DayView
      events={events}
      habits={habits}
      focusDate={focusDate}
      onRefresh={refresh}
      todos={todos}
      onTodosChange={setTodos}
    />
  );
}
