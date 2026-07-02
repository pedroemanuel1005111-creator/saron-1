import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  try {
    if (code) {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code.toUpperCase()));

      if (!coupon || !coupon.active) {
        return NextResponse.json(
          { success: false, error: "Cupom inválido ou expirado" },
          { status: 404 }
        );
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { success: false, error: "Cupom expirado" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, data: coupon });
    }

    const items = await db.select().from(coupons);
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
    const [coupon] = await db.insert(coupons).values(body).returning();
    return NextResponse.json({ success: true, data: coupon });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
