import "dotenv/config";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "../common/prisma.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../../prisma/postgis-setup.sql");

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith("--"));
}

async function main() {
  const sql = readFileSync(sqlPath, "utf8");
  const statements = splitStatements(sql);

  console.log(`Running ${statements.length} PostGIS setup statement(s) against the configured database...`);

  for (const statement of statements) {
    const label = statement.split("\n")[0]?.slice(0, 80) ?? statement.slice(0, 80);
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`  ok: ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  failed: ${label}\n    ${message}`);
      throw error;
    }
  }

  const [{ postgis_version: postgisVersion }] = await prisma.$queryRawUnsafe<
    Array<{ postgis_version: string }>
  >("SELECT postgis_version() as postgis_version");

  console.log(`PostGIS is enabled (version ${postgisVersion}). Rider matching will use the fast geography path.`);
}

main()
  .catch((error: unknown) => {
    console.error(
      "PostGIS setup failed. The backend will continue to work using the in-memory Haversine matching fallback."
    );
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
