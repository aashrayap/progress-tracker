"use client";

import { useEffect, type ReactNode } from "react";

interface TrendModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
}

export default function TrendModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  sidebar,
  footer,
}: TrendModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close trend modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />
      <div className={`relative mx-auto flex h-full items-end p-2 sm:items-center sm:p-6 ${sidebar ? "max-w-5xl" : "max-w-3xl"}`}>
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl"
        >
          <header className="flex items-start justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">{title}</h3>
              {subtitle ? <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-zinc-100"
            >
              Close
            </button>
          </header>
          {sidebar ? (
            <div className="flex flex-col sm:flex-row overflow-hidden flex-1 min-h-0">
              <div className="overflow-y-auto px-4 py-4 sm:px-5 flex-1">{children}</div>
              <div className="border-t sm:border-t-0 sm:border-l border-white/10 overflow-y-auto px-4 py-4 sm:px-5 sm:w-80 max-h-[50vh] sm:max-h-none">
                {sidebar}
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
          )}
          {footer ? (
            <footer className="border-t border-white/10 px-4 py-3 text-xs text-zinc-400 sm:px-5">
              {footer}
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}
