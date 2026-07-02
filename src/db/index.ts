import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

/**
 * Configuração segura para ambientes serverless (Vercel).
 *
 * Em serverless cada instância de função pode criar sua própria pool de
 * conexões. Usar um `max` alto (padrão do node-postgres é 10) multiplicado
 * por várias instâncias pode facilmente estourar o limite de conexões do
 * Postgres (especialmente em planos gratuitos como Neon free tier).
 *
 * Recomendações:
 *  - Use a connection string "pooled" do Neon (contém "-pooler" no host),
 *    que usa PgBouncer no lado do banco para lidar com muitas conexões.
 *  - Mantenha `max` baixo aqui, pois o pooling real é feito pelo Neon/PgBouncer.
 */
export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

// Cacheia a pool no globalThis para reaproveitar conexões entre "warm invocations"
// da mesma instância de função (tanto em dev quanto em produção serverless).
globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);
