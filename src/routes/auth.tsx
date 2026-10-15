import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Đăng nhập quản trị — SocialMedia" },
    { name: "description", content: "Đăng nhập trang quản trị SocialMedia." },
    { property: "og:title", content: "Đăng nhập quản trị — SocialMedia" },
    { property: "og:description", content: "Trang quản trị SocialMedia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") return toast.success("Kiểm tra email để xác nhận tài khoản.");
    nav({ to: "/admin" });
  }
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-extrabold">Quản trị <span className="text-primary">SocialMedia</span></h1>
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={6} placeholder="Mật khẩu" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button variant="premium" disabled={busy}>{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</Button>
        <button type="button" className="text-xs text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
