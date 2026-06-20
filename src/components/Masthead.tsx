import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Masthead() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return (
    <header className="border-b-4 border-double border-ink-deep bg-paper">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-3">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-ink-muted border-b border-paper-rule pb-2">
          <span>Vol. MMXXVI · No. 1</span>
          <span className="hidden sm:inline">{today}</span>
          <span>The World's Newspaper of Record</span>
        </div>

        <div className="flex flex-col items-center text-center py-4">
          <Link to="/" className="block">
            <img src={logo} alt="Global Media India" className="h-16 sm:h-20 w-auto mx-auto" />
          </Link>
          <p className="mt-2 font-serif italic text-sm text-ink-muted">
            "All the news worth reading — submitted by the world, for the world."
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-b border-paper-rule py-2 text-[11px] font-mono uppercase tracking-widest">
          <Link to="/" className="hover:text-accent-red">Front Page</Link>
          <span className="text-paper-rule">·</span>
          <Link to="/submit" className="hover:text-accent-red">Submit a Story</Link>
          <span className="text-paper-rule">·</span>
          <Link to="/admin" className="hover:text-accent-red">Newsroom</Link>
        </nav>
      </div>
    </header>
  );
}
