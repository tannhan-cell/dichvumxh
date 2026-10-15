import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Signed-in member profile (balance + personal discount), or null for guests. */
export function useMember() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const load = async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) { setProfile(null); return; }
    const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(p ?? null);
  };
  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") load(); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { profile, reload: load };
}
