/**
 * Registry global de clientes SSE (Server-Sent Events).
 * Centralizado aqui para não conflitar com as exports das route files do Next.js.
 */

const g = globalThis as typeof globalThis & {
  __saronSseClients?: Set<ReadableStreamDefaultController>;
};

if (!g.__saronSseClients) {
  g.__saronSseClients = new Set();
}

export const sseClients: Set<ReadableStreamDefaultController> =
  g.__saronSseClients;

/** Emite um evento para todos os admins/clientes conectados via SSE */
export function broadcastToClients(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const ctrl of sseClients) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      sseClients.delete(ctrl);
    }
  }
}
