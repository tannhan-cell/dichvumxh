import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackOrder } from "@/lib/orders.functions";
import { STATUS_LABEL, formatVnd } from "@/lib/pricing";

export const Route = createFileRoute("/tra-cuu")({
  head: () => ({ meta: [
    { title: "Tra cứu đơn hàng — SocialMedia" },
    { name: "description", content: "Nhập mã đơn để xem trạng thái đơn dịch vụ SocialMedia." },
    { property: "og:title", content: "Tra cứu đơn hàng — SocialMedia" },
    { property: "og:description", content: "Kiểm tra trạng thái đơn hàng bằng mã đơn." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Track,
});

type Res = Awaited<ReturnType<typeof trackOrder>>;

function Track() {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<Res | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const fn = useServerFn(trackOrder);
  return (
    <main className="page-shell min-h-screen py-16">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Trang chủ</Link>
      <h1 className="text-4xl font-extrabold">Tra cứu đơn<span className="text-primary">.</span></h1>
      <form className="mt-6 flex max-w-md gap-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setRes(await fn({ data: { code } })); setBusy(false); }}>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: SMAB12CD" required />
        <Button variant="premium" disabled={busy}><Search /> Tra cứu</Button>
      </form>
      {res === null && <p className="mt-6 text-destructive">Không tìm thấy đơn.</p>}
      {res && (
        <div className="mt-6 grid max-w-md gap-2 rounded-xl border border-border bg-card p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Mã đơn</span><b>{res.code}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dịch vụ</span><b>{res.service_name}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Số lượng</span><b>{res.quantity}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Số tiền</span><b>{formatVnd(Number(res.amount))}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Trạng thái</span><b className="text-primary">{STATUS_LABEL[res.status]}</b></div>
        </div>
      )}
    </main>
  );
}
