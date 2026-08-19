import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar - Admin" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
      }
      navigate({ to: "/admin" });
    } catch (e: any) {
      setError(e?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: "-apple-system,Segoe UI,Roboto,Arial,sans-serif" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 32, borderRadius: 12, width: "100%", maxWidth: 380, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22 }}>Painel Admin</h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 14 }}>
          {mode === "signin" ? "Entre com sua conta" : "Crie uma conta"}
        </p>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, marginBottom: 14, fontSize: 14 }} />
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Senha</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 6, marginBottom: 14, fontSize: 14 }} />
        {error && <div style={{ background: "#fee", color: "#c00", padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", background: "#3483FA", color: "#fff", border: 0, padding: 12, borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          {loading ? "..." : mode === "signin" ? "Entrar" : "Cadastrar"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{ width: "100%", background: "transparent", border: 0, marginTop: 12, color: "#3483FA", cursor: "pointer", fontSize: 13 }}>
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
