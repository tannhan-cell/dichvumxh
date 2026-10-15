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
