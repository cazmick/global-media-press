import { Link } from "@tanstack/react-router";
import { ImageCarousel } from "./ImageCarousel";
import type { ArticleDTO } from "@/lib/articles.functions";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ArticleCard({ article, lead = false }: { article: ArticleDTO; lead?: boolean }) {
  return (
    <article className="border-b border-paper-rule pb-6 sm:pb-8">
      {article.category && <div className="kicker mb-2">{article.category}</div>}
      <Link to="/article/$id" params={{ id: article.id }} className="block group">
        <h2
          className={`font-display font-black text-ink-deep leading-[1.05] tracking-tight group-hover:text-accent-red break-words ${
            lead ? "text-3xl sm:text-4xl md:text-5xl" : "text-xl sm:text-2xl md:text-3xl"
          }`}
        >
          {article.headline}
        </h2>
      </Link>

      <div className={`mt-4 ${lead ? "grid sm:grid-cols-5 gap-4 sm:gap-6" : "grid sm:grid-cols-3 gap-4 sm:gap-5"}`}>
        {article.images.length > 0 && (
          <div className={lead ? "sm:col-span-3" : "sm:col-span-1"}>
            <ImageCarousel
              images={article.images}
              alt={article.headline}
              className={lead ? "aspect-[16/10]" : "aspect-[4/3]"}
            />
            <p className="mt-1 font-mono text-[10px] tracking-widest uppercase text-ink-muted">
              Photo · {article.images.length} image{article.images.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
        <div className={article.images.length > 0 ? (lead ? "sm:col-span-2" : "sm:col-span-2") : "sm:col-span-3"}>
          <p
            className={`text-ink leading-relaxed ${lead ? "text-base sm:text-lg sm:dropcap" : "text-base"}`}
          >
            {article.summary || article.body.slice(0, 160).replace(/\n+/g, " ").trim() + (article.body.length > 160 ? "…" : "")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-ink-muted">
            <span>By {article.submitter_name?.trim() || "Anonymous"}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(article.published_at)}</span>
          </div>
          <Link
            to="/article/$id"
            params={{ id: article.id }}
            className="inline-block mt-3 text-sm font-mono uppercase tracking-widest text-accent-red border-b border-accent-red pb-0.5 hover:text-ink-deep hover:border-ink-deep"
          >
            Continue reading →
          </Link>
        </div>
      </div>
    </article>
  );
}
