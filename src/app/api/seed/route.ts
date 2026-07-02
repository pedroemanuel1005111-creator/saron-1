import { db } from "@/db";
import { users, categories, products, siteSettings, coupons, testimonials } from "@/db/schema";
import { hashPassword } from "@/lib/utils";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  // Proteção simples - requer ?key=saron
  if (key !== "saron") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🌱 Seeding database...");

    // Verifica se já há admin
    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Banco já populado. Adicione ?force=true para recriar.",
      });
    }

    // Cria admin
    const adminPassword = await hashPassword("saron123");
    await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
    });

    // Categorias
    const [catClassic, catGourmet, catHotdog, catSides, catDrinks, catDesserts] = await db
      .insert(categories)
      .values([
        { name: "Hambúrgueres Clássicos", icon: "🍔", order: 1, description: "Os clássicos irresistíveis" },
        { name: "Especiais Gourmet", icon: "🔥", order: 2, description: "Sabores exclusivos" },
        { name: "Hot Dogs", icon: "🌭", order: 3, description: "Hot dogs recheados" },
        { name: "Porções & Acompanhamentos", icon: "🍟", order: 4, description: "Para acompanhar" },
        { name: "Bebidas", icon: "🥤", order: 5, description: "Refresque-se" },
        { name: "Sobremesas", icon: "🍰", order: 6, description: "Finalize com doçura" },
      ])
      .returning();

    const extras = [
      { name: "Queijo extra", price: 3.5 },
      { name: "Bacon extra", price: 5 },
      { name: "Ovo", price: 3 },
      { name: "Hambúrguer extra", price: 8 },
      { name: "Cheddar", price: 4 },
      { name: "Molho extra", price: 2 },
    ];

    await db.insert(products).values([
      { categoryId: catClassic.id, name: "X-Burguer", description: "O clássico que nunca falha", ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Alface", "Tomate", "Molho especial"], allergens: ["Glúten", "Lactose"], extras, price: "19.90", image: "/images/bacon-burger.jpg", available: true, order: 1 },
      { categoryId: catClassic.id, name: "X-Bacon", description: "Bacon crocante com queijo derretido", ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Bacon crocante", "Alface", "Tomate", "Molho"], allergens: ["Glúten", "Lactose"], extras, price: "25.90", image: "/images/bacon-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 2 },
      { categoryId: catClassic.id, name: "X-Tudo", description: "Para quem tem muita fome!", ingredients: ["Pão", "Hambúrguer 150g", "Queijo", "Bacon", "Ovo", "Presunto", "Alface", "Tomate", "Cebola", "Milho", "Molho"], allergens: ["Glúten", "Lactose", "Ovo"], extras, price: "29.90", image: "/images/bacon-burger.jpg", available: true, order: 3 },
      { categoryId: catGourmet.id, name: "Saron Smash Burguer", description: "Smash burger exclusivo com cheddar", ingredients: ["Pão brioche", "2x Smash 90g", "Cheddar derretido", "Cebola caramelizada", "Picles", "Molho Saron"], allergens: ["Glúten", "Lactose"], extras, price: "34.90", image: "/images/smash-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 1 },
      { categoryId: catGourmet.id, name: "Saron Double", description: "Dose dupla de sabor premium", ingredients: ["Pão brioche", "2x Hambúrguer 150g", "Dobro de queijo", "Bacon", "Molho especial"], allergens: ["Glúten", "Lactose"], extras, price: "39.90", image: "/images/smash-burger.jpg", badge: "NOVO", available: true, order: 2 },
      { categoryId: catGourmet.id, name: "Costela Burguer", description: "Costela desfiada no pão australiano", ingredients: ["Pão australiano", "Hambúrguer de costela 200g", "Queijo provolone", "Cebola crispy", "Molho BBQ"], allergens: ["Glúten", "Lactose"], extras, price: "42.90", image: "/images/smash-burger.jpg", available: true, order: 3 },
      { categoryId: catHotdog.id, name: "Hot Dog Completo", description: "Completo como você gosta", ingredients: ["Pão", "Salsicha", "Purê", "Vinagrete", "Milho", "Ervilha", "Batata palha", "Queijo", "Molhos"], allergens: ["Glúten", "Lactose"], extras, price: "19.90", image: "/images/hot-dog.jpg", available: true, order: 1 },
      { categoryId: catHotdog.id, name: "Hot Dog Especial Saron", description: "O hot dog da casa!", ingredients: ["Pão", "2 Salsichas", "Cheddar", "Bacon", "Cebola crispy", "Molho Saron"], allergens: ["Glúten", "Lactose"], extras, price: "24.90", image: "/images/hot-dog.jpg", badge: "MAIS VENDIDO", available: true, order: 2 },
      { categoryId: catSides.id, name: "Batata Frita Tradicional", description: "Crocante por fora, macia por dentro", ingredients: ["Batata frita", "Sal"], allergens: [], extras, price: "12.90", image: "/images/fries.jpg", available: true, order: 1 },
      { categoryId: catSides.id, name: "Batata com Cheddar e Bacon", description: "Irresistível combinação", ingredients: ["Batata frita", "Cheddar cremoso", "Bacon picado"], allergens: ["Lactose"], extras, price: "22.90", image: "/images/fries.jpg", badge: "PROMOÇÃO", available: true, order: 2 },
      { categoryId: catDrinks.id, name: "Coca-Cola Lata", description: "Refrigerante gelado 350ml", ingredients: ["Coca-Cola 350ml"], allergens: [], extras: [{ name: "600ml", price: 3 }, { name: "2L", price: 8 }], price: "6.90", image: "/images/hero-burger.jpg", available: true, order: 1 },
      { categoryId: catDrinks.id, name: "Milkshake", description: "Chocolate, morango ou baunilha", ingredients: ["Sorvete", "Leite", "Sabor escolhido"], allergens: ["Lactose"], extras, price: "14.90", image: "/images/hero-burger.jpg", available: true, order: 2 },
      { categoryId: catDesserts.id, name: "Petit Gateau com Sorvete", description: "Bolo quente com sorvete cremoso", ingredients: ["Bolo de chocolate", "Sorvete de creme", "Calda"], allergens: ["Glúten", "Lactose", "Ovo"], extras, price: "18.90", image: "/images/hero-burger.jpg", available: true, order: 1 },
      { categoryId: catDesserts.id, name: "Açaí 500ml", description: "Açaí cremoso com complementos", ingredients: ["Açaí", "Granola", "Banana", "Leite condensado"], allergens: ["Lactose"], extras: [{ name: "Leite Ninho", price: 3 }, { name: "Morango", price: 4 }], price: "19.90", image: "/images/hero-burger.jpg", available: true, order: 2 },
    ]);

    await db.insert(coupons).values([
      { code: "BEMVINDO10", type: "percent", value: "10", minOrder: "50", active: true },
      { code: "SARON15", type: "percent", value: "15", minOrder: "80", active: true },
    ]);

    await db.insert(siteSettings).values([
      { key: "site_name", value: "SARON BURGUER", type: "text" },
      { key: "site_slogan", value: "O sabor que você merece!", type: "text" },
      { key: "phone", value: "(11) 99999-9999", type: "text" },
      { key: "whatsapp", value: "5511999999999", type: "text" },
      { key: "address", value: "Rua dos Hambúrgueres, 123", type: "text" },
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
      { key: "about_text", value: "A SARON BURGUER nasceu da paixão por hambúrgueres artesanais de qualidade. Desde 2020, oferecemos o melhor da hamburgueria gourmet com ingredientes frescos e selecionados.", type: "text" },
      { key: "stats_burgers", value: "5000", type: "text" },
      { key: "stats_clients", value: "2000", type: "text" },
      { key: "stats_orders", value: "8000", type: "text" },
      { key: "stats_years", value: "5", type: "text" },
    ]);

    await db.insert(testimonials).values([
      { name: "Carlos Silva", rating: 5, message: "Melhor hambúrguer da cidade! Atendimento impecável.", active: true },
      { name: "Ana Paula", rating: 5, message: "O Smash Burguer é sensacional! Virei cliente fiel.", active: true },
      { name: "João Pedro", rating: 5, message: "Entrega rápida e produto excelente. Super recomendo!", active: true },
      { name: "Mariana Costa", rating: 4, message: "Adorei a qualidade dos ingredientes. Voltarei sempre!", active: true },
    ]);

    return NextResponse.json({ success: true, message: "✅ Banco populado com sucesso!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
