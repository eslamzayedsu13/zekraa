import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import story from "@/assets/story.jpg";
import journal from "@/assets/p-journal.jpg";
import box from "@/assets/p-box.jpg";
import candle from "@/assets/p-candle.jpg";
import { catalogQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeader } from "@/components/store/SectionHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ذِكرى Zekra — هدايا للمخطوبين ومن يحبّون" },
      { name: "description", content: "Engraved ring dishes, couple's journals, star maps and keepsakes — handmade gifts for engaged couples, delivered across Egypt." },
      { property: "og:title", content: "ذِكرى Zekra — Gifts kept by heart" },
      { property: "og:description", content: "Handmade, engraved gifts for engaged couples in Egypt. Cash on delivery." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(catalogQuery);
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const featured = data.products.filter((p) => p.featured).slice(0, 4);
  const best = [...data.products].filter((p) => p.bestseller).sort((a, b) => b.sales_count - a.sales_count).slice(0, 4);

  const collections = [
    { cat: "engagement", title: t("coll_engagement"), desc: t("coll_engagement_d"), img: box, cls: "md:col-span-7 aspect-[4/3]" },
    { cat: "keepsakes", title: t("coll_keepsakes"), desc: t("coll_keepsakes_d"), img: journal, cls: "md:col-span-5 aspect-[4/5] md:mt-24" },
    { cat: "home", title: t("coll_everyday"), desc: t("coll_everyday_d"), img: candle, cls: "md:col-span-5 md:col-start-3 aspect-[4/5] md:-mt-12" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="container-ed grid items-end gap-10 pb-20 pt-10 md:grid-cols-12 md:gap-6 md:pt-16">
        <div className="md:col-span-5 md:pb-16">
          <p className="eyebrow">{t("hero_eyebrow")}</p>
          <h1 className="mt-6 text-[3.25rem] leading-[1.02] md:text-[5.5rem]">{t("hero_title")}</h1>
          <p className="mt-8 max-w-md leading-relaxed text-muted-foreground">{t("hero_body")}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Button size="lg" asChild>
              <Link to="/shop">{t("hero_cta")}</Link>
            </Button>
            <Link to="/about" className="link-draw text-sm">
              {t("hero_cta2")}
            </Link>
          </div>
        </div>
        <figure className="md:col-span-6 md:col-start-7">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <img src={hero} alt={t("hero_caption")} width={1280} height={1600} fetchPriority="high" className="img-reveal size-full object-cover" />
          </div>
          <figcaption className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{t("hero_caption")}</span>
            <span>Nº 01</span>
          </figcaption>
        </figure>
      </section>

      {/* Promise strip */}
      <section className="border-y border-border">
        <div className="container-ed grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="py-7 md:px-8 md:first:ps-0">
              <p className="font-display text-xl">{t(`promise_${n}` as "promise_1")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`promise_${n}d` as "promise_1d")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="container-ed py-24 md:py-32">
        <SectionHeader index={1} label={t("sec_collections")} />
        <div className="grid gap-10 md:grid-cols-12 md:gap-6">
          {collections.map((c) => (
            <Link key={c.cat} to="/shop" search={{ cat: c.cat }} className={`group block ${c.cls.split(" ").filter((x) => x.startsWith("md:")).join(" ")}`}>
              <div className={`overflow-hidden bg-muted ${c.cls.split(" ").filter((x) => x.startsWith("aspect")).join(" ")}`}>
                <img src={c.img} alt="" loading="lazy" width={1024} height={1280} className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h3 className="text-3xl">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                </div>
                <Arrow className="size-5 stroke-[1.25] transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-ed pb-24 md:pb-32">
        <SectionHeader
          index={2}
          label={t("sec_featured")}
          action={<Link to="/shop" className="link-draw text-sm">{t("view_all")}</Link>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} className={i % 2 === 1 ? "md:mt-16" : ""} />
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-paper py-24 md:py-32">
        <div className="container-ed grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <img src={story} alt="" loading="lazy" width={1280} height={960} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="eyebrow">03 / {t("sec_story")}</p>
            <h2 className="mt-6 text-4xl leading-[1.1] md:text-5xl">{t("story_title")}</h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">{t("story_body")}</p>
            <Link to="/about" className="link-draw mt-8 inline-block text-sm">
              {t("story_more")}
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-ed py-24 md:py-32">
        <SectionHeader
          index={4}
          label={t("sec_bestsellers")}
          action={<Link to="/shop" search={{ sort: "bestselling" }} className="link-draw text-sm">{t("view_all")}</Link>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Newsletter (honest placeholder — no list yet) */}
      <section className="container-ed">
        <div className="grid gap-6 border-t border-border pt-16 md:grid-cols-2">
          <h2 className="text-4xl">{t("newsletter_title")}</h2>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="text-sm text-muted-foreground">{t("newsletter_body")}</p>
            <span className="eyebrow border border-border px-4 py-2">{t("newsletter_cta")}</span>
          </div>
        </div>
      </section>
    </>
  );
}
