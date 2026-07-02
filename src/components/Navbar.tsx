"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, Home, BookOpen, Info, Phone, Image as ImageIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar({
  onCartClick,
}: {
  onCartClick?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, lastAdded } = useCart();
  const [badgeFlip, setBadgeFlip] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (lastAdded) {
      setBadgeFlip(true);
      setTimeout(() => setBadgeFlip(false), 500);
    }
  }, [lastAdded]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
          <Link href="/" className="nav-logo">
            <img
              src="/images/logo.png"
              alt="Logo Saron Rede Burgs"
              style={{ width: 62, height: 62, borderRadius: 12, objectFit: "cover", boxShadow: "0 0 22px rgba(255,215,0,0.35)" }}
            />
            <span>SARON BURGUER</span>
          </Link>

          <ul className="nav-links">
            <li>
              <a onClick={() => scrollTo("home")}>
                <Home size={16} style={{ display: "inline", marginRight: 4 }} /> Início
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("cardapio")}>
                <BookOpen size={16} style={{ display: "inline", marginRight: 4 }} /> Cardápio
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("sobre")}>
                <Info size={16} style={{ display: "inline", marginRight: 4 }} /> Sobre
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("galeria")}>
                <ImageIcon size={16} style={{ display: "inline", marginRight: 4 }} /> Fotos
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("contato")}>
                <Phone size={16} style={{ display: "inline", marginRight: 4 }} /> Contato
              </a>
            </li>

          </ul>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="cart-icon-wrapper" onClick={() => onCartClick?.()}>
              <ShoppingCart size={28} color="#FFD700" />
              {itemCount > 0 && (
                <span className={`cart-badge ${badgeFlip ? "flipping" : ""}`}>{itemCount}</span>
              )}
            </div>

            <div
              className={`hamburger ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>

      <div className={`menu-backdrop ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <a onClick={() => scrollTo("home")}>🏠 Início</a>
        <a onClick={() => scrollTo("cardapio")}>📋 Cardápio</a>
        <a onClick={() => scrollTo("sobre")}>ℹ️ Sobre</a>
        <a onClick={() => scrollTo("galeria")}>📸 Fotos</a>
        <a onClick={() => scrollTo("contato")}>📞 Contato</a>
        <div style={{ marginTop: 32, padding: "1rem", background: "rgba(255,215,0,0.1)", borderRadius: 12 }}>
          <p style={{ color: "var(--secondary)", fontWeight: 600 }}>🔥 Peça já!</p>
          <p style={{ color: "var(--text-gray)", fontSize: "0.9rem", marginTop: 4 }}>
            Faça seu pedido online e receba em casa
          </p>
        </div>
      </div>
    </>
  );
}
