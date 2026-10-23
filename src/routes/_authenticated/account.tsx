import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي · Account — ذِكرى Zekra" },
      { name: "description", content: "Your Zekra profile, addresses and orders." },
      { property: "og:title", content: "Account — Zekra" },
      { property: "og:description", content: "Profile, addresses and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { t } = useI18n();
  const { signOut, isAdmin } = useAuth();
  return (
    <div className="container-ed pt-12 md:pt-20">
      <h1 className="text-5xl md:text-6xl">{t("account_title")}</h1>
      <nav className="mt-8 flex flex-wrap gap-6 border-b border-border pb-3 text-sm">
        <Link to="/account" activeOptions={{ exact: true }} className="link-draw" activeProps={{ "aria-current": "page" }}>{t("profile")}</Link>
        <Link to="/account/orders" className="link-draw" activeProps={{ "aria-current": "page" }}>{t("orders")}</Link>
        {isAdmin ? <Link to="/admin" className="link-draw text-rose-deep">{t("nav_admin")}</Link> : null}
        <button onClick={signOut} className="link-draw ms-auto text-muted-foreground">{t("nav_signout")}</button>
      </nav>
      <div className="pt-10"><Outlet /></div>
    </div>
  );
}
