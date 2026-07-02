"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";

function CheckoutPage() {
  const { items, subtotal, clearCart, cartLoaded } = useCart();
  const router = useRouter();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "cartao" | "pix">("pix");
  const [changeFor, setChangeFor] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState("recebido");
  const [cancelLoading, setCancelLoading] = useState(false);

  const deliveryFee = parseFloat(settings.delivery_fee || "5");
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === "percent"
      ? (subtotal * parseFloat(appliedCoupon.value)) / 100
      : parseFloat(appliedCoupon.value);
  }
  const total = Math.max(0, subtotal + (deliveryType === "delivery" ? deliveryFee : 0) - discount);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.success) setSettings(d.data || {}); });
  }, []);

  // Aguarda carregar antes de decidir redirecionar
  useEffect(() => {
    if (cartLoaded) {
      setInitialLoading(false);
      if (items.length === 0 && step !== 3 && !orderNumber) {
        // Não redireciona, apenas mostra mensagem
      }
    }
  }, [cartLoaded, items, step, orderNumber]);

  // SSE + fallback polling para acompanhar status do pedido em tempo real
  useEffect(() => {
    if (step !== 3 || !orderNumber) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const refreshStatus = async () => {
      try {
        const r = await fetch(`/api/orders?orderNumber=${orderNumber}`);
        const d = await r.json();
        if (d.success && d.data) {
          setOrderStatus(d.data.status);
          localStorage.setItem(`saron_order_${orderNumber}`, JSON.stringify(d.data));
        }
      } catch {}
    };

    // SSE: recebe push quando admin muda status
    const connectSSE = () => {
      try {
        es = new EventSource("/api/orders/events");
        es.addEventListener("order_updated", (e) => {
          const payload = JSON.parse(e.data || "{}");
          if (String(payload.orderNumber) === String(orderNumber)) {
            refreshStatus();
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
    const fallback = setInterval(refreshStatus, 5_000);

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
      clearInterval(fallback);
    };
  }, [step, orderNumber]);

  // Verifica se tem pedido salvo ao carregar
  useEffect(() => {
    if (cartLoaded && items.length === 0) {
      // Checa localStorage por pedidos ativos
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("saron_order_")) {
          try {
            const savedOrder = JSON.parse(localStorage.getItem(key) || "{}");
            if (savedOrder?.orderNumber && savedOrder?.status !== "entregue" && savedOrder?.status !== "cancelado") {
              setOrderNumber(savedOrder.orderNumber);
              setOrderStatus(savedOrder.status);
              setStep(3);
              break;
            }
          } catch {}
        }
      }
    }
  }, [cartLoaded, items]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) { showToast("Digite um código", "error"); return; }
    try {
      const r = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode)}`);
      const d = await r.json();
      if (d.success) {
        if (parseFloat(d.data.minOrder) > subtotal) {
          showToast(`Mínimo ${formatCurrency(d.data.minOrder)}`, "error");
          return;
        }
        setAppliedCoupon(d.data);
        showToast(`Cupom ${d.data.code} aplicado!`, "success");
      } else {
        showToast(d.error || "Cupom inválido", "error");
      }
    } catch { showToast("Erro ao validar cupom", "error"); }
  };

  const submitOrder = async () => {
    if (!customerName || !customerPhone) { showToast("Preencha nome e telefone", "error"); return; }
    if (deliveryType === "delivery" && (!address || !neighborhood)) {
      showToast("Preencha endereço completo", "error"); return;
    }
    if (items.length === 0) { showToast("Carrinho vazio!", "error"); return; }

    setLoading(true);
    try {
      const orderData = {
        customerName,
        customerPhone,
        deliveryType,
        address: deliveryType === "delivery" ? address : null,
        neighborhood: deliveryType === "delivery" ? neighborhood : null,
        complement: deliveryType === "delivery" ? complement : null,
        zipCode: deliveryType === "delivery" ? zipCode : null,
        paymentMethod,
        changeFor: paymentMethod === "dinheiro" && changeFor ? parseFloat(changeFor) : null,
        coupon: appliedCoupon?.code || null,
        discount: discount.toFixed(2),
        deliveryFee: (deliveryType === "delivery" ? deliveryFee : 0).toFixed(2),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        items: items.map(i => ({
          name: i.name,
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          extras: i.extras,
          notes: i.notes,
          ingredients: i.ingredients,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();

      if (data.success) {
        setOrderNumber(data.data.orderNumber);
        setOrderStatus("recebido");
        setStep(3);
        // Salva pedido no localStorage
        localStorage.setItem(`saron_order_${data.data.orderNumber}`, JSON.stringify(data.data));
        clearCart();
        showToast("✅ Pedido realizado! Nº #" + data.data.orderNumber, "success");
      } else {
        showToast(data.error || "Erro ao criar pedido", "error");
        console.error("Erro no pedido:", data);
      }
    } catch (error: any) {
      showToast("Erro de conexão: " + (error.message || ""), "error");
    } finally { setLoading(false); }
  };

  // Cliente cancela o próprio pedido
  const cancelClientOrder = async () => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderNumber ? undefined : orderNumber, status: "cancelado", orderNumber }),
      });
      // Tenta pelo orderNumber se não achou pelo id
      if (orderNumber) {
        const orderRes = await fetch(`/api/orders?orderNumber=${orderNumber}`);
        const orderData = await orderRes.json();
        if (orderData.success && orderData.data) {
          await fetch("/api/orders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: orderData.data.id, status: "cancelado" }),
          });
        }
      }
      setOrderStatus("cancelado");
      localStorage.removeItem(`saron_order_${orderNumber}`);
      showToast("✅ Pedido cancelado com sucesso!", "success");
    } catch {
      showToast("Erro ao cancelar pedido", "error");
    }
    setCancelLoading(false);
  };

  if (initialLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", animation: "spin3d 2s ease-in-out infinite" }}>🍔</div>
          <p style={{ color: "var(--text-gray)", marginTop: 16 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // TELA DE CONFIRMAÇÃO + ACOMPANHAMENTO
  if (step === 3 && orderNumber) {
    const statusSteps = [
      { key: "recebido", label: "Recebido", emoji: "📥", icon: "🔄" },
      { key: "preparando", label: "Preparando", emoji: "👨‍🍳", icon: "🔥" },
      { key: "entrega", label: "Saiu para entrega", emoji: "🛵", icon: "🛵" },
      { key: "entregue", label: "Entregue", emoji: "✅", icon: "🎉" },
    ];
    const currentIdx = statusSteps.findIndex(s => s.key === orderStatus);
    const cancelado = orderStatus === "cancelado";

    return (
      <div style={{ minHeight: "100vh", padding: "2rem 1rem", paddingTop: 80, background: "var(--bg-dark)" }}>
        <div className="container" style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "2rem", border: cancelado ? "2px solid var(--danger)" : "2px solid var(--secondary)" }}>
            {cancelado ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>❌</div>
                <h2 style={{ color: "var(--danger)", fontFamily: "Bebas Neue", fontSize: "2.5rem" }}>PEDIDO CANCELADO</h2>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div className="success-check">✓</div>
                <h1 style={{ fontSize: "2.2rem", color: "var(--secondary)", fontFamily: "Bebas Neue" }}>PEDIDO CONFIRMADO! 🎉</h1>
                <p style={{ color: "var(--text-gray)", margin: "8px 0" }}>Seu pedido #<strong style={{ color: "var(--secondary)", fontSize: "1.5rem" }}>{String(orderNumber).padStart(4, "0")}</strong></p>
                <p style={{ color: "var(--text-gray)", fontSize: "0.9rem" }}>
                  {deliveryType === "delivery" ? "🚚 Entrega em até 45 min" : "📍 Pronto em 30 min"}
                </p>

                {/* Status Tracking */}
                <div style={{ marginTop: 24, textAlign: "left" }}>
                  {statusSteps.map((s, idx) => {
                    const completed = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: completed ? "linear-gradient(135deg, var(--secondary), #ff6600)" : "var(--bg-card-hover)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.2rem", flexShrink: 0,
                          animation: active ? "stepPulse 2s ease-in-out infinite" : "none",
                        }}>
                          {completed ? "✓" : idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: completed ? "var(--secondary)" : "var(--text-gray)", fontWeight: completed ? 700 : 400 }}>
                            {s.emoji} {s.label}
                          </div>
                          {active && <div style={{ fontSize: "0.8rem", color: "var(--warning)" }}>⏳ Em andamento...</div>}
                          {completed && idx === statusSteps.length - 1 && <div style={{ fontSize: "0.8rem", color: "var(--success)" }}>✅ Concluído!</div>}
                        </div>
                        {completed && <span style={{ color: "var(--success)" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <Link href={`/tracking?order=${orderNumber}`} className="btn-primary">
                <span>📍 ACOMPANHAR</span>
              </Link>
              <Link href="/" className="btn-primary" style={{ background: "var(--bg-card-hover)" }}>
                <span>🏠 INÍCIO</span>
              </Link>
              {!cancelado && (orderStatus === "recebido" || orderStatus === "preparando") && (
                <button
                  className="btn-primary"
                  onClick={cancelClientOrder}
                  disabled={cancelLoading}
                  style={{ background: "transparent", border: "2px solid var(--danger)", color: "var(--danger)" }}
                >
                  <span>{cancelLoading ? "⏳..." : "❌ CANCELAR PEDIDO"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1rem", paddingTop: 80, background: "var(--bg-dark)" }}>
      <div className="container" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--secondary)", marginBottom: 24, textDecoration: "none" }}>
          <ArrowLeft size={20} /> Voltar
        </Link>

        <h1 style={{ fontSize: "2.5rem", color: "var(--secondary)", fontFamily: "Bebas Neue", letterSpacing: "0.1em", marginBottom: 24 }}>
          🛒 FINALIZAR PEDIDO
        </h1>

        {/* Carrinho vazio */}
        {items.length === 0 && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: 16 }}>🛒</div>
            <h3 style={{ color: "white", marginBottom: 12 }}>Seu carrinho está vazio</h3>
            <Link href="/#cardapio" className="btn-primary"><span>🍔 VER CARDÁPIO</span></Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="checkout-grid">
            <div>
              {step === 1 && (
                <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid rgba(255,215,0,0.2)" }}>
                  <h2 style={{ color: "var(--secondary)", marginBottom: 16 }}>📦 Revise seu pedido</h2>
                  {items.map((item) => {
                    const extrasCost = item.extras.reduce((s, e) => s + e.price, 0);
                    return (
                      <div key={item.id} style={{ display: "flex", gap: 16, padding: 16, background: "var(--bg-dark)", borderRadius: 8, marginBottom: 12 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 8, background: "var(--bg-card-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🍔</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: "white", fontSize: "0.95rem" }}>{item.quantity}x {item.name}</h4>
                          {item.extras.length > 0 && <p style={{ fontSize: "0.8rem", color: "var(--text-gray)" }}>+ {item.extras.map(e => e.name).join(", ")}</p>}
                          {item.notes && <p style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>📝 {item.notes}</p>}
                        </div>
                        <div style={{ color: "var(--secondary)", fontWeight: 700, fontFamily: "Bebas Neue", fontSize: "1.2rem", whiteSpace: "nowrap" }}>
                          {formatCurrency((item.price + extrasCost) * item.quantity)}
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 20, padding: 16, background: "var(--bg-dark)", borderRadius: 8 }}>
                    <h4 style={{ color: "var(--secondary)", marginBottom: 8, fontSize: "0.95rem" }}>🎫 Cupom</h4>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="form-input" placeholder="Código" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                      <button className="btn-primary" onClick={applyCoupon}><span>Aplicar</span></button>
                    </div>
                    {appliedCoupon && <p style={{ color: "var(--success)", marginTop: 8, fontSize: "0.85rem" }}>✓ Cupom {appliedCoupon.code} - {formatCurrency(discount)} off</p>}
                  </div>

                  <button className="btn-primary" onClick={() => setStep(2)} style={{ width: "100%", marginTop: 20, textAlign: "center" }}>
                    <span>CONTINUAR →</span>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid rgba(255,215,0,0.2)" }}>
                  <h2 style={{ color: "var(--secondary)", marginBottom: 16 }}>👤 Seus dados</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome" /></div>
                    <div className="form-group"><label className="form-label">WhatsApp *</label><input className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
                  </div>
                  <h3 style={{ color: "var(--secondary)", marginTop: 20, marginBottom: 8, fontSize: "1rem" }}>🚚 Entrega</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button onClick={() => setDeliveryType("delivery")} style={{ padding: 14, background: deliveryType === "delivery" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg-dark)", border: deliveryType === "delivery" ? "2px solid var(--secondary)" : "2px solid transparent", borderRadius: 12, color: "white", cursor: "pointer", fontWeight: 600 }}>
                      <Truck size={20} style={{ display: "block", margin: "0 auto 4px" }} /> Delivery (+{formatCurrency(deliveryFee)})
                    </button>
                    <button onClick={() => setDeliveryType("pickup")} style={{ padding: 14, background: deliveryType === "pickup" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg-dark)", border: deliveryType === "pickup" ? "2px solid var(--secondary)" : "2px solid transparent", borderRadius: 12, color: "white", cursor: "pointer", fontWeight: 600 }}>
                      <MapPin size={20} style={{ display: "block", margin: "0 auto 4px" }} /> Retirar (Grátis)
                    </button>
                  </div>
                  {deliveryType === "delivery" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div className="form-group"><label className="form-label">Endereço *</label><input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número" /></div>
                      <div className="form-group"><label className="form-label">Bairro *</label><input className="form-input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" /></div>
                    </div>
                  )}
                  <h3 style={{ color: "var(--secondary)", marginTop: 20, marginBottom: 8, fontSize: "1rem" }}>💳 Pagamento</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { id: "pix" as const, label: "PIX", icon: "💠", desc: "Instantâneo" },
                      { id: "cartao" as const, label: "Cartão", icon: "💳", desc: "Crédito/Débito" },
                      { id: "dinheiro" as const, label: "Dinheiro", icon: "💵", desc: "Com troco" },
                    ].map(p => (
                      <button key={p.id} onClick={() => setPaymentMethod(p.id)} style={{ padding: 12, background: paymentMethod === p.id ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg-dark)", border: paymentMethod === p.id ? "2px solid var(--secondary)" : "2px solid transparent", borderRadius: 12, color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                        <span style={{ fontSize: 24, display: "block" }}>{p.icon}</span>{p.label}<small style={{ display: "block", fontWeight: 400, opacity: 0.7 }}>{p.desc}</small>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === "dinheiro" && (
                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label className="form-label">Troco para quanto?</label>
                      <input className="form-input" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} placeholder="Ex: 100" type="number" />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <button className="btn-primary" onClick={() => setStep(1)} style={{ background: "var(--bg-card-hover)" }}><span>← Voltar</span></button>
                    <button className="btn-primary btn-pulse" onClick={submitOrder} disabled={loading} style={{ flex: 1, textAlign: "center" }}>
                      <span>{loading ? "⏳ Processando..." : "✓ CONFIRMAR PEDIDO"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,215,0,0.2)", position: "sticky", top: 80 }}>
              <h3 style={{ color: "var(--secondary)", marginBottom: 12, fontSize: "1.1rem" }}>📊 Resumo</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-gray)", fontSize: "0.9rem" }}>
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {appliedCoupon && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--success)", fontSize: "0.9rem" }}><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
              {deliveryType === "delivery" ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-gray)", fontSize: "0.9rem" }}>
                  <span>Entrega</span><span>{formatCurrency(deliveryFee)}</span>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--success)", fontSize: "0.9rem" }}>
                  <span>Retirada</span><span>Grátis</span>
                </div>
              )}
              <div style={{ borderTop: "2px solid var(--secondary)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: 700 }}>
                <span style={{ color: "var(--secondary)" }}>TOTAL</span>
                <span style={{ color: "var(--secondary)", fontFamily: "Bebas Neue" }}>{formatCurrency(total)}</span>
              </div>
              <div style={{ marginTop: 12, padding: 10, background: "rgba(255,215,0,0.1)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-gray)" }}>
                <p>🔥 Pronto em 30-45 min</p>
                <p>💠 Pagamento: {paymentMethod === "pix" ? "PIX" : paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutWrapper() {
  return (
    <ToastProvider>
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    </ToastProvider>
  );
}
