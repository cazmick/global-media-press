import { Heart } from "lucide-react";

export function KofiWidget() {
  // Update these values to match your Ko-fi goal
  const goal = 500;
  const current = 125;
  const percent = Math.min(100, Math.round((current / goal) * 100));

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 mt-8">
      <div className="border-2 border-double border-ink-deep bg-paper p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <p className="kicker mb-1">Reader Support</p>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-ink-deep">
              Keep the Presses Running
            </h2>
          </div>
          <a
            href="https://ko-fi.com/globalmediapress"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent-red text-paper px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-ink-deep transition"
          >
            <Heart className="w-3.5 h-3.5" />
            Donate on Ko-fi
          </a>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink-muted">
            <span>${current} raised</span>
            <span>Goal: ${goal}</span>
          </div>
          <div className="h-3 bg-paper-rule border border-paper-rule">
            <div
              className="h-full bg-accent-red transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-ink-muted font-serif italic">
            {percent}% of monthly goal. Every cup of coffee helps fund independent reporting.
          </p>
        </div>
      </div>
    </section>
  );
}
