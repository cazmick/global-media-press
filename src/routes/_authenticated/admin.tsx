import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Masthead } from "@/components/Masthead";
import { supabase } from "@/integrations/supabase/client";
import {
  getAllArticlesAdmin, setArticleStatus, deleteArticle, isCurrentUserAdmin,
} from "@/lib/articles.functions";
import { toast } from "sonner";
import { ArrowUpCircle, ArrowDownCircle, Trash2, LogOut, ShieldAlert, Loader2, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Newsroom — Global Media" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const adminCheck = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => isCurrentUserAdmin(),
  });

  const articlesFn = useServerFn(getAllArticlesAdmin);
  const setStatusFn = useServerFn(setArticleStatus);
  const deleteFn = useServerFn(deleteArticle);

  const articlesQ = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: () => articlesFn(),
    enabled: adminCheck.data?.isAdmin === true,
  });

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: "published" | "reverted" }) =>
      setStatusFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article deleted");
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/IamBoss", replace: true });
  }

  if (adminCheck.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Masthead />
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      </div>
    );
  }

  if (adminCheck.data && !adminCheck.data.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Masthead />
        <div className="max-w-xl mx-auto p-12 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-accent-red" />
          <h1 className="font-display text-3xl mt-3">Editors Only</h1>
          <p className="text-ink-muted mt-2">Your account doesn't have moderation access.</p>
          <button onClick={signOut} className="mt-6 font-mono text-xs uppercase tracking-widest underline">Sign out</button>
        </div>
      </div>
    );
  }

  const articles = articlesQ.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Masthead />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between border-b border-paper-rule pb-3 mb-6">
          <div>
            <p className="kicker">Newsroom</p>
            <h1 className="font-display text-3xl">Moderation Desk</h1>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 border border-ink-deep px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-ink-deep hover:text-paper"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        {articlesQ.isLoading ? (
          <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto border border-paper-rule bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper-rule">
                <tr className="text-left font-mono text-[11px] uppercase tracking-widest">
                  <th className="px-3 py-2">Headline</th>
                  <th className="px-3 py-2">Submitter</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Reads</th>
                  <th className="px-3 py-2">Published</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-t border-paper-rule align-top">
                    <td className="px-3 py-3">
                      {a.status === "published" ? (
                        <Link to="/article/$id" params={{ id: a.id }} className="font-display text-base hover:text-accent-red">
                          {a.headline}
                        </Link>
                      ) : (
                        <span className="font-display text-base text-ink-muted line-through">{a.headline}</span>
                      )}
                      {a.category && <div className="kicker mt-1">{a.category}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div>{a.submitter_name}</div>
                      {a.submitter_email && <div className="text-xs text-ink-muted">{a.submitter_email}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                        a.status === "published" ? "bg-ink-deep text-paper" : "bg-accent-red text-paper"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{a.click_count.toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-ink-muted">
                      {new Date(a.published_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "published" ? (
                          <ActionBtn onClick={() => setStatus.mutate({ id: a.id, status: "reverted" })}>
                            <ArrowDownCircle className="w-3.5 h-3.5" /> Revert
                          </ActionBtn>
                        ) : (
                          <ActionBtn onClick={() => setStatus.mutate({ id: a.id, status: "published" })}>
                            <ArrowUpCircle className="w-3.5 h-3.5" /> Restore
                          </ActionBtn>
                        )}
                        <ActionBtn
                          danger
                          onClick={() => {
                            if (confirm(`Permanently delete "${a.headline}"?`)) del.mutate(a.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-ink-muted">No articles.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
        danger
          ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "border-ink-deep hover:bg-ink-deep hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
