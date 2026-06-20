import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type ArticleDTO = {
  id: string;
  headline: string;
  summary: string;
  body: string;
  images: string[];
  submitter_name: string | null;
  category: string | null;
  status: string;
  click_count: number;
  published_at: string;
  created_at: string;
};

export const getPublishedArticles = createServerFn({ method: "GET" }).handler(
  async (): Promise<ArticleDTO[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("articles")
      .select("id,headline,summary,body,images,submitter_name,category,status,click_count,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const getArticleById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<ArticleDTO | null> => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("articles")
      .select("id,headline,summary,body,images,submitter_name,category,status,click_count,published_at,created_at")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getTrending = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pick<ArticleDTO, "id" | "headline" | "click_count" | "category">[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("articles")
      .select("id,headline,click_count,category")
      .eq("status", "published")
      .order("click_count", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const recordClick = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("article_clicks").insert({ article_id: data.id });
    const { data: row } = await supabaseAdmin
      .from("articles").select("click_count").eq("id", data.id).maybeSingle();
    if (row) {
      await supabaseAdmin
        .from("articles")
        .update({ click_count: (row.click_count ?? 0) + 1 })
        .eq("id", data.id);
    }
    return { ok: true };
  });

const SubmitSchema = z.object({
  headline: z.string().min(8).max(200),
  summary: z.string().min(20).max(500),
  body: z.string().min(40).max(20000),
  category: z.string().max(40).optional().nullable(),
  submitter_name: z.string().min(2).max(80),
  submitter_email: z.string().email().optional().or(z.literal("")),
  images: z.array(z.string().url()).max(8).default([]),
});

export const submitArticle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .insert({
        headline: data.headline,
        summary: data.summary,
        body: data.body,
        category: data.category || null,
        submitter_name: data.submitter_name,
        submitter_email: data.submitter_email || null,
        images: data.images,
        status: "published",
        click_count: 0,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

/* -------------------- Admin -------------------- */

async function assertAdmin(ctx: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data, error } = await ctx.supabase
    .rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

export const getAllArticlesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("id,headline,summary,images,submitter_name,submitter_email,category,status,click_count,published_at,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setArticleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "published" | "reverted" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["published", "reverted"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("articles").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context as { supabase: ReturnType<typeof publicClient>; userId: string }).supabase
      .rpc("has_role", { _user_id: (context as { userId: string }).userId, _role: "admin" });
    return { isAdmin: !!data };
  });
