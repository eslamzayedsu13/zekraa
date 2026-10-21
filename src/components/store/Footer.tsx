import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Wordmark } from "./Header";

export function Footer() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 border-t border-border bg-paper">
      <div className="container-ed grid gap-12 py-16 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t("footer_about")}</p>
        </div>
        <div>
          <p className="eyebrow mb-5">{t("footer_shop")}</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/shop" className="link-draw">{t("shop_all")}</Link></li>
            <li><Link to="/shop" search={{ cat: "engagement" }} className="link-draw">{t("coll_engagement")}</Link></li>
            <li><Link to="/shop" search={{ cat: "keepsakes" }} className="link-draw">{t("coll_keepsakes")}</Link></li>
            <li><Link to="/about" className="link-draw">{t("nav_story")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5">{t("footer_help")}</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/faq" className="link-draw">{t("footer_faq")}</Link></li>
            <li><Link to="/shipping" className="link-draw">{t("footer_shipping")}</Link></li>
            <li><Link to="/returns" className="link-draw">{t("footer_returns")}</Link></li>
            <li><Link to="/contact" className="link-draw">{t("nav_contact")}</Link></li>
            {isAdmin ? <li><Link to="/admin" className="link-draw">{t("nav_admin")}</Link></li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-ed flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© {year} Zekra · ذِكرى</span>
          <span>{t("footer_rights")}</span>
        </div>
      </div>
    </footer>
  );
}
