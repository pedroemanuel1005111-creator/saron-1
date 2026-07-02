import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serve arquivos gravados em /tmp/uploads (usado apenas no runtime da Vercel).
 *
 * ⚠️ IMPORTANTE: o diretório /tmp na Vercel é efêmero e local a cada instância
 * de função. Isso funciona apenas como "melhor esforço" (ex: a mesma instância
 * atendeu o upload e a visualização logo em seguida). Não há garantia de que
 * o arquivo ainda exista em requisições futuras ou em outra instância.
 *
 * Para produção real, use uma URL externa (Cloudinary, S3, Imgur, Bunny.net)
 * em vez de depender deste endpoint.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name || name.includes("..") || name.includes("/")) {
      return NextResponse.json({ error: "Nome de arquivo inválido" }, { status: 400 });
    }

    const filePath = path.join("/tmp/uploads", name);
    const buffer = await readFile(filePath);

    const ext = name.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    };

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Arquivo não encontrado. Em produção na Vercel, arquivos temporários podem expirar — use URL externa para uploads permanentes.",
      },
      { status: 404 }
    );
  }
}
