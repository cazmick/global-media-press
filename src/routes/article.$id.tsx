import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Masthead } from "@/components/Masthead";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getArticleById, recordClick } from "@/lib/articles.functions";
import { refineEnglish } from "@/lib/refine.functions";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/article/$id")({
  loader: async ({ params, context }) => {
    const qo = queryOptions({
      queryKey: ["article", params.id],
      queryFn: () => getArticleById({ data: { id: params.id } }),
    });
    const article = await context.queryClient.ensureQueryData(qo);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ params, loaderData }) => {
    const url = `https://global-media-press.lovable.app/article/${params.id}`;
    if (!loaderData) {
      return { meta: [{ title: "Article — Global Media" }] };
    }
    const a = loaderData.article;
    const desc = a.summary || a.body.slice(0, 160).replace(/\n+/g, " ").trim() + (a.body.length > 160 ? "…" : "");
    return {
      meta: [
        { title: `${a.headline} — Global Media` },
        { name: "description", content: desc },
        { property: "og:title", content: a.headline },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(a.images[0] ? [{ property: "og:image", content: a.images[0] }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
          headline: a.headline,
            description: desc,
            datePublished: a.published_at,
            dateModified: a.published_at,
            author: { "@type": "Person", name: a.submitter_name?.trim() || "Anonymous" },
            publisher: {
              "@type": "Organization",
              name: "Global Media",
              logo: { "@type": "ImageObject", url: "https://global-media-press.lovable.app/favicon.ico" },
            },
            image: a.images.length > 0 ? a.images : undefined,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            articleSection: a.category ?? undefined,
          }),
        },
      ],
    };
  },
  component: ArticlePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">Failed to load article: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Masthead />
      <div className="max-w-3xl mx-auto p-12 text-center">
        <h1 className="font-display text-5xl">Story Not Found</h1>
        <p className="mt-3 text-ink-muted">This article may have been pulled by our editors.</p>
        <Link to="/" className="inline-block mt-6 font-mono text-xs uppercase tracking-widest border-b border-ink-deep">Back to Front Page</Link>
      </div>
    </div>
  ),
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const router = useRouter();
  const refine = useServerFn(refineEnglish);
  const [refinedBody, setRefinedBody] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    recordClick({ data: { id: article.id } }).catch(() => undefined);
    const t = setTimeout(() => router.invalidate(), 1500);
    return () => clearTimeout(t);
  }, [article.id, router]);

  const date = new Date(article.published_at).toLocaleString(undefined, {
    dateStyle: "full", timeStyle: "short",
  });

  const displayBody = refinedBody ?? article.body;

  const handleRefine = async () => {
    if (refining) return;
    if (refinedBody) { setRefinedBody(null); return; }
    setRefining(true);
    try {
      const { refined } = await refine({ data: { text: article.body } });
      setRefinedBody(refined);
      toast.success("English refined");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not refine");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <article className="max-w-3xl mx-auto px-4 py-10">
        {article.category && <div className="kicker mb-3">{article.category}</div>}
        <h1 className="font-display font-black text-4xl sm:text-6xl leading-[1.02] tracking-tight text-ink-deep">
          {article.headline}
        </h1>
        <p className="mt-4 text-xl text-ink leading-relaxed italic">{article.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest text-ink-muted border-y border-paper-rule py-3">
          <span>By {article.submitter_name?.trim() || "Anonymous"}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{article.click_count.toLocaleString()} reads</span>
        </div>

        {article.images.length > 0 && (
          <div className="my-6">
            <ImageCarousel images={article.images} alt={article.headline} className="aspect-[16/9]" />
          </div>
        )}

        <div className="mt-6 mb-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleRefine}
            disabled={refining}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest px-2.5 py-1.5 border border-ink-deep text-ink-deep hover:bg-ink-deep hover:text-background transition-colors disabled:opacity-60"
            title="Improve grammar and clarity with AI"
          >
            {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {refining ? "Refining…" : refinedBody ? "Show original" : "Refine English"}
          </button>
        </div>

        <div className="prose-newspaper">
          {displayBody.split(/\n\n+/).map((para: string, i: number) => (
            <p
              key={i}
              className={`text-lg leading-[1.75] text-ink mb-5 ${i === 0 ? "dropcap" : ""}`}
              style={{ textAlign: "justify" }}
            >
              {para}
            </p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t-2 border-double border-ink-deep flex justify-between font-mono text-xs uppercase tracking-widest">
          <Link to="/" className="hover:text-accent-red">← Front Page</Link>
          <Link to="/submit" className="hover:text-accent-red">Submit your own →</Link>
        </div>
      </article>
    </div>
  );
}
