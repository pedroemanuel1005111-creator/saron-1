"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowUp, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import ProductCard, { ProductModal } from "@/components/ProductCard";
import VirtualAssistant from "@/components/VirtualAssistant";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import type { Product, Category, Testimonial, MediaItem } from "@/db/schema";

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [showBackTop, setShowBackTop] = useState(false);

  // Counter animation
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [counterValues, setCounterValues] = useState({ burgers: 0, clients: 0, orders: 0, years: 0 });

  // Ref para re-aplicar animações quando produtos mudam
  const productGridRef = useRef<HTMLDivElement>(null);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, prodRes, testRes, setRes, mediaRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
          fetch("/api/testimonials"),
          fetch("/api/settings"),
          fetch("/api/media"),
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();
        const testData = await testRes.json();
        const setData = await setRes.json();
        const mediaData = await mediaRes.json();

        if (catData.success) setCategories(catData.data || []);
        if (prodData.success) setProducts(prodData.data || []);
        if (testData.success) setTestimonials(testData.data || []);
        if (setData.success) setSettings(setData.data || {});
        if (mediaData.success) setMediaItems(mediaData.data || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Typewriter effect
    const text = "Os melhores hambúrgueres da cidade 🔥";
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax
  useEffect(() => {
    const handleScroll = () => {
      const heroBg = document.querySelector(".hero-bg") as HTMLElement;
      if (heroBg) {
        heroBg.style.transform = `translateY(${window.scrollY * 0.3}px) scale(1.1)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Observador de interseção para animações AOS-like - REATIVA a cada renderização
  const setupObservers = useCallback(() => {
    // Observa elementos data-aos
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("aos-animate");

            // Counter animation
            if (entry.target.classList.contains("stats-section") && !statsAnimated) {
              setStatsAnimated(true);
              animateCounters();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observa elementos .reveal
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[data-aos]").forEach((el) => observer.observe(el));
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    document.querySelectorAll(".stats-section").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, [statsAnimated]);

  // Configura observadores quando loading termina ou categoria muda
  useEffect(() => {
    if (!loading) {
      const cleanup = setupObservers();
      // Pequeno delay para garantir que o DOM foi atualizado
      const timeout = setTimeout(() => {
        setupObservers();
      }, 100);
      return () => {
        cleanup();
        clearTimeout(timeout);
      };
    }
  }, [loading, selectedCategory, setupObservers]);

  const animateCounters = () => {
    const targets = {
      burgers: parseInt(settings.stats_burgers || "5000"),
      clients: parseInt(settings.stats_clients || "2000"),
      orders: parseInt(settings.stats_orders || "8000"),
      years: parseInt(settings.stats_years || "5"),
    };
    const duration = 2000;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounterValues({
        burgers: Math.floor(Math.max(0, targets.burgers * eased)),
        clients: Math.floor(Math.max(0, targets.clients * eased)),
        orders: Math.floor(Math.max(0, targets.orders * eased)),
        years: Math.floor(Math.max(0, targets.years * eased)),
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const whatsappLink = generateWhatsAppLink(
    settings.whatsapp || "5511999999999",
    "Olá! Gostaria de saber mais sobre a SARON BURGUER!"
  );

  const galleryItems = mediaItems
    .filter((item) =>
      ["gallery", "ambiente", "videos", "general"].includes(
        (item.category || "").toLowerCase()
      )
    )
    .slice(0, 12);

  return (
    <>
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${settings.hero_image || "/images/hero-burger.jpg"})` }}></div>
        <div className="hero-overlay"></div>

        {/* Partículas */}
        <div className="particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="container hero-grid">
          <div>
            <p className="hero-subtitle">🔥 {settings.hero_subtitle || "O sabor que você merece!"}</p>
            <h1 className="hero-title">
              {settings.hero_title || "SARON BURGUER"}
            </h1>
            <div className="typewriter-text" style={{ minHeight: "2.5rem", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              {typedText}
              <span className="typed-cursor">|</span>
            </div>
            <div className="hero-buttons">
              <a href="#cardapio" className="btn-primary btn-pulse" onClick={(e) => { e.preventDefault(); document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span>🍔 VER CARDÁPIO</span>
              </a>
              <a href="#cardapio" className="btn-primary btn-order" onClick={(e) => { e.preventDefault(); document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span>🛒 FAZER PEDIDO</span>
              </a>
            </div>
          </div>

          <div className="hero-burger-img" style={{ display: "flex", justifyContent: "center" }}>
            <div className="smoke"></div>
            <div className="smoke"></div>
            <div className="smoke"></div>
            <img
              src={settings.hero_image || "/images/smash-burger.jpg"}
              alt="Hambúrguer Saron Burguer"
              className="hero-burger-circle"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="section-darker">
        <div className="container">
          <h2 className="section-title">{settings.about_title || "Nossa História"}</h2>
          <p className="section-subtitle">
            {settings.about_text ||
              "A SARON BURGUER nasceu da paixão por hambúrgueres artesanais de qualidade. Desde 2020, oferecemos o melhor da hamburgueria gourmet com ingredientes frescos e selecionados, preparados com carinho para você."}
          </p>

          <div className="stats-section stats-grid">
            <div className="stat-card">
              <div className="stat-number">+{counterValues.burgers.toLocaleString("pt-BR")}</div>
              <div className="stat-label">Hambúrgueres vendidos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">+{counterValues.clients.toLocaleString("pt-BR")}</div>
              <div className="stat-label">Clientes satisfeitos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">+{counterValues.orders.toLocaleString("pt-BR")}</div>
              <div className="stat-label">Pedidos entregues</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{counterValues.years}</div>
              <div className="stat-label">Anos de tradição</div>
            </div>
          </div>
        </div>
      </section>

      {/* CARDÁPIO */}
      <section id="cardapio" className="section-dark">
        <div className="container">
          <h2 className="section-title">🍔 NOSSO CARDÁPIO</h2>
          <p className="section-subtitle">Escolha seu favorito e peça agora mesmo!</p>

          {/* Tabs de categoria */}
          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategory === null ? "active" : ""}`}
              onClick={() => setSelectedCategory(null)}
            >
              🍽️ Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Grid de produtos */}
          {loading ? (
            <div className="grid-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 320 }}></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: "3rem" }}>🍔</div>
              <h3>Nenhum produto nesta categoria</h3>
              <p style={{ color: "var(--text-gray)", marginTop: 8 }}>Tente selecionar outra categoria</p>
            </div>
          ) : (
            <div className="grid-4" ref={productGridRef}>
              {filteredProducts.map((product, idx) => (
                <div key={product.id} data-aos="fade-up" data-aos-delay={(idx % 4) * 50}>
                  <ProductCard
                    product={product}
                    onOpenDetails={() => setSelectedProduct(product)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section-accent">
        <div className="container">
          <h2 className="section-title">💬 O QUE DIZEM NOSSOS CLIENTES</h2>
          <p className="section-subtitle">Avaliações reais de quem já experimentou</p>

          <div className="grid-3">
            {testimonials.slice(0, 6).map((t, i) => (
              <div key={t.id} className="testimonial-card" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="stars">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      className="star"
                      style={{
                        color: idx < t.rating ? "var(--secondary)" : "var(--text-gray)",
                        animationDelay: `${idx * 0.1}s`,
                        animation: idx < t.rating ? `starFill 0.5s ease-out ${idx * 0.1}s backwards` : "none",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p style={{ color: "var(--text-gray)", marginBottom: 16, fontStyle: "italic" }}>
                  &ldquo;{t.message}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                    }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <strong style={{ color: "white" }}>{t.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOTOS & VÍDEOS */}
      <section id="galeria" className="section-darker">
        <div className="container">
          <h2 className="section-title">📸 FOTOS & VÍDEOS</h2>
          <p className="section-subtitle">Conheça nossos lanches, ambiente e momentos especiais da Saron Burguer.</p>

          {galleryItems.length === 0 ? (
            /* Vazio — admin ainda não enviou fotos */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--bg-card)",
              borderRadius: 16,
              border: "2px dashed rgba(255,215,0,0.2)",
            }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 16, opacity: 0.5 }}>📷</div>
              <h3 style={{ color: "var(--text-gray)", fontFamily: "Bebas Neue", fontSize: "1.5rem", marginBottom: 8 }}>
                Em breve mais fotos!
              </h3>
              <p style={{ color: "var(--text-gray)", fontSize: "0.9rem" }}>
                Em breve compartilharemos nossos melhores momentos aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {galleryItems.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  data-aos="zoom-in"
                  data-aos-delay={i * 60}
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid rgba(255,215,0,0.15)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--bg-card-hover)" }}>
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={`Foto ${i + 1} da Saron Burguer`}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(0,0,0,0.65)", color: "var(--secondary)",
                      padding: "4px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                    }}>
                      {item.type === "video" ? "🎬 Vídeo" : "📷 Foto"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LOCALIZAÇÃO */}
      <section id="contato" className="section-dark">
        <div className="container">
          <h2 className="section-title">📍 ONDE NOS ENCONTRAR</h2>
          <p className="section-subtitle">Estamos esperando sua visita!</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, marginTop: 48 }}>
            <div className="stat-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📍</div>
              <h3 style={{ color: "var(--secondary)", marginBottom: 8 }}>ENDEREÇO</h3>
              <p style={{ color: "var(--text-gray)" }}>
                {settings.address || "Rua dos Hambúrgueres, 123"}
                <br />
                {settings.city || "São Paulo - SP"}
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📞</div>
              <h3 style={{ color: "var(--secondary)", marginBottom: 8 }}>CONTATO</h3>
              <p style={{ color: "var(--text-gray)" }}>
                {settings.phone || "(11) 99999-9999"}
                <br />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--secondary)" }}>
                  WhatsApp disponível
                </a>
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🕐</div>
              <h3 style={{ color: "var(--secondary)", marginBottom: 8 }}>HORÁRIOS</h3>
              <p style={{ color: "var(--text-gray)" }}>
                {settings.opening_hours || "Seg-Dom: 18h às 00h"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 48, borderRadius: 12, overflow: "hidden", height: 300, border: "2px solid var(--secondary)" }}>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0!2d-46.6545!3d-23.5505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzAxLjgiUyA0NsKwMzknMTYuMiJX!5e0!3m2!1spt-BR!2sbr!4v1700000000000'
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              title="Mapa Saron Burguer"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img
                src="/images/logo.png"
                alt="Logo Saron Rede Burgs"
                style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", boxShadow: "0 0 24px rgba(255,215,0,0.35)" }}
              />
              <h3 style={{ color: "var(--secondary)", fontSize: "1.8rem", fontFamily: "Bebas Neue", letterSpacing: "0.1em" }}>
                SARON BURGUER
              </h3>
            </div>
            <p style={{ color: "var(--text-gray)", marginBottom: 16 }}>
              O sabor que você merece! Hambúrgueres artesanais feitos com amor e ingredientes selecionados.
            </p>
            <div className="social-links">
              <a href={settings.instagram || "#"} className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href={settings.facebook || "#"} className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href={whatsappLink} className="social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>NAVEGAÇÃO</h4>
            <ul>
              <li><a onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}>Início</a></li>
              <li><a onClick={() => document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}>Cardápio</a></li>
              <li><a onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}>Sobre</a></li>
              <li><a onClick={() => document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}>Fotos & Vídeos</a></li>
              <li><a onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}>Contato</a></li>
              <li><Link href="/tracking">Acompanhar Pedido</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>CONTATO</h4>
            <ul>
              <li>📞 {settings.phone || "(11) 99999-9999"}</li>
              <li>📍 {settings.address || "Rua dos Hambúrgueres, 123"}</li>
              <li>🕒 {settings.opening_hours || "18h às 00h"}</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>NEWSLETTER</h4>
            <p style={{ color: "var(--text-gray)", marginBottom: 12, fontSize: "0.9rem" }}>
              Receba promoções exclusivas!
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" placeholder="Seu e-mail" className="form-input" style={{ flex: 1, padding: "0.7rem" }} />
              <button className="btn-primary" style={{ padding: "0.7rem 1rem" }}>
                <span>📨</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,215,0,0.2)", marginTop: 32, paddingTop: 24, textAlign: "center", color: "var(--text-gray)", fontSize: "0.9rem", position: "relative" }}>
          <p>© 2026 SARON BURGUER. Todos os direitos reservados.</p>
          <p style={{ marginTop: 8, fontSize: "0.8rem" }}>
            Desenvolvido com 🔥 e muito amor pelo sabor
          </p>
          <Link
            href="/admin"
            aria-label="Acessar painel administrativo"
            title="⛮"
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              color: "rgba(255,255,255,0.28)",
              textDecoration: "none",
              fontSize: "1.2rem",
              lineHeight: 1,
              padding: "0.2rem 0.35rem",
              transition: "all 0.3s ease",
            }}
          >
            ⛮
          </Link>
        </div>
      </footer>

      {/* Assistente virtual */}
      <VirtualAssistant settings={settings} />

      {/* Back to top */}
      <button
        className={`back-to-top ${showBackTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
      >
        <ArrowUp size={20} />
      </button>

      {/* Modal do produto */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <CartProvider>
        <HomePage />
      </CartProvider>
    </ToastProvider>
  );
}
