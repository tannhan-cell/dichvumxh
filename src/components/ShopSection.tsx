import { useEffect, useState } from "react";
import { ArrowUpRight, Facebook, Instagram, LockKeyhole, Music2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS, formatVnd } from "@/lib/pricing";
import { OrderDialog, type ServiceRow } from "./OrderDialog";

const ICONS = { facebook: Facebook, tiktok: Music2, instagram: Instagram, unlock: LockKeyhole } as const;

export function ShopSection({ platform, setPlatform }: { platform: string; setPlatform: (p: string) => void }) {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<ServiceRow | null>(null);
  useEffect(() => {
    supabase.from("services").select("id,platform,name,unit_price,min_qty,max_qty,badge").eq("active", true).order("sort")
      .then(({ data }) => { setRows((data ?? []) as ServiceRow[]); setLoading(false); });
  }, []);
  const list = rows.filter((r) => r.platform === platform);
  return (
    <section className="page-shell services-section" id="dat-don">
      <div className="section-heading"><div><span className="eyebrow"><span className="section-number">00 /</span> ĐẶT ĐƠN TRỰC TIẾP</span><h2>Bảng giá & đặt đơn<span className="text-primary">.</span></h2></div><p>Chọn dịch vụ, nhập link và thanh toán<br />bằng mã QR chỉ trong 30 giây.</p></div>
      <div className="shop-tabs" role="tablist">
        {PLATFORMS.map((p) => { const I = ICONS[p.id]; return (
          <button key={p.id} role="tab" aria-selected={platform === p.id} className={platform === p.id ? "active" : ""} onClick={() => setPlatform(p.id)}><I className="h-4 w-4" /> {p.label}</button>
        ); })}
      </div>
      <div className="shop-grid">
        {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="shop-item animate-pulse h-[92px]" />)}
        {list.map((s) => (
          <button key={s.id} className="shop-item" onClick={() => setPicked(s)}>
            <div className="flex items-start justify-between gap-2">
              <span className="shop-name">{s.name}</span>
              {s.badge && <span className="shop-badge">{s.badge}</span>}
            </div>
            <div className="flex items-end justify-between">
              <span><span className="shop-price">{formatVnd(Number(s.unit_price))}</span><span className="text-xs text-muted-foreground"> / 1{s.min_qty > 1 ? ` · tối thiểu ${s.min_qty}` : ""}</span></span>
              <span className="shop-buy"><ShoppingCart className="h-3.5 w-3.5" /> Mua <ArrowUpRight className="h-3.5 w-3.5" /></span>
            </div>
          </button>
        ))}
      </div>
      <OrderDialog service={picked} onClose={() => setPicked(null)} />
    </section>
  );
}
