import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Masthead } from "@/components/Masthead";
import { ArticleCard } from "@/components/ArticleCard";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { KofiWidget } from "@/components/KofiWidget";
import { getPublishedArticles, getTrending } from "@/lib/articles.functions";
import { PenSquare, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 11;

const homeSearchSchema = z.object({
  page: fallback(z.number().int().min(1), 1).default(1),
});

function articlesQueryOptions(page: number) {
  return queryOptions({
    queryKey: ["articles", "published", page],
    queryFn: () => getPublishedArticles({ data: { page, perPage: PAGE_SIZE } }),
  });
}

const trendingQO = queryOptions({
  queryKey: ["articles", "trending"],
  queryFn: () => getTrending(),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(homeSearchSchema),
  head: () => ({
    meta: [
      { title: "Global Media — The World's Newspaper of Record" },
      { name: "description", content: "Breaking news, world affairs, business, technology, sport and culture. Submitted by the world, for the world." },
      { property: "og:title", content: "Global Media — Front Page" },
      { property: "og:description", content: "All the news worth reading, updated by the minute." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://global-media-press.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://global-media-press.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Global Media",
          url: "https://global-media-press.lovable.app/",
          description: "Breaking news, world affairs, business, technology, sport and culture — submitted by the world, for the world.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Global Media",
          url: "https://global-media-press.lovable.app/",
          logo: "https://global-media-press.lovable.app/favicon.ico",
        }),
      },
    ],
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(articlesQueryOptions(deps.page));
    context.queryClient.ensureQueryData(trendingQO);
  },
  component: Home,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center"><p>Couldn't load the front page: {error.message}</p></div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found.</div>,
});

function Home() {
  const { page } = Route.useSearch();
  const { data: pageData } = useSuspenseQuery(articlesQueryOptions(page));
  const { data: trending } = useSuspenseQuery(trendingQO);
  const navigate = useNavigate({ from: "/" });

  const { articles, total } = pageData;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [lead, ...rest] = articles;

  const goToPage = (p: number) => {
    navigate({ search: (prev: { page: number }) => ({ ...prev, page: p }) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (page <= 3) {
        start = 2;
        end = Math.min(totalPages - 1, maxVisible - 1);
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxVisible - 2);
        end = totalPages - 1;
      }
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((p, i) =>
      typeof p === "string" ? (
        <span key={`ellipsis-${i}`} className="px-2 text-ink-muted font-mono text-xs">
          ...
        </span>
      ) : (
        <button
          key={p}
          onClick={() => goToPage(p)}
          disabled={p === page}
          className={`min-w-[2.25rem] h-9 px-2 font-mono text-xs uppercase tracking-widest border transition ${
            p === page
              ? "bg-ink-deep text-paper border-ink-deep"
              : "bg-paper text-ink-deep border-paper-rule hover:border-ink-deep"
          }`}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Masthead asH1 />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-paper-rule pb-3 mb-6">
          <p className="kicker">Front Page · Sorted by most recent · Page {page} of {totalPages}</p>
          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 bg-ink-deep text-paper px-4 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition w-full sm:w-auto"
          >
            <PenSquare className="w-3.5 h-3.5" />
            Submit a Story
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-4">
              <TrendingSidebar items={trending} />
            </div>
          </div>

          <main className="lg:col-span-9 order-1 lg:order-2 space-y-6 sm:space-y-8">
            {articles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-paper-rule">
                <p className="font-display text-2xl">The presses are quiet.</p>
                <p className="text-ink-muted mt-2">No stories yet — be the first to submit.</p>
              </div>
            ) : (
              <>
                {lead && <ArticleCard article={lead} lead />}
                <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                  {rest.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Front page pagination"
                className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-paper-rule"
              >
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 h-9 font-mono text-xs uppercase tracking-widest border border-paper-rule bg-paper text-ink-deep hover:border-ink-deep disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                {renderPageNumbers()}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 h-9 font-mono text-xs uppercase tracking-widest border border-paper-rule bg-paper text-ink-deep hover:border-ink-deep disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>

      <KofiWidget />

      <footer className="border-t-4 border-double border-ink-deep mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono uppercase tracking-widest text-ink-muted">
          <span>© {new Date().getFullYear()} Global Media India</span>
          <a
            href="https://ko-fi.com/globalmediapress"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-red"
          >
            Support Us on Ko-fi
          </a>
          <span>Printed daily on the internet</span>
        </div>
      </footer>
    </div>
  );
}
