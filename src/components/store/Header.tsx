import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-['Amiri'] text-[1.7rem] leading-none">ذِكرى</span>
      <span className="font-['Cormorant_Garamond'] text-[0.7rem] uppercase tracking-[0.35em] text-muted-foreground">
        Zekra
      </span>
    </span>
  );
}

export function Header() {
  const { t, lang, setLang, dir } = useI18n();
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const links = [
    { to: "/shop" as const, label: t("nav_shop") },
    { to: "/about" as const, label: t("nav_story") },
    { to: "/contact" as const, label: t("nav_contact") },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(false);
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="bg-ink py-2 text-center text-[11px] tracking-wide text-primary-foreground">
        {t("shipping_note")}
      </div>
      <div className="container-ed grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
        <div className="flex items-center gap-1">
          <button className="grid size-10 place-items-center md:hidden" onClick={() => setMenu(true)} aria-label={t("nav_menu")}>
            <Menu className="size-5 stroke-[1.25]" />
          </button>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="link-draw" activeProps={{ "aria-current": "page" }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link to="/" aria-label="Zekra — ذِكرى">
          <Wordmark />
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="link-draw me-2 hidden text-xs tracking-wide sm:inline"
            lang={lang === "ar" ? "en" : "ar"}
          >
            {t("lang_switch")}
          </button>
          <button className="grid size-10 place-items-center" onClick={() => setSearching((s) => !s)} aria-label={t("search_placeholder")}>
            <Search className="size-[18px] stroke-[1.25]" />
          </button>
          <Link to="/wishlist" className="hidden size-10 place-items-center sm:grid" aria-label={t("nav_wishlist")}>
            <Heart className="size-[18px] stroke-[1.25]" />
          </Link>
          <Link to={user ? "/account" : "/auth"} className="hidden size-10 place-items-center sm:grid" aria-label={t("nav_account")}>
            <User className="size-[18px] stroke-[1.25]" />
          </Link>
          <button className="relative grid size-10 place-items-center" onClick={() => setOpen(true)} aria-label={t("nav_cart")}>
            <ShoppingBag className="size-[18px] stroke-[1.25]" />
            {count > 0 ? (
              <span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-rose-deep px-1 text-[10px] leading-4 text-primary-foreground">
                {formatNumber(count, lang)}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {searching ? (
        <form onSubmit={submit} className="border-t border-border">
          <div className="container-ed flex h-14 items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search_placeholder")}
              className="h-full flex-1 bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground"
              aria-label={t("search_placeholder")}
            />
          </div>
        </form>
      ) : null}

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-[86%] bg-background" dir={dir}>
          <SheetHeader className="text-start">
            <SheetTitle className="font-normal">
              <Wordmark />
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-10 flex flex-col gap-6 px-4">
            {[...links, { to: "/wishlist" as const, label: t("nav_wishlist") }].map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenu(false)} className="font-display text-3xl">
                {l.label}
              </Link>
            ))}
            <Link to={user ? "/account" : "/auth"} onClick={() => setMenu(false)} className="font-display text-3xl">
              {user ? t("nav_account") : t("nav_signin")}
            </Link>
            {isAdmin ? (
              <Link to="/admin" onClick={() => setMenu(false)} className="font-display text-3xl text-rose-deep">
                {t("nav_admin")}
              </Link>
            ) : null}
          </nav>
          <div className="absolute inset-x-4 bottom-8 border-t border-border pt-6">
            <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-sm" lang={lang === "ar" ? "en" : "ar"}>
              {t("lang_switch")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
