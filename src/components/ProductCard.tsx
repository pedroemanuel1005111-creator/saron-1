"use client";

import { useState } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import type { Product } from "@/db/schema";

interface ProductCardProps {
  product: Product;
  onOpenDetails: () => void;
}

export default function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  return (
    <div
      className="product-card"
      data-aos="fade-up"
      data-aos-delay={(product.order % 4) * 100}
      onClick={onOpenDetails}
    >
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <span>🍔</span>
        )}
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{formatCurrency(product.price)}</span>
          <button
            className="btn-add"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            aria-label="Adicionar"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { showToast } = useToast();

  if (!product) return null;

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = parseFloat(product.price) + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (extra: { name: string; price: number }) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image || "",
      price: parseFloat(product.price),
      quantity,
      notes,
      extras: selectedExtras,
      ingredients: product.ingredients as string[],
    });
    showToast(`${product.name} adicionado ao carrinho!`, "success");
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
      setQuantity(1);
      setNotes("");
      setSelectedExtras([]);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: "var(--secondary)", fontSize: "1.8rem" }}>{product.name}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {product.image && (
            <div style={{ width: "100%", height: 250, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <p style={{ color: "var(--text-gray)", marginBottom: 20, lineHeight: 1.6 }}>
            {product.description}
          </p>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: "var(--secondary)", marginBottom: 10, fontSize: "1.1rem" }}>
              ✅ O QUE VEM
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {(product.ingredients as string[]).map((ing, i) => (
                <li key={i} style={{ padding: "4px 0", color: "var(--text-gray)" }}>
                  ✓ {ing}
                </li>
              ))}
            </ul>
          </div>

          {Array.isArray(product.allergens) && (product.allergens as string[]).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: "var(--danger)", marginBottom: 10, fontSize: "1.1rem" }}>
                ⚠️ ALÉRGENOS
              </h4>
              <p style={{ color: "var(--text-gray)" }}>
                Contém: {(product.allergens as string[]).join(", ")}
              </p>
            </div>
          )}

          {Array.isArray(product.extras) && (product.extras as any[]).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: "var(--secondary)", marginBottom: 10, fontSize: "1.1rem" }}>
                ➕ ADICIONAIS
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(product.extras as any[]).map((extra, i) => {
                  const selected = selectedExtras.find((e) => e.name === extra.name);
                  return (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        background: selected ? "rgba(255, 215, 0, 0.1)" : "var(--bg-dark)",
                        border: selected ? "2px solid var(--secondary)" : "2px solid transparent",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleExtra(extra)}
                        style={{ width: 18, height: 18, accentColor: "var(--secondary)" }}
                      />
                      <span style={{ flex: 1 }}>{extra.name}</span>
                      <span style={{ color: "var(--secondary)", fontWeight: 600 }}>
                        +{formatCurrency(extra.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">📝 OBSERVAÇÕES</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, bem passado, molho à parte..."
              rows={3}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              background: "var(--bg-dark)",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ color: "var(--text-gray)" }}>Quantidade:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus size={14} />
              </button>
              <span style={{ minWidth: 32, textAlign: "center", fontSize: "1.2rem", fontWeight: 700 }}>
                {quantity}
              </span>
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="btn-primary"
            style={{
              width: "100%",
              textAlign: "center",
              background: justAdded
                ? "linear-gradient(135deg, #4CAF50, #2e7d32)"
                : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              transition: "all 0.3s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {justAdded ? (
                <>
                  <Check size={20} /> ADICIONADO!
                </>
              ) : (
                <>
                  <Plus size={20} /> ADICIONAR {formatCurrency(totalPrice)}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
