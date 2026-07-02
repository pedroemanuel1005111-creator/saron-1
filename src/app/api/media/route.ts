import { db } from "@/db";
import { media } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Na Vercel o sistema de arquivos é efêmero — os arquivos gravados com
 * writeFile são perdidos entre deploys/funções.
 *
 * Esta rota aceita upload direto e salva em /tmp (OK para preview),
 * mas também aceita registrar uma URL externa diretamente via JSON
 * (recomendado para produção com Cloudinary, S3, etc.).
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const items = await db.select().from(media).orderBy(desc(media.createdAt));
    const filtered = category
      ? items.filter((item) => item.category === category)
      : items;
    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ── Modo 1: JSON com URL externa (Cloudinary, S3, Imgur, etc.) ──────────
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { url, filename, type, category } = body as {
        url: string;
        filename?: string;
        type?: string;
        category?: string;
      };

      if (!url) {
        return NextResponse.json(
          { success: false, error: "URL obrigatória" },
          { status: 400 }
        );
      }

      const [item] = await db
        .insert(media)
        .values({
          filename: filename || url.split("/").pop() || "upload",
          url,
          type: type || (url.match(/\.(mp4|webm|mov|avi)$/i) ? "video" : "image"),
          category: category || "gallery",
        })
        .returning();

      return NextResponse.json({ success: true, data: item });
    }

    // ── Modo 2: FormData com arquivo binário ─────────────────────────────────
    const formData = await req.formData();
    const category = (formData.get("category") as string) || "gallery";

    const filesFromMany = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const files = filesFromMany.length > 0
      ? filesFromMany.filter(Boolean)
      : singleFile ? [singleFile] : [];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Arquivo obrigatório" },
        { status: 400 }
      );
    }

    // Na Vercel: salva em /tmp (temporário — funciona para demonstração)
    // Para produção real, integre Cloudinary ou S3 aqui
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const isVercel = process.env.VERCEL === "1";
    const uploadDir = isVercel
      ? "/tmp/uploads"
      : path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const createdItems = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safeName}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      // URL pública: na Vercel /tmp não é servido — use URL externa
      const url = isVercel
        ? `/api/media/file?name=${filename}` // serve via API (veja abaixo)
        : `/uploads/${filename}`;

      const [item] = await db
        .insert(media)
        .values({
          filename,
          url,
          type: file.type.startsWith("video") ? "video" : "image",
          category,
        })
        .returning();

      createdItems.push(item);
    }

    return NextResponse.json({
      success: true,
      data: createdItems,
      message: `${createdItems.length} arquivo(s) enviado(s).`,
      note: process.env.VERCEL === "1"
        ? "⚠️ Na Vercel os uploads são temporários. Use URL externa (Cloudinary/Imgur) para persistência."
        : undefined,
    });
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
    await db.delete(media).where(eq(media.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
