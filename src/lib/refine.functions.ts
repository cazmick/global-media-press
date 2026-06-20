import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ text: z.string().min(1).max(20000) });

export const refineEnglish = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an English copy editor. Improve grammar, spelling, clarity and flow of the given article text. Preserve meaning, paragraph breaks, names and facts. Do not add or remove information. Return ONLY the refined text, no preamble.",
          },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`Refine failed (${res.status})`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const refined = json.choices?.[0]?.message?.content?.trim();
    if (!refined) throw new Error("No refined text returned");
    return { refined };
  });
