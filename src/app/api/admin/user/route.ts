import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin não encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: { id: admin.id, username: admin.username, name: admin.name, email: admin.email || "" }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
