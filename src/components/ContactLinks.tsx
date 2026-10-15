import { Facebook, MessageCircle, Send } from "lucide-react";
import { CONTACT } from "@/lib/pricing";

export function ContactLinks({ compact }: { compact?: boolean }) {
  const items = [
    { href: CONTACT.facebook, label: "Facebook", sub: "Nhân Võ Tấn", Icon: Facebook },
    { href: CONTACT.telegram, label: "Telegram", sub: CONTACT.telegramHandle, Icon: Send },
    { href: CONTACT.zalo, label: "Zalo", sub: CONTACT.zaloPhone, Icon: MessageCircle },
  ];
  return (
    <div className={compact ? "flex flex-wrap gap-3" : "grid gap-2"}>
      {items.map(({ href, label, sub, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm transition-colors hover:border-primary">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold">{label}</span>
          {!compact && <span className="ml-auto text-muted-foreground">{sub}</span>}
        </a>
      ))}
    </div>
  );
}
