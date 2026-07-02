import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Extras comuns
const burgerExtras = [
  { name: "Hambúrguer", price: 6 },
  { name: "Ovo", price: 5 },
  { name: "Salsicha", price: 4 },
  { name: "Bacon", price: 8 },
  { name: "Calabresa", price: 7 },
  { name: "Anel de cebola", price: 7 },
  { name: "Hambúrguer artesanal", price: 10 },
  { name: "Queijo coalho", price: 5 },
];

const hotdogExtras = [
  { name: "Hambúrguer", price: 6 },
  { name: "Ovo", price: 5 },
  { name: "Salsicha", price: 4 },
  { name: "Bacon", price: 8 },
  { name: "Calabresa", price: 7 },
];

const acaiComplementos = [
  "Gotas de chocolate", "Amendoim", "M&M", "Chocobool", "Farinha láctea",
  "Leite em pó", "Ovomaltine", "Cereal", "Granola", "Castanha", "Jujuba", "Paçoca",
  "Banana", "Uva", "Maçã", "Morango", "Kiwi",
  "Chocotella", "Choconinho",
  "Calda de morango", "Calda de leite condensado", "Calda de chocolate", "Calda de caramelo", "Calda de açaí",
].map((name) => ({ name, price: 0 }));

const milkshakeSabores = [
  { name: "Morango", price: 0 },
  { name: "Coco", price: 0 },
  { name: "Chocolate", price: 0 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== "saron") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🍔 Adicionando cardápio real da Saron Burguer...");

    // Limpa produtos e categorias existentes
    await db.delete(products);
    await db.delete(categories);

    // ===== CATEGORIAS =====
    const [
      catTradicionais,
      catEspeciais,
      catArtesanais,
      catPassaportesTrad,
      catPassaportesEsp,
      catBatatas,
      catBebidas,
      catAcaiGelados,
      catSobremesas,
    ] = await db
      .insert(categories)
      .values([
        { name: "Hambúrgueres Tradicionais", icon: "🍔", order: 1, description: "Os clássicos da casa" },
        { name: "Hambúrgueres Especiais", icon: "🍔", order: 2, description: "Com ovo e mais recheio" },
        { name: "Artesanais", icon: "🔥", order: 3, description: "Pão brioche, receitas exclusivas" },
        { name: "Passaportes Tradicionais", icon: "🌭", order: 4, description: "Hot dogs tradicionais" },
        { name: "Passaportes Especiais", icon: "🌭", order: 5, description: "Hot dogs recheados" },
        { name: "Batatas Fritas", icon: "🍟", order: 6, description: "Porções crocantes" },
        { name: "Bebidas", icon: "🥤", order: 7, description: "Refrigerantes e sucos" },
        { name: "Açaí & Gelados", icon: "🍨", order: 8, description: "Açaí, milkshake e sorvetes" },
        { name: "Sobremesas", icon: "🍮", order: 9, description: "Doces da casa" },
      ])
      .returning();

    // ===== 1. HAMBÚRGUERES TRADICIONAIS =====
    await db.insert(products).values([
      { categoryId: catTradicionais.id, name: "Queijo", description: "Pão assado, queijo", ingredients: ["Pão assado", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "6.00", image: "/images/bacon-burger.jpg", available: true, order: 1 },
      { categoryId: catTradicionais.id, name: "Misto", description: "Pão bola, queijo, presunto", ingredients: ["Pão bola", "Queijo", "Presunto"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "7.00", image: "/images/bacon-burger.jpg", available: true, order: 2 },
      { categoryId: catTradicionais.id, name: "Baurú", description: "Pão bola, queijo, presunto, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Salada"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "8.00", image: "/images/bacon-burger.jpg", available: true, order: 3 },
      { categoryId: catTradicionais.id, name: "Hambúrguer", description: "Pão bola, queijo, hambúrguer, salada", ingredients: ["Pão bola", "Queijo", "Hambúrguer", "Salada"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "10.00", image: "/images/bacon-burger.jpg", available: true, order: 4 },
      { categoryId: catTradicionais.id, name: "Americano", description: "Pão bola, queijo, presunto, ovo, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "12.00", image: "/images/bacon-burger.jpg", available: true, order: 5 },
      { categoryId: catTradicionais.id, name: "X-Búrguer", description: "Pão bola, queijo, presunto, hambúrguer", ingredients: ["Pão bola", "Queijo", "Presunto", "Hambúrguer"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "12.00", image: "/images/bacon-burger.jpg", available: true, order: 6 },
      { categoryId: catTradicionais.id, name: "Minuano", description: "Pão bola, queijo, presunto, hambúrguer, ovo, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Hambúrguer", "Ovo", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "14.00", image: "/images/bacon-burger.jpg", available: true, order: 7 },
      { categoryId: catTradicionais.id, name: "X-Carne Moída", description: "Pão bola, queijo, presunto, ovo, carne moída, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Carne moída", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "17.00", image: "/images/bacon-burger.jpg", available: true, order: 8 },
      { categoryId: catTradicionais.id, name: "X-Calabresa", description: "Pão bola, queijo, presunto, ovo, calabresa, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Calabresa", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "18.00", image: "/images/bacon-burger.jpg", available: true, order: 9 },
      { categoryId: catTradicionais.id, name: "X-Bacon", description: "Pão bola, queijo, presunto, ovo, bacon, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Bacon", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "18.00", image: "/images/bacon-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 10 },
      { categoryId: catTradicionais.id, name: "X-Frango", description: "Pão bola, queijo, presunto, ovo, frango em cubos, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Frango em cubos", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "18.00", image: "/images/bacon-burger.jpg", available: true, order: 11 },
      { categoryId: catTradicionais.id, name: "X-Misto", description: "Pão bola, queijo, presunto, ovo, carne moída, frango, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Carne moída", "Frango", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "20.00", image: "/images/bacon-burger.jpg", available: true, order: 12 },
      { categoryId: catTradicionais.id, name: "X-Alcatra", description: "Pão bola, queijo, presunto, ovo, alcatra, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Alcatra", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "21.00", image: "/images/bacon-burger.jpg", available: true, order: 13 },
      { categoryId: catTradicionais.id, name: "X-Cala-Frango", description: "Pão bola, queijo, presunto, ovo, frango, calabresa, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Frango", "Calabresa", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "22.00", image: "/images/bacon-burger.jpg", available: true, order: 14 },
      { categoryId: catTradicionais.id, name: "X-Fran-Bacon", description: "Pão bola, queijo, presunto, ovo, frango, bacon, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Frango", "Bacon", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "22.00", image: "/images/bacon-burger.jpg", available: true, order: 15 },
      { categoryId: catTradicionais.id, name: "X-Saron", description: "Pão bola, queijo, presunto, ovo, bacon, calabresa, salsicha, carne moída, frango, salada", ingredients: ["Pão bola", "Queijo", "Presunto", "Ovo", "Bacon", "Calabresa", "Salsicha", "Carne moída", "Frango", "Salada"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "25.00", image: "/images/bacon-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 16 },
    ]);

    // ===== 2. HAMBÚRGUERES ESPECIAIS =====
    await db.insert(products).values([
      { categoryId: catEspeciais.id, name: "X-Carne Moída Especial", description: "Pão bola, ovo, carne moída, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Ovo", "Carne moída", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "21.00", image: "/images/bacon-burger.jpg", available: true, order: 1 },
      { categoryId: catEspeciais.id, name: "X-Calabresa Especial", description: "Pão bola, ovo, calabresa, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Ovo", "Calabresa", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "22.00", image: "/images/bacon-burger.jpg", available: true, order: 2 },
      { categoryId: catEspeciais.id, name: "X-Bacon Especial", description: "Pão bola, ovo, bacon, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Ovo", "Bacon", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "22.00", image: "/images/bacon-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 3 },
      { categoryId: catEspeciais.id, name: "X-Frango Especial", description: "Pão bola, ovo, frango, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Ovo", "Frango", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "22.00", image: "/images/bacon-burger.jpg", available: true, order: 4 },
      { categoryId: catEspeciais.id, name: "X-Misto Especial", description: "Pão bola, carne moída, ovo, frango, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Carne moída", "Ovo", "Frango", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "23.00", image: "/images/bacon-burger.jpg", available: true, order: 5 },
      { categoryId: catEspeciais.id, name: "X-Alcatra Especial", description: "Pão bola, ovo, alcatra, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Ovo", "Alcatra", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "24.00", image: "/images/bacon-burger.jpg", available: true, order: 6 },
      { categoryId: catEspeciais.id, name: "X-Cala-Frango Especial", description: "Pão bola, frango, ovo, calabresa, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Frango", "Ovo", "Calabresa", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "26.00", image: "/images/bacon-burger.jpg", available: true, order: 7 },
      { categoryId: catEspeciais.id, name: "X-Fran-Bacon Especial", description: "Pão bola, frango, ovo, bacon, hambúrguer, tomate, presunto, queijo, alface", ingredients: ["Pão bola", "Frango", "Ovo", "Bacon", "Hambúrguer", "Tomate", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "26.00", image: "/images/bacon-burger.jpg", available: true, order: 8 },
      { categoryId: catEspeciais.id, name: "X-Saron Especial", description: "Pão bola, carne moída, calabresa, frango, bacon, ovo, tomate, hambúrguer, salsicha, presunto, queijo, alface", ingredients: ["Pão bola", "Carne moída", "Calabresa", "Frango", "Bacon", "Ovo", "Tomate", "Hambúrguer", "Salsicha", "Presunto", "Queijo", "Alface"], allergens: ["Glúten", "Lactose", "Ovo"], extras: burgerExtras, price: "30.00", image: "/images/bacon-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 9 },
    ]);

    // ===== 3. ARTESANAIS =====
    await db.insert(products).values([
      { categoryId: catArtesanais.id, name: "Acém", description: "Pão brioche, salada, molho especial, hambúrguer 130g, cebola caramelizada, queijo", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de acém 130g", "Cebola caramelizada", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "18.00", image: "/images/artesanal-burger.jpg", available: true, order: 1 },
      { categoryId: catArtesanais.id, name: "Costela", description: "Pão brioche, salada, molho especial, hambúrguer 130g, cebola caramelizada, queijo", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de costela 130g", "Cebola caramelizada", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "20.00", image: "/images/artesanal-burger.jpg", available: true, order: 2 },
      { categoryId: catArtesanais.id, name: "Alcatra", description: "Pão brioche, salada, molho especial, hambúrguer 130g, cebola caramelizada, queijo", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de alcatra 130g", "Cebola caramelizada", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "21.00", image: "/images/artesanal-burger.jpg", available: true, order: 3 },
      { categoryId: catArtesanais.id, name: "Picanha", description: "Pão brioche, salada, molho especial, hambúrguer 130g, cebola caramelizada, queijo", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de picanha 130g", "Cebola caramelizada", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "22.00", image: "/images/artesanal-burger.jpg", badge: "NOVO", available: true, order: 4 },
      { categoryId: catArtesanais.id, name: "Mais Bacon", description: "Pão brioche, salada, molho especial, hambúrguer 130g (costela), cebola caramelizada, bacon, queijo", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de costela 130g", "Cebola caramelizada", "Bacon", "Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "25.00", image: "/images/artesanal-burger.jpg", available: true, order: 5 },
      { categoryId: catArtesanais.id, name: "Saron Duplo", description: "Pão brioche, salada, molho especial, 2 hambúrguer 130g (acém), cebola caramelizada, 2 queijos", ingredients: ["Pão brioche", "Salada", "Molho especial", "2x Hambúrguer de acém 130g", "Cebola caramelizada", "2x Queijo"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "28.00", image: "/images/artesanal-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 6 },
      { categoryId: catArtesanais.id, name: "Gourmet Mais Queijo", description: "Pão brioche, salada, hambúrguer gourmet 150g, cebola caramelizada, queijo empanado, molho especial", ingredients: ["Pão brioche", "Salada", "Hambúrguer gourmet 150g", "Cebola caramelizada", "Queijo empanado", "Molho especial"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "30.00", image: "/images/artesanal-burger.jpg", available: true, order: 7 },
      { categoryId: catArtesanais.id, name: "X-Saron Burguer", description: "Pão brioche, salada, molho especial, 2 hambúrguer (costela e alcatra), bacon, cebola caramelizada, 2 queijos, anel de cebola", ingredients: ["Pão brioche", "Salada", "Molho especial", "Hambúrguer de costela", "Hambúrguer de alcatra", "Bacon", "Cebola caramelizada", "2x Queijo", "Anel de cebola"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "32.00", image: "/images/artesanal-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 8 },
      { categoryId: catArtesanais.id, name: "X-Big Saron Duplo (Abacaxi)", description: "Pão brioche, salada, hambúrguer, abacaxi caramelizado, hambúrguer, queijo, cebola caramelizada, molho especial, bacon, queijo cheddar", ingredients: ["Pão brioche", "Salada", "2x Hambúrguer", "Abacaxi caramelizado", "Queijo", "Cebola caramelizada", "Molho especial", "Bacon", "Queijo cheddar"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "38.00", image: "/images/artesanal-burger.jpg", badge: "NOVO", available: true, order: 9 },
      { categoryId: catArtesanais.id, name: "X-Big Saron Duplo (Banana)", description: "Pão brioche, salada, hambúrguer, banana caramelizada, hambúrguer, queijo, cebola caramelizada, molho especial, bacon, queijo cheddar", ingredients: ["Pão brioche", "Salada", "2x Hambúrguer", "Banana caramelizada", "Queijo", "Cebola caramelizada", "Molho especial", "Bacon", "Queijo cheddar"], allergens: ["Glúten", "Lactose"], extras: burgerExtras, price: "38.00", image: "/images/artesanal-burger.jpg", badge: "NOVO", available: true, order: 10 },
    ]);

    // ===== 4. PASSAPORTES TRADICIONAIS =====
    await db.insert(products).values([
      { categoryId: catPassaportesTrad.id, name: "Passa-Carne", description: "Pão seda, salsicha, carne moída, tomate, milho, ervilha, batata palha", ingredients: ["Pão seda", "Salsicha", "Carne moída", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "14.00", image: "/images/hot-dog.jpg", available: true, order: 1 },
      { categoryId: catPassaportesTrad.id, name: "Passa-Frango", description: "Pão seda, salsicha, frango, tomate, milho, ervilha, batata palha", ingredients: ["Pão seda", "Salsicha", "Frango", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "15.00", image: "/images/hot-dog.jpg", available: true, order: 2 },
      { categoryId: catPassaportesTrad.id, name: "Passa-Misto", description: "Pão seda, salsicha, frango, carne moída, tomate, milho, ervilha, batata palha", ingredients: ["Pão seda", "Salsicha", "Frango", "Carne moída", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "15.00", image: "/images/hot-dog.jpg", available: true, order: 3 },
      { categoryId: catPassaportesTrad.id, name: "Passa-Red Carne", description: "Pão sedão (28cm), 2 salsichas, carne moída, tomate, milho, ervilha, batata palha", ingredients: ["Pão sedão 28cm", "2x Salsicha", "Carne moída", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "19.00", image: "/images/hot-dog.jpg", badge: "MAIS VENDIDO", available: true, order: 4 },
      { categoryId: catPassaportesTrad.id, name: "Passa-Red Frango", description: "Pão sedão (28cm), 2 salsichas, frango, tomate, milho, ervilha, batata palha", ingredients: ["Pão sedão 28cm", "2x Salsicha", "Frango", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "20.00", image: "/images/hot-dog.jpg", available: true, order: 5 },
      { categoryId: catPassaportesTrad.id, name: "Passa-Red Misto", description: "Pão sedão (28cm), 2 salsichas, carne moída, frango, tomate, milho, ervilha, batata palha", ingredients: ["Pão sedão 28cm", "2x Salsicha", "Carne moída", "Frango", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "21.00", image: "/images/hot-dog.jpg", available: true, order: 6 },
    ]);

    // ===== 5. PASSAPORTES ESPECIAIS =====
    await db.insert(products).values([
      { categoryId: catPassaportesEsp.id, name: "Passa-Bacon", description: "Pão seda, salsicha, bacon, carne moída, tomate, batata palha, queijo ralado", ingredients: ["Pão seda", "Salsicha", "Bacon", "Carne moída", "Tomate", "Batata palha", "Queijo ralado"], allergens: ["Glúten", "Lactose"], extras: hotdogExtras, price: "16.00", image: "/images/hot-dog.jpg", available: true, order: 1 },
      { categoryId: catPassaportesEsp.id, name: "Especial Parmesão", description: "Pão seda, salsicha, carne moída, tomate, milho, ervilha, queijo parmesão desfiado", ingredients: ["Pão seda", "Salsicha", "Carne moída", "Tomate", "Milho", "Ervilha", "Queijo parmesão desfiado"], allergens: ["Glúten", "Lactose"], extras: hotdogExtras, price: "17.00", image: "/images/hot-dog.jpg", available: true, order: 2 },
      { categoryId: catPassaportesEsp.id, name: "Passa-Búrguer", description: "Pão seda, salsicha, carne moída, hambúrguer, tomate, milho, ervilha, batata palha", ingredients: ["Pão seda", "Salsicha", "Carne moída", "Hambúrguer", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten"], extras: hotdogExtras, price: "18.00", image: "/images/hot-dog.jpg", badge: "MAIS VENDIDO", available: true, order: 3 },
      { categoryId: catPassaportesEsp.id, name: "Especial Coalho", description: "Pão seda, salsicha, carne moída, tomate, milho, ervilha, batata palha, queijo coalho", ingredients: ["Pão seda", "Salsicha", "Carne moída", "Tomate", "Milho", "Ervilha", "Batata palha", "Queijo coalho"], allergens: ["Glúten", "Lactose"], extras: hotdogExtras, price: "18.00", image: "/images/hot-dog.jpg", available: true, order: 4 },
      { categoryId: catPassaportesEsp.id, name: "Especial Carne de Sol", description: "Pão seda, salsicha, carne de sol, tomate, milho, ervilha, batata palha, queijo coalho", ingredients: ["Pão seda", "Salsicha", "Carne de sol", "Tomate", "Milho", "Ervilha", "Batata palha", "Queijo coalho"], allergens: ["Glúten", "Lactose"], extras: hotdogExtras, price: "18.00", image: "/images/hot-dog.jpg", available: true, order: 5 },
      { categoryId: catPassaportesEsp.id, name: "Passa-Red Tudo", description: "Pão sedão (28cm), 2 salsichas, carne moída, frango, calabresa, bacon, hambúrguer, tomate, milho, ervilha, batata palha", ingredients: ["Pão sedão 28cm", "2x Salsicha", "Carne moída", "Frango", "Calabresa", "Bacon", "Hambúrguer", "Tomate", "Milho", "Ervilha", "Batata palha"], allergens: ["Glúten", "Lactose"], extras: hotdogExtras, price: "32.00", image: "/images/hot-dog.jpg", badge: "MAIS VENDIDO", available: true, order: 6 },
    ]);

    // ===== 6. BATATAS FRITAS =====
    await db.insert(products).values([
      { categoryId: catBatatas.id, name: "Batata Tradicional 250g", description: "Porção de batatas fatiadas, queijo ralado, ketchup", ingredients: ["Batata fatiada 250g", "Queijo ralado", "Ketchup"], allergens: ["Lactose"], extras: [], price: "10.00", image: "/images/fries.jpg", available: true, order: 1 },
      { categoryId: catBatatas.id, name: "Batata Especial 270g", description: "Porção de batatas fatiadas, cheddar, catupiry, ketchup", ingredients: ["Batata fatiada 270g", "Cheddar", "Catupiry", "Ketchup"], allergens: ["Lactose"], extras: [], price: "12.00", image: "/images/fries.jpg", badge: "MAIS VENDIDO", available: true, order: 2 },
      { categoryId: catBatatas.id, name: "Batata Especial com Adicional 280g", description: "Porção de batatas fatiadas, cheddar, catupiry, ketchup, adicional (bacon, calabresa ou alcatra)", ingredients: ["Batata fatiada 280g", "Cheddar", "Catupiry", "Ketchup"], allergens: ["Lactose"], extras: [{ name: "Adicional Bacon", price: 0 }, { name: "Adicional Calabresa", price: 0 }, { name: "Adicional Alcatra", price: 0 }], price: "15.00", image: "/images/fries.jpg", available: true, order: 3 },
      { categoryId: catBatatas.id, name: "Batata Especial da Casa 300g", description: "Porção de batatas fatiadas, cheddar, catupiry, ketchup, adicional (bacon, calabresa ou alcatra), cebola, tomate, alface", ingredients: ["Batata fatiada 300g", "Cheddar", "Catupiry", "Ketchup", "Cebola", "Tomate", "Alface"], allergens: ["Lactose"], extras: [{ name: "Adicional Bacon", price: 0 }, { name: "Adicional Calabresa", price: 0 }, { name: "Adicional Alcatra", price: 0 }], price: "19.99", image: "/images/fries.jpg", badge: "PROMOÇÃO", available: true, order: 4 },
    ]);

    // ===== 7. BEBIDAS =====
    await db.insert(products).values([
      { categoryId: catBebidas.id, name: "Pepsi Pet 1L", description: "Refrigerante gelado", ingredients: ["Pepsi 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 1 },
      { categoryId: catBebidas.id, name: "Guaraná Pet 1L", description: "Refrigerante gelado", ingredients: ["Guaraná 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 2 },
      { categoryId: catBebidas.id, name: "Coca-Cola Lata 350ml", description: "Refrigerante gelado", ingredients: ["Coca-Cola 350ml"], allergens: [], extras: [], price: "7.00", image: "/images/hero-burger.jpg", badge: "MAIS VENDIDO", available: true, order: 3 },
      { categoryId: catBebidas.id, name: "Guaraná Lata 350ml", description: "Refrigerante gelado", ingredients: ["Guaraná 350ml"], allergens: [], extras: [], price: "7.00", image: "/images/hero-burger.jpg", available: true, order: 4 },
      { categoryId: catBebidas.id, name: "Fanta Lata", description: "Refrigerante gelado", ingredients: ["Fanta 350ml"], allergens: [], extras: [], price: "7.00", image: "/images/hero-burger.jpg", available: true, order: 5 },
      { categoryId: catBebidas.id, name: "Coca Pet 2L", description: "Refrigerante gelado", ingredients: ["Coca-Cola 2L"], allergens: [], extras: [], price: "14.00", image: "/images/hero-burger.jpg", available: true, order: 6 },
      { categoryId: catBebidas.id, name: "Guaraná Pet 2L", description: "Refrigerante gelado", ingredients: ["Guaraná 2L"], allergens: [], extras: [], price: "13.00", image: "/images/hero-burger.jpg", available: true, order: 7 },
      { categoryId: catBebidas.id, name: "Fanta Pet 2L", description: "Refrigerante gelado", ingredients: ["Fanta 2L"], allergens: [], extras: [], price: "13.00", image: "/images/hero-burger.jpg", available: true, order: 8 },
      { categoryId: catBebidas.id, name: "Coca-Cola 1L", description: "Refrigerante gelado", ingredients: ["Coca-Cola 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 9 },
      { categoryId: catBebidas.id, name: "Pepsi Lata", description: "Refrigerante gelado", ingredients: ["Pepsi 350ml"], allergens: [], extras: [], price: "7.00", image: "/images/hero-burger.jpg", available: true, order: 10 },
      { categoryId: catBebidas.id, name: "Coca Ks 1L", description: "Refrigerante gelado", ingredients: ["Coca-Cola KS 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 11 },
      { categoryId: catBebidas.id, name: "Fanta Ks 1L", description: "Refrigerante gelado", ingredients: ["Fanta KS 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 12 },
      { categoryId: catBebidas.id, name: "Kuat Ks 1L", description: "Refrigerante gelado", ingredients: ["Kuat KS 1L"], allergens: [], extras: [], price: "10.00", image: "/images/hero-burger.jpg", available: true, order: 13 },
      { categoryId: catBebidas.id, name: "Suco Jarra 1L", description: "Sabores: manga, acerola, goiaba, abacaxi, laranja, graviola. Sem leite.", ingredients: ["Suco natural 1L"], allergens: [], extras: [{ name: "Com leite", price: 2 }], price: "12.00", image: "/images/hero-burger.jpg", available: true, order: 14 },
      { categoryId: catBebidas.id, name: "Suco Copo 300ml", description: "Sabores: manga, acerola, goiaba, abacaxi, laranja, graviola. Sem leite.", ingredients: ["Suco natural 300ml"], allergens: [], extras: [{ name: "Com leite", price: 2 }], price: "7.00", image: "/images/hero-burger.jpg", available: true, order: 15 },
    ]);

    // ===== 8. AÇAÍ & GELADOS =====
    await db.insert(products).values([
      { categoryId: catAcaiGelados.id, name: "Açaí 300ml", description: "Açaí cremoso, escolha seus complementos!", ingredients: ["Açaí batido 300ml"], allergens: [], extras: acaiComplementos, price: "13.00", image: "/images/acai-cup.jpg", badge: "MAIS VENDIDO", available: true, order: 1 },
      { categoryId: catAcaiGelados.id, name: "Açaí 400ml", description: "Açaí cremoso, escolha seus complementos!", ingredients: ["Açaí batido 400ml"], allergens: [], extras: acaiComplementos, price: "15.00", image: "/images/acai-cup.jpg", available: true, order: 2 },
      { categoryId: catAcaiGelados.id, name: "Açaí 500ml", description: "Açaí cremoso, escolha seus complementos!", ingredients: ["Açaí batido 500ml"], allergens: [], extras: acaiComplementos, price: "17.00", image: "/images/acai-cup.jpg", available: true, order: 3 },
      { categoryId: catAcaiGelados.id, name: "Açaí Mix 300ml", description: "Açaí misturado com sorvete, escolha seus complementos!", ingredients: ["Açaí batido 300ml", "Sorvete"], allergens: ["Lactose"], extras: acaiComplementos, price: "13.00", image: "/images/acai-cup.jpg", available: true, order: 4 },
      { categoryId: catAcaiGelados.id, name: "Açaí Mix 400ml", description: "Açaí misturado com sorvete, escolha seus complementos!", ingredients: ["Açaí batido 400ml", "Sorvete"], allergens: ["Lactose"], extras: acaiComplementos, price: "15.00", image: "/images/acai-cup.jpg", available: true, order: 5 },
      { categoryId: catAcaiGelados.id, name: "Açaí Mix 500ml", description: "Açaí misturado com sorvete, escolha seus complementos!", ingredients: ["Açaí batido 500ml", "Sorvete"], allergens: ["Lactose"], extras: acaiComplementos, price: "17.00", image: "/images/acai-cup.jpg", available: true, order: 6 },
      { categoryId: catAcaiGelados.id, name: "Milkshake 300ml", description: "Milkshake cremoso - escolha o sabor", ingredients: ["Sorvete", "Leite"], allergens: ["Lactose"], extras: milkshakeSabores, price: "13.00", image: "/images/milkshake-cup.jpg", available: true, order: 7 },
      { categoryId: catAcaiGelados.id, name: "Milkshake 400ml", description: "Milkshake cremoso - escolha o sabor", ingredients: ["Sorvete", "Leite"], allergens: ["Lactose"], extras: milkshakeSabores, price: "15.00", image: "/images/milkshake-cup.jpg", available: true, order: 8 },
      { categoryId: catAcaiGelados.id, name: "Milkshake 500ml", description: "Milkshake cremoso - escolha o sabor", ingredients: ["Sorvete", "Leite"], allergens: ["Lactose"], extras: milkshakeSabores, price: "17.00", image: "/images/milkshake-cup.jpg", badge: "MAIS VENDIDO", available: true, order: 9 },
      { categoryId: catAcaiGelados.id, name: "Sorvete 300ml", description: "Sorvete cremoso no copo", ingredients: ["Sorvete 300ml"], allergens: ["Lactose"], extras: [], price: "10.00", image: "/images/milkshake-cup.jpg", available: true, order: 10 },
      { categoryId: catAcaiGelados.id, name: "Sorvete 400ml", description: "Sorvete cremoso no copo", ingredients: ["Sorvete 400ml"], allergens: ["Lactose"], extras: [], price: "12.00", image: "/images/milkshake-cup.jpg", available: true, order: 11 },
      { categoryId: catAcaiGelados.id, name: "Sorvete 500ml", description: "Sorvete cremoso no copo", ingredients: ["Sorvete 500ml"], allergens: ["Lactose"], extras: [], price: "15.00", image: "/images/milkshake-cup.jpg", available: true, order: 12 },
    ]);

    // ===== 9. SOBREMESAS =====
    await db.insert(products).values([
      { categoryId: catSobremesas.id, name: "Pudim", description: "Pudim de leite condensado tradicional", ingredients: ["Leite condensado", "Ovos", "Açúcar"], allergens: ["Lactose", "Ovo"], extras: [], price: "6.00", image: "/images/milkshake-cup.jpg", available: true, order: 1 },
      { categoryId: catSobremesas.id, name: "Mousse", description: "Sabores: limão ou maracujá", ingredients: ["Creme de leite", "Leite condensado"], allergens: ["Lactose"], extras: [{ name: "Limão", price: 0 }, { name: "Maracujá", price: 0 }], price: "7.00", image: "/images/milkshake-cup.jpg", available: true, order: 2 },
      { categoryId: catSobremesas.id, name: "Tortilete", description: "Docinho crocante", ingredients: ["Massa crocante", "Recheio doce"], allergens: ["Glúten", "Lactose"], extras: [], price: "2.50", image: "/images/milkshake-cup.jpg", available: true, order: 3 },
    ]);

    const totalProducts = await db.select().from(products);

    return NextResponse.json({
      success: true,
      message: `✅ Cardápio real adicionado! ${totalProducts.length} produtos em 9 categorias.`,
    });
  } catch (error: any) {
    console.error("Erro ao popular cardápio:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
