export const config = {
  profile: {
    age: 30,
    height: "6'0\"",
  },

  why: "Trade escape for building systems and habits where I can operate at a level to change the world for the better.",

  priorities: ["Weight", "Sleep", "Meditate", "Deep Work"],

  weight: {
    start: 240,
    goal: 200,
    deadline: "2026-06-30",
    checkpoints: [
      { month: "Feb", target: 232 },
      { month: "Mar", target: 224 },
      { month: "Apr", target: 216 },
      { month: "May", target: 208 },
      { month: "Jun", target: 200 },
    ],
  },

  dopamineReset: {
    startDate: "2026-01-30",
    days: 90,
    avoid: ["weed", "lol", "poker"],
    build: ["gym", "sleep", "meditate", "deepWork", "ateClean"],
  },

  replacing: [
    { id: "gym", label: "Gym" },
    { id: "coding", label: "Coding personal projects" },
    { id: "reading", label: "Reading" },
  ],

  habits: [
    { id: "sleep", label: "Sleep 10pm", goal: "dopamine" },
  ],

  todos: [
    { id: 1, text: "Book Poland flight", today: false, done: false },
    { id: 2, text: "Buy ring", today: false, done: false },
  ],
};
