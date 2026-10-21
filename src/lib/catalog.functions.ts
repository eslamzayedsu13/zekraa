import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_COLS =
  "id,slug,category_id,name_ar,name_en,description_ar,description_en,price,compare_at_price,stock,images,featured,bestseller,sales_count,allow_engraving,engraving_price,created_at,product_variants(id,name_ar,name_en,price_delta,stock,sort)";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [cats, prods] = await Promise.all([
    sb.from("categories").select("id,slug,name_ar,name_en,sort").order("sort"),
    sb.from("products").select(PRODUCT_COLS).eq("active", true).order("created_at", { ascending: false }),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  return { categories: cats.data, products: prods.data };
});

export const getShippingRates = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("shipping_rates").select("*").order("fee").order("governorate");
  if (error) throw new Error(error.message);
  return data;
});
