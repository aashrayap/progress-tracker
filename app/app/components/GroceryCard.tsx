"use client";

import type { GroceryEntry } from "../lib/types";

interface GrocerySection {
  name: string;
  items: GroceryEntry[];
}

interface GroceryCardProps {
  sections: GrocerySection[];
  totalItems: number;
  doneItems: number;
  onToggle: (item: string, done: number) => void;
  onDelete: (item: string) => void;
  onClearDone: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  produce: "Produce",
  bakery: "Bakery",
  deli: "Deli",
  meat: "Meat",
  dairy: "Dairy",
  frozen: "Frozen",
  beverages: "Beverages",
  canned: "Canned",
  pasta_rice: "Pasta & Rice",
  baking: "Baking",
  cereal: "Cereal",
  snacks: "Snacks",
  condiments: "Condiments",
  household: "Household",
  health: "Health",
};

export default function GroceryCard({
  sections,
  totalItems,
  doneItems,
  onToggle,
  onDelete,
  onClearDone,
}: GroceryCardProps) {
  return (
    <details className="mb-6 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 group/grocery">
      <summary className="flex justify-between items-center p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Groceries</h2>
          {totalItems > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-700/60 text-zinc-300">
              {doneItems}/{totalItems}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className="text-zinc-500 transition-transform group-open/grocery:rotate-180"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="px-5 pb-5">
        {totalItems === 0 ? (
          <p className="text-sm text-zinc-500">List empty — add items via voice</p>
        ) : (
          <>
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.name}>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                    {SECTION_LABELS[section.name] || section.name}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <div
                        key={item.item}
                        className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg hover:bg-white/5 group"
                      >
                        <button
                          onClick={() => onToggle(item.item, item.done === 1 ? 0 : 1)}
                          className="flex-shrink-0 w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-colors"
                          style={{ minWidth: 20, minHeight: 20 }}
                        >
                          {item.done === 1 && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${item.done === 1 ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                          {item.item}
                        </span>
                        <button
                          onClick={() => onDelete(item.item)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-xs px-1 transition-opacity"
                          aria-label={`Remove ${item.item}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {doneItems > 0 && (
              <button
                onClick={onClearDone}
                className="mt-4 w-full py-2.5 text-sm font-medium rounded-xl bg-zinc-800/60 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
              >
                Clear {doneItems} done
              </button>
            )}
          </>
        )}
      </div>
    </details>
  );
}
