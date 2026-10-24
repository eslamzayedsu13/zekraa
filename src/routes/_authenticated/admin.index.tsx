import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { pick, price, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [orders, products, variants, customers] = await Promise.all([
        supabase.from("orders").select("status,total"),
        supabase.from("products").select("id,name_ar,name_en,stock,product_variants(stock)"),
        supabase.from("product_variants").select("id"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const os = orders.data ?? [];
      const low = (products.data ?? []).filter((p) => {
        const s = p.product_variants.length ? p.product_variants.reduce((a, v) => a + v.stock, 0) : p.stock;
        return s <= 5;
      });
      return {
        revenue: os.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
        pending: os.filter((o) => o.status === "pending").length,
        orders: os.length,
        customers: customers.count ?? 0,
        low,
        variants: variants.data?.length ?? 0,
      };
    },
  });
  const stats = [
    { label: pick("المبيعات (غير الملغاة)", "Sales (excl. cancelled)"), value: data ? price(data.revenue) : "—" },
    { label: pick("الطلبات", "Orders"), value: data ? formatNumber(data.orders, lang) : "—" },
    { label: pick("بانتظار المراجعة", "Pending review"), value: data ? formatNumber(data.pending, lang) : "—" },
    { label: pick("العملاء", "Customers"), value: data ? formatNumber(data.customers, lang) : "—" },
  ];
  return (
    <div className="space-y-14">
      <div className="grid grid-cols-2 border-y border-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-border p-5 odd:border-e md:border-e md:last:border-e-0">
            <p className="eyebrow">{s.label}</p>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-4 text-2xl">{pick("مخزون منخفض", "Low stock")}</h2>
        {data?.low.length ? (
          <ul className="divide-y divide-border border-y border-border text-sm">
            {data.low.map((p) => (
              <li key={p.id} className="flex justify-between py-3">
                <span>{pick(p.name_ar, p.name_en)}</span>
                <Link to="/admin/products" className="link-draw text-rose-deep">{pick("تحديث", "Update")}</Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">—</p>}
      </div>
    </div>
  );
}
