// Seed script - executa com: npx tsx src/scripts/seed.ts
import { db } from "../db";
import { users, categories, products, siteSettings, coupons, testimonials } from "../db/schema";
import { hashPassword } from "../lib/utils";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Limpa tabelas
  await db.delete(testimonials);
  await db.delete(coupons);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(users);
  await db.delete(siteSettings);

  // Cria admin
  const adminPassword = await hashPassword("saron123");
  await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    name: "Administrador",
    role: "admin",
  });
  console.log("✅ Admin criado (admin / saron123)");

  // Categorias
  const [catClassic, catGourmet, catHotdog, catSides, catDrinks, catDesserts] = await db
    .insert(categories)
    .values([
      { name: "Hambúrgueres Clássicos", icon: "🍔", order: 1, description: "Os clássicos irresistíveis" },
      { name: "Especiais Gourmet", icon: "🔥", order: 2, description: "Sabores exclusivos da casa" },
      { name: "Hot Dogs", icon: "🌭", order: 3, description: "Hot dogs recheados" },
      { name: "Porções & Acompanhamentos", icon: "🍟", order: 4, description: "Para acompanhar seu pedido" },
      { name: "Bebidas", icon: "🥤", order: 5, description: "Refresque-se" },
      { name: "Sobremesas", icon: "🍰", order: 6, description: "Finalize com doçura" },
    ])
    .returning();

  console.log("✅ Categorias criadas");

  // Produtos
  const extras = [
    { name: "Queijo extra", price: 3.5 },
    { name: "Bacon extra", price: 5 },
    { name: "Ovo", price: 3 },
    { name: "Hambúrguer extra", price: 8 },
    { name: "Cheddar", price: 4 },
    { name: "Molho extra", price: 2 },
  ];

  await db.insert(products).values([
    // Clássicos
    {
      categoryId: catClassic.id,
      name: "X-Burguer",
      description: "O clássico que nunca falha",
      ingredients: ["Pão de hambúrguer", "Hambúrguer 150g", "Queijo mussarela", "Alface", "Tomate", "Molho especial"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "19.90",
      image: "/images/bacon-burger.jpg",
      available: true,
      order: 1,
    },
    {
      categoryId: catClassic.id,
      name: "X-Salada",
      description: "Frescor e sabor em cada mordida",
      ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Alface", "Tomate", "Cebola", "Molho"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "21.90",
      image: "/images/bacon-burger.jpg",
      available: true,
      order: 2,
    },
    {
      categoryId: catClassic.id,
      name: "X-Bacon",
      description: "Bacon crocante com queijo derretido",
      ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Bacon crocante", "Alface", "Tomate", "Molho"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "25.90",
      image: "/images/bacon-burger.jpg",
      badge: "MAIS VENDIDO",
      available: true,
      order: 3,
    },
    {
      categoryId: catClassic.id,
      name: "X-Egg",
      description: "O tradicional com ovo frito",
      ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Ovo", "Alface", "Tomate", "Molho"],
      allergens: ["Glúten", "Lactose", "Ovo"],
      extras,
      price: "22.90",
      image: "/images/bacon-burger.jpg",
      available: true,
      order: 4,
    },
    {
      categoryId: catClassic.id,
      name: "X-Tudo",
      description: "Para quem tem muita fome!",
      ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Bacon", "Ovo", "Presunto", "Alface", "Tomate", "Cebola", "Milho", "Molho especial"],
      allergens: ["Glúten", "Lactose", "Ovo"],
      extras,
      price: "29.90",
      image: "/images/bacon-burger.jpg",
      available: true,
      order: 5,
    },
    // Gourmet
    {
      categoryId: catGourmet.id,
      name: "Saron Smash Burguer",
      description: "Nosso exclusivo smash burger com cheddar e cebola caramelizada",
      ingredients: ["Pão brioche", "2x Smash 90g", "Queijo cheddar derretido", "Cebola caramelizada", "Picles", "Molho Saron"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "34.90",
      image: "/images/smash-burger.jpg",
      badge: "MAIS VENDIDO",
      available: true,
      order: 1,
    },
    {
      categoryId: catGourmet.id,
      name: "Saron Double",
      description: "Dose dupla de sabor premium",
      ingredients: ["Pão brioche", "2x Hambúrguer 150g", "Dobro de queijo", "Bacon", "Molho especial"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "39.90",
      image: "/images/smash-burger.jpg",
      badge: "NOVO",
      available: true,
      order: 2,
    },
    {
      categoryId: catGourmet.id,
      name: "Costela Burguer",
      description: "Costela desfiada no pão australiano",
      ingredients: ["Pão australiano", "Hambúrguer de costela desfiada 200g", "Queijo provolone", "Cebola crispy", "Molho BBQ"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "42.90",
      image: "/images/smash-burger.jpg",
      available: true,
      order: 3,
    },
    {
      categoryId: catGourmet.id,
      name: "Frango Crocante Burguer",
      description: "Filé empanado super crocante",
      ingredients: ["Pão", "Filé de frango empanado", "Queijo", "Alface", "Tomate", "Maionese temperada"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "27.90",
      image: "/images/bacon-burger.jpg",
      available: true,
      order: 4,
    },
    {
      categoryId: catGourmet.id,
      name: "Veggie Burguer",
      description: "Opção vegetariana saborosa",
      ingredients: ["Pão integral", "Hambúrguer de grão-de-bico", "Queijo", "Rúcula", "Tomate seco", "Molho de ervas"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "26.90",
      image: "/images/bacon-burger.jpg",
      badge: "NOVO",
      available: true,
      order: 5,
    },
    // Hot Dogs
    {
      categoryId: catHotdog.id,
      name: "Hot Dog Tradicional",
      description: "O clássico do fast food",
      ingredients: ["Pão de hot dog", "Salsicha", "Vinagrete", "Batata palha", "Ketchup", "Mostarda", "Maionese"],
      allergens: ["Glúten"],
      extras,
      price: "15.90",
      image: "/images/hot-dog.jpg",
      available: true,
      order: 1,
    },
    {
      categoryId: catHotdog.id,
      name: "Hot Dog Completo",
      description: "Completo como você gosta",
      ingredients: ["Pão", "Salsicha", "Purê", "Vinagrete", "Milho", "Ervilha", "Batata palha", "Queijo ralado", "Molhos"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "19.90",
      image: "/images/hot-dog.jpg",
      available: true,
      order: 2,
    },
    {
      categoryId: catHotdog.id,
      name: "Hot Dog Especial Saron",
      description: "O hot dog da casa!",
      ingredients: ["Pão", "2 Salsichas", "Cheddar derretido", "Bacon picado", "Cebola crispy", "Molho Saron"],
      allergens: ["Glúten", "Lactose"],
      extras,
      price: "24.90",
      image: "/images/hot-dog.jpg",
      badge: "MAIS VENDIDO",
      available: true,
      order: 3,
    },
    // Porções
    {
      categoryId: catSides.id,
      name: "Batata Frita Tradicional",
      description: "Crocante por fora, macia por dentro (P/M/G)",
      ingredients: ["Batata frita", "Sal"],
      allergens: [],
      extras: [{ name: "Porção M", price: 5 }, { name: "Porção G", price: 10 }],
      price: "12.90",
      image: "/images/fries.jpg",
      available: true,
      order: 1,
    },
    {
      categoryId: catSides.id,
      name: "Batata com Cheddar e Bacon",
      description: "Irresistível combinação",
      ingredients: ["Batata frita", "Cheddar cremoso", "Bacon picado"],
      allergens: ["Lactose"],
      extras,
      price: "22.90",
      image: "/images/fries.jpg",
      badge: "PROMOÇÃO",
      available: true,
      order: 2,
    },
    {
      categoryId: catSides.id,
      name: "Onion Rings",
      description: "Anéis de cebola empanados crocantes",
      ingredients: ["Cebola", "Farinha", "Temperos"],
      allergens: ["Glúten"],
      extras,
      price: "18.90",
      image: "/images/fries.jpg",
      available: true,
      order: 3,
    },
    {
      categoryId: catSides.id,
      name: "Nuggets 10 unidades",
      description: "Nuggets crocantes de frango",
      ingredients: ["Frango", "Farinha", "Temperos"],
      allergens: ["Glúten"],
      extras: [{ name: "Mais 10 unidades", price: 10 }],
      price: "19.90",
      image: "/images/fries.jpg",
      available: true,
      order: 4,
    },
    // Bebidas
    {
      categoryId: catDrinks.id,
      name: "Coca-Cola Lata",
      description: "Refrigerante gelado 350ml",
      ingredients: ["Coca-Cola 350ml"],
      allergens: [],
      extras: [{ name: "600ml", price: 3 }, { name: "2L", price: 8 }],
      price: "6.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 1,
    },
    {
      categoryId: catDrinks.id,
      name: "Suco Natural",
      description: "Laranja, maracujá, limão ou abacaxi",
      ingredients: ["Fruta natural", "Água", "Açúcar"],
      allergens: [],
      extras,
      price: "8.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 2,
    },
    {
      categoryId: catDrinks.id,
      name: "Milkshake",
      description: "Chocolate, morango, ovomaltine ou baunilha",
      ingredients: ["Sorvete", "Leite", "Sabor escolhido"],
      allergens: ["Lactose"],
      extras,
      price: "14.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 3,
    },
    {
      categoryId: catDrinks.id,
      name: "Água Mineral",
      description: "Com ou sem gás - 500ml",
      ingredients: ["Água mineral"],
      allergens: [],
      extras: [{ name: "Com gás", price: 0 }],
      price: "4.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 4,
    },
    // Sobremesas
    {
      categoryId: catDesserts.id,
      name: "Petit Gateau com Sorvete",
      description: "Bolo quente com sorvete cremoso",
      ingredients: ["Bolo de chocolate", "Sorvete de creme", "Calda"],
      allergens: ["Glúten", "Lactose", "Ovo"],
      extras,
      price: "18.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 1,
    },
    {
      categoryId: catDesserts.id,
      name: "Brownie com Sorvete",
      description: "Brownie de chocolate quente com sorvete",
      ingredients: ["Brownie", "Sorvete de creme", "Calda de chocolate"],
      allergens: ["Glúten", "Lactose", "Ovo"],
      extras,
      price: "16.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 2,
    },
    {
      categoryId: catDesserts.id,
      name: "Açaí 500ml",
      description: "Açaí cremoso com complementos",
      ingredients: ["Açaí", "Granola", "Banana", "Leite condensado"],
      allergens: ["Lactose"],
      extras: [{ name: "Leite Ninho", price: 3 }, { name: "Morango", price: 4 }, { name: "Paçoca", price: 2 }],
      price: "19.90",
      image: "/images/hero-burger.jpg",
      available: true,
      order: 3,
    },
  ]);

  console.log("✅ Produtos criados");

  // Cupons
  await db.insert(coupons).values([
    { code: "BEMVINDO10", type: "percent", value: "10", minOrder: "50", active: true },
    { code: "SARON15", type: "percent", value: "15", minOrder: "80", active: true },
    { code: "FRETEGRATIS", type: "fixed", value: "5", minOrder: "0", active: true },
  ]);

  console.log("✅ Cupons criados");

  // Configurações do site
  await db.insert(siteSettings).values([
    { key: "site_name", value: "SARON BURGUER", type: "text" },
    { key: "site_slogan", value: "O sabor que você merece!", type: "text" },
    { key: "phone", value: "(11) 99999-9999", type: "text" },
    { key: "whatsapp", value: "5511999999999", type: "text" },
    { key: "address", value: "Rua dos Hambúrgueres, 123 - Centro", type: "text" },
    { key: "neighborhood", value: "Centro", type: "text" },
    { key: "city", value: "São Paulo - SP", type: "text" },
    { key: "opening_hours", value: "Seg-Dom: 18h às 00h", type: "text" },
    { key: "delivery_fee", value: "5", type: "text" },
    { key: "instagram", value: "https://instagram.com/saronburguer", type: "text" },
    { key: "facebook", value: "https://facebook.com/saronburguer", type: "text" },
    { key: "tiktok", value: "https://tiktok.com/@saronburguer", type: "text" },
    { key: "hero_title", value: "SARON BURGUER", type: "text" },
    { key: "hero_subtitle", value: "O sabor que você merece!", type: "text" },
    { key: "hero_image", value: "/images/hero-burger.jpg", type: "image" },
    { key: "about_title", value: "Nossa História", type: "text" },
    { key: "about_text", value: "A SARON BURGUER nasceu da paixão por hambúrgueres artesanais de qualidade. Desde 2020, oferecemos o melhor da hamburgueria gourmet com ingredientes frescos e selecionados, preparados com carinho para você.", type: "text" },
    { key: "stats_burgers", value: "5000", type: "text" },
    { key: "stats_clients", value: "2000", type: "text" },
    { key: "stats_orders", value: "8000", type: "text" },
    { key: "stats_years", value: "5", type: "text" },
  ]);

  console.log("✅ Configurações do site criadas");

  // Depoimentos
  await db.insert(testimonials).values([
    { name: "Carlos Silva", rating: 5, message: "Melhor hambúrguer da cidade! Atendimento impecável e sabor incrível.", active: true },
    { name: "Ana Paula", rating: 5, message: "O Smash Burguer é sensacional! Virei cliente fiel.", active: true },
    { name: "João Pedro", rating: 5, message: "Entrega rápida e produto excelente. Super recomendo!", active: true },
    { name: "Mariana Costa", rating: 4, message: "Adorei a qualidade dos ingredientes. Voltarei sempre!", active: true },
  ]);

  console.log("✅ Depoimentos criados");
  console.log("🎉 Seed concluído!");
}

seed().catch(console.error);
