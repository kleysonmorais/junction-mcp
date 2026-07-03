"use client";

import { GITHUB_URL, VIEWS, type View } from "./views";
import { useTheme } from "./useTheme";

function Logo() {
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-lg"
      style={{ background: "var(--accent)" }}
      aria-hidden
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: "var(--panel)" }}
      />
    </span>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      className="relative flex h-7 w-[52px] items-center rounded-full border transition-colors"
      style={{
        borderColor: "var(--line)",
        background: "var(--panel2)",
      }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-transform duration-200"
        style={{
          transform: dark ? "translateX(23px)" : "translateX(2px)",
          background: dark ? "var(--ink)" : "var(--accent)",
          color: "var(--panel)",
        }}
      >
        {dark ? "☾" : "☀"}
      </span>
    </button>
  );
}

export default function NavBar({
  view,
  onSelect,
}: {
  view: View;
  onSelect: (v: View) => void;
}) {
  return (
    <div className="sticky top-3 z-50 px-4">
      <nav
        className="mx-auto flex max-w-6xl items-center gap-4 rounded-2xl border px-4 py-2.5 backdrop-blur-md"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <button
          onClick={() => onSelect("Home")}
          className="flex items-center gap-2.5 font-semibold"
          style={{ color: "var(--ink)" }}
        >
          <Logo />
          <span className="text-[15px] tracking-tight">junction-mcp</span>
        </button>

        <div className="ml-2 flex items-center gap-1">
          {VIEWS.map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => onSelect(v)}
                className="rounded-lg px-3 py-1.5 text-sm transition-colors"
                style={{
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--sub)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {v}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
            style={{
              borderColor: "var(--line)",
              background: "var(--panel)",
              color: "var(--sub)",
            }}
          >
            <GitHubIcon />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}
