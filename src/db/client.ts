import { loadEnvConfig } from "@next/env";
import { Pool, types } from "pg";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured before connecting to PostgreSQL.");
}

types.setTypeParser(1082, (value) => value);

export const db = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});