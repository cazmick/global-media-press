import { createFileRoute } from "@tanstack/react-router";

const SOURCES = [
  // Existing outlets
  { continent: "North America", outlet: "The New York Times", country: "USA" },
  { continent: "South America", outlet: "Folha de S.Paulo", country: "Brazil" },
  { continent: "Europe", outlet: "BBC News", country: "United Kingdom" },
  { continent: "Africa", outlet: "News24", country: "South Africa" },
  { continent: "Oceania", outlet: "ABC News", country: "Australia" },
  { continent: "Asia (ex-India)", outlet: "The Asahi Shimbun", country: "Japan" },

  // Additional international TV / wire outlets
  { continent: "Europe", outlet: "BBC News UK", country: "UK" },
  { continent: "North America", outlet: "CNN International", country: "USA" },
  { continent: "Middle East", outlet: "Al Jazeera English", country: "Qatar" },
  { continent: "Europe", outlet: "Sky News", country: "UK" },
  { continent: "Europe", outlet: "France 24", country: "France" },
  { continent: "Europe", outlet: "DW News", country: "Germany" },
  { continent: "Europe", outlet: "Euronews", country: "Europe" },
  { continent: "North America", outlet: "Bloomberg Television", country: "USA" },
  { continent: "North America", outlet: "CNBC", country: "USA" },
  { continent: "North America", outlet: "Fox News", country: "USA" },
];

type Drafted = { headline: string; summary: string; body: string };

async function draftStory(src: typeof SOURCES[number], apiKey: string): Promise<Drafted | null> {
  const prompt = `You are a wire-service editor for an Indian news portal. Write a single, original news brief summarizing how ${src.outlet} (${src.country}, ${src.continent}) — a leading outlet on its continent — has recently covered or commented on India (politics, economy, diplomacy, culture, sport, climate, or tech). Focus on what they think of India.

LANGUAGE: Output MUST be in natural, fluent English only. If the original source language is not English (e.g. Portuguese, Japanese), translate everything to English first. Do NOT include any non-English words, characters, or scripts (no Japanese, Chinese, Cyrillic, Portuguese diacritics in body text beyond proper nouns). Proper nouns may keep standard romanized spelling.

Return STRICT JSON with this shape and nothing else:
{"headline": "...", "summary": "...", "body": "..."}

Rules:
- headline: 8-110 chars, factual English, no clickbait, mention the outlet or country.
- summary: 1-2 English sentences, <= 280 chars.
- body: 3-5 short English paragraphs (<= 1800 chars total). Paraphrase only — do NOT fabricate direct quotes or specific dates. Attribute clearly ("According to ${src.outlet}…"). End with a one-line "Source: ${src.outlet} (${src.country})" line.
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

        // Dedup window: skip outlets that already posted within the last 2.5 hours
        // (cron runs every 3h, so this catches overlapping/retry runs without blocking the next cycle).
        const DEDUP_HOURS = 2.5;
        const sinceIso = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000).toISOString();

        for (const src of SOURCES) {
          try {
            const submitterTag = `${src.outlet} digest`;

            // 1) Skip if this outlet posted recently
            const { data: recent } = await supabaseAdmin
              .from("articles")
              .select("id")
              .eq("submitter_name", submitterTag)
              .gte("published_at", sinceIso)
              .limit(1);
            if (recent && recent.length > 0) {
              results.push({ outlet: src.outlet, ok: false, error: "skipped_recent_duplicate" });
              continue;
            }

            const draft = await draftStory(src, apiKey);
            if (!draft) {
              results.push({ outlet: src.outlet, ok: false, error: "draft_failed" });
              continue;
            }
            const headline = draft.headline.slice(0, 200);
            const summary = (draft.summary || "").slice(0, 500);
            let body = draft.body.slice(0, 20000);

            // Safety net: if any non-Latin script slipped through, re-ask the model to translate.
            const nonEnglish = /[\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;
            if (nonEnglish.test(headline + summary + body)) {
              const fix = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: "google/gemini-3-flash-preview",
                  messages: [
                    { role: "system", content: "Translate the user text to natural fluent English. Return only the translated text, no preamble." },
                    { role: "user", content: body },
                  ],
                }),
              });
              if (fix.ok) {
                const fj = await fix.json();
                const t = fj?.choices?.[0]?.message?.content?.trim();
                if (t) body = t.slice(0, 20000);
              }
            }

            // 2) Skip if an article with this exact headline already exists
            const { data: dupHeadline } = await supabaseAdmin
              .from("articles")
              .select("id")
              .ilike("headline", headline)
              .limit(1);
            if (dupHeadline && dupHeadline.length > 0) {
              results.push({ outlet: src.outlet, ok: false, error: "skipped_duplicate_headline" });
              continue;
            }

            const { data, error } = await supabaseAdmin
              .from("articles")
              .insert({
                headline,
                summary,
                body,
                category: "World on India",
                submitter_name: submitterTag,
                submitter_email: null,
                images: [],
                status: "published",
                click_count: 0,
                published_at: new Date().toISOString(),
              })
              .select("id")
              .single();

            if (error) {
              // 3) Unique-index race: another concurrent run inserted the same headline
              const msg = error.message || "";
              if (msg.includes("articles_headline_unique_idx") || (error as { code?: string }).code === "23505") {
                results.push({ outlet: src.outlet, ok: false, error: "skipped_duplicate_headline" });
              } else {
                results.push({ outlet: src.outlet, ok: false, error: msg });
              }
            } else {
              results.push({ outlet: src.outlet, ok: true, id: data.id });
            }
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
