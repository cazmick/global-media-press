# Global Media — News Portal

A classic broadsheet-style news site where anyone can submit a story (auto-published) and admins can revert/unpublish. Single Lovable project, multiple routes, shared Lovable Cloud backend.

## Pages

- `/` — Reader homepage (newspaper layout)
  - Masthead "GLOBAL MEDIA" with date/edition line
  - Left column: **Trending Now** (top 5 most-clicked, last 7 days)
  - Center: news feed sorted by **most recent first**
  - Each article card: headline, image carousel (◀ ▶ buttons for multi-image), summary, "Read more"
  - Top-right button: **Submit a Story** → `/submit`
- `/article/$id` — Full article view (increments click count)
- `/submit` — Public submission form: headline, summary, body, multi-image upload, submitter name/email. On submit → auto-published, redirect with confirmation
- `/auth` — Admin email/password login
- `/admin` (protected) — Moderation dashboard: list of all articles (published + reverted), revert/restore/delete actions

## Newspaper aesthetic (Classic Times)

- Palette: paper `#f5f3ee`, rule `#e8e4dd`, ink `#2d2d2d`, deep ink `#0d0d0d`
- Fonts: **Playfair Display** (masthead/headlines), **Lora** (body), **IBM Plex Mono** (kickers/metadata)
- Hairline dividers, drop caps on lead article, multi-column flow on desktop, justified body, vintage paper texture, ALL-CAPS section labels

## Moderation model

Articles auto-publish (`status='published'`). Admin can flip to `reverted` (hidden from reader) or restore. Click counter for trending.

---

## Technical details

**Backend:** Lovable Cloud (Supabase). Enable in same turn.

**Tables (migrations):**
- `articles` — `id, headline, summary, body, images (text[]), submitter_name, submitter_email, status ('published'|'reverted'), click_count (int), created_at, published_at`
- `article_clicks` — `id, article_id, clicked_at` (for 7-day trending window)
- `app_role` enum (`admin`, `user`) + `user_roles` table + `has_role()` security-definer function (per role guidance)

**RLS / GRANTs:**
- `articles`: `GRANT SELECT TO anon, authenticated` (only `status='published'` via policy); `INSERT` open to anon for submissions; `UPDATE/DELETE` only via `has_role(auth.uid(),'admin')`
- `article_clicks`: `INSERT` open (records views); `SELECT` admin only
- `user_roles`: `SELECT` authenticated; managed by service role

**Storage:** Public bucket `article-images` with anon insert + public read for submission uploads.

**Server functions (`src/lib/*.functions.ts`):**
- `submitArticle` — public, validates with Zod, inserts row
- `getPublishedArticles` — public, server publishable client, returns recent published
- `getTrending` — public, top 5 by click count in last 7 days
- `recordClick` — public, inserts into `article_clicks` + increments `click_count`
- `getAllArticlesAdmin` / `revertArticle` / `restoreArticle` / `deleteArticle` — `requireSupabaseAuth` + admin role check

**Routes structure:**
- Public: `/`, `/article/$id`, `/submit`, `/auth`
- Protected: `/_authenticated/admin` (integration-managed gate)

**Components:**
- `Masthead`, `ArticleCard`, `ImageCarousel` (left/right buttons, dot indicators), `TrendingSidebar`, `SubmitForm` (with multi-file image upload), `AdminTable`

**Tailwind v4 theme tokens** in `src/styles.css` for paper/ink palette and `@theme` font families. Fonts loaded via `<link>` in `__root.tsx`.

**Seed:** 5 sample articles via migration so the homepage looks alive immediately.

**Admin bootstrap:** First user to sign up at `/auth` is auto-granted admin role (via trigger checking if `user_roles` is empty), so you can log in and moderate without manual SQL.

---

Approve and I'll build it end-to-end.
