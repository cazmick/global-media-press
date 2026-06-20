import { createFileRoute, Link } from "@tanstack/react-router";
import { Masthead } from "@/components/Masthead";

const URL = "https://global-media-press.lovable.app/education/what-is-citizen-journalism";

export const Route = createFileRoute("/education/what-is-citizen-journalism")({
  head: () => ({
    meta: [
      { title: "What is Citizen Journalism? A Complete Guide — Global Media" },
      { name: "description", content: "Citizen journalism explained: definition, history, why it matters, and how anyone can contribute reporting to independent news platforms like Global Media." },
      { property: "og:title", content: "What is Citizen Journalism? A Complete Guide" },
      { property: "og:description", content: "Citizen journalism explained: definition, history, why it matters, and how anyone can contribute reporting to independent news platforms." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is Citizen Journalism? A Complete Guide",
          description: "A guide to citizen journalism — its definition, history, importance, and how to get started.",
          author: { "@type": "Organization", name: "Global Media" },
          publisher: {
            "@type": "Organization",
            name: "Global Media",
            logo: { "@type": "ImageObject", url: "https://global-media-press.lovable.app/favicon.ico" },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": URL },
        }),
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="kicker mb-3">Education · Guide</div>
        <h1 className="font-display font-black text-4xl sm:text-6xl leading-[1.02] tracking-tight text-ink-deep">
          What is Citizen Journalism?
        </h1>
        <p className="mt-4 text-xl italic text-ink leading-relaxed">
          A practical guide to participatory news — what it is, where it came from, and why it matters more than ever.
        </p>

        <div className="prose-newspaper mt-8 space-y-5 text-lg leading-[1.75] text-ink" style={{ textAlign: "justify" }}>
          <p className="dropcap">
            Citizen journalism is the practice of ordinary people — not trained reporters or employees of a media company — gathering, reporting, analysing and distributing news. A smartphone, an internet connection, and the will to bear witness are the only credentials required. From a protest livestream to a neighbourhood blog to an eyewitness photo of a breaking event, citizen journalism is news produced by the audience itself.
          </p>

          <h2 className="font-display text-3xl mt-8">A short history</h2>
          <p>
            The idea predates the internet — community newsletters, pirate radio and zines all share the same DNA — but the web turbocharged it. Indymedia centres covering the 1999 Seattle WTO protests, the blogger coverage of the 2004 Indian Ocean tsunami, and the citizen video that documented the 2009 protests in Iran each forced mainstream outlets to take amateur reporting seriously. By the 2010s, platforms like Twitter, YouTube and Facebook had become the first place many major stories surfaced.
          </p>

          <h2 className="font-display text-3xl mt-8">Why it matters</h2>
          <p>
            Newsrooms have shrunk. Local papers have closed. Foreign bureaus have been gutted. Citizen journalists fill the gap — covering city-council meetings the regional paper no longer staffs, documenting conflicts in places no foreign correspondent can safely reach, and holding institutions to account in towns where the watchdogs have left. Just as importantly, citizen reporting diversifies whose stories get told and whose voices get heard.
          </p>

          <h2 className="font-display text-3xl mt-8">The principles that still apply</h2>
          <p>
            A citizen journalist isn't bound by a newsroom style guide, but the basic ethics of reporting still hold: verify before you publish, attribute your sources, separate fact from opinion, and correct mistakes openly. Photos and videos should be presented in context, not cropped to mislead. When you don't know something, say so.
          </p>

          <h2 className="font-display text-3xl mt-8">How to get started</h2>
          <p>
            Start with what you know. A story you witnessed firsthand, a meeting you attended, a problem in your neighbourhood — the most valuable reporting is often the most local. Write clearly, lead with the most important fact, and tell the reader why the story matters. If you have photos or short clips, include them. If you can quote the people involved, do.
          </p>

          <h2 className="font-display text-3xl mt-8">Publish on Global Media</h2>
          <p>
            Global Media is a citizen-journalism platform: stories you submit publish to the front page instantly, with full credit to you as the reporter. Our editors moderate after publication, not before, so urgent news doesn't sit in a queue. If you've got a story the world should read, we want it.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t-2 border-double border-ink-deep flex justify-between font-mono text-xs uppercase tracking-widest">
          <Link to="/" className="hover:text-accent-red">← Front Page</Link>
          <Link to="/submit" className="hover:text-accent-red">Submit your story →</Link>
        </div>
      </article>
    </div>
  );
}
