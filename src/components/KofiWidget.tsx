import { Heart } from "lucide-react";

export function KofiWidget() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8 mt-8">
      <div className="border-2 border-double border-ink-deep bg-paper p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
      </div>
    </section>
  );
}
