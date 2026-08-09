import "dotenv/config";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "../common/prisma.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../../prisma/postgis-setup.sql");

export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;

  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && !current.trim()) continue;

    if (line.includes("$$")) {
      const occurrences = (line.match(/\$\$/g) || []).length;
      if (occurrences % 2 !== 0) {
        inDollarQuote = !inDollarQuote;
      }
    }

    current += line + "\n";

    if (!inDollarQuote && trimmed.endsWith(";")) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = "";
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

export async function runPostgisSetup(): Promise<void> {
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

  const rows = await prisma.$queryRawUnsafe<Array<{ postgis_version: string }>>(
    "SELECT postgis_version() as postgis_version"
  );
  const postgisVersion = rows[0]?.postgis_version ?? "unknown";

  console.log(`PostGIS is enabled (version ${postgisVersion}). Rider matching will use the fast geography path.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runPostgisSetup()
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
}
