import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

interface WishlistValue {
  ids: Set<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistValue | null>(null);
const STORAGE_KEY = "zekra-wishlist-v1";

function readLocal(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Signed-in users: stored in the database. Guests: kept on this device, merged on sign-in. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setIds(new Set(readLocal()));
      return;
    }
    (async () => {
      const local = readLocal();
      if (local.length) {
        await supabase
          .from("wishlists")
          .upsert(local.map((product_id) => ({ user_id: user.id, product_id })), { ignoreDuplicates: true });
        window.localStorage.removeItem(STORAGE_KEY);
      }
      const { data } = await supabase.from("wishlists").select("product_id");
      setIds(new Set((data ?? []).map((r) => r.product_id)));
    })();
  }, [user, ready]);

  const toggle = useCallback(
    async (id: string) => {
      const next = new Set(ids);
      const removing = next.has(id);
      if (removing) next.delete(id);
      else next.add(id);
      setIds(next);
      if (!user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return;
      }
      const { error } = removing
        ? await supabase.from("wishlists").delete().eq("product_id", id).eq("user_id", user.id)
        : await supabase.from("wishlists").insert({ user_id: user.id, product_id: id });
      if (error) setIds(ids);
    },
    [ids, user],
  );

  const value = useMemo(() => ({ ids, has: (id: string) => ids.has(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
