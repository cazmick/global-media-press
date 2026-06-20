import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Masthead } from "@/components/Masthead";
import { ArticleCard } from "@/components/ArticleCard";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { getPublishedArticles, getTrending } from "@/lib/articles.functions";
import { PenSquare } from "lucide-react";

const articlesQO = queryOptions({
  queryKey: ["articles", "published"],
  queryFn: () => getPublishedArticles(),
});
const trendingQO = queryOptions({
  queryKey: ["articles", "trending"],
  queryFn: () => getTrending(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Media — The World's Newspaper of Record" },
      { name: "description", content: "Breaking news, world affairs, business, technology, sport and culture. Submitted by the world, for the world." },
      { property: "og:title", content: "Global Media — Front Page" },
      { property: "og:description", content: "All the news worth reading, updated by the minute." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(articlesQO);
    context.queryClient.ensureQueryData(trendingQO);
  },
  component: Home,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center"><p>Couldn't load the front page: {error.message}</p></div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found.</div>,
});

function Home() {
  const { data: articles } = useSuspenseQuery(articlesQO);
  const { data: trending } = useSuspenseQuery(trendingQO);

  const [lead, ...rest] = articles;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between border-b border-paper-rule pb-3 mb-6">
          <p className="kicker">Front Page · Sorted by most recent</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 bg-ink-deep text-paper px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition"
          >
            <PenSquare className="w-3.5 h-3.5" />
            Submit a Story
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-4">
              <TrendingSidebar items={trending} />
            </div>
          </div>

          <main className="lg:col-span-9 order-1 lg:order-2 space-y-8">
            {articles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-paper-rule">
                <p className="font-display text-2xl">The presses are quiet.</p>
                <p className="text-ink-muted mt-2">No stories yet — be the first to submit.</p>
              </div>
            ) : (
              <>
                {lead && <ArticleCard article={lead} lead />}
                <div className="grid sm:grid-cols-2 gap-8">
                  {rest.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t-4 border-double border-ink-deep mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono uppercase tracking-widest text-ink-muted">
          <span>© {new Date().getFullYear()} Global Media</span>
          <span>Printed daily on the internet</span>
        </div>
      </footer>
    </div>
  );
}
