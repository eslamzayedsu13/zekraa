import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { Price } from "@/components/store/Price";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function Customers() {
  const { t, pick, lang } = useI18n();
  const { data = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [p, o] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id,total,status"),
      ]);
      return (p.data ?? []).map((c) => {
        const mine = (o.data ?? []).filter((x) => x.user_id === c.id && x.status !== "cancelled");
        return { ...c, orders: mine.length, spent: mine.reduce((s, x) => s + x.total, 0) };
      });
    },
  });
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="eyebrow border-b border-border">
          <tr>{[t("full_name"), t("email"), t("phone"), pick("منذ", "Since"), t("orders"), pick("الإنفاق", "Spent")].map((h) => <th key={h} className="py-3 text-start font-normal">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((c) => (
            <tr key={c.id}>
              <td className="py-3">{c.full_name ?? "—"}</td>
              <td dir="ltr" className="text-start">{c.email}</td>
              <td dir="ltr" className="text-start">{c.phone ?? "—"}</td>
              <td>{formatDate(c.created_at, lang)}</td>
              <td>{formatNumber(c.orders, lang)}</td>
              <td><Price amount={c.spent} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
