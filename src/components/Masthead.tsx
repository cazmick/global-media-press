import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function Masthead({ asH1 = false }: { asH1?: boolean }) {
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    );
  }, []);
  const TitleTag = asH1 ? "h1" : "div";
  return (
    <header className="border-b-4 border-double border-ink-deep bg-paper">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-3">
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-ink-muted border-b border-paper-rule pb-2">
          <span className="shrink-0">Vol. MMXXVI · No. 1</span>
          <span className="hidden md:inline truncate">{today}</span>
          <span className="hidden sm:inline shrink-0 text-right">The World's Newspaper of Record</span>
        </div>

        <div className="flex flex-col items-center text-center py-3 sm:py-4">
          <TitleTag className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-ink-deep leading-none m-0">
            <Link to="/" className="text-ink-deep no-underline">
              Global Media
            </Link>
          </TitleTag>
          <p className="mt-2 font-serif italic text-xs sm:text-sm text-ink-muted px-2">
            "All the news worth reading — submitted by the world, for the world."
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 border-t border-b border-paper-rule py-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest">
          <Link to="/" className="hover:text-accent-red">Front Page</Link>
          <span className="text-paper-rule">·</span>
          <Link to="/submit" className="hover:text-accent-red">Submit</Link>
          <span className="text-paper-rule">·</span>
          <Link to="/contact" className="hover:text-accent-red">Contact</Link>
          <span className="text-paper-rule">·</span>
          <Link to="/admin" className="hover:text-accent-red">Newsroom</Link>
        </nav>
      </div>
    </header>
  );
}
