import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (data !== true) throw redirect({ to: "/account" });
  },
  head: () => ({
    meta: [
      { title: "لوحة الإدارة · Admin — ذِكرى Zekra" },
      { name: "description", content: "Manage Zekra products, inventory, orders and customers." },
      { property: "og:title", content: "Admin — Zekra" },
      { property: "og:description", content: "Store management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { pick } = useI18n();
  const links = [
    { to: "/admin" as const, label: pick("نظرة عامة", "Overview"), exact: true },
    { to: "/admin/products" as const, label: pick("المنتجات والمخزون", "Products & stock") },
    { to: "/admin/categories" as const, label: pick("الفئات", "Categories") },
    { to: "/admin/orders" as const, label: pick("الطلبات", "Orders") },
    { to: "/admin/customers" as const, label: pick("العملاء", "Customers") },
  ];
  return (
    <div className="container-ed pt-10">
      <p className="eyebrow">{pick("لوحة الإدارة", "Admin")}</p>
      <nav className="mt-4 flex gap-6 overflow-x-auto border-b border-border pb-3 text-sm">
        {links.map((l) => (
          <Link key={l.to} to={l.to} activeOptions={{ exact: !!l.exact }} className="link-draw whitespace-nowrap" activeProps={{ "aria-current": "page" }}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="pt-10"><Outlet /></div>
    </div>
  );
}
