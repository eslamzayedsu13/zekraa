import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Field } from "./auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "كلمة مرور جديدة · Reset password — Zekra" },
      { name: "description", content: "Choose a new password for your Zekra account." },
      { property: "og:title", content: "Reset password — Zekra" },
      { property: "og:description", content: "Choose a new password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <div className="container-ed grid min-h-[60vh] place-items-center py-16">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const password = String(new FormData(e.currentTarget).get("password"));
          const { error } = await supabase.auth.updateUser({ password });
          setBusy(false);
          if (error) return toast.error(error.message);
          toast.success(t("saved"));
          navigate({ to: "/account" });
        }}
      >
        <h1 className="mb-8 text-4xl">{t("update_password")}</h1>
        <Field label={t("new_password")} name="password" type="password" minLength={8} required dir="ltr" />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{t("update_password")}</Button>
      </form>
    </div>
  );
}
