"use client";

import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  return (
    <>
      <div className={`menu-backdrop ${open ? "show" : ""}`} onClick={onClose} />
      <div className={`cart-sidebar ${open ? "open" : ""}`}>
        <div className="cart-header">
          <h2 style={{ fontSize: "1.5rem", color: "var(--secondary)" }}>
            🛒 Seu Carrinho ({items.length})
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <h3>Seu carrinho está vazio</h3>
              <p style={{ marginTop: 8 }}>Adicione produtos deliciosos!</p>
            </div>
          ) : (
            items.map((item) => {
              const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
              const itemTotal = (item.price + extrasTotal) * item.quantity;
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : (
                      "🍔"
                    )}
                  </div>
                  <div className="cart-item-info">
                    <h4 style={{ color: "white", marginBottom: 4 }}>{item.name}</h4>
                    {item.extras.length > 0 && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-gray)", marginBottom: 4 }}>
                        + {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    {item.notes && (
                      <p style={{ fontSize: "0.8rem", color: "var(--secondary)", marginBottom: 4 }}>
                        📝 {item.notes}
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--secondary)", fontWeight: 700, fontFamily: "Bebas Neue" }}>
                          {formatCurrency(itemTotal)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-gray)" }}>Subtotal:</span>
              <span style={{ color: "var(--secondary)", fontWeight: 700, fontSize: "1.3rem", fontFamily: "Bebas Neue" }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
            <Link href="/checkout" onClick={onClose} className="btn-primary btn-pulse" style={{ width: "100%", textAlign: "center", marginBottom: 8 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ShoppingBag size={18} />
                FINALIZAR PEDIDO
              </span>
            </Link>
            <button
              onClick={clearCart}
              style={{
                width: "100%",
                padding: "0.7rem",
                background: "transparent",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                borderRadius: 50,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  );
}
