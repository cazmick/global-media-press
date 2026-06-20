import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Masthead } from "@/components/Masthead";
import { submitArticle } from "@/lib/articles.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Upload, Loader2 } from "lucide-react";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a Story — Global Media" },
      { name: "description", content: "Have a story the world should read? Submit your news to Global Media — it publishes instantly to the front page." },
      { property: "og:title", content: "Submit a Story — Global Media" },
      { property: "og:description", content: "Have a story the world should read? Submit your news to Global Media — it publishes instantly to the front page." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://global-media-press.lovable.app/submit" },
    ],
    links: [{ rel: "canonical", href: "https://global-media-press.lovable.app/submit" }],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const submit = useServerFn(submitArticle);
  const navigate = useNavigate();
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 8 - images.length)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("article-images").upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("article-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((p) => [...p, ...uploaded]);
    } catch (e) {
      toast.error("Image upload failed: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          headline, body,
          category: category || null,
          submitter_name: name,
          submitter_email: email,
          images,
        },
      });
      toast.success("Story published!");
      navigate({ to: "/article/$id", params: { id: res.id } });
    } catch (e) {
      toast.error("Could not publish: " + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="border-b border-paper-rule pb-4 mb-6">
          <p className="kicker">The Newsroom</p>
          <h1 className="font-display text-3xl sm:text-5xl mt-1">Submit a Story</h1>
          <p className="mt-2 text-sm sm:text-base text-ink-muted">
            Stories publish to the front page instantly. Our editors may revert anything that breaches our standards.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Headline" required>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              minLength={8}
              required
              placeholder="Make it count."
              className="w-full bg-paper border border-paper-rule px-3 py-2 font-display text-2xl focus:outline-none focus:border-ink-deep"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Category">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="World, Business, Tech, Sport, Culture…"
                className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
              />
            </Field>
            <Field label="Your name (optional)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank to publish anonymously"
                className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
              />
            </Field>
          </div>

          <Field label="Your email (optional)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
            />
          </Field>

          <Field label="Full story" required>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required minLength={40} rows={10}
              placeholder="Separate paragraphs with a blank line."
              className="w-full bg-paper border border-paper-rule px-3 py-2 font-serif leading-relaxed focus:outline-none focus:border-ink-deep"
            />
          </Field>

          <Field label={`Images (${images.length}/8)`}>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.map((url, i) => (
                    <div key={url} className="relative aspect-square border border-paper-rule">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-ink-deep text-paper p-0.5 hover:bg-accent-red"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-ink-deep px-4 py-3 hover:bg-paper-rule transition">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="font-mono text-xs uppercase tracking-widest">
                  {uploading ? "Uploading…" : "Add images"}
                </span>
                <input
                  type="file" accept="image/*" multiple className="hidden"
                  disabled={uploading || images.length >= 8}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </div>
          </Field>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-paper-rule">
            <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink-deep order-2 sm:order-1">← Cancel</Link>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="order-1 sm:order-2 inline-flex items-center justify-center gap-2 bg-ink-deep text-paper px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent-red disabled:opacity-50 w-full sm:w-auto"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish to Front Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="kicker mb-1 block">{label}{required && <span className="text-accent-red"> *</span>}</span>
      {children}
    </label>
  );
}
