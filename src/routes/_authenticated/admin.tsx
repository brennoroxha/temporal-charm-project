import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOrders, updateOrderStatus } from "@/lib/orders.functions";
import { listGateways, updateGateway, updateSplitGateways } from "@/lib/gateways.functions";
import { listPageViews, listSessionEvents, listVisitLogs } from "@/lib/analytics.functions";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Ofertas 25 Anos - Admin" }] }),
  component: AdminPage,
});

type Order = {
  id: string;
  transaction_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_document: string | null;
  amount: number;
  status: string;
  items: any;
  shipping: any;
  receipt_url: string | null;
  receipt_signed_url: string | null;
  receipt_uploaded_at: string | null;
  created_at: string;
};

const brl = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS = ["pending", "receipt_uploaded", "paid", "rejected", "canceled"];

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchList = useServerFn(listOrders);
  const doUpdate = useServerFn(updateOrderStatus);
  const fetchVisits = useServerFn(listPageViews);
  const fetchEvents = useServerFn(listSessionEvents);
  const fetchLogs = useServerFn(listVisitLogs);
  const fetchGateways = useServerFn(listGateways);
  const doUpdateGateway = useServerFn(updateGateway);
  const doUpdateSplit = useServerFn(updateSplitGateways);

  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "custom">("all");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [preview, setPreview] = useState<Order | null>(null);
  const [tab, setTab] = useState<"orders" | "visits" | "sources" | "gateways">("orders");
  const [stepsSession, setStepsSession] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders", dateFilter, customDates],
    queryFn: async () => {
      try {
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (dateFilter === "today") {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          startDate = d.toISOString();
        } else if (dateFilter === "yesterday") {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          d.setHours(0, 0, 0, 0);
          startDate = d.toISOString();
          const e = new Date();
          e.setDate(e.getDate() - 1);
          e.setHours(23, 59, 59, 999);
          endDate = e.toISOString();
        } else if (dateFilter === "custom" && customDates.start) {
          startDate = new Date(customDates.start).toISOString();
          if (customDates.end) {
            endDate = new Date(customDates.end + "T23:59:59").toISOString();
          }
        }

        return await fetchList({ data: { startDate, endDate } });
      } catch (e: any) {
        if (String(e?.message).includes("Forbidden")) setForbidden(true);
        throw e;
      }
    },
    refetchInterval: tab === "orders" ? 15000 : false,
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: string }) => doUpdate({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const visitsQ = useQuery({
    queryKey: ["admin-visits"],
    queryFn: async () => {
      try { return await fetchVisits(); }
      catch (e: any) { if (String(e?.message).includes("Forbidden")) setForbidden(true); throw e; }
    },
    refetchInterval: 15000,
    enabled: tab === "visits",
  });
  const visits: any[] = (visitsQ.data?.visits ?? []) as any[];

  const logsQ = useQuery({
    queryKey: ["admin-visit-logs"],
    queryFn: async () => {
      try { return await fetchLogs(); }
      catch (e: any) { if (String(e?.message).includes("Forbidden")) setForbidden(true); throw e; }
    },
    refetchInterval: 15000,
    enabled: tab === "sources",
  });
  const logs: any[] = (logsQ.data?.logs ?? []) as any[];

  const gatewaysQ = useQuery({
    queryKey: ["admin-gateways"],
    queryFn: async () => {
      try { return await fetchGateways(); }
      catch (e: any) { if (String(e?.message).includes("Forbidden")) setForbidden(true); throw e; }
    },
    enabled: tab === "gateways",
  });
  const gateways: any[] = (gatewaysQ.data?.gateways ?? []) as any[];
  const splitSettings = (gatewaysQ.data?.settings ?? {}) as any;

  const updateGatewayMut = useMutation({
    mutationFn: (v: { id: string; publicKey?: string; secretKey?: string; isActive?: boolean }) =>
      doUpdateGateway({ data: v }),
    onSuccess: () => gatewaysQ.refetch(),
  });

  const updateSplitMut = useMutation({
    mutationFn: (enabled: boolean) => doUpdateSplit({ data: { enabled } }),
    onSuccess: () => gatewaysQ.refetch(),
  });

  


  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const orders: Order[] = (data?.orders ?? []) as any;
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    receipts: orders.filter((o) => o.receipt_url).length,
    paid: orders.filter((o) => o.status === "paid").length,
    revenue: orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0),
  };

  if (forbidden) {
    return (
      <div style={{ padding: 40, fontFamily: "-apple-system,Segoe UI,Roboto,Arial,sans-serif", maxWidth: 600, margin: "0 auto" }}>
        <h1>Acesso negado</h1>
        <p>Sua conta não tem permissão de administrador. Peça para adicionarem seu usuário à tabela <code>user_roles</code> com o papel <code>admin</code>.</p>
        <button type="button" onClick={signOut}>Sair</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fb", fontFamily: "-apple-system,Segoe UI,Roboto,Arial,sans-serif" }}>
      <header style={{ background: "#0f172a", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Painel Admin</h1>
        <button type="button" onClick={signOut} style={{ background: "transparent", border: "1px solid #fff5", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>Sair</button>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
          <Stat label="Pedidos" value={stats.total} />
          <Stat label="Pendentes" value={stats.pending} />
          <Stat label="Comprovantes" value={stats.receipts} />
          <Stat label="Pagos" value={stats.paid} />
          <Stat label="Receita paga" value={brl(stats.revenue)} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          {[
            { k: "orders", label: "Pedidos" },
            { k: "visits", label: "Visitas" },
            { k: "sources", label: "Origens (UTM)" },
            { k: "gateways", label: "Gateways" },
          ].map((t) => (
            <button type="button" key={t.k} onClick={() => setTab(t.k as any)}
              style={{ padding: "10px 16px", border: 0, background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600, color: tab === t.k ? "#3483FA" : "#64748b", borderBottom: tab === t.k ? "2px solid #3483FA" : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginRight: 8 }}>Período:</span>
              {[
                { k: "all", label: "Total" },
                { k: "today", label: "Hoje" },
                { k: "yesterday", label: "Ontem" },
                { k: "custom", label: "Personalizado" },
              ].map((d) => (
                <button type="button" key={d.k} onClick={() => setDateFilter(d.k as any)}
                  style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #ddd", background: dateFilter === d.k ? "#0f172a" : "#fff", color: dateFilter === d.k ? "#fff" : "#333", cursor: "pointer", fontSize: 13 }}>
                  {d.label}
                </button>
              ))}
              
              {dateFilter === "custom" && (
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 8 }}>
                  <input type="date" value={customDates.start} onChange={e => setCustomDates(prev => ({ ...prev, start: e.target.value }))} 
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12 }} />
                  <span style={{ fontSize: 12 }}>até</span>
                  <input type="date" value={customDates.end} onChange={e => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12 }} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginRight: 8 }}>Status:</span>
              {["all", ...STATUS].map((s) => (
                <button type="button" key={s} onClick={() => setFilter(s)}
                  style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #ddd", background: filter === s ? "#3483FA" : "#fff", color: filter === s ? "#fff" : "#333", cursor: "pointer", fontSize: 13 }}>
                  {s === "all" ? "Todos" : s}
                </button>
              ))}
            </div>

            {isLoading && <div>Carregando...</div>}
            {error && !forbidden && <div style={{ color: "#c00" }}>{String((error as any).message)}</div>}

            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <tr>
                    <th style={th}>Data</th>
                    <th style={th}>Cliente</th>
                    <th style={th}>Valor</th>
                    <th style={th}>Status</th>
                    <th style={th}>Comprovante</th>
                    <th style={th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} style={{ borderTop: "1px solid #eef2f7" }}>
                      <td style={td}>{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                        <div style={{ color: "#666", fontSize: 12 }}>{o.customer_email}</div>
                        {o.customer_phone && <div style={{ color: "#666", fontSize: 12 }}>{o.customer_phone}</div>}
                      </td>
                      <td style={td}>{brl(o.amount)}</td>
                      <td style={td}>
                        <select value={o.status} onChange={(e) => mut.mutate({ id: o.id, status: e.target.value })}
                          style={{ padding: 6, borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}>
                          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={td}>
                        {o.receipt_signed_url ? (
                          <button type="button" onClick={() => setPreview(o)} style={btnSm}>Ver</button>
                        ) : <span style={{ color: "#999" }}>—</span>}
                      </td>
                      <td style={td}>
                        <button type="button" onClick={() => setPreview(o)} style={btnSm}>Detalhes</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !isLoading && (
                    <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#999", padding: 40 }}>Nenhum pedido</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "visits" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                {visits.length} sessões (atualiza a cada 15s)
              </div>
              <button type="button" onClick={() => visitsQ.refetch()} style={btnSm}>Atualizar</button>
            </div>
            {visitsQ.isLoading && <div>Carregando...</div>}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <tr>
                    <th style={th}>Última atividade</th>
                    <th style={th}>IP</th>
                    <th style={th}>Última página</th>
                    <th style={th}>Views</th>
                    <th style={th}>Entrou em</th>
                    <th style={th}>Navegador</th>
                    <th style={th}>Passos</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} style={{ borderTop: "1px solid #eef2f7" }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{timeAgo(v.last_seen_at)}</div>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(v.last_seen_at).toLocaleString("pt-BR")}</div>
                      </td>
                      <td style={td}>
                        <div style={{ fontFamily: "monospace" }}>{v.ip ?? "—"}</div>
                        {v.country && <div style={{ color: "#94a3b8", fontSize: 11 }}>{v.country}</div>}
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{v.path ?? "—"}</div>
                        {v.title && <div style={{ color: "#64748b", fontSize: 11 }}>{v.title}</div>}
                      </td>
                      <td style={td}>{v.views}</td>
                      <td style={td}>{new Date(v.first_seen_at).toLocaleString("pt-BR")}</td>
                      <td style={{ ...td, maxWidth: 220, color: "#64748b", fontSize: 11, wordBreak: "break-all" }}>
                        {shortUA(v.user_agent)}
                      </td>
                      <td style={td}>
                        <button type="button" onClick={() => setStepsSession(v.session_id)} style={btnSm}>Ver passos</button>
                      </td>
                    </tr>
                  ))}
                  {visits.length === 0 && !visitsQ.isLoading && (
                    <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#999", padding: 40 }}>Nenhuma visita ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {tab === "sources" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                {logs.length} visitas registradas com origem (atualiza a cada 15s)
              </div>
              <button type="button" onClick={() => logsQ.refetch()} style={btnSm}>Atualizar</button>
            </div>
            {logsQ.isLoading && <div>Carregando...</div>}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <tr>
                    <th style={th}>Quando</th>
                    <th style={th}>IP</th>
                    <th style={th}>Passos (Funil)</th>
                    <th style={th}>Página</th>
                    <th style={th}>Origem / Mídia</th>
                    <th style={th}>Campanha</th>
                    <th style={th}>Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #eef2f7" }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{timeAgo(l.created_at)}</div>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(l.created_at).toLocaleString("pt-BR")}</div>
                      </td>
                      <td style={td}>
                        <div style={{ fontFamily: "monospace" }}>{l.ip ?? "—"}</div>
                        {l.country && <div style={{ color: "#94a3b8", fontSize: 11 }}>{l.country}</div>}
                      </td>
                      <td style={{ ...td, maxWidth: 240, wordBreak: "break-all" }}>{l.path ?? "—"}</td>
                      <td style={{ ...td, minWidth: 200, color: "#3483FA", fontWeight: 600 }}>
                        {l.funnel ? (
                          <div style={{ fontSize: 11, background: "#ebf5ff", padding: "4px 8px", borderRadius: 4 }}>
                            {l.funnel}
                          </div>
                        ) : "—"}
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{l.utm_source || "direto"}</div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{l.utm_medium || "—"}</div>
                      </td>
                      <td style={{ ...td, maxWidth: 200, wordBreak: "break-all" }}>{l.utm_campaign || "—"}</td>
                      <td style={{ ...td, maxWidth: 200, wordBreak: "break-all", color: "#64748b", fontSize: 11 }}>
                        <div>{l.utm_content || "—"}</div>
                        <div>{l.utm_term || "—"}</div>
                      </td>
                      <td style={{ ...td, maxWidth: 220, wordBreak: "break-all", color: "#64748b", fontSize: 11 }}>{l.referrer || "—"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && !logsQ.isLoading && (
                    <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#999", padding: 40 }}>Nenhuma visita registrada ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>



      {preview && <Modal order={preview} onClose={() => setPreview(null)} />}
      {stepsSession && <StepsModal sessionId={stepsSession} fetchEvents={fetchEvents} onClose={() => setStepsSession(null)} />}
      
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 14px", fontWeight: 600, fontSize: 12, textTransform: "uppercase", color: "#475569" };
const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "top" };
const btnSm: React.CSSProperties = { background: "#3483FA", color: "#fff", border: 0, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 };

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}
function shortUA(ua: string | null | undefined): string {
  if (!ua) return "—";
  const m = ua.match(/(Chrome|Firefox|Safari|Edge|OPR|SamsungBrowser)[/\s]([\d.]+)/);
  const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(";")[0]?.trim() ?? "";
  return `${m ? `${m[1]} ${m[2].split(".")[0]}` : "?"} · ${os}`;
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Modal({ order, onClose }: { order: Order; onClose: () => void }) {
  const isImg = order.receipt_signed_url && !/\.pdf(\?|$)/i.test(order.receipt_url || "");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 10, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Pedido #{order.transaction_id ?? order.id.slice(0, 8)}</h2>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: 0, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ fontSize: 14, color: "#333", lineHeight: 1.7 }}>
          <div><b>Cliente:</b> {order.customer_name}</div>
          <div><b>E-mail:</b> {order.customer_email}</div>
          {order.customer_phone && <div><b>Telefone:</b> {order.customer_phone}</div>}
          {order.customer_document && <div><b>CPF:</b> {order.customer_document}</div>}
          <div><b>Valor:</b> {brl(order.amount)}</div>
          <div><b>Status:</b> {order.status}</div>
          <div><b>Criado:</b> {new Date(order.created_at).toLocaleString("pt-BR")}</div>
        </div>
        {order.shipping && (
          <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 6, fontSize: 13 }}>
            <b>Entrega:</b><br />
            {order.shipping.street}, {order.shipping.streetNumber} - {order.shipping.neighborhood}<br />
            {order.shipping.city}/{order.shipping.state} - {order.shipping.zipCode}
          </div>
        )}
        {Array.isArray(order.items) && order.items.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <b>Itens:</b>
            <ul style={{ margin: "6px 0", paddingLeft: 20, fontSize: 13 }}>
              {order.items.map((i: any, idx: number) => (
                <li key={idx}>{i.quantity}x {i.title} - {brl((i.unitPrice ?? 0) * (i.quantity ?? 1))}</li>
              ))}
            </ul>
          </div>
        )}
        {order.receipt_signed_url && (
          <div style={{ marginTop: 20 }}>
            <b>Comprovante:</b>
            <div style={{ marginTop: 8 }}>
              {isImg ? (
                <img src={order.receipt_signed_url} alt="comprovante" loading="lazy" decoding="async" style={{ maxWidth: "100%", borderRadius: 6, border: "1px solid #eee" }} />
              ) : (
                <a href={order.receipt_signed_url} target="_blank" rel="noreferrer" style={{ color: "#3483FA" }}>Abrir arquivo</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepsModal({ sessionId, fetchEvents, onClose }: { sessionId: string; fetchEvents: (args: { data: { session_id: string } }) => Promise<{ events: any[] }>; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["session-events", sessionId],
    queryFn: () => fetchEvents({ data: { session_id: sessionId } }),
    refetchInterval: 10000,
  });
  const events: any[] = q.data?.events ?? [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 10, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Passos da sessão</h2>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, fontFamily: "monospace", wordBreak: "break-all" }}>{sessionId}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: 0, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {q.isLoading && <div>Carregando...</div>}
        {!q.isLoading && events.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "#999" }}>Sem passos detalhados para esta sessão.</div>
        )}
        {events.length > 0 && (
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {events.map((ev, i) => {
              const prev = i > 0 ? new Date(events[i - 1].created_at).getTime() : new Date(ev.created_at).getTime();
              const delta = Math.max(0, Math.floor((new Date(ev.created_at).getTime() - prev) / 1000));
              return (
                <li key={ev.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i === 0 ? 0 : "1px solid #eef2f7" }}>
                  <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: "#3483FA", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{ev.event}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {new Date(ev.created_at).toLocaleString("pt-BR")}
                      {i > 0 && <span> · +{delta}s</span>}
                      {ev.path && <span> · {ev.path}</span>}
                    </div>
                    {ev.meta && Object.keys(ev.meta).length > 0 && (
                      <pre style={{ margin: "6px 0 0", padding: 8, background: "#f8fafc", borderRadius: 6, fontSize: 11, color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(ev.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}


