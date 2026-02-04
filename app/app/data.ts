// Static data only - dynamic data comes from /api/log which reads log.csv
// This file kept for backwards compatibility and static content

export const staticData = {
  todos: [
    { id: 1, text: "Book Poland flight", today: false, done: false },
    { id: 2, text: "Buy ring", today: false, done: false },
  ],

  habits: {
    definitions: [
      { id: "sleep", label: "Sleep 10pm", goal: "dopamine" },
    ],
  },

  replacing: [
    { id: "gym", label: "Gym" },
    { id: "coding", label: "Coding personal projects" },
    { id: "reading", label: "Reading" },
  ],
};

// Helper kept for any legacy usage
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
