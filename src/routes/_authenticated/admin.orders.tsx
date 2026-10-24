import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { ORDER_FLOW, statusKey } from "@/components/store/StatusTimeline";
import { Price } from "@/components/store/Price";
import { OrderView } from "./account.orders.$id";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: AdminOrders });

const STATUSES = [...ORDER_FLOW, "cancelled"] as const;

function AdminOrders() {
  const { t, pick, lang } = useI18n();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("id,order_number,status,total,created_at,contact_name,contact_phone,governorate").order("created_at", { ascending: false })).data ?? [],
  });
  const list = filter === "all" ? data : data.filter((o) => o.status === filter);

  const update = async (id: string, status: (typeof STATUSES)[number]) => {
    if (status === "cancelled" && !confirm(pick("إلغاء الطلب وإرجاع المخزون؟", "Cancel this order and restock items?"))) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("saved")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["order", id] }); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`border px-3 py-1.5 ${filter === s ? "border-foreground bg-foreground text-background" : "border-border"}`}>
            {s === "all" ? pick("الكل", "All") : t(statusKey(s))}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="eyebrow border-b border-border text-start">
            <tr>{["#", t("order_date"), t("full_name"), t("governorate"), t("total"), t("status")].map((h) => <th key={h} className="py-3 text-start font-normal">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((o) => (
              <>
                <tr key={o.id} className="cursor-pointer hover:bg-paper" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <td className="py-3 font-display text-base">{o.order_number}</td>
                  <td>{formatDate(o.created_at, lang)}</td>
                  <td>{o.contact_name}<span className="block text-xs text-muted-foreground" dir="ltr">{o.contact_phone}</span></td>
                  <td>{o.governorate}</td>
                  <td><Price amount={o.total} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={o.status}
                      disabled={o.status === "cancelled"}
                      onChange={(e) => update(o.id, e.target.value as (typeof STATUSES)[number])}
                      className="border border-border bg-transparent px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{t(statusKey(s))}</option>)}
                    </select>
                  </td>
                </tr>
                {open === o.id ? (
                  <tr key={o.id + "-d"}><td colSpan={6} className="bg-paper p-6"><OrderView id={o.id} /></td></tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
