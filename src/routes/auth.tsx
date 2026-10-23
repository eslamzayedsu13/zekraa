import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · Sign in — ذِكرى Zekra" },
      { name: "description", content: "Sign in or create your Zekra account to order and track your gifts." },
      { property: "og:title", content: "Sign in — Zekra" },
      { property: "og:description", content: "Your Zekra account." },
    ],
  }),
  component: AuthPage,
});

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <input {...rest} className="h-11 w-full border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground" />
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function AuthPage() {
  const { t } = useI18n();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice(t("reset_sent"));
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: String(f.get("name") ?? "") } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: safePath(redirect) });
        else setNotice(t("check_email"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safePath(redirect) });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (redirect) sessionStorage.setItem("zekra-after-auth", safePath(redirect));
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(t("err_generic"));
    else if (!r.redirected) navigate({ to: safePath(redirect) });
  };

  return (
    <div className="container-ed grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-4xl">{t("auth_title")}</h1>
        {mode !== "forgot" ? (
          <div className="mt-10 grid grid-cols-2 border-b border-border text-sm">
            {(["in", "up"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setNotice(null); }} className={`pb-3 ${mode === m ? "border-b border-foreground" : "text-muted-foreground"}`}>
                {t(m === "in" ? "signin" : "signup")}
              </button>
            ))}
          </div>
        ) : null}
        {notice ? (
          <p className="mt-8 border border-sage bg-sage-soft p-4 text-sm">{notice}</p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "up" ? <Field label={t("full_name")} name="name" required autoComplete="name" /> : null}
            <Field label={t("email")} name="email" type="email" required autoComplete="email" dir="ltr" />
            {mode !== "forgot" ? (
              <Field label={t("password")} name="password" type="password" required minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} dir="ltr" />
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {mode === "forgot" ? t("send_reset") : t(mode === "in" ? "signin" : "signup")}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-xs">
          {mode === "in" ? (
            <button className="link-draw text-muted-foreground" onClick={() => setMode("forgot")}>{t("forgot")}</button>
          ) : mode === "forgot" ? (
            <button className="link-draw text-muted-foreground" onClick={() => { setMode("in"); setNotice(null); }}>{t("back")}</button>
          ) : null}
        </div>
        {mode !== "forgot" ? (
          <>
            <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />{t("or")}<span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={google}>{t("google")}</Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
