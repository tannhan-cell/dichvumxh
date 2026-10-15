import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, notifyPaid } from "@/lib/orders.functions";
import { BANK, calcAmount, formatVnd, vietQrUrl } from "@/lib/pricing";

export type ServiceRow = { id: string; platform: string; name: string; unit_price: number; min_qty: number; max_qty: number; badge: string | null };

export function OrderDialog({ service, onClose }: { service: ServiceRow | null; onClose: () => void }) {
  const [link, setLink] = useState("");
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; amount: number } | null>(null);
  const [reported, setReported] = useState(false);
  const create = useServerFn(createOrder);
  const paid = useServerFn(notifyPaid);

  const quantity = qty || service?.min_qty || 0;
  const amount = service ? calcAmount(Number(service.unit_price), quantity) : 0;

  function reset() { setLink(""); setQty(0); setNote(""); setContact(""); setResult(null); setReported(false); onClose(); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setBusy(true);
    try {
      const r = await create({ data: { serviceId: service.id, link, quantity, note, contact } });
      setResult(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={service !== null} onOpenChange={(o) => !o && reset()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-xl">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>{service?.name}</DialogTitle>
              <DialogDescription>Đơn giá {formatVnd(Number(service?.unit_price ?? 0))} / 1 · Tối thiểu {service?.min_qty}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">Nhập Link / ID
                <Input required value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://facebook.com/..." />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Số lượng
                <Input type="number" required min={service?.min_qty} max={service?.max_qty} value={quantity} onChange={(e) => setQty(Number(e.target.value))} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">SĐT / Zalo liên hệ
                <Input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="09xx xxx xxx" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Ghi chú
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" rows={3} />
              </label>
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
                <span className="text-sm text-muted-foreground">Tổng thanh toán</span>
                <span className="text-xl font-extrabold text-primary">{formatVnd(amount)}</span>
              </div>
              <Button type="submit" variant="premium" size="lg" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <QrCode />} Tạo đơn & lấy mã QR
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="text-primary" /> Đơn {result.code}</DialogTitle>
              <DialogDescription>Quét mã bằng app ngân hàng — số tiền và nội dung đã điền sẵn.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="mx-auto w-full max-w-[280px] rounded-xl bg-foreground p-3">
                <img src={vietQrUrl(result.amount, result.code)} alt={`QR thanh toán ${formatVnd(result.amount)}`} className="w-full" />
              </div>
              <div className="grid gap-2 rounded-lg border border-border bg-secondary/50 p-4 text-sm">
                <Row k="Ngân hàng" v={BANK.label} />
                <Row k="Số tài khoản" v={BANK.account} copy />
                <Row k="Chủ tài khoản" v={BANK.name} />
                <Row k="Số tiền" v={formatVnd(result.amount)} />
                <Row k="Nội dung" v={result.code} copy />
              </div>
              <Button variant="premium" disabled={reported} onClick={async () => { await paid({ data: { code: result.code } }); setReported(true); toast.success("Đã báo admin, đơn sẽ được xử lý sớm!"); }}>
                {reported ? "Đã gửi xác nhận" : "Tôi đã chuyển khoản"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Lưu mã <b className="text-foreground">{result.code}</b> để <Link to="/tra-cuu" className="text-primary underline">tra cứu đơn</Link>.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="flex items-center gap-2 font-semibold">{v}
        {copy && <button type="button" aria-label={`Sao chép ${k}`} onClick={() => { navigator.clipboard.writeText(v); toast.success("Đã sao chép"); }}><Copy className="h-3.5 w-3.5 text-primary" /></button>}
      </span>
    </div>
  );
}
