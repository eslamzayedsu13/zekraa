import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { IMAGE_LIBRARY, resolveImage } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Price } from "@/components/store/Price";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: AdminProducts });

const input = "h-9 w-full border border-border bg-transparent px-2 text-sm outline-none focus:border-foreground";

type VariantDraft = { id?: string; name_ar: string; name_en: string; price_delta: number; stock: number };

function AdminProducts() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*, product_variants(*)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort"),
      ]);
      return { products: p.data ?? [], categories: c.data ?? [] };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };
  const products = data?.products ?? [];
  const current = editing && editing !== "new" ? products.find((p) => p.id === editing) : undefined;

  const quickStock = async (table: "products" | "product_variants", id: string, stock: number) => {
    const { error } = await supabase.from(table).update({ stock: Math.max(0, stock) }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setEditing("new")}>{pick("منتج جديد", "New product")}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="eyebrow border-b border-border">
            <tr>{["", pick("المنتج", "Product"), pick("السعر", "Price"), pick("المخزون", "Stock"), pick("الحالة", "Status"), ""].map((h, i) => <th key={i} className="py-3 text-start font-normal">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="py-3 pe-3"><img src={resolveImage(p.images[0])} alt="" width={48} height={60} className="h-15 w-12 object-cover" /></td>
                <td className="py-3">{pick(p.name_ar, p.name_en)}<span className="block text-xs text-muted-foreground" dir="ltr">{p.slug}</span></td>
                <td className="py-3"><Price amount={p.price} /></td>
                <td className="py-3">
                  {p.product_variants.length ? (
                    <ul className="space-y-1">
                      {p.product_variants.map((v) => (
                        <li key={v.id} className="flex items-center gap-2 text-xs">
                          <span className="w-24 truncate">{pick(v.name_ar, v.name_en)}</span>
                          <input type="number" min={0} defaultValue={v.stock} className="h-7 w-16 border border-border bg-transparent px-1"
                            onBlur={(e) => Number(e.target.value) !== v.stock && quickStock("product_variants", v.id, Number(e.target.value))} aria-label="stock" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <input type="number" min={0} defaultValue={p.stock} className="h-7 w-16 border border-border bg-transparent px-1 text-xs"
                      onBlur={(e) => Number(e.target.value) !== p.stock && quickStock("products", p.id, Number(e.target.value))} aria-label="stock" />
                  )}
                </td>
                <td className="py-3 text-xs">{p.active ? pick("ظاهر", "Live") : pick("مخفي", "Hidden")}</td>
                <td className="py-3 text-end"><button className="link-draw text-xs" onClick={() => setEditing(p.id)}>{pick("تعديل", "Edit")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-sm bg-background">
          <DialogHeader><DialogTitle className="font-display text-2xl font-normal">{current ? pick(current.name_ar, current.name_en) : pick("منتج جديد", "New product")}</DialogTitle></DialogHeader>
          {editing ? (
            <ProductForm
              key={editing}
              product={current}
              categories={data?.categories ?? []}
              onDone={() => { setEditing(null); refresh(); toast.success(t("saved")); }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, categories, onDone }: {
  product?: { id: string; slug: string; name_ar: string; name_en: string; description_ar: string; description_en: string; price: number; compare_at_price: number | null; stock: number; images: string[]; category_id: string | null; featured: boolean; bestseller: boolean; active: boolean; allow_engraving: boolean; engraving_price: number; product_variants: { id: string; name_ar: string; name_en: string; price_delta: number; stock: number }[] };
  categories: { id: string; name_ar: string; name_en: string }[];
  onDone: () => void;
}) {
  const { pick, t } = useI18n();
  const [images, setImages] = useState<string[]>(product?.images ?? ["giftbox"]);
  const [url, setUrl] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>(product?.product_variants.map((v) => ({ ...v })) ?? []);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = (k: string) => Number(f.get(k) || 0);
    const row = {
      slug: String(f.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name_ar: String(f.get("name_ar")), name_en: String(f.get("name_en")),
      description_ar: String(f.get("description_ar")), description_en: String(f.get("description_en")),
      price: n("price"), compare_at_price: f.get("compare_at_price") ? n("compare_at_price") : null,
      stock: n("stock"), images, category_id: String(f.get("category_id")) || null,
      featured: f.get("featured") === "on", bestseller: f.get("bestseller") === "on", active: f.get("active") === "on",
      allow_engraving: f.get("allow_engraving") === "on", engraving_price: n("engraving_price"),
    };
    setBusy(true);
    const res = product
      ? await supabase.from("products").update(row).eq("id", product.id).select("id").single()
      : await supabase.from("products").insert(row).select("id").single();
    if (res.error) { setBusy(false); return toast.error(res.error.message); }
    const pid = res.data.id;
    const keep = variants.filter((v) => v.id).map((v) => v.id!);
    const removed = (product?.product_variants ?? []).filter((v) => !keep.includes(v.id)).map((v) => v.id);
    if (removed.length) await supabase.from("product_variants").delete().in("id", removed);
    for (const [i, v] of variants.entries()) {
      const vr = { product_id: pid, name_ar: v.name_ar, name_en: v.name_en, price_delta: v.price_delta, stock: v.stock, sort: i };
      const r = v.id ? await supabase.from("product_variants").update(vr).eq("id", v.id) : await supabase.from("product_variants").insert(vr);
      if (r.error) { setBusy(false); return toast.error(r.error.message); }
    }
    setBusy(false);
    onDone();
  };

  const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <L label="الاسم (عربي)"><input name="name_ar" defaultValue={product?.name_ar} required className={input} dir="rtl" /></L>
        <L label="Name (English)"><input name="name_en" defaultValue={product?.name_en} required className={input} dir="ltr" /></L>
        <L label="الوصف"><textarea name="description_ar" defaultValue={product?.description_ar} rows={3} className={`${input} h-auto py-2`} dir="rtl" /></L>
        <L label="Description"><textarea name="description_en" defaultValue={product?.description_en} rows={3} className={`${input} h-auto py-2`} dir="ltr" /></L>
        <L label="Slug"><input name="slug" defaultValue={product?.slug} required className={input} dir="ltr" /></L>
        <L label={pick("الفئة", "Category")}>
          <select name="category_id" defaultValue={product?.category_id ?? ""} className={input}>
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{pick(c.name_ar, c.name_en)}</option>)}
          </select>
        </L>
        <L label={pick("السعر (ج.م)", "Price (EGP)")}><input name="price" type="number" min={0} defaultValue={product?.price} required className={input} /></L>
        <L label={pick("السعر قبل الخصم", "Compare-at price")}><input name="compare_at_price" type="number" min={0} defaultValue={product?.compare_at_price ?? ""} className={input} /></L>
        <L label={pick("المخزون (بدون خيارات)", "Stock (no variants)")}><input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className={input} /></L>
        <L label={pick("سعر الحفر", "Engraving price")}><input name="engraving_price" type="number" min={0} defaultValue={product?.engraving_price ?? 0} className={input} /></L>
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        {([["active", pick("ظاهر في المتجر", "Live"), product?.active ?? true], ["featured", pick("مختارات", "Featured"), product?.featured], ["bestseller", pick("الأكثر طلبًا", "Bestseller"), product?.bestseller], ["allow_engraving", t("engraving"), product?.allow_engraving]] as const).map(([k, l, d]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" name={k} defaultChecked={!!d} className="accent-[var(--rose-deep)]" />{l}</label>
        ))}
      </div>

      <div>
        <p className="eyebrow mb-2">{pick("الصور", "Images")}</p>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button type="button" key={img + i} onClick={() => setImages(images.filter((_, j) => j !== i))} className="relative" title={pick("إزالة", "Remove")}>
              <img src={resolveImage(img)} alt="" className="h-20 w-16 object-cover" />
              {i === 0 ? <span className="absolute inset-x-0 bottom-0 bg-background/80 text-[10px]">1</span> : null}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.keys(IMAGE_LIBRARY).map((k) => (
            <button type="button" key={k} onClick={() => setImages([...images, k])} className="opacity-70 hover:opacity-100">
              <img src={IMAGE_LIBRARY[k]} alt={k} className="h-12 w-10 object-cover" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={input} dir="ltr" />
          <Button type="button" size="sm" variant="outline" onClick={() => { if (/^https:\/\//.test(url)) { setImages([...images, url]); setUrl(""); } }}>{pick("إضافة رابط", "Add URL")}</Button>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">{pick("الخيارات (المقاس/اللون)", "Variants (size / colour)")}</p>
        {variants.map((v, i) => (
          <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_80px_70px_auto] gap-2">
            <input value={v.name_ar} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, name_ar: e.target.value } : x))} placeholder="عربي" className={input} required />
            <input value={v.name_en} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, name_en: e.target.value } : x))} placeholder="English" className={input} required />
            <input type="number" value={v.price_delta} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, price_delta: Number(e.target.value) } : x))} title="± EGP" className={input} />
            <input type="number" min={0} value={v.stock} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) } : x))} title="stock" className={input} />
            <button type="button" className="text-xs text-muted-foreground" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <Button type="button" size="sm" variant="ghost" onClick={() => setVariants([...variants, { name_ar: "", name_en: "", price_delta: 0, stock: 0 }])}>+ {pick("خيار", "Variant")}</Button>
      </div>

      <Button type="submit" className="w-full" disabled={busy || images.length === 0}>{t("save")}</Button>
    </form>
  );
}
