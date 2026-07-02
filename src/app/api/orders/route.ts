import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { broadcastToClients } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const id = searchParams.get("id");
  const orderNumber = searchParams.get("orderNumber");
  const since = searchParams.get("since");
  const newOrders = searchParams.get("new");

  try {
    if (id) {
      const [order] = await db.select().from(orders).where(eq(orders.id, parseInt(id)));
      return NextResponse.json({ success: true, data: order });
    }

    if (orderNumber) {
      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, parseInt(orderNumber)));
      return NextResponse.json({ success: true, data: order });
    }

    // Returns only new orders since last check
    if (newOrders && since) {
      const sinceDate = new Date(parseInt(since));
      const items = await db
        .select()
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, sinceDate),
            eq(orders.status, "recebido")
          )
        )
        .orderBy(desc(orders.createdAt));

      return NextResponse.json({ success: true, data: items });
    }

    const whereClause = status ? eq(orders.status, status) : undefined;
    let items;
    if (since) {
      items = await db
        .select()
        .from(orders)
        .where(gte(orders.createdAt, new Date(parseInt(since))))
        .orderBy(desc(orders.createdAt));
    } else {
      items = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(100);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Valida campos obrigatórios
    if (!body.customerName || !body.customerPhone || !body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Gera próximo número de pedido
    const lastOrder = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.orderNumber))
      .limit(1);

    const orderNumber = lastOrder.length > 0 ? lastOrder[0].orderNumber + 1 : 1001;

    // Garante que items é um array válido
    const items = Array.isArray(body.items) ? body.items : [];

    const [order] = await db
      .insert(orders)
      .values({
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        deliveryType: body.deliveryType || "delivery",
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        complement: body.complement || null,
        zipCode: body.zipCode || null,
        paymentMethod: body.paymentMethod,
        changeFor: body.changeFor || null,
        coupon: body.coupon || null,
        discount: body.discount || "0",
        deliveryFee: body.deliveryFee || "0",
        subtotal: body.subtotal || "0",
        total: body.total || "0",
        items: items,
        orderNumber,
        status: "recebido",
      })
      .returning();

    // 🔔 Push imediato para todos os admins conectados via SSE
    try {
      broadcastToClients("new_order", {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      });
    } catch {
      // Se não houver admins conectados, não faz nada
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
    }
    const [order] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    // 🔔 Push de atualização de status para todos (admin + cliente via SSE)
    try {
      broadcastToClients("order_updated", {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      });
    } catch {}

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
    }
    await db.delete(orders).where(eq(orders.id, id));
    return NextResponse.json({ success: true, message: "Pedido excluído" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
