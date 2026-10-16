import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LogOut, Megaphone, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORMS, STATUS_LABEL, formatVnd } from "@/lib/pricing";
import { setOrderStatus } from "@/lib/orders.functions";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Svc = Database["public"]["Tables"]["services"]["Row"];
type Ann = Database["public"]["Tables"]["announcements"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Bảng quản trị — SocialMedia" },
    { name: "description", content: "Quản lý đơn, giá và thông báo SocialMedia." },
    { property: "og:title", content: "Bảng quản trị — SocialMedia" },
    { property: "og:description", content: "Quản trị SocialMedia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Admin,
});

const PAID = ["paid", "running", "completed"];

function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const { data: r } = await supabase.rpc("has_role", { _user_id: data.user!.id, _role: "admin" });
      setIsAdmin(!!r);
    });
  }, []);
  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/auth"; };
  if (isAdmin === null) return <p className="p-10 text-muted-foreground">Đang tải…</p>;
  if (!isAdmin) return <div className="p-10"><p>Tài khoản này không có quyền quản trị.</p><Button variant="glass" className="mt-4" onClick={logout}>Đăng xuất</Button></div>;
  return (
    <main className="page-shell py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold">Admin <span className="text-primary">SocialMedia</span></Link>
        <Button variant="glass" onClick={logout}><LogOut /> Đăng xuất</Button>
      </div>
      <Tabs defaultValue="dash">
        <TabsList className="mb-6 flex-wrap"><TabsTrigger value="dash">Tổng quan</TabsTrigger><TabsTrigger value="orders">Đơn hàng</TabsTrigger><TabsTrigger value="prices">Bảng giá</TabsTrigger><TabsTrigger value="members">Thành viên</TabsTrigger><TabsTrigger value="ann">Thông báo</TabsTrigger></TabsList>
        <OrdersData>{(orders, reload) => (<>
          <TabsContent value="dash"><Dashboard orders={orders} /></TabsContent>
          <TabsContent value="orders"><Orders orders={orders} reload={reload} /></TabsContent>
        </>)}</OrdersData>
        <TabsContent value="prices"><Prices /></TabsContent>
        <TabsContent value="members"><Members /></TabsContent>
        <TabsContent value="ann"><Announcements /></TabsContent>
      </Tabs>
    </main>
  );
}

function OrdersData({ children }: { children: (o: Order[], reload: () => void) => React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = () => supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000).then(({ data }) => setOrders(data ?? []));
  useEffect(() => { load(); }, []);
  return <>{children(orders, load)}</>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-extrabold ${tone ?? ""}`}>{value}</p></div>;
}

function Dashboard({ orders }: { orders: Order[] }) {
  const paid = orders.filter((o) => PAID.includes(o.status));
  const revenue = paid.reduce((s, o) => s + Number(o.amount), 0);
  const chart = useMemo(() => {
    const days: { day: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key.slice(5), revenue: paid.filter((o) => o.created_at.slice(0, 10) === key).reduce((s, o) => s + Number(o.amount), 0) });
    }
    return days;
  }, [orders]);
  const count = (s: string) => orders.filter((o) => o.status === s).length;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Doanh thu" value={formatVnd(revenue)} tone="text-primary" />
        <Stat label="Chờ thanh toán" value={String(count("pending"))} />
        <Stat label="Chưa chạy" value={String(count("paid"))} tone="text-destructive" />
        <Stat label="Đang chạy" value={String(count("running"))} />
        <Stat label="Hoàn thành" value={String(count("completed"))} />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 font-bold">Doanh thu 14 ngày</p>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} formatter={(v: number) => formatVnd(v)} />
              <Area dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Orders({ orders, reload }: { orders: Order[]; reload: () => void }) {
  const [filter, setFilter] = useState("all");
  const updateStatus = useServerFn(setOrderStatus);
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  async function setStatus(id: string, status: string) {
    try {
      await updateStatus({ data: { id, status: status as "pending" | "paid" | "running" | "completed" | "cancelled" } });
      toast.success("Đã cập nhật & gửi thông báo Telegram");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không cập nhật được đơn");
    }
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...Object.keys(STATUS_LABEL)].map((s) => <Button key={s} size="sm" variant={filter === s ? "premium" : "glass"} onClick={() => setFilter(s)}>{s === "all" ? "Tất cả" : STATUS_LABEL[s]}</Button>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground"><tr><th className="p-3">Mã</th><th className="p-3">Dịch vụ</th><th className="p-3">Link</th><th className="p-3">SL</th><th className="p-3">Tiền</th><th className="p-3">Liên hệ</th><th className="p-3">Thời gian</th><th className="p-3">Trạng thái</th></tr></thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-t border-border align-top">
                <td className="p-3 font-bold">{o.code}</td>
                <td className="p-3">{o.service_name}{o.note && <p className="text-xs text-muted-foreground">{o.note}</p>}</td>
                <td className="max-w-[200px] break-all p-3"><a href={o.link} target="_blank" rel="noreferrer" className="text-primary">{o.link}</a></td>
                <td className="p-3">{o.quantity}</td>
                <td className="p-3 font-semibold">{formatVnd(Number(o.amount))}</td>
                <td className="p-3">{o.contact}</td>
                <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString("vi-VN")}</td>
                <td className="p-3">
                  <select className="rounded-md border border-border bg-background p-1.5" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Chưa có đơn.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Prices() {
  const [rows, setRows] = useState<Svc[]>([]);
  const load = () => supabase.from("services").select("*").order("platform").order("sort").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const edit = (id: string, patch: Partial<Svc>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  async function save(s: Svc) {
    const { error } = await supabase.from("services").update({ name: s.name, unit_price: s.unit_price, min_qty: s.min_qty, max_qty: s.max_qty, badge: s.badge || null, active: s.active }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success(`Đã lưu ${s.name}`);
  }
  return (
    <div className="grid gap-8">
      {PLATFORMS.map((p) => (
        <div key={p.id}>
          <h3 className="mb-3 font-bold">{p.label}</h3>
          <div className="grid gap-2">
            {rows.filter((r) => r.platform === p.id).map((s) => (
              <div key={s.id} className="grid grid-cols-2 items-center gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto]">
                <Input value={s.name} onChange={(e) => edit(s.id, { name: e.target.value })} className="col-span-2 md:col-span-1" />
                <label className="text-xs text-muted-foreground">Giá/1 (đ)<Input type="number" value={s.unit_price} onChange={(e) => edit(s.id, { unit_price: Number(e.target.value) })} /></label>
                <label className="text-xs text-muted-foreground">Tối thiểu<Input type="number" value={s.min_qty} onChange={(e) => edit(s.id, { min_qty: Number(e.target.value) })} /></label>
                <label className="text-xs text-muted-foreground">Tối đa<Input type="number" value={s.max_qty} onChange={(e) => edit(s.id, { max_qty: Number(e.target.value) })} /></label>
                <label className="text-xs text-muted-foreground">Nhãn<Input value={s.badge ?? ""} onChange={(e) => edit(s.id, { badge: e.target.value })} /></label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={s.active} onCheckedChange={(v) => edit(s.id, { active: v })} /> Hiện</label>
                <Button size="sm" variant="premium" onClick={() => save(s)}><Save /> Lưu</Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Announcements() {
  const [rows, setRows] = useState<Ann[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  return (
    <div className="grid max-w-2xl gap-4">
      <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.from("announcements").insert({ message: msg }); if (error) toast.error(error.message); else { setMsg(""); toast.success("Đã đẩy thông báo lên web"); load(); } }}>
        <Input required value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Nội dung thông báo (VD: Giảm 20% dịch vụ TikTok hôm nay!)" />
        <Button variant="premium"><Megaphone /> Đăng</Button>
      </form>
      {rows.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <p className="flex-1 text-sm">{a.message}</p>
          <Switch checked={a.active} onCheckedChange={async (v) => { await supabase.from("announcements").update({ active: v }).eq("id", a.id); load(); }} />
          <Button size="icon" variant="ghost" aria-label="Xóa" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); load(); }}><Trash2 /></Button>
        </div>
      ))}
    </div>
  );
}
