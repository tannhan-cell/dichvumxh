import { describe, expect, it } from "vitest";
import { calcAmount, vietQrUrl } from "@/lib/pricing";

describe("pricing", () => {
  it("amount is unit price times quantity", () => {
    expect(calcAmount(25, 1000)).toBe(25000);
  });
  it("QR pays TPBank 00003858069 with amount and order code", () => {
    const url = vietQrUrl(25000, "SMABC123");
    expect(url).toContain("TPB-00003858069");
    expect(url).toContain("amount=25000");
    expect(url).toContain("addInfo=SMABC123");
  });
});
