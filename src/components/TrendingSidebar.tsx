import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function TrendingSidebar({ items }: { items: { id: string; headline: string; click_count: number; category: string | null }[] }) {
  return (
    <aside className="border border-paper-rule bg-paper/60 p-4">
      <div className="flex items-center gap-2 border-b border-ink-deep pb-2 mb-3">
        <Flame className="w-4 h-4 text-accent-red" />
        <h2 className="kicker !text-ink-deep font-mono">Trending Now</h2>
      </div>
      <ol className="space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-ink-muted italic">Nothing trending yet.</li>
        )}
        {items.map((a, idx) => (
          <li key={a.id} className="flex gap-3 group">
            <span className="font-display text-3xl leading-none text-accent-red w-6 shrink-0">{idx + 1}</span>
            <div className="flex-1 border-b border-dotted border-paper-rule pb-3 last:border-0">
              {a.category && (
                <div className="kicker mb-1">{a.category}</div>
              )}
              <Link
                to="/article/$id"
                params={{ id: a.id }}
                className="font-display text-base leading-snug text-ink-deep group-hover:text-accent-red"
              >
                {a.headline}
              </Link>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                {a.click_count.toLocaleString()} reads
              </div>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
