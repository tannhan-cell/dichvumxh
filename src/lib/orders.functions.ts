import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calcAmount, formatVnd, memberAmount, STATUS_LABEL } from "./pricing";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TELEGRAM_CHAT_ID = 6021357708;

async function notifyTelegram(text: string) {
  const lovable = process.env["LOVABLE_API_KEY"];
  const tg = process.env["TELEGRAM_API_KEY"];
  if (!lovable || !tg) return;
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": tg, "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("Telegram failed", res.status, await res.text());
  } catch (e) {
    console.error("Telegram error", e);
  }
}

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().uuid(),
      link: z.string().trim().min(3).max(500),
      quantity: z.number().int().min(1).max(10_000_000),
      note: z.string().trim().max(1000).optional(),
      contact: z.string().trim().min(6).max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: svc } = await supabaseAdmin.from("services").select("*").eq("id", data.serviceId).eq("active", true).maybeSingle();
    if (!svc) throw new Error("Dịch vụ không tồn tại");
    if (data.quantity < svc.min_qty || data.quantity > svc.max_qty) throw new Error(`Số lượng từ ${svc.min_qty} đến ${svc.max_qty}`);
    const amount = calcAmount(Number(svc.unit_price), data.quantity);
    const code = "SM" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabaseAdmin.from("orders").insert({
      code, service_id: svc.id, service_name: svc.name, platform: svc.platform,
      link: data.link, quantity: data.quantity, note: data.note || null, contact: data.contact, amount,
    });
    if (error) throw new Error("Không tạo được đơn, vui lòng thử lại");
    await notifyTelegram(
      `🛒 <b>ĐƠN MỚI ${code}</b>\n📦 ${esc(svc.name)} (${svc.platform})\n🔢 SL: ${data.quantity}\n💰 ${formatVnd(amount)}\n🔗 ${esc(data.link)}\n📞 ${esc(data.contact)}${data.note ? `\n📝 ${esc(data.note)}` : ""}\n⏳ Chờ thanh toán`,
    );
    return { code, amount };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().min(4).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("orders")
      .select("code, service_name, quantity, amount, status, created_at")
      .eq("code", data.code.toUpperCase()).maybeSingle();
    return o ?? null;
  });

export const notifyPaid = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().min(4).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("orders").select("code, amount, status").eq("code", data.code).maybeSingle();
    if (!o || o.status !== "pending") return { ok: false };
    await notifyTelegram(`💸 Khách báo <b>đã chuyển khoản</b> đơn ${o.code} — ${formatVnd(Number(o.amount))}. Vui lòng kiểm tra TPBank và xác nhận.`);
    return { ok: true };
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "running", "completed", "cancelled"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Không có quyền");
    const { data: o, error } = await context.supabase.from("orders")
      .update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id)
      .select("code, service_name, quantity, amount, contact").maybeSingle();
    if (error || !o) throw new Error("Không cập nhật được đơn");
    await notifyTelegram(`🔄 <b>Cập nhật đơn ${o.code}</b>\n📦 ${esc(o.service_name)} · SL ${o.quantity}\n💰 ${formatVnd(Number(o.amount))}\n📞 ${esc(o.contact)}\n➡️ Trạng thái: <b>${STATUS_LABEL[data.status]}</b>`);
    return { ok: true };
  });

export const createMemberOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().uuid(),
      link: z.string().trim().min(3).max(500),
      quantity: z.number().int().min(1).max(10_000_000),
      note: z.string().trim().max(1000).optional(),
      contact: z.string().trim().min(6).max(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("email, discount_percent").eq("id", context.userId).maybeSingle();
    if (!prof) throw new Error("Không tìm thấy tài khoản");
    const { data: svc } = await supabaseAdmin.from("services").select("*").eq("id", data.serviceId).eq("active", true).maybeSingle();
    if (!svc) throw new Error("Dịch vụ không tồn tại");
    if (data.quantity < svc.min_qty || data.quantity > svc.max_qty) throw new Error(`Số lượng từ ${svc.min_qty} đến ${svc.max_qty}`);
    const amount = memberAmount(Number(svc.unit_price), data.quantity, Number(prof.discount_percent));
    const { data: ok } = await supabaseAdmin.rpc("deduct_balance", { _uid: context.userId, _amount: amount });
    if (!ok) throw new Error(`Số dư không đủ (cần ${formatVnd(amount)}). Liên hệ admin để nạp tiền.`);
    const code = "SM" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabaseAdmin.from("orders").insert({
      code, service_id: svc.id, service_name: svc.name, platform: svc.platform, link: data.link, quantity: data.quantity,
      note: data.note || null, contact: data.contact, amount, status: "paid", user_id: context.userId, paid_by_balance: true,
    });
    if (error) {
      const { data: p2 } = await supabaseAdmin.from("profiles").select("balance").eq("id", context.userId).single();
      await supabaseAdmin.from("profiles").update({ balance: Number(p2!.balance) + amount }).eq("id", context.userId);
      throw new Error("Không tạo được đơn, tiền đã được hoàn lại");
    }
    await notifyTelegram(
      `💳 <b>ĐƠN THÀNH VIÊN ${code}</b> (đã trừ số dư)\n👤 ${esc(prof.email ?? "")}\n📦 ${esc(svc.name)} (${svc.platform})\n🔢 SL: ${data.quantity}\n💰 ${formatVnd(amount)}\n🔗 ${esc(data.link)}\n📞 ${esc(data.contact)}${data.note ? `\n📝 ${esc(data.note)}` : ""}\n✅ Đã thanh toán – chờ chạy`,
    );
    return { code, amount };
  });
