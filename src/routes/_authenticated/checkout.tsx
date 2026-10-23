import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { shippingRatesQuery } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { EG_PHONE, extrasTotal, GIFT_WRAP_FEE, GREETING_CARD_FEE, shippingFee } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import type { DictKey } from "@/lib/dict";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/store/Price";
import { Field } from "../auth";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب · Checkout — ذِكرى Zekra" },
      { name: "description", content: "Complete your Zekra order with cash on delivery." },
      { property: "og:title", content: "Checkout — Zekra" },
      { property: "og:description", content: "Complete your order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const KNOWN_ERRORS = ["INVALID_PHONE", "INVALID_NAME", "INVALID_ADDRESS", "INVALID_GOVERNORATE", "OUT_OF_STOCK", "PRODUCT_UNAVAILABLE", "VARIANT_REQUIRED", "EMPTY_CART", "ENGRAVING_TOO_LONG"];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { t, pick, price, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: rates = [] } = useQuery(shippingRatesQuery);
  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await supabase.from("addresses").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "", gov: "", city: "", street: "", notes: "" });
  const [wrap, setWrap] = useState(false);
  const [card, setCard] = useState(false);
  const [message, setMessage] = useState("");
  const [saveAddr, setSaveAddr] = useState(true);
  const [busy, setBusy] = useState(false);
  const idem = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const a = addresses[0];
    setForm((f) => ({
      ...f,
      email: f.email || user?.email || "",
      ...(a && !f.street ? { name: a.full_name, phone: a.phone, gov: a.governorate, city: a.city, street: a.street, notes: a.notes ?? "" } : {}),
    }));
  }, [addresses, user]);

  const rate = rates.find((r) => r.governorate === form.gov) ?? null;
  const ship = shippingFee(subtotal, rate?.fee ?? null);
  const extras = extrasTotal({ giftWrap: wrap, greetingCard: card });
  const total = ship === null ? null : subtotal + ship + extras;
  const phoneOk = EG_PHONE.test(form.phone);
  const valid = useMemo(
    () => items.length > 0 && form.name.trim().length >= 2 && phoneOk && !!rate && form.city.trim().length >= 2 && form.street.trim().length >= 4,
    [items, form, phoneOk, rate],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const place = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      payload: {
        idempotency_key: idem.current,
        items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.qty, engraving: i.engraving })),
        contact_name: form.name,
        contact_phone: form.phone,
        contact_email: form.email,
        governorate: form.gov,
        city: form.city,
        street: form.street,
        address_notes: form.notes,
        gift_wrap: wrap,
        greeting_card: card,
        gift_message: card ? message : "",
        payment_method: "cod",
      },
    });
    if (error) {
      setBusy(false);
      const code = KNOWN_ERRORS.find((c) => error.message.includes(c));
      toast.error(t(code ? (`err_${code}` as DictKey) : "err_generic"));
      if (code === "OUT_OF_STOCK" || code === "PRODUCT_UNAVAILABLE") idem.current = crypto.randomUUID();
      return;
    }
    if (saveAddr && user && !addresses.some((a) => a.street === form.street && a.governorate === form.gov)) {
      await supabase.from("addresses").insert({ user_id: user.id, full_name: form.name, phone: form.phone, governorate: form.gov, city: form.city, street: form.street, notes: form.notes || null });
    }
    const res = data as { id: string };
    clear();
    navigate({ to: "/account/orders/$id", params: { id: res.id }, search: { placed: true } });
  };

  if (items.length === 0) {
    return (
      <div className="container-ed py-24">
        <p className="font-display text-3xl">{t("cart_empty")}</p>
        <Button variant="outline" className="mt-8" asChild><Link to="/shop">{t("cart_continue")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-ed pt-12 md:pt-20">
      <h1 className="text-5xl md:text-6xl">{t("checkout_title")}</h1>
      <div className="mt-12 grid gap-14 md:grid-cols-12">
        <div className="space-y-12 md:col-span-7">
          <section>
            <p className="eyebrow mb-5">01 — {t("contact")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("full_name")} value={form.name} onChange={set("name")} autoComplete="name" required />
              <Field
                label={t("phone")}
                hint={form.phone && !phoneOk ? t("err_INVALID_PHONE") : t("phone_hint")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 11) })}
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                required
              />
              <div className="sm:col-span-2">
                <Field label={t("email")} value={form.email} onChange={set("email")} type="email" dir="ltr" />
              </div>
            </div>
          </section>

          <section>
            <p className="eyebrow mb-5">02 — {t("address")}</p>
            {addresses.length > 1 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button key={a.id} type="button" className="border border-border px-3 py-2 text-xs hover:border-foreground"
                    onClick={() => setForm({ ...form, name: a.full_name, phone: a.phone, gov: a.governorate, city: a.city, street: a.street, notes: a.notes ?? "" })}>
                    {a.city} — {a.street.slice(0, 24)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">{t("governorate")}</span>
                <select value={form.gov} onChange={set("gov")} className="h-11 w-full border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground" required>
                  <option value="">{t("choose_governorate")}</option>
                  {rates.map((r) => (
                    <option key={r.governorate} value={r.governorate}>
                      {pick(r.name_ar, r.governorate)} — {price(r.fee)}
                    </option>
                  ))}
                </select>
              </label>
              <Field label={t("city")} value={form.city} onChange={set("city")} required />
              <div className="sm:col-span-2"><Field label={t("street")} value={form.street} onChange={set("street")} autoComplete="street-address" required /></div>
              <div className="sm:col-span-2"><Field label={t("notes")} value={form.notes} onChange={set("notes")} maxLength={300} /></div>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="size-4 accent-[var(--rose-deep)]" />
              {t("save_address")}
            </label>
          </section>

          <section>
            <p className="eyebrow mb-5">03 — {t("gift_options")}</p>
            <div className="divide-y divide-border border-y border-border">
              {[
                { on: wrap, set: setWrap, label: t("gift_wrap"), fee: GIFT_WRAP_FEE },
                { on: card, set: setCard, label: t("greeting_card"), fee: GREETING_CARD_FEE },
              ].map((o) => (
                <label key={o.label} className="flex cursor-pointer items-center justify-between py-4 text-sm">
                  <span className="flex items-center gap-3">
                    <input type="checkbox" checked={o.on} onChange={(e) => o.set(e.target.checked)} className="size-4 accent-[var(--rose-deep)]" />
                    {o.label}
                  </span>
                  <span className="text-muted-foreground">+ {price(o.fee)}</span>
                </label>
              ))}
            </div>
            {card ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                placeholder={t("gift_message_ph")}
                rows={3}
                className="mt-4 w-full border border-border bg-transparent p-3 font-display text-lg outline-none focus:border-foreground"
                aria-label={t("gift_message")}
              />
            ) : null}
          </section>

          <section>
            <p className="eyebrow mb-5">04 — {t("payment")}</p>
            <div className="space-y-2">
              <label className="flex items-start gap-3 border border-foreground p-4 text-sm">
                <input type="radio" checked readOnly className="mt-1 accent-[var(--rose-deep)]" />
                <span><span className="block">{t("cod")}</span><span className="text-xs text-muted-foreground">{t("cod_d")}</span></span>
              </label>
              {[t("card_wallet"), t("fawry")].map((m) => (
                <div key={m} aria-disabled className="flex items-center justify-between border border-border p-4 text-sm text-muted-foreground">
                  <span>{m}</span><span className="eyebrow">{t("coming_soon")}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <div className="border-t border-foreground pt-6 md:sticky md:top-32">
            <p className="eyebrow mb-4">{t("summary")}</p>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.key} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {pick(i.nameAr, i.nameEn)} × {formatNumber(i.qty, lang)}
                    {i.variantAr ? <span className="block text-xs text-muted-foreground">{pick(i.variantAr, i.variantEn)}</span> : null}
                    {i.engraving ? <span className="block text-xs text-muted-foreground">{t("engraving")}: «{i.engraving}»</span> : null}
                  </span>
                  <Price amount={(i.unitPrice + i.engravingPrice) * i.qty} />
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd><Price amount={subtotal} /></dd></div>
              {extras > 0 ? <div className="flex justify-between"><dt>{t("extras")}</dt><dd><Price amount={extras} /></dd></div> : null}
              <div className="flex justify-between">
                <dt>{t("shipping")}</dt>
                <dd>{ship === null ? <span className="text-muted-foreground">{t("choose_governorate")}</span> : ship === 0 ? t("free") : <Price amount={ship} />}</dd>
              </div>
              {rate ? <div className="flex justify-between text-xs text-muted-foreground"><dt>{t("eta")}</dt><dd>{rate.eta_days} {t("days")}</dd></div> : null}
              <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
                <dt>{t("total")}</dt><dd>{total === null ? "—" : <Price amount={total} />}</dd>
              </div>
            </dl>
            <Button size="lg" className="mt-6 w-full" disabled={!valid || busy} onClick={place}>
              {busy ? t("placing") : t("place_order")}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">{t("cod_d")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
