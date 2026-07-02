"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, BookOpen, MapPin, Clock3, PhoneCall, Instagram, ChevronDown } from "lucide-react";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  options?: string[];
}

interface Props {
  settings: Record<string, string>;
}

// ─── Motor de respostas da Saron ─────────────────────────────────────────────
function buildBrain(settings: Record<string, string>) {
  const name     = settings.assistant_name    || "Saron Assist";
  const greeting = settings.assistant_greeting || `Olá! Eu sou a **${name}**, atendente virtual da Saron Burguer 🍔 Como posso te ajudar hoje?`;
  const hours    = settings.opening_hours      || "Seg a Dom: 06h às 00h — quarta-feira fechado";
  const address  = settings.address            || "Cj. Antônio Lins, Rio Largo - AL";
  const city     = settings.city               || "Rio Largo - AL";
  const phone    = settings.phone              || "(82) 98727-5750";
  const whatsapp = settings.whatsapp           || "5582987275750";
  const ig       = settings.instagram          || "https://instagram.com/saronburguer";
  const fee      = settings.delivery_fee       || "5";

  type Rule = { patterns: RegExp[]; reply: (m: RegExpMatchArray | null) => string; options?: string[] };

  const rules: Rule[] = [
    // ── Saudações ──────────────────────────────────────────────────────────────
    {
      patterns: [/\b(oi|olá|ola|hey|hello|bom dia|boa tarde|boa noite|tudo bem|tudo bom)\b/i],
      reply: () => `${greeting}`,
      options: ["🍔 Cardápio", "📍 Localização", "🕐 Horário", "🚚 Delivery", "💳 Pagamento"],
    },

    // ── Cardápio geral ─────────────────────────────────────────────────────────
    {
      patterns: [/card[áa]pio|menu|o que tem|tem o que|o que voc[êe]s vendem|lanches|produtos/i],
      reply: () =>
        `🍔 Temos um cardápio completo:\n\n` +
        `• **Hambúrgueres Tradicionais** — R$ 6 a R$ 25\n` +
        `• **Hambúrgueres Especiais** — R$ 21 a R$ 30\n` +
        `• **Artesanais (brioche)** — R$ 18 a R$ 38\n` +
        `• **Passaportes (hot dogs)** — R$ 14 a R$ 32\n` +
        `• **Batatas Fritas** — R$ 10 a R$ 19,99\n` +
        `• **Açaí & Gelados** — R$ 10 a R$ 17\n` +
        `• **Milkshake** — R$ 13 a R$ 17\n` +
        `• **Bebidas** — R$ 7 a R$ 14\n` +
        `• **Sobremesas** — R$ 2,50 a R$ 7\n\n` +
        `Quer ver o cardápio completo no site? Só clicar em 👇`,
      options: ["📋 Ver cardápio no site", "🍔 Hambúrgueres", "🌭 Passaportes", "🍟 Batatas"],
    },

    // ── Hambúrgueres ───────────────────────────────────────────────────────────
    {
      patterns: [/hamburguer|hambúrguer|artesanal|brioche|smash|duplo|saron burger/i],
      reply: () =>
        `🍔 Nossos destaques:\n\n` +
        `• **Acém** — R$ 18 (pão brioche, molho especial, cebola caramelizada)\n` +
        `• **Saron Duplo** — R$ 28 (2x hambúrguer artesanal, 2 queijos)\n` +
        `• **X-Saron Burguer** — R$ 32 (costela + alcatra, bacon, cebola caramelizada, 2 queijos, anel de cebola)\n` +
        `• **Gourmet Mais Queijo** — R$ 30 (hambúrguer 150g, queijo empanado)\n` +
        `• **X-Big Saron Duplo** — R$ 38 (com abacaxi ou banana caramelizada)\n\n` +
        `Todos os artesanais têm pão brioche 🔥`,
      options: ["🌭 Passaportes", "🍟 Batatas fritas", "📋 Ver cardápio completo"],
    },

    // ── Passaportes / hot dogs ──────────────────────────────────────────────────
    {
      patterns: [/passaporte|hot.?dog|salsicha|cachorro.?quente/i],
      reply: () =>
        `🌭 Passaportes da Saron:\n\n` +
        `**Tradicionais:**\n` +
        `• Passa-Carne — R$ 14\n` +
        `• Passa-Frango — R$ 15\n` +
        `• Passa-Misto — R$ 15\n` +
        `• Passa-Red Carne (28cm, 2 salsichas) — R$ 19\n` +
        `• Passa-Red Misto — R$ 21\n\n` +
        `**Especiais:**\n` +
        `• Passa-Bacon — R$ 16\n` +
        `• Passa-Búrguer — R$ 18\n` +
        `• Passa-Red Tudo — R$ 32\n\n` +
        `Todos com batata palha, milho e ervilha 😋`,
      options: ["🍔 Hambúrgueres", "🍟 Batatas", "📋 Ver cardápio completo"],
    },

    // ── Batatas ─────────────────────────────────────────────────────────────────
    {
      patterns: [/batata|frita|fritas|porcao|porção|acompanhamento/i],
      reply: () =>
        `🍟 Porções de Batata:\n\n` +
        `• Tradicional 250g — R$ 10 (batata fatiada, queijo ralado, ketchup)\n` +
        `• Especial 270g — R$ 12 (cheddar, catupiry, ketchup)\n` +
        `• Especial c/ Adicional 280g — R$ 15 (+ bacon, calabresa ou alcatra)\n` +
        `• Da Casa 300g — R$ 19,99 (cheddar, catupiry, adicional, cebola, tomate, alface)\n\n` +
        `As batatas são fatiadas e crocantes 🔥`,
      options: ["🍔 Hambúrgueres", "🍨 Açaí", "💳 Pagamento"],
    },

    // ── Açaí e sobremesas ──────────────────────────────────────────────────────
    {
      patterns: [/a[çc]a[íi]|gelado|sorvete|sobremesa|doce|milkshake|milk.shake/i],
      reply: () =>
        `🍨 Açaí & Gelados:\n\n` +
        `**Açaí puro:**\n` +
        `• 300ml — R$ 13  |  400ml — R$ 15  |  500ml — R$ 17\n\n` +
        `**Açaí Mix (com sorvete):**\n` +
        `• 300ml — R$ 13  |  400ml — R$ 15  |  500ml — R$ 17\n\n` +
        `**Milkshake** (morango, coco, chocolate):\n` +
        `• 300ml — R$ 13  |  400ml — R$ 15  |  500ml — R$ 17\n\n` +
        `**Sorvete:**  300ml R$10  |  400ml R$12  |  500ml R$15\n\n` +
        `**Sobremesas:** Pudim R$6 | Mousse R$7 | Tortilete R$2,50`,
      options: ["🍔 Cardápio completo", "🚚 Delivery", "💳 Pagamento"],
    },

    // ── Bebidas ─────────────────────────────────────────────────────────────────
    {
      patterns: [/bebida|refrigerante|suco|coca|pepsi|guaraná|guarana|fanta|agua|água/i],
      reply: () =>
        `🥤 Bebidas:\n\n` +
        `• Coca-Cola Lata 350ml — R$ 7\n` +
        `• Coca-Cola 1L / 2L — R$ 10 / R$ 14\n` +
        `• Pepsi Pet 1L — R$ 10\n` +
        `• Guaraná Pet 1L / 2L — R$ 10 / R$ 13\n` +
        `• Fanta Lata — R$ 7 | Fanta Pet 2L — R$ 13\n` +
        `• Suco Jarra 1L — R$ 12 (c/ leite R$ 14)\n` +
        `• Suco Copo 300ml — R$ 7\n` +
        `• Sabores de suco: manga, acerola, goiaba, abacaxi, laranja, graviola`,
      options: ["🍔 Cardápio", "🚚 Delivery", "💳 Pagamento"],
    },

    // ── Preço / quanto custa ────────────────────────────────────────────────────
    {
      patterns: [/pre[çc]o|quanto (custa|é|tem|vende)|valor|mais barato|mais caro|barato/i],
      reply: () =>
        `💰 Preços da Saron:\n\n` +
        `• Mais barato: **Queijo** — R$ 6,00 🧀\n` +
        `• Tradicionais: R$ 6 a R$ 25\n` +
        `• Especiais: R$ 21 a R$ 30\n` +
        `• Artesanais: R$ 18 a R$ 38 🔥\n` +
        `• Passaportes: R$ 14 a R$ 32\n` +
        `• Batatas: R$ 10 a R$ 19,99\n\n` +
        `Temos opções para todos os bolsos! 😉`,
      options: ["🍔 Ver cardápio", "🚚 Delivery", "💳 Pagamento"],
    },

    // ── Horário ─────────────────────────────────────────────────────────────────
    {
      patterns: [/hor[áa]rio|funciona|abre|fecha|expediente|quarta|aberto|fechado|funcionamento/i],
      reply: () =>
        `🕐 Horário de funcionamento:\n\n` +
        `• Segunda a Terça: 06h às 00h\n` +
        `• Quinta a Domingo: 06h às 00h\n` +
        `• **Quarta-feira: FECHADO** ❌\n\n` +
        `Horário registrado: *${hours}*`,
      options: ["📍 Localização", "🚚 Delivery", "📞 Contato"],
    },

    // ── Localização / endereço ─────────────────────────────────────────────────
    {
      patterns: [/endere[çc]o|localiza[çc]|fica|onde|bairro|rua|mapa|como chegar|rio largo/i],
      reply: () =>
        `📍 Estamos em:\n\n` +
        `**${address}**\n${city}\n\n` +
        `CEP: 57100-000\n\n` +
        `📌 Clique no botão abaixo para abrir no Google Maps!`,
      options: ["🗺️ Abrir no Google Maps", "🕐 Horário", "📞 Contato"],
    },

    // ── Delivery / entrega ──────────────────────────────────────────────────────
    {
      patterns: [/delivery|entrega|entreg|moto|motoboy|pedido|pedir|encomendar/i],
      reply: () =>
        `🚚 Delivery Saron!\n\n` +
        `• Fazemos entrega sim! 🛵\n` +
        `• Taxa de entrega: **R$ ${fee}**\n` +
        `• Também pode retirar no local gratuitamente\n\n` +
        `Para fazer seu pedido pelo site é só ir no cardápio e clicar em qualquer produto 🛒`,
      options: ["📋 Ver cardápio", "💳 Pagamento", "📞 Falar pelo WhatsApp"],
    },

    // ── Pagamento ───────────────────────────────────────────────────────────────
    {
      patterns: [/pagamento|paga|pix|cart[ãa]o|dinheiro|crédito|cr[eé]dito|débito|d[eé]bito|forma|aceita/i],
      reply: () =>
        `💳 Formas de pagamento:\n\n` +
        `• 💠 **PIX** — instantâneo\n` +
        `• 💳 **Cartão de crédito/débito**\n` +
        `• 💵 **Dinheiro** — informamos o troco na finalização\n\n` +
        `Pagamento na entrega ou retirada 😊`,
      options: ["🚚 Delivery", "📋 Fazer pedido", "📞 Contato"],
    },

    // ── Contato / telefone / WhatsApp ──────────────────────────────────────────
    {
      patterns: [/contato|telefone|fone|liga|ligar|zap|whatsapp|número|número|falar com/i],
      reply: () =>
        `📞 Entre em contato:\n\n` +
        `• **Telefone / WhatsApp:** ${phone}\n` +
        `• Atendimento via site: 24h no cardápio online 🛒\n\n` +
        `Para fazer pedido, vai direto no cardápio aqui no site!`,
      options: ["📋 Ver cardápio", "🚚 Fazer pedido", "📍 Localização"],
    },

    // ── Instagram ───────────────────────────────────────────────────────────────
    {
      patterns: [/instagram|insta|rede social|social|foto|seguir|@/i],
      reply: () =>
        `📸 Nos siga no Instagram!\n\n` +
        `Lá postamos fotos dos nossos lanches, promoções e novidades 🔥\n\n` +
        `👉 ${ig}`,
      options: ["🍔 Cardápio", "📍 Localização", "📞 Contato"],
    },

    // ── Promoção / desconto / cupom ────────────────────────────────────────────
    {
      patterns: [/promo[çc][ãa]o|desconto|cupom|oferta|promo|barato|gratis|grátis/i],
      reply: () =>
        `🏷️ Promoções Saron!\n\n` +
        `Temos cupons de desconto disponíveis no checkout!\n\n` +
        `• **BEMVINDO10** — 10% off no primeiro pedido acima de R$ 50\n` +
        `• **SARON15** — 15% off em pedidos acima de R$ 80\n\n` +
        `Ative seu cupom na tela de finalização do pedido 🎫`,
      options: ["📋 Ver cardápio", "🛒 Fazer pedido", "📞 Contato"],
    },

    // ── Acréscimos / extras ────────────────────────────────────────────────────
    {
      patterns: [/acr[eé]scimo|extra|adicional|bacon|ovo|queijo|calabresa|frango extra/i],
      reply: () =>
        `➕ Acréscimos disponíveis:\n\n` +
        `• Hambúrguer — R$ 6\n` +
        `• Hambúrguer Artesanal — R$ 10\n` +
        `• Ovo — R$ 5\n` +
        `• Salsicha — R$ 4\n` +
        `• Bacon — R$ 8\n` +
        `• Calabresa — R$ 7\n` +
        `• Queijo Coalho — R$ 5\n` +
        `• Anel de Cebola — R$ 7\n` +
        `• Banana Caramelizada — R$ 7\n` +
        `• Abacaxi Caramelizado — R$ 7`,
      options: ["🍔 Cardápio", "🛒 Fazer pedido"],
    },

    // ── Avalição / como está ────────────────────────────────────────────────────
    {
      patterns: [/avalia[çc][ãa]o|nota|estrela|qualidade|bom|ótimo|gostoso|delicioso|recomenda/i],
      reply: () =>
        `⭐ A Saron Burguer tem nota **4,7** no Google com 7 avaliações!\n\n` +
        `"Lanches Gostosos, Local adequado." — Ariel YT\n` +
        `"Amo kisso hm 😍" — Eduardo Silver\n` +
        `"Lanche de qualidade!" — Cliente satisfeito\n\n` +
        `Venha experimentar e deixe sua avaliação também 🙌`,
      options: ["📋 Ver cardápio", "🚚 Fazer pedido", "📍 Localização"],
    },

    // ── Sobre a Saron ──────────────────────────────────────────────────────────
    {
      patterns: [/quem [eé]|sobre voc[êe]s|hist[oó]ria|empresa|loja|lanchonete|rede burg/i],
      reply: () =>
        `🍔 Saron Rede Burgs!\n\n` +
        `Somos uma lanchonete localizada em **Rio Largo - AL**, especializada em hambúrgueres, passaportes (hot dogs), açaí e gelados.\n\n` +
        `• ⭐ Nota 4,7 no Google\n` +
        `• 🚚 Fazemos delivery\n` +
        `• 🗓️ Abertos seg a dom (exceto quarta)\n\n` +
        `Nossa missão é servir o melhor lanche da região com qualidade e sabor! 🔥`,
      options: ["📋 Ver cardápio", "📍 Localização", "🕐 Horário"],
    },
  ];

  // Função de matching NLP
  function process(userText: string): { reply: string; options?: string[] } {
    const t = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Verifica opções de botão especiais
    if (t.includes("ver card") || t === "cardapio" || t === "ver cardapio no site") {
      return {
        reply: "Perfeito! Vou te levar ao cardápio 🍔",
        options: ["🍔 Hambúrgueres", "🌭 Passaportes", "🍟 Batatas", "🍨 Açaí"],
      };
    }

    if (t.includes("abrir no google maps") || t.includes("mapa") || t.includes("google maps")) {
      return {
        reply: `📍 Clique aqui para abrir no Google Maps:\n👉 [Abrir Mapa](https://www.google.com/maps/place/Saron+red+burgue%27s/@-9.4853415,-35.8086496,17z)`,
      };
    }

    if (t.includes("falar pelo whatsapp") || t.includes("whatsapp") && t.includes("falar")) {
      return {
        reply: `📱 Nosso WhatsApp:\n\n📞 **${phone}**\n\nSe preferir fazer o pedido pelo site, é só ir ao cardápio 🛒`,
      };
    }

    if (t.includes("fazer pedido") || t.includes("pedido") || t.includes("comprar")) {
      return {
        reply: "🛒 Ótimo! Para fazer seu pedido:\n\n1. Escolha seus itens no cardápio abaixo\n2. Adicione ao carrinho\n3. Clique em finalizar pedido\n4. Preencha seus dados e pronto!\n\nÉ rápido e fácil 😊",
        options: ["📋 Ver cardápio", "🚚 Info de entrega", "💳 Pagamento"],
      };
    }

    // Busca por padrão
    for (const rule of rules) {
      for (const pat of rule.patterns) {
        const m = t.match(pat);
        if (m) {
          return { reply: rule.reply(m), options: rule.options };
        }
      }
    }

    // Fallback inteligente
    return {
      reply: `🤔 Hmm, não entendi exatamente. Posso te ajudar com:\n\n• 🍔 Cardápio e preços\n• 🕐 Horário de funcionamento\n• 📍 Endereço e localização\n• 🚚 Delivery e entrega\n• 💳 Formas de pagamento\n• 🏷️ Promoções e cupons\n\nMe conta melhor o que você precisa 😊`,
      options: ["🍔 Cardápio", "📍 Localização", "🕐 Horário", "🚚 Delivery", "💳 Pagamento"],
    };
  }

  return { greeting, process, name };
}

// ─── Componente de mensagem com markdown básico ──────────────────────────────
function MsgText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ─── Chips / ações rápidas ───────────────────────────────────────────────────
const INITIAL_CHIPS = [
  "🍔 Cardápio",
  "📍 Localização",
  "🕐 Horário",
  "🚚 Delivery",
  "💳 Pagamento",
  "🏷️ Promoções",
  "📞 Contato",
];

// ─── Componente principal ────────────────────────────────────────────────────
export default function VirtualAssistant({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [chips, setChips] = useState<string[]>(INITIAL_CHIPS);
  const endRef = useRef<HTMLDivElement>(null);
  const brainRef = useRef(buildBrain(settings));

  // Re-constrói o brain quando as settings mudam
  useEffect(() => { brainRef.current = buildBrain(settings); }, [settings]);

  useEffect(() => {
    setMounted(true);
    const { greeting } = buildBrain(settings);
    setMessages([{
      id: Date.now(),
      role: "assistant",
      text: greeting,
      options: INITIAL_CHIPS,
    }]);
  }, []);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTyping(true);

    // Resposta com delay natural (800-1400ms)
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      const { reply, options } = brainRef.current.process(text);
      setTyping(false);
      setMessages((p) => [
        ...p,
        { id: Date.now() + Math.random(), role: "assistant", text: reply, options },
      ]);
      // Atualiza chips globais se resposta trouxe opções
      if (options && options.length > 0) setChips(options);
      // Navega ao cardápio se necessário
      if (
        text.toLowerCase().includes("ver card") ||
        text.toLowerCase().includes("cardapio no site") ||
        text.toLowerCase().includes("fazer pedido")
      ) {
        setTimeout(() => document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" }), 400);
      }
    }, delay);
  };

  if (!mounted) return null;

  const assistantName = settings.assistant_name || "Saron Assist";

  return (
    <div className="assistant-root">
      {/* ── Painel de chat ───────────────────────────────────────── */}
      {open && (
        <div className="assistant-panel">
          {/* Header */}
          <div className="assistant-header">
            <div className="assistant-header-info">
              <div className="assistant-avatar-wrap">
                <img src="/images/logo.png" alt="logo" className="assistant-avatar-logo" />
                <span className="assistant-online-dot" />
              </div>
              <div>
                <div className="assistant-name">{assistantName}</div>
                <div className="assistant-status">● Online agora</div>
              </div>
            </div>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="assistant-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`assistant-bubble-wrap ${msg.role}`}>
                {msg.role === "assistant" && (
                  <img src="/images/logo.png" alt="" className="assistant-bubble-avatar" />
                )}
                <div className={`assistant-bubble ${msg.role}`}>
                  <MsgText text={msg.text} />
                  {/* Opções inline da mensagem */}
                  {msg.role === "assistant" && msg.options && msg.options.length > 0 && (
                    <div className="assistant-bubble-options">
                      {msg.options.map((opt) => (
                        <button key={opt} className="assistant-option-btn" onClick={() => send(opt)}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Digitando... */}
            {typing && (
              <div className="assistant-bubble-wrap assistant">
                <img src="/images/logo.png" alt="" className="assistant-bubble-avatar" />
                <div className="assistant-bubble assistant assistant-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Chips rápidos fixos */}
          <div className="assistant-chips-bar">
            {chips.map((chip) => (
              <button key={chip} className="assistant-chip" onClick={() => send(chip)}>
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="assistant-input-row">
            <input
              className="assistant-input"
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              autoComplete="off"
            />
            <button className="assistant-send" onClick={() => send(input)} aria-label="Enviar">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB (botão flutuante) ─────────────────────────────────── */}
      <button
        className={`assistant-fab ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir atendente virtual"
      >
        <div className="assistant-fab-avatar">
          <img src="/images/logo.png" alt="Saron" className="assistant-fab-logo" />
        </div>
        <div className="assistant-fab-text">
          <span className="assistant-fab-label">{assistantName}</span>
          <span className="assistant-fab-sub">Clique para conversar</span>
        </div>
        <ChevronDown size={18} className={`assistant-fab-chevron ${open ? "open" : ""}`} />
        {!open && <span className="assistant-fab-ping" />}
      </button>
    </div>
  );
}
