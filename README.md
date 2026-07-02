# 🍔 SARON BURGUER — Site completo

Site profissional para hamburgueria com cardápio digital, pedidos online, painel admin e assistente virtual.

---

## ✅ Checklist de verificação para deploy na Vercel

| Item | Status |
|---|---|
| Build de produção (`next build`) | ✅ OK |
| TypeScript sem erros | ✅ OK |
| `.gitignore` protegendo `.env` | ✅ OK |
| `vercel.json` mínimo e seguro (sem secrets legados) | ✅ OK |
| Pool de conexões do banco ajustado para serverless | ✅ OK |
| Rotas de API sem dependência de estado em disco permanente | ✅ OK (com ressalvas de upload, ver abaixo) |
| Login com cookie `secure` em produção | ✅ OK |
| SSE com fallback de polling garantindo entrega do pedido | ✅ OK |

---

## ⚠️ Limitações importantes da Vercel (leia antes de publicar)

A Vercel roda o backend como **funções serverless** — isso é diferente de um servidor Node.js tradicional sempre ligado. Dois pontos merecem atenção:

### 1. Notificação em tempo real (SSE)
O painel admin usa **Server-Sent Events (SSE)** para receber pedidos instantaneamente, com um **fallback de polling a cada 4-5 segundos**.

- Em um servidor tradicional (Railway, Render, VPS): o SSE funciona perfeitamente e o pedido chega **na hora**.
- Na Vercel (serverless): funções podem escalar em múltiplas instâncias, e a conexão SSE de um admin pode estar em uma instância diferente de onde chegou o pedido. Por isso o **polling de 4-5s garante a entrega do pedido mesmo se o SSE não alcançar todas as instâncias** — ou seja, o pedido chega em no máximo alguns segundos, sempre.
- Se quiser notificação 100% instantânea e garantida na Vercel, o ideal é integrar um serviço de pub/sub como [Pusher](https://pusher.com), [Ably](https://ably.com) ou [Supabase Realtime](https://supabase.com/realtime) (todos têm planos gratuitos). Posso implementar isso se desejar.

### 2. Upload de fotos/vídeos
A Vercel **não permite** gravar arquivos permanentemente no disco. Por isso:

- Uploads feitos direto do computador ficam em `/tmp` (temporário, pode ser perdido).
- **Recomendado:** no painel admin → Mídias, use o campo **"Adicionar por URL externa"** e cole o link de uma imagem hospedada em [Cloudinary](https://cloudinary.com) (grátis até 25GB), [Imgur](https://imgur.com) ou [Bunny.net](https://bunny.net).
- O limite de tamanho de upload direto também é de **4.5 MB por arquivo** (limite da Vercel para requisições).

---

## 🚀 Deploy na Vercel (passo a passo)

### 1. Banco de dados — Neon (grátis, recomendado)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um projeto → copie a **connection string com pooling** (contém `-pooler` no host — importante para serverless)
3. No **SQL Editor** do Neon, execute o conteúdo de `scripts/setup-db.sql`

### 2. GitHub

```bash
git init
git add .
git commit -m "SARON BURGUER - deploy inicial"
git remote add origin https://github.com/seu-usuario/saron-burguer.git
git push -u origin main
```

### 3. Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório
2. Em **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | String do Neon **com `-pooler`** — ex: `postgresql://user:pass@ep-xxx-pooler.sa-east-1.aws.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | Qualquer string longa e aleatória |

3. Clique em **Deploy** ✅

### 4. Popular o banco (uma vez, após o primeiro deploy)

Acesse no navegador:
```
https://seu-site.vercel.app/api/seed?key=saron
https://seu-site.vercel.app/api/seed-real-menu?key=saron
```

> ⚠️ Depois de popular o banco, considere remover ou proteger melhor essas rotas (`src/app/api/seed*`), pois ficam publicamente acessíveis com a chave `saron`.

---

## 🔑 Acesso ao painel admin

- URL: `https://seu-site.vercel.app/admin`
- **Usuário:** `admin`
- **Senha:** `saron123` (troque assim que possível pelo próprio painel → Minha Conta)

> O link de acesso ao admin fica discretamente no rodapé do site (ícone ⛮ no canto inferior esquerdo)

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Home — cardápio, depoimentos, galeria, contato
│   ├── checkout/              # Fluxo de pedido (com SSE + polling de status)
│   ├── tracking/               # Acompanhamento do pedido em tempo real
│   ├── admin/                  # Painel administrativo
│   └── api/
│       ├── categories/         # CRUD de categorias
│       ├── products/           # CRUD de produtos
│       ├── orders/             # Pedidos (GET/POST/PUT/DELETE)
│       ├── orders/events/      # SSE — push em tempo real para o admin/cliente
│       ├── settings/           # CMS do site
│       ├── media/              # Biblioteca de mídias (upload + URL externa)
│       ├── media/file/         # Serve arquivos de /tmp (best-effort na Vercel)
│       ├── coupons/            # Cupons de desconto
│       ├── testimonials/       # Depoimentos
│       ├── auth/                # Login/logout/change-password
│       ├── admin/stats         # Dashboard stats
│       ├── seed/                 # Popular banco (admin/usuários/settings)
│       └── seed-real-menu/       # Popular cardápio completo
├── components/
│   ├── Navbar.tsx
│   ├── CartSidebar.tsx
│   ├── ProductCard.tsx
│   ├── AdminPanel.tsx
│   └── VirtualAssistant.tsx    # Assistente digital com NLP local
├── lib/
│   ├── sse.ts                  # Registry global de clientes SSE
│   └── utils.ts                 # Helpers (bcrypt, JWT, formatadores)
├── context/
│   ├── CartContext.tsx
│   └── ToastContext.tsx
└── db/
    ├── schema.ts                # Tabelas Drizzle ORM
    └── index.ts                  # Conexão PostgreSQL (pool serverless-safe)
```

---

## 🔧 Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ Sim | String de conexão PostgreSQL (use a versão "pooled" do Neon) |
| `JWT_SECRET` | ✅ Sim | Chave para assinar tokens JWT |

Copie `.env.example` para `.env` localmente e preencha os valores.

---

## 🖥️ Alternativa sem limitações serverless

Se preferir **notificação 100% instantânea** e **upload de arquivo permanente sem depender de URL externa**, hospede em um servidor sempre ativo:

- [Railway](https://railway.app) — grátis para começar, suporta Node.js tradicional + Postgres
- [Render](https://render.com) — grátis para começar
- VPS próprio (DigitalOcean, Hetzner, etc.)

Nesses ambientes, o SSE funciona de forma totalmente confiável (sem os limites de múltiplas instâncias/timeout da Vercel) e o upload de arquivos pode gravar direto em `public/uploads` permanentemente.

---

## 📞 Contato do estabelecimento

- **Telefone:** (82) 98727-5750
- **Endereço:** Cj. Antônio Lins, Rio Largo - AL, 57100-000
- **Horário:** Seg a Dom 06h-00h (exceto quarta-feira)
