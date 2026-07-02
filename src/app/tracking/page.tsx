"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, ChefHat, Truck, CheckCircle, XCircle, Home } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/db/schema";

const statusLabels: Record<string, { label: string; icon: any; color: string }> = {
  recebido: { label: "Recebido", icon: Package, color: "#1976d2" },
  preparando: { label: "Preparando", icon: ChefHat, color: "#f57c00" },
  entrega: { label: "Saiu para entrega", icon: Truck, color: "#7b1fa2" },
  entregue: { label: "Entregue", icon: CheckCircle, color: "#388e3c" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "#c62828" },
};

const statusOrder = ["recebido", "preparando", "entrega", "entregue"];

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let fallbackInterval: ReturnType<typeof setInterval>;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?orderNumber=${orderNumber}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    // Carga inicial
    fetchOrder();

    // SSE: recebe push quando o admin muda o status
    const connectSSE = () => {
      try {
        es = new EventSource("/api/orders/events");
        es.addEventListener("order_updated", (e) => {
          const payload = JSON.parse(e.data || "{}");
          // Só recarrega se for o pedido deste cliente
          if (String(payload.orderNumber) === String(orderNumber)) {
            fetchOrder();
          }
        });
        es.onerror = () => {
          es?.close();
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch {
        reconnectTimer = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Fallback de polling a cada 5s (garante atualização mesmo sem SSE,
    // essencial em ambientes serverless como a Vercel)
    fallbackInterval = setInterval(fetchOrder, 5_000);

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
      clearInterval(fallbackInterval);
    };
  }, [orderNumber]);

  if (!orderNumber) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--bg-card)", padding: 32, borderRadius: 12, textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ color: "var(--secondary)", marginBottom: 16 }}>Digite o número do pedido</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const num = formData.get("order");
              window.location.href = `/tracking?order=${num}`;
            }}
          >
            <input name="order" className="form-input" placeholder="Ex: 1001" required style={{ marginBottom: 16 }} />
            <button className="btn-primary" style={{ width: "100%" }}>
              <span>BUSCAR PEDIDO</span>
            </button>
          </form>
          <Link href="/" style={{ display: "block", marginTop: 16, color: "var(--secondary)" }}>
            ← Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--secondary)" }}>
          <div className="loading-burger" style={{ fontSize: "4rem", marginBottom: 16 }}>🍔</div>
          <p>Buscando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--bg-card)", padding: 32, borderRadius: 12, textAlign: "center" }}>
          <h2 style={{ color: "var(--danger)", marginBottom: 16 }}>Pedido não encontrado</h2>
          <Link href="/" className="btn-primary">
            <span>VOLTAR AO INÍCIO</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIdx = statusOrder.indexOf(order.status);
  const progressPercent = order.status === "cancelado" ? 0 : ((currentStatusIdx + 1) / statusOrder.length) * 80;

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1rem", paddingTop: 100, background: "var(--bg-dark)" }}>
      <div className="container" style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--secondary)", marginBottom: 24, textDecoration: "none" }}>
          <ArrowLeft size={20} /> Início
        </Link>

        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 32, border: "2px solid var(--secondary)", boxShadow: "0 20px 60px rgba(255, 215, 0, 0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: "var(--text-gray)" }}>Seu pedido</p>
            <h1 style={{ fontSize: "4rem", color: "var(--secondary)", fontFamily: "Bebas Neue", letterSpacing: "0.1em" }}>
              #{String(order.orderNumber).padStart(4, "0")}
            </h1>
            <p style={{ color: "var(--text-gray)", fontSize: "0.9rem" }}>
              Feito em {formatDate(order.createdAt)}
            </p>
          </div>

          {order.status === "cancelado" ? (
            <div style={{ textAlign: "center", padding: 32, background: "rgba(198, 40, 40, 0.1)", borderRadius: 12, border: "2px solid var(--danger)" }}>
              <XCircle size={60} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
              <h2 style={{ color: "var(--danger)" }}>Pedido cancelado</h2>
            </div>
          ) : (
            <>
              <div className="tracking-steps">
                <div className="tracking-progress" style={{ width: `${progressPercent}%` }} />
                {statusOrder.map((s, idx) => {
                  const cfg = statusLabels[s];
                  const Icon = cfg.icon;
                  const isCompleted = currentStatusIdx > idx;
                  const isActive = currentStatusIdx === idx;
                  return (
                    <div key={s} className={`tracking-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                      <div className="tracking-icon">
                        <Icon size={24} />
                      </div>
                      <div className="tracking-label">{cfg.label}</div>
                    </div>
                  );
                })}
              </div>

              {order.status === "entregue" && (
                <div style={{ textAlign: "center", padding: 24, background: "rgba(56, 142, 60, 0.1)", borderRadius: 12, border: "2px solid var(--success)", marginTop: 24 }}>
                  <CheckCircle size={50} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
                  <h3 style={{ color: "var(--success)" }}>Pedido entregue! 🎉</h3>
                  <p style={{ color: "var(--text-gray)", marginTop: 8 }}>
                    Obrigado por escolher a SARON BURGUER!
                  </p>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 32 }}>
            <h3 style={{ color: "var(--secondary)", marginBottom: 16 }}>📦 Itens do pedido</h3>
            {(order.items as any[]).map((item: any, i: number) => (
              <div key={i} style={{ padding: 16, background: "var(--bg-dark)", borderRadius: 8, marginBottom: 12, borderLeft: "4px solid var(--secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong style={{ color: "white" }}>
                    {item.quantity}x {item.name}
                  </strong>
                  <span style={{ color: "var(--secondary)", fontWeight: 700 }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
                {item.extras?.length > 0 && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-gray)" }}>
                    ➕ {item.extras.map((e: any) => e.name).join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p style={{ fontSize: "0.85rem", color: "var(--warning)", marginTop: 4 }}>
                    📝 {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "var(--bg-dark)", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Cliente:</span>
              <strong>{order.customerName}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Tipo:</span>
              <strong>{order.deliveryType === "delivery" ? "🚚 Delivery" : "📍 Retirada"}</strong>
            </div>
            {order.address && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Endereço:</span>
                <strong style={{ textAlign: "right" }}>
                  {order.address}, {order.neighborhood}
                </strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Pagamento:</span>
              <strong style={{ textTransform: "capitalize" }}>{order.paymentMethod}</strong>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--secondary)", fontWeight: 600 }}>TOTAL</span>
              <strong style={{ color: "var(--secondary)", fontSize: "1.5rem", fontFamily: "Bebas Neue" }}>
                {formatCurrency(order.total)}
              </strong>
            </div>
          </div>

          {(order.status === "recebido" || order.status === "preparando") && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
                  setCancelLoading(true);
                  try {
                    await fetch(`/api/orders`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: order.id, status: "cancelado" }),
                    });
                    setOrder({ ...order, status: "cancelado" });
                  } catch {}
                  setCancelLoading(false);
                }}
                disabled={cancelLoading}
                style={{ background: "transparent", border: "2px solid var(--danger)", color: "var(--danger)" }}
              >
                <span>{cancelLoading ? "⏳ Cancelando..." : "❌ CANCELAR PEDIDO"}</span>
              </button>
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn-primary" style={{ background: "var(--bg-card-hover)" }}>
              <span><Home size={18} style={{ display: "inline", verticalAlign: "middle" }} /> INÍCIO</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 100, textAlign: "center", color: "var(--secondary)" }}>Carregando...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
