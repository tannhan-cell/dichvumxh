import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Ann = { id: string; message: string };

export function AnnouncementBar() {
  const [items, setItems] = useState<Ann[]>([]);
  useEffect(() => {
    const load = () => supabase.from("announcements").select("id,message").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
    load();
    const ch = supabase.channel("ann").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  if (!items.length) return null;
  return (
    <div className="announce-bar">
      <Megaphone className="h-4 w-4 shrink-0" />
      <div className="announce-track"><div className="announce-move">{[...items, ...items].map((a, i) => <span key={a.id + i}>{a.message}</span>)}</div></div>
    </div>
  );
}
