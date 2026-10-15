export const BANK = { bin: "TPB", account: "00003858069", name: "VO TAN NHAN", label: "TPBank" };

export function calcAmount(unitPrice: number, quantity: number) {
  return Math.round(unitPrice * quantity);
}

export function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
}

export function vietQrUrl(amount: number, code: string) {
  const p = new URLSearchParams({ amount: String(Math.round(amount)), addInfo: code, accountName: BANK.name });
  return `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.png?${p}`;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán – chưa chạy",
  running: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "unlock", label: "Mở khóa & Bảo mật" },
] as const;

/** Member price after personal discount (percent 0–100). */
export function memberAmount(unitPrice: number, quantity: number, discountPercent: number) {
  const d = Math.min(100, Math.max(0, discountPercent || 0));
  return Math.round(unitPrice * quantity * (1 - d / 100));
}

export const CONTACT = {
  facebook: "https://www.facebook.com/nhan.votan.395",
  telegram: "https://t.me/kyretia",
  telegramHandle: "@kyretia",
  zalo: "https://zalo.me/0392733577",
  zaloPhone: "0392733577",
};
