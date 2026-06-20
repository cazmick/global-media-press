import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Masthead } from "@/components/Masthead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Editor Sign In — Global Media" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
      }
      toast.success("Signed in");
      navigate({ to: "/admin", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="border border-paper-rule p-6 bg-card">
          <p className="kicker">Editor Access</p>
          <h1 className="font-display text-3xl mt-1 mb-4">
            {mode === "signin" ? "Sign In" : "Create Editor Account"}
          </h1>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email" required placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
            />
            <input
              type="password" required placeholder="Password" minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-paper border border-paper-rule px-3 py-2 focus:outline-none focus:border-ink-deep"
            />
            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-ink-deep text-paper px-4 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-accent-red disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="mt-4 text-xs text-ink-muted text-center">
            {mode === "signin" ? (
              <>No account? <button onClick={() => setMode("signup")} className="underline">Create one</button> — the first account becomes admin.</>
            ) : (
              <>Already have one? <button onClick={() => setMode("signin")} className="underline">Sign in</button></>
            )}
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink-deep">← Back to Front Page</Link>
        </div>
      </div>
    </div>
  );
}
