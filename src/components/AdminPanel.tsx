"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut, LayoutDashboard, ShoppingBag, Package, Settings, Image,
  Star, Tag, Plus, Edit, Trash2, X, Eye, Phone, MessageCircle, Menu,
  Bell, Shield, Key, Mail, ChevronDown, Search,
} from "lucide-react";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import type { Product, Category, Order, Coupon, Testimonial } from "@/db/schema";

type Page = "dashboard" | "orders" | "products" | "categories" | "coupons" | "testimonials" | "media" | "settings" | "profile";

const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
  recebido: { label: "Recebido", color: "#1976d2", emoji: "📥" },
  preparando: { label: "Preparando", color: "#f57c00", emoji: "👨‍🍳" },
  entrega: { label: "Saiu p/ Entrega", color: "#7b1fa2", emoji: "🛵" },
  entregue: { label: "Entregue", color: "#388e3c", emoji: "✅" },
  cancelado: { label: "Cancelado", color: "#c62828", emoji: "❌" },
};

// ============== LOGIN ==============
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await globalThis.fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("admin_token", data.data.token);
        localStorage.setItem("admin_user", JSON.stringify(data.data.user));
        onLogin();
      } else {
        setError(data.error || "Erro ao fazer login");
      }
    } catch { setError("Erro de conexão"); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🍔</div>
          <h1 className="login-title">SARON BURGUER</h1>
          <p style={{ color: "var(--text-gray)" }}>Painel Administrativo</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Usuário</label><input className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus /></div>
          <div className="form-group"><label className="form-label">Senha</label><input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required /></div>
          {error && <div style={{ padding: 12, background: "rgba(198,40,40,0.2)", border: "1px solid var(--danger)", borderRadius: 8, marginBottom: 16, color: "var(--danger)", fontSize: "0.9rem" }}>{error}</div>}
          <button className="btn-primary" style={{ width: "100%", textAlign: "center" }} disabled={loading}>
            <span>{loading ? "⏳ Entrando..." : "🔐 ENTRAR"}</span>
          </button>
        </form>
        <p style={{ marginTop: 12, textAlign: "center", color: "var(--text-gray)", fontSize: "0.8rem" }}>Usuário: admin / Senha: saron123</p>
        <Link href="/" style={{ display: "block", marginTop: 12, textAlign: "center", color: "var(--secondary)", fontSize: "0.9rem" }}>← Voltar ao site</Link>
      </div>
    </div>
  );
}

// ============== ROOT ADMIN PANEL ==============
export default function AdminPanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    try { setLogged(!!localStorage.getItem("admin_token")); } catch {}
    setLoading(false);
  }, []);

  if (!mounted || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: "4rem" }}>🍔</div><p style={{ color: "var(--text-gray)", marginTop: 16 }}>Carregando...</p></div>
      </div>
    );
  }

  if (!logged) return <LoginForm onLogin={() => setLogged(true)} />;
  return <AdminDashboard onLogout={() => { setLogged(false); localStorage.removeItem("admin_token"); localStorage.removeItem("admin_user"); }} />;
}

// ============== NOTIFICATION SOUND ==============
function useOrderNotification(newOrdersCount: number, prevCountRef: React.MutableRefObject<number>) {
  useEffect(() => {
    if (newOrdersCount > prevCountRef.current) {
      try {
        // Notificação sonora usando AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);

        // Segundo beep mais agudo
        setTimeout(() => {
          const ctx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.type = "sine";
          osc2.frequency.value = 1100;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx2.currentTime + 0.2);
        }, 200);

        // Notificação do navegador
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🍔 SARON BURGUER", {
            body: "Novo pedido recebido!",
            icon: "/images/logo.png",
          });
        }
      } catch {}
    }
    prevCountRef.current = newOrdersCount;
  }, [newOrdersCount]);
}

// ============== DASHBOARD ==============
function DashboardSection({ orders, stats }: { orders: Order[]; stats: any }) {
  const pendingCount = orders.filter(o => o.status === "recebido" || o.status === "preparando").length;
  const todayOrders = orders.filter(o => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(o.createdAt) >= today;
  });
  const todayRevenue = todayOrders.reduce((s, o) => s + parseFloat(o.total), 0);

  const statusCounts = { recebido: 0, preparando: 0, entrega: 0, entregue: 0, cancelado: 0 };
  orders.forEach(o => { if (o.status in statusCounts) statusCounts[o.status as keyof typeof statusCounts]++; });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div className="dashboard-card"><div className="dashboard-card-icon">📦</div><div className="dashboard-card-title">Pedidos Hoje</div><div className="dashboard-card-value">{todayOrders.length}</div></div>
        <div className="dashboard-card"><div className="dashboard-card-icon">💰</div><div className="dashboard-card-title">Receita Hoje</div><div className="dashboard-card-value">{formatCurrency(todayRevenue)}</div></div>
        <div className="dashboard-card"><div className="dashboard-card-icon">⏳</div><div className="dashboard-card-title">Pendentes</div><div className="dashboard-card-value">{pendingCount}</div></div>
        <div className="dashboard-card"><div className="dashboard-card-icon">📊</div><div className="dashboard-card-title">Total Pedidos</div><div className="dashboard-card-value">{orders.length}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12 }}>
          <h3 style={{ color: "var(--secondary)", marginBottom: 12, fontSize: "1rem" }}>📈 Status dos Pedidos</h3>
          {Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([s, count]) => {
            const total = orders.length || 1;
            const pct = (count / total) * 100;
            const cfg = statusLabels[s];
            return (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                  <span>{cfg?.emoji} {cfg?.label || s}</span><span>{count} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-dark)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cfg?.color || "#666", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <p style={{ color: "var(--text-gray)", textAlign: "center", padding: 24 }}>Nenhum pedido ainda</p>}
        </div>

        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12 }}>
          <h3 style={{ color: "var(--secondary)", marginBottom: 12, fontSize: "1rem" }}>🏆 Produtos Mais Vendidos</h3>
          {(stats?.topProducts?.length ? stats.topProducts : []).map((p: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.9rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, #ffd700, #ff6600)" : "var(--bg-card-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: i === 0 ? "var(--bg-dark)" : "white", flexShrink: 0, fontSize: "0.8rem" }}>{i + 1}</div>
              <div style={{ flex: 1 }}><div style={{ color: "white" }}>{p.name}</div><div style={{ color: "var(--text-gray)", fontSize: "0.8rem" }}>{p.count} vendas</div></div>
            </div>
          ))}
          {(!stats?.topProducts?.length) && <p style={{ color: "var(--text-gray)", textAlign: "center", padding: 24 }}>Sem dados ainda</p>}
        </div>
      </div>
    </div>
  );
}

// ============== ORDERS ==============
function OrdersSection({ orders: initialOrders, onChangeStatus, onDeleteOrder }: { orders: Order[]; onChangeStatus: (id: number, status: string) => void; onDeleteOrder?: (id: number) => void }) {
  const [filter, setFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  let filtered = filter ? initialOrders.filter(o => o.status === filter) : initialOrders;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(o =>
      o.customerName.toLowerCase().includes(term) ||
      String(o.orderNumber).includes(term) ||
      o.customerPhone.includes(term)
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input className="form-input" style={{ width: 200, padding: "8px 12px" }} placeholder="🔍 Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="form-input" style={{ width: "auto", padding: "8px 12px" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos ({initialOrders.length})</option>
            <option value="recebido">📥 Recebidos</option>
            <option value="preparando">👨‍🍳 Preparando</option>
            <option value="entrega">🛵 Entrega</option>
            <option value="entregue">✅ Entregues</option>
            <option value="cancelado">❌ Cancelados</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <div className="empty-state-icon" style={{ fontSize: "3rem" }}>📦</div>
            <h3>Nenhum pedido encontrado</h3>
          </div>
        )}
        {filtered.map((order) => {
          const cfg = statusLabels[order.status];
          const items = order.items as any[];
          const isNew = order.status === "recebido" && new Date(order.createdAt).getTime() > Date.now() - 60000;

          return (
            <div key={order.id} style={{
              background: "var(--bg-card)", borderRadius: 12, padding: 16,
              border: `2px solid ${isNew ? "var(--secondary)" : cfg?.color || "#444"}`,
              position: "relative", overflow: "hidden",
              animation: isNew ? "fadeIn 0.5s" : "none",
            }}>
              {isNew && <div style={{ position: "absolute", top: 8, right: 8, background: "var(--danger)", color: "white", padding: "2px 8px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, animation: "btnPulse 1.5s infinite" }}>🆕 NOVO</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <h3 style={{ color: "var(--secondary)", fontSize: "1.3rem", fontFamily: "Bebas Neue" }}>#{String(order.orderNumber).padStart(4, "0")}</h3>
                  <p style={{ color: "var(--text-gray)", fontSize: "0.75rem" }}>{formatDate(order.createdAt)}</p>
                </div>
                <span className={`status-badge status-${order.status}`}>{cfg?.emoji} {cfg?.label || order.status}</span>
              </div>
              <div style={{ fontSize: "0.85rem", marginBottom: 6 }}>
                <strong>{order.customerName}</strong>
                <div style={{ color: "var(--text-gray)" }}>📞 {order.customerPhone}</div>
                {order.address && <div style={{ color: "var(--text-gray)", fontSize: "0.8rem" }}>📍 {order.address}</div>}
              </div>
              <div style={{ background: "var(--bg-dark)", padding: 6, borderRadius: 6, fontSize: "0.8rem", marginBottom: 8 }}>
                {items.slice(0, 2).map((item: any, i: number) => (
                  <div key={i} style={{ color: "var(--text-gray)" }}>• {item.quantity}x {item.name}</div>
                ))}
                {items.length > 2 && <div style={{ color: "var(--secondary)", fontSize: "0.75rem" }}>+ {items.length - 2} mais...</div>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--secondary)", fontFamily: "Bebas Neue", fontSize: "1.1rem" }}>{formatCurrency(order.total)}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-gray)" }}>
                  {order.paymentMethod === "pix" ? "💠 PIX" : order.paymentMethod === "dinheiro" ? "💵 Dinheiro" : "💳 Cartão"}
                </span>
              </div>

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                {order.status === "recebido" && <button className="btn-action btn-warning" onClick={() => onChangeStatus(order.id, "preparando")} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>👨‍🍳 Preparar</button>}
                {order.status === "preparando" && <button className="btn-action btn-edit" onClick={() => onChangeStatus(order.id, "entrega")} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>🛵 Enviar</button>}
                {order.status === "entrega" && <button className="btn-action btn-success" onClick={() => onChangeStatus(order.id, "entregue")} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>✓ Entregue</button>}
                {order.status !== "entregue" && order.status !== "cancelado" && (
                  <button className="btn-action btn-delete" onClick={() => onChangeStatus(order.id, "cancelado")} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>✕ Cancelar</button>
                )}
                {(order.status === "cancelado" || order.status === "entregue") && (
                  <button className="btn-action btn-delete" onClick={async () => {
                    if (confirm(`Excluir pedido #${order.orderNumber} permanentemente?`)) {
                      await globalThis.fetch(`/api/orders?id=${order.id}`, { method: "DELETE" });
                      if (onDeleteOrder) onDeleteOrder(order.id);
                    }
                  }} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>🗑️ Excluir</button>
                )}
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn-action btn-secondary" onClick={() => setSelectedOrder(order)} style={{ fontSize: "0.75rem", padding: "4px 10px" }}><Eye size={12} /> Ver</button>
                <a href={generateWhatsAppLink(order.customerPhone, `Olá ${order.customerName}! Seu pedido #${order.orderNumber} na SARON BURGUER`)} target="_blank" rel="noopener noreferrer" className="btn-action" style={{ background: "#25d366", color: "white", fontSize: "0.75rem", padding: "4px 10px" }}><MessageCircle size={12} /></a>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h2 style={{ color: "var(--secondary)", fontFamily: "Bebas Neue" }}>Pedido #{String(selectedOrder.orderNumber).padStart(4, "0")}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ fontSize: "0.9rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><strong>Cliente:</strong> {selectedOrder.customerName}</div>
                <div><strong>Tel:</strong> {selectedOrder.customerPhone}</div>
                <div><strong>Tipo:</strong> {selectedOrder.deliveryType === "delivery" ? "🚚 Delivery" : "📍 Retirada"}</div>
                <div><strong>Pagto:</strong> {selectedOrder.paymentMethod === "pix" ? "💠 PIX" : selectedOrder.paymentMethod === "dinheiro" ? "💵 Dinheiro" : "💳 Cartão"}</div>
                {selectedOrder.address && <div style={{ gridColumn: "1 / -1" }}><strong>Endereço:</strong> {selectedOrder.address}, {selectedOrder.neighborhood}</div>}
              </div>
              <h4 style={{ color: "var(--secondary)", marginBottom: 8 }}>Itens:</h4>
              {(selectedOrder.items as any[]).map((item: any, i: number) => (
                <div key={i} style={{ background: "var(--bg-dark)", padding: 10, borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{item.quantity}x {item.name}</strong>
                    <span style={{ color: "var(--secondary)" }}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  {item.extras?.length > 0 && <p style={{ color: "var(--warning)", fontSize: "0.8rem" }}>➕ {item.extras.map((e: any) => e.name).join(", ")}</p>}
                  {item.notes && <p style={{ color: "var(--secondary)", fontSize: "0.8rem" }}>📝 {item.notes}</p>}
                </div>
              ))}
              <div style={{ borderTop: "2px solid var(--secondary)", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between", color: "var(--secondary)", fontSize: "1.2rem", fontWeight: 700 }}>
                <span>TOTAL:</span><span>{formatCurrency(selectedOrder.total)}</span>
              </div>
              <button className="btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={() => window.print()}><span>🖨️ IMPRIMIR</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== PRODUCTS ==============
function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = async () => {
    try {
      const [pR, cR] = await Promise.all([globalThis.fetch("/api/products"), globalThis.fetch("/api/categories")]);
      const pD = await pR.json(); const cD = await cR.json();
      if (pD.success) setProducts(pD.data ?? []);
      if (cD.success) setCats(cD.data ?? []);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const del = async (id: number) => { if (!confirm("Excluir?")) return; await globalThis.fetch(`/api/products?id=${id}`, { method: "DELETE" }); load(); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem" }}>🍔 Produtos ({products.length})</h3>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><span><Plus size={16} style={{ display: "inline" }} /> NOVO</span></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: "var(--bg-card)", borderRadius: 8, overflow: "hidden", opacity: p.available ? 1 : 0.5 }}>
            <div style={{ height: 110, background: "var(--bg-card-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", position: "relative" }}>
              {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍔"}
              {p.badge && <span style={{ position: "absolute", top: 4, right: 4, background: "var(--secondary)", color: "var(--bg-dark)", padding: "1px 6px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700 }}>{p.badge}</span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ color: "white", fontWeight: 600, fontSize: "0.85rem", marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--secondary)", fontFamily: "Bebas Neue", fontSize: "1rem" }}>{formatCurrency(p.price)}</span>
                <span style={{ color: p.available ? "var(--success)" : "var(--danger)", fontSize: "0.65rem" }}>{p.available ? "●" : "○"}</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button className="btn-action btn-edit" onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding: "2px 8px" }}><Edit size={10} /></button>
                <button className="btn-action btn-delete" onClick={() => del(p.id)} style={{ padding: "2px 8px" }}><Trash2 size={10} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showForm && <ProductForm product={editing} cats={cats} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ProductForm({ product, cats, onClose, onSave }: { product: Product | null; cats: Category[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<any>(product ?? { name: "", description: "", categoryId: cats[0]?.id ?? 1, price: "0", image: "", video: "", ingredients: [], allergens: [], extras: [], badge: "", available: true });
  const [ingInput, setIngInput] = useState("");

  const save = async () => {
    const method = product ? "PUT" : "POST";
    await globalThis.fetch("/api/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(product ? { ...form, id: product.id } : form) });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header"><h2 style={{ color: "var(--secondary)" }}>{product ? "✏️ Editar" : "➕ Novo"} Produto</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div className="form-group"><label className="form-label">Categoria</label>
              <select className="form-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value) })}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Preço (R$)</label><input type="number" step="0.01" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Badge</label>
              <select className="form-input" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
                <option value="">Nenhum</option>
                <option value="MAIS VENDIDO">🔥 Mais Vendido</option>
                <option value="NOVO">🆕 Novo</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">URL da Imagem</label><input className="form-input" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/uploads/foto.jpg" /></div>
          <div className="form-group"><label className="form-label">URL do Vídeo (opcional)</label><input className="form-input" value={form.video || ""} onChange={(e) => setForm({ ...form, video: e.target.value })} placeholder="YouTube embed URL" /></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {(form.ingredients ?? []).map((ing: string, i: number) => (
              <span key={i} style={{ background: "var(--bg-dark)", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem" }}>
                ✓ {ing} <X size={10} style={{ cursor: "pointer", display: "inline", verticalAlign: "middle" }} onClick={() => setForm({ ...form, ingredients: form.ingredients.filter((_: any, idx: number) => idx !== i) })} />
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="form-input" style={{ flex: 1, fontSize: "0.85rem" }} value={ingInput} onChange={(e) => setIngInput(e.target.value)} placeholder="Ingrediente" />
            <button className="btn-primary" onClick={() => { if (ingInput) { setForm({ ...form, ingredients: [...(form.ingredients ?? []), ingInput] }); setIngInput(""); } }}><span>+</span></button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: "0.9rem" }}>Disponível</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={save} style={{ flex: 1 }}><span>💾 SALVAR</span></button>
            <button className="btn-primary" onClick={onClose} style={{ background: "var(--bg-card-hover)" }}><span>Cancelar</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== CATEGORIES ==============
function CategoriesSection() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const load = async () => { try { const r = await globalThis.fetch("/api/categories"); const d = await r.json(); if (d.success) setCats(d.data ?? []); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => { if (!name || !icon) return; await globalThis.fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, icon, order: cats.length + 1 }) }); setName(""); setIcon(""); load(); };
  const del = async (id: number) => { if (!confirm("Excluir?")) return; await globalThis.fetch(`/api/categories?id=${id}`, { method: "DELETE" }); load(); };

  return (
    <div>
      <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem", marginBottom: 12 }}>📂 Categorias ({cats.length})</h3>
      <div style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", gap: 8, alignItems: "end" }}>
        <div className="form-group" style={{ margin: 0, flex: 0.2 }}><label className="form-label">Ícone</label><input className="form-input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍔" /></div>
        <div className="form-group" style={{ margin: 0, flex: 1 }}><label className="form-label">Nome</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <button className="btn-primary" onClick={add} style={{ marginBottom: 0 }}><span>➕</span></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {cats.map(c => (
          <div key={c.id} style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,215,0,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: "2rem" }}>{c.icon}</div>
            <div style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", marginBottom: 6 }}>{c.name}</div>
            <button className="btn-action btn-delete" onClick={() => del(c.id)} style={{ padding: "2px 8px", fontSize: "0.75rem" }}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== COUPONS ==============
function CouponsSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState(""); const [type, setType] = useState("percent"); const [value, setValue] = useState("");

  const load = async () => { try { const r = await globalThis.fetch("/api/coupons"); const d = await r.json(); if (d.success) setCoupons(d.data ?? []); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => { if (!code || !value) return; await globalThis.fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase(), type, value, minOrder: "0" }) }); setCode(""); setValue(""); load(); };

  return (
    <div>
      <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem", marginBottom: 12 }}>🎫 Cupons ({coupons.length})</h3>
      <div style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", gap: 8, alignItems: "end" }}>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Código</label><input className="form-input" style={{ width: 100 }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Tipo</label><select className="form-input" style={{ width: 80 }} value={type} onChange={(e) => setType(e.target.value)}><option value="percent">%</option><option value="fixed">R$</option></select></div>
        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Valor</label><input type="number" className="form-input" style={{ width: 80 }} value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <button className="btn-primary" onClick={add} style={{ marginBottom: 0 }}><span>➕</span></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {coupons.map(c => (
          <div key={c.id} style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, border: c.active ? "2px solid var(--secondary)" : "2px solid #444" }}>
            <div style={{ color: "var(--secondary)", fontFamily: "monospace", fontWeight: 700 }}>{c.code}</div>
            <div style={{ color: "white", fontSize: "1.1rem" }}>{c.type === "percent" ? `${c.value}%` : formatCurrency(c.value)} OFF</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== TESTIMONIALS ==============
function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [name, setName] = useState(""); const [rating, setRating] = useState(5); const [message, setMessage] = useState("");
  const load = async () => { try { const r = await globalThis.fetch("/api/testimonials"); const d = await r.json(); if (d.success) setItems(d.data ?? []); } catch {} };
  useEffect(() => { load(); }, []);
  const add = async () => { if (!name || !message) return; await globalThis.fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, rating, message }) }); setName(""); setRating(5); setMessage(""); load(); };
  const del = async (id: number) => { if (!confirm("Remover?")) return; await globalThis.fetch(`/api/testimonials?id=${id}`, { method: "DELETE" }); load(); };

  return (
    <div>
      <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem", marginBottom: 12 }}>⭐ Depoimentos ({items.length})</h3>
      <div style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" style={{ marginBottom: 6, fontSize: "0.85rem" }} />
        <select className="form-input" style={{ marginBottom: 6, fontSize: "0.85rem" }} value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
        <textarea className="form-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensagem..." style={{ marginBottom: 6, fontSize: "0.85rem" }} />
        <button className="btn-primary" onClick={add}><span>ADICIONAR</span></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
        {items.map(t => (
          <div key={t.id} style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8 }}>
            <div style={{ color: "var(--secondary)", fontSize: "0.9rem" }}>{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
            <p style={{ color: "var(--text-gray)", fontStyle: "italic", fontSize: "0.85rem", margin: "6px 0" }}>"{t.message}"</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.85rem" }}>{t.name}</strong>
              <button className="btn-action btn-delete" onClick={() => del(t.id)} style={{ padding: "2px 8px" }}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== MEDIA ==============
function MediaSection() {
  const [items, setItems] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("gallery");
  const [externalUrl, setExternalUrl] = useState("");
  const load = async () => {
    try {
      const r = await globalThis.fetch("/api/media");
      const d = await r.json();
      if (d.success) setItems(d.data ?? []);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const addExternalUrl = async () => {
    if (!externalUrl.trim()) return;
    setUploading(true);
    try {
      await globalThis.fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: externalUrl.trim(), category }),
      });
      setExternalUrl("");
      load();
    } finally {
      setUploading(false);
    }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    fd.append("category", category);
    await globalThis.fetch("/api/media", { method: "POST", body: fd });
    setUploading(false);
    e.target.value = "";
    load();
  };

  const removeMedia = async (id: number) => {
    if (!confirm("Excluir esta mídia?")) return;
    await globalThis.fetch(`/api/media?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem", marginBottom: 12 }}>📸 Mídias ({items.length})</h3>

      <div style={{ background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", padding: "12px 14px", borderRadius: 10, marginBottom: 12 }}>
        <p style={{ color: "#ffc107", fontSize: "0.8rem", margin: 0 }}>
          ⚠️ <strong>Importante:</strong> se o site estiver hospedado na Vercel, o upload direto de arquivo é temporário
          (pode ser perdido). Para fotos/vídeos permanentes, use uma <strong>URL externa</strong> (Cloudinary, Imgur, Bunny.net)
          colando o link abaixo.
        </p>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 12, borderRadius: 10, marginBottom: 12 }}>
        <label className="form-label">➕ Adicionar por URL externa (recomendado em produção)</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="https://res.cloudinary.com/.../foto.jpg"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 160 }}>
            <option value="gallery">Galeria do site</option>
            <option value="ambiente">Ambiente</option>
            <option value="produtos">Produtos</option>
            <option value="videos">Vídeos</option>
            <option value="general">Geral</option>
          </select>
          <button className="btn-primary" onClick={addExternalUrl} disabled={uploading}>
            <span>{uploading ? "⏳..." : "➕ ADICIONAR"}</span>
          </button>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
          <label className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
            <span>{uploading ? "⏳ Enviando..." : "📤 OU ENVIAR ARQUIVO DO COMPUTADOR"}</span>
            <input type="file" accept="image/*,video/*" multiple onChange={upload} style={{ display: "none" }} />
          </label>
        </div>

        <p style={{ color: "var(--text-gray)", fontSize: "0.8rem", marginTop: 10 }}>
          Os itens da categoria “Galeria do site” aparecem na aba de fotos acima do contato.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {items.map((m) => (
          <div key={m.id} style={{ background: "var(--bg-card)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,215,0,0.1)" }}>
            <div style={{ height: 110, background: "var(--bg-card-hover)", position: "relative" }}>
              {m.type === "image" ? (
                <img src={m.url} alt="Mídia" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <video src={m.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.65)", color: "var(--secondary)", padding: "2px 6px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700 }}>
                {m.type === "video" ? "🎬" : "📷"}
              </div>
            </div>
            <div style={{ padding: 6 }}>
              <div style={{ color: "white", fontSize: "0.75rem", marginBottom: 4, minHeight: 18 }}>{m.category || "sem categoria"}</div>
              <input className="form-input" readOnly value={m.url} onClick={(e) => (e.target as HTMLInputElement).select()} style={{ fontSize: "0.55rem", padding: "2px 4px", marginBottom: 6 }} />
              <button className="btn-action btn-delete" onClick={() => removeMedia(m.id)} style={{ width: "100%", justifyContent: "center", padding: "4px 8px", fontSize: "0.7rem" }}>
                <Trash2 size={12} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== SETTINGS ==============
function SettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { globalThis.fetch("/api/settings").then(r => r.json()).then(d => { if (d.success) setSettings(d.data ?? {}); }); }, []);

  const save = async () => {
    setSaving(true);
    await globalThis.fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
  };
  const update = (k: string, v: string) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem" }}>⚙️ Configurações do Site</h3>
        <button className="btn-primary" onClick={save} disabled={saving}><span>{saving ? "⏳..." : "💾 SALVAR"}</span></button>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 8 }}>🏠 Banner Principal</h4>
        <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={settings.hero_title || ""} onChange={(e) => update("hero_title", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Subtítulo</label><input className="form-input" value={settings.hero_subtitle || ""} onChange={(e) => update("hero_subtitle", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Imagem de fundo (URL)</label><input className="form-input" value={settings.hero_image || ""} onChange={(e) => update("hero_image", e.target.value)} /></div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 8 }}>ℹ️ Sobre Nós</h4>
        <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={settings.about_title || ""} onChange={(e) => update("about_title", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Texto</label><textarea className="form-input" rows={3} value={settings.about_text || ""} onChange={(e) => update("about_text", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <div className="form-group"><label className="form-label">Hambúrgueres</label><input className="form-input" value={settings.stats_burgers || ""} onChange={(e) => update("stats_burgers", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Clientes</label><input className="form-input" value={settings.stats_clients || ""} onChange={(e) => update("stats_clients", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Pedidos</label><input className="form-input" value={settings.stats_orders || ""} onChange={(e) => update("stats_orders", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Anos</label><input className="form-input" value={settings.stats_years || ""} onChange={(e) => update("stats_years", e.target.value)} /></div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 8 }}>📞 Contato & Redes Sociais</h4>
        <div className="form-group"><label className="form-label">Telefone</label><input className="form-input" value={settings.phone || ""} onChange={(e) => update("phone", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">WhatsApp (só números, com 55)</label><input className="form-input" value={settings.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="5511999999999" /></div>
        <div className="form-group"><label className="form-label">Endereço</label><input className="form-input" value={settings.address || ""} onChange={(e) => update("address", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Cidade</label><input className="form-input" value={settings.city || ""} onChange={(e) => update("city", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Link do Google Maps</label><input className="form-input" value={settings.google_maps_url || ""} onChange={(e) => update("google_maps_url", e.target.value)} placeholder="https://maps.google.com/..." /></div>
        <div className="form-group"><label className="form-label">Horário de funcionamento</label><input className="form-input" value={settings.opening_hours || ""} onChange={(e) => update("opening_hours", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Taxa de entrega (R$)</label><input type="number" step="0.01" className="form-input" value={settings.delivery_fee || ""} onChange={(e) => update("delivery_fee", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Instagram (URL)</label><input className="form-input" value={settings.instagram || ""} onChange={(e) => update("instagram", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Facebook (URL)</label><input className="form-input" value={settings.facebook || ""} onChange={(e) => update("facebook", e.target.value)} /></div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 8 }}>🤖 Assistente Virtual</h4>
        <div className="form-group"><label className="form-label">Nome da assistente</label><input className="form-input" value={settings.assistant_name || ""} onChange={(e) => update("assistant_name", e.target.value)} placeholder="Ex: Saron Assist" /></div>
        <div className="form-group"><label className="form-label">Mensagem inicial</label><textarea className="form-input" rows={3} value={settings.assistant_greeting || ""} onChange={(e) => update("assistant_greeting", e.target.value)} placeholder="Ex: Oi! Eu sou a atendente virtual..." /></div>
      </div>
    </div>
  );
}

// ============== PROFILE ==============
function ProfileSection() {
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    globalThis.fetch("/api/admin/user").then(r => r.json()).then(d => {
      if (d.success) { setAdminInfo(d.data); setNewEmail(d.data.email || ""); }
    });
  }, []);

  const changePassword = async () => {
    setMsg("");
    if (newPassword && newPassword.length < 4) { setMsg("Senha deve ter no mínimo 4 caracteres"); return; }
    if (newPassword !== confirmPassword) { setMsg("Senhas não conferem"); return; }
    setLoading(true);
    try {
      const res = await globalThis.fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", currentPassword: currentPassword || "saron123", newPassword, newEmail }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("✅ Dados atualizados com sucesso!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setMsg("❌ " + (d.error || "Erro ao atualizar"));
      }
    } catch { setMsg("❌ Erro de conexão"); }
    finally { setLoading(false); }
  };

  if (!adminInfo) return <div style={{ textAlign: "center", padding: 40, color: "var(--text-gray)" }}>Carregando...</div>;

  return (
    <div>
      <h3 style={{ color: "var(--secondary)", fontSize: "1.2rem", marginBottom: 16 }}>🔐 Minha Conta</h3>

      <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--secondary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 700 }}>
            {adminInfo.name?.charAt(0) || "A"}
          </div>
          <div>
            <h4 style={{ color: "white", fontSize: "1.1rem" }}>{adminInfo.name}</h4>
            <p style={{ color: "var(--text-gray)", fontSize: "0.85rem" }}>@{adminInfo.username}</p>
            {adminInfo.email && <p style={{ color: "var(--text-gray)", fontSize: "0.8rem" }}>{adminInfo.email}</p>}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12, marginBottom: 16 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 12 }}>📧 Alterar E-mail</h4>
        <div className="form-group"><input className="form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="seu@email.com" /></div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12 }}>
        <h4 style={{ color: "var(--secondary)", marginBottom: 12 }}>🔑 Alterar Senha</h4>
        <div className="form-group"><label className="form-label">Senha atual</label><input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Nova senha</label><input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 4 caracteres" /></div>
        <div className="form-group"><label className="form-label">Confirmar nova senha</label><input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
        {msg && <div style={{ padding: 10, background: msg.includes("❌") ? "rgba(198,40,40,0.2)" : "rgba(76,175,80,0.2)", borderRadius: 6, marginBottom: 12, color: msg.includes("❌") ? "var(--danger)" : "var(--success)", fontSize: "0.9rem" }}>{msg}</div>}
        <button className="btn-primary" onClick={changePassword} disabled={loading}>
          <span>{loading ? "⏳ Salvando..." : "💾 SALVAR ALTERAÇÕES"}</span>
        </button>
      </div>
    </div>
  );
}

// ============== MAIN ADMIN DASHBOARD ==============
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const prevCountRef = useRef(0);

  // Carrega admin info
  useEffect(() => {
    try { const u = localStorage.getItem("admin_user"); if (u) setUser(JSON.parse(u)); } catch {}
  }, []);

  // Carrega pedidos e stats
  const loadOrders = useCallback(async () => {
    try {
      const r = await globalThis.fetch("/api/orders");
      const d = await r.json();
      if (d.success) setAllOrders(d.data ?? []);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try { const r = await globalThis.fetch("/api/admin/stats"); const d = await r.json(); if (d.success) setStats(d.data); } catch {}
  }, []);

  // Carregamento inicial
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [loadOrders, loadStats]);

  // ── SSE: push imediato quando chega novo pedido ──────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        es = new EventSource("/api/orders/events");

        es.addEventListener("connected", () => {
          console.log("🔴 SSE conectado ao servidor");
        });

        // Novo pedido chegou — atualiza instantaneamente
        es.addEventListener("new_order", () => {
          loadOrders();
          loadStats();
        });

        // Status de pedido mudou
        es.addEventListener("order_updated", () => {
          loadOrders();
          loadStats();
        });

        es.onerror = () => {
          es?.close();
          // Reconecta após 5s se cair
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    // Fallback de polling a cada 4s — garante que o pedido chegue mesmo em
    // ambientes serverless (Vercel) onde o SSE pode não alcançar todas as
    // instâncias de função. Isso é o que garante a entrega do pedido em
    // qualquer cenário (SSE funcionando ou não).
    const fallback = setInterval(() => {
      loadOrders();
      loadStats();
    }, 4_000);

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
      clearInterval(fallback);
    };
  }, [loadOrders, loadStats]);

  // Notificação sonora quando novos pedidos chegam
  const newRecebidosCount = allOrders.filter(o => o.status === "recebido").length;
  useOrderNotification(newRecebidosCount, prevCountRef);

  // Muda status do pedido
  const changeStatus = async (id: number, status: string) => {
    try {
      await globalThis.fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      loadOrders();
      loadStats();
    } catch {}
  };

  // Exclui pedido permanentemente
  const deleteOrder = async (id: number) => {
    try {
      await globalThis.fetch(`/api/orders?id=${id}`, { method: "DELETE" });
      loadOrders();
      loadStats();
    } catch {}
  };

  const logout = async () => {
    await globalThis.fetch("/api/auth/logout", { method: "POST" });
    onLogout();
    router.push("/admin");
  };

  const menu = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "orders" as Page, label: "Pedidos", icon: ShoppingBag, badge: newRecebidosCount },
    { id: "products" as Page, label: "Produtos", icon: Package },
    { id: "categories" as Page, label: "Categorias", icon: Tag },
    { id: "coupons" as Page, label: "Cupons", icon: Tag },
    { id: "testimonials" as Page, label: "Depoimentos", icon: Star },
    { id: "media" as Page, label: "Mídias", icon: Image },
    { id: "settings" as Page, label: "Config", icon: Settings },
    { id: "profile" as Page, label: "Minha Conta", icon: Shield },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-dark)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />}

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{
        width: 240, background: "linear-gradient(180deg, #100000, #000)",
        borderRight: "2px solid var(--secondary)", position: "fixed",
        left: 0, top: 0, bottom: 0, overflowY: "auto", zIndex: 100,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "1.2rem", textAlign: "center", borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 4 }}>🍔</div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: "1.2rem", color: "var(--secondary)", letterSpacing: "0.1em" }}>SARON ADMIN</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-gray)", marginTop: 2 }}>{user?.name || "Admin"}</div>
        </div>

        <div style={{ flex: 1, padding: "8px 0" }}>
          {menu.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", width: "100%",
                  background: page === item.id ? "linear-gradient(135deg, rgba(196,30,42,0.4), transparent)" : "transparent",
                  border: "none", color: "white", cursor: "pointer", fontSize: "0.9rem",
                  fontFamily: "inherit", textAlign: "left",
                  borderLeft: page === item.id ? "3px solid var(--secondary)" : "3px solid transparent",
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span style={{ background: "var(--danger)", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: "0.7rem", animation: "btnPulse 1.5s infinite" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,215,0,0.15)", padding: "8px 0" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", color: "var(--text-gray)", textDecoration: "none", fontSize: "0.85rem" }}>
            ← Ver site
          </Link>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", width: "100%", background: "transparent", border: "none", color: "var(--text-gray)", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit", textAlign: "left" }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed", top: 10, left: 10, zIndex: 101,
          background: "var(--primary)", color: "white",
          border: "none", borderRadius: 6, padding: "6px 10px",
          cursor: "pointer", display: sidebarOpen ? "none" : "block",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
        <Menu size={18} />
      </button>

      {/* New order notification bar */}
      {newRecebidosCount > 0 && (
        <div className="admin-notification-bar" style={{
          background: "linear-gradient(90deg, var(--danger), var(--primary))",
          padding: "8px 20px", textAlign: "center", color: "white",
          fontWeight: 600, fontSize: "0.9rem",
          animation: "btnPulse 2s infinite",
        }}>
          <Bell size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
          {newRecebidosCount} pedido(s) aguardando confirmação!
        </div>
      )}

      {/* Main content */}
      <main className="admin-main-content" style={{ padding: newRecebidosCount > 0 ? "50px 2rem 2rem" : "2rem", minHeight: "100vh" }}>
        {page === "dashboard" && <DashboardSection orders={allOrders} stats={stats} />}
        {page === "orders" && <OrdersSection orders={allOrders} onChangeStatus={changeStatus} onDeleteOrder={deleteOrder} />}
        {page === "products" && <ProductsSection />}
        {page === "categories" && <CategoriesSection />}
        {page === "coupons" && <CouponsSection />}
        {page === "testimonials" && <TestimonialsSection />}
        {page === "media" && <MediaSection />}
        {page === "settings" && <SettingsSection />}
        {page === "profile" && <ProfileSection />}
      </main>
    </div>
  );
}
