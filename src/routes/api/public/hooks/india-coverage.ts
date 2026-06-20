import { createFileRoute } from "@tanstack/react-router";

const SOURCES = [
  { continent: "North America", outlet: "The New York Times", country: "USA" },
  { continent: "South America", outlet: "Folha de S.Paulo", country: "Brazil" },
  { continent: "Europe", outlet: "BBC News", country: "United Kingdom" },
  { continent: "Africa", outlet: "News24", country: "South Africa" },
  { continent: "Oceania", outlet: "ABC News", country: "Australia" },
  { continent: "Asia (ex-India)", outlet: "The Asahi Shimbun", country: "Japan" },
];

type Drafted = { headline: string; summary: string; body: string };

async function draftStory(src: typeof SOURCES[number], apiKey: string): Promise<Drafted | null> {
  const prompt = `You are a wire-service editor for an Indian news portal. Write a single, original news brief summarizing how ${src.outlet} (${src.country}, ${src.continent}) — a leading outlet on its continent — has recently covered or commented on India (politics, economy, diplomacy, culture, sport, climate, or tech). Focus on what they think of India.

Return STRICT JSON with this shape and nothing else:
{"headline": "...", "summary": "...", "body": "..."}

Rules:
- headline: 8-110 chars, factual, no clickbait, mention the outlet or country.
- summary: 1-2 sentences, <= 280 chars.
- body: 3-5 short paragraphs (<= 1800 chars total). Paraphrase only — do NOT fabricate direct quotes or specific dates. Attribute clearly ("According to ${src.outlet}…"). End with a one-line "Source: ${src.outlet} (${src.country})" line.
- Neutral, encyclopedic tone. No emojis. No markdown.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You return only valid JSON. No prose, no code fences." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    console.error("AI gateway error", src.outlet, res.status, await res.text().catch(() => ""));
    return null;
  }
  const j = await res.json();
  const text: string = j?.choices?.[0]?.message?.content ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed?.headline && parsed?.body) return parsed as Drafted;
  } catch (e) {
    console.error("Parse fail", src.outlet, cleaned.slice(0, 200));
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/india-coverage")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const results: Array<{ outlet: string; ok: boolean; id?: string; error?: string }> = [];

        for (const src of SOURCES) {
          try {
            const draft = await draftStory(src, apiKey);
            if (!draft) {
              results.push({ outlet: src.outlet, ok: false, error: "draft_failed" });
              continue;
            }
            const headline = draft.headline.slice(0, 200);
            const summary = (draft.summary || "").slice(0, 500);
            const body = draft.body.slice(0, 20000);

            const { data, error } = await supabaseAdmin
              .from("articles")
              .insert({
                headline,
                summary,
                body,
                category: "World on India",
                submitter_name: `${src.outlet} digest`,
                submitter_email: null,
                images: [],
                status: "published",
                click_count: 0,
                published_at: new Date().toISOString(),
              })
              .select("id")
              .single();

            if (error) results.push({ outlet: src.outlet, ok: false, error: error.message });
            else results.push({ outlet: src.outlet, ok: true, id: data.id });
          } catch (e) {
            results.push({ outlet: src.outlet, ok: false, error: (e as Error).message });
          }
        }

        return new Response(
          JSON.stringify({ ok: true, ranAt: new Date().toISOString(), results }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
