import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { resolveImage } from "@/lib/images";
import { FREE_SHIPPING_THRESHOLD, lineTotal } from "@/lib/pricing";
import { QuantityStepper } from "./QuantityStepper";
import { Price } from "./Price";

export function CartLines({ compact }: { compact?: boolean }) {
  const { items, setQty, remove } = useCart();
  const { pick, t, price } = useI18n();
  return (
    <ul className="divide-y divide-border">
      {items.map((i) => (
        <li key={i.key} className="flex gap-4 py-5">
          <Link to="/product/$slug" params={{ slug: i.slug }} className="shrink-0">
            <img
              src={resolveImage(i.image)}
              alt=""
              width={compact ? 80 : 112}
              height={compact ? 100 : 140}
              loading="lazy"
              className={compact ? "h-[100px] w-20 object-cover" : "h-[140px] w-28 object-cover"}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-snug">{pick(i.nameAr, i.nameEn)}</p>
                {i.variantAr ? <p className="text-xs text-muted-foreground">{pick(i.variantAr, i.variantEn)}</p> : null}
                {i.engraving ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("engraving")}: «{i.engraving}»{" "}
                    {i.engravingPrice > 0 ? `+ ${price(i.engravingPrice)}` : `(${t("engraving_free")})`}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(i.key)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("remove")}
              >
                <X className="size-4 stroke-[1.25]" />
              </button>
            </div>
            <div className="mt-auto flex items-center justify-between pt-3">
              <QuantityStepper size="sm" value={i.qty} max={Math.min(20, i.maxQty)} onChange={(n) => setQty(i.key, n)} />
              <Price amount={lineTotal(i)} className="text-sm" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FreeShippingNote() {
  const { subtotal } = useCart();
  const { t, price } = useI18n();
  const left = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="text-xs text-muted-foreground">
      <p>{left > 0 ? t("free_ship_left", { amount: price(left) }) : t("free_ship_ok")}</p>
      <div className="mt-2 h-px w-full bg-border">
        <div className="h-px bg-rose-deep transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen, items, subtotal } = useCart();
  const { t, dir } = useI18n();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side={dir === "rtl" ? "left" : "right"} className="flex w-full flex-col bg-background p-0 sm:max-w-md" dir={dir}>
        <SheetHeader className="border-b border-border px-6 py-5 text-start rtl:pr-6 rtl:pl-14 ltr:pr-14">
          <SheetTitle className="font-display text-2xl font-normal">{t("cart_title")}</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-display text-2xl">{t("cart_empty")}</p>
            <Button variant="outline" asChild onClick={() => setOpen(false)}>
              <Link to="/shop">{t("cart_continue")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <CartLines compact />
            </div>
            <div className="space-y-4 border-t border-border px-6 py-5">
              <FreeShippingNote />
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("subtotal")}</span>
                <Price amount={subtotal} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild onClick={() => setOpen(false)}>
                  <Link to="/cart">{t("cart_view")}</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link to="/checkout">{t("cart_checkout")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
