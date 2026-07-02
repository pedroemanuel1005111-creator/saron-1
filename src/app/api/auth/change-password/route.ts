import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, currentPassword, newPassword, newEmail } = await req.json();

    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    if (currentPassword) {
      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ success: false, error: "Senha atual incorreta" }, { status: 401 });
      }
    }

    const updateData: any = {};

    if (newPassword && newPassword.length >= 4) {
      updateData.password = await hashPassword(newPassword);
    }

    if (newEmail !== undefined) {
      updateData.email = newEmail;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "Nada para atualizar" }, { status: 400 });
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: "Dados atualizados com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
