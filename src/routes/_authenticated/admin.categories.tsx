import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: Categories });

const input = "h-9 w-full border border-border bg-transparent px-2 text-sm outline-none focus:border-foreground";

function Categories() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data ?? [],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };

  const save = async (e: React.FormEvent<HTMLFormElement>, id?: string) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = { slug: String(f.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"), name_ar: String(f.get("name_ar")), name_en: String(f.get("name_en")), sort: Number(f.get("sort") || 0) };
    const { error } = id ? await supabase.from("categories").update(row).eq("id", id) : await supabase.from("categories").insert(row);
    if (error) toast.error(error.message);
    else { toast.success(t("saved")); if (!id) e.currentTarget.reset(); refresh(); }
  };

  const Row = ({ c }: { c?: (typeof data)[number] }) => (
    <form onSubmit={(e) => save(e, c?.id)} className="grid grid-cols-2 items-end gap-2 border-b border-border py-3 md:grid-cols-[1fr_1fr_1fr_80px_auto_auto]">
      <input name="name_ar" defaultValue={c?.name_ar} placeholder="الاسم" required className={input} dir="rtl" />
      <input name="name_en" defaultValue={c?.name_en} placeholder="Name" required className={input} dir="ltr" />
      <input name="slug" defaultValue={c?.slug} placeholder="slug" required className={input} dir="ltr" />
      <input name="sort" type="number" defaultValue={c?.sort ?? 0} className={input} />
      <Button size="sm" type="submit">{c ? t("save") : pick("إضافة", "Add")}</Button>
      {c ? (
        <Button size="sm" type="button" variant="ghost" onClick={async () => {
          if (!confirm(pick("حذف الفئة؟", "Delete category?"))) return;
          const { error } = await supabase.from("categories").delete().eq("id", c.id);
          if (error) toast.error(error.message); else refresh();
        }}>{t("delete")}</Button>
      ) : <span />}
    </form>
  );

  return (
    <div className="max-w-4xl">
      {data.map((c) => <Row key={c.id} c={c} />)}
      <p className="eyebrow mt-10">{pick("فئة جديدة", "New category")}</p>
      <Row />
    </div>
  );
}
