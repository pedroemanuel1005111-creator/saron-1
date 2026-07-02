import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, today));

    const totalRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const pendingOrders = todayOrders.filter(
      (o) => o.status === "recebido" || o.status === "preparando"
    );

    // Últimos 7 dias
    const last7Days: { date: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await db
        .select()
        .from(orders)
        .where(and(gte(orders.createdAt, date), sql`${orders.createdAt} < ${nextDate}`));

      const dayTotal = dayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      last7Days.push({
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: dayTotal,
        count: dayOrders.length,
      });
    }

    // Produtos mais vendidos
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
    const productCount: Record<string, number> = {};
    allOrders.forEach((order) => {
      const items = order.items as any[];
      items?.forEach((item) => {
        productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);

    return NextResponse.json({
      success: true,
      data: {
        todayOrders: todayOrders.length,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        last7Days,
        topProducts,
        allTimeOrders: totalOrders[0]?.count || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
