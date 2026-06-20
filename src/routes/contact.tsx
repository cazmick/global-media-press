import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Masthead } from "@/components/Masthead";
import { submitContactMessage } from "@/lib/contact.functions";
import { Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Global Media" },
      { name: "description", content: "Get in touch with the Global Media newsroom. Send tips, questions, or feedback — we read every message." },
      { property: "og:title", content: "Contact Us — Global Media" },
      { property: "og:description", content: "Get in touch with the Global Media newsroom. Send tips, questions, or feedback — we read every message." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://global-media-press.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://global-media-press.lovable.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const send = useServerFn(submitContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await send({ data: { name, email, message } });
      const subject = encodeURIComponent(`Global Media inquiry from ${name}`);
      const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
      window.location.href = `mailto:kanishkamogha20@gmail.com?subject=${subject}&body=${body}`;
      setSent(true);
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      setError((err as Error).message || "Could not send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="border-b border-paper-rule pb-4 mb-6">
          <p className="kicker">Get in touch</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-1">Contact Us</h1>
          <p className="mt-2 text-ink-muted">
            Tips, corrections, questions — drop us a line and the newsroom will read it.
          </p>
        </div>

        {sent ? (
          <div className="border border-paper-rule p-6 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-accent-red shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-2xl">Message received</h2>
              <p className="mt-1 text-ink-muted">Thanks for reaching out. We'll get back to you if a reply is needed.</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setSent(false)}
                  className="font-mono text-xs uppercase tracking-widest border border-ink-deep px-4 py-2 hover:bg-paper-rule"
                >
                  Send another
                </button>
                <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink-deep self-center">
                  ← Back to front page
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Your name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required minLength={1} maxLength={100}
                className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
              />
            </Field>

            <Field label="Your email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required maxLength={255}
                className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
              />
            </Field>

            <Field label="Message" required>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required minLength={1} maxLength={2000} rows={8}
                className="w-full bg-paper border border-paper-rule px-3 py-2 font-serif leading-relaxed focus:outline-none focus:border-ink-deep"
              />
            </Field>

            {error && <p className="text-accent-red font-mono text-xs">{error}</p>}

            <div className="flex items-center justify-between pt-4 border-t border-paper-rule">
              <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink-deep">← Cancel</Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-ink-deep text-paper px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent-red disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Message
              </button>
            </div>
          </form>
        )}
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
