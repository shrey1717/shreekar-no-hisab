import { db } from "../src/db/client";

async function resetLocalDatabase(): Promise<void> {
  if (process.env.RESET_LOCAL_DATABASE !== "yes") {
    throw new Error(
      "Refusing to reset the database. Set RESET_LOCAL_DATABASE=yes to continue.",
    );
  }

  const client = await db.connect();
  try {
    const result = await client.query<{ table_name: string }>(
      `SELECT tablename AS table_name
       FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename <> 'schema_migrations'`,
    );
    const tables = result.rows
      .map(({ table_name }) => `"${table_name.replaceAll('"', '""')}"`)
      .join(", ");

    if (tables) {
      await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
    }

    console.log("Local application data reset successfully.");
  } finally {
    client.release();
    await db.end();
  }
}

resetLocalDatabase().catch((error: unknown) => {
  console.error("Local database reset failed:", error);
  process.exitCode = 1;
});
