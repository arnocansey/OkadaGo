import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function inspect() {
  const client = await pool.connect();
  try {
    const { rows: users } = await client.query(
      `SELECT id, role, email, "phoneE164", "fullName", "createdAt" FROM "User" ORDER BY "createdAt" ASC`
    );
    console.log("Found", users.length, "users:");
    for (const u of users) {
      console.log(`- [${u.role}] ${u.fullName} | Email: ${u.email} | Phone: ${u.phoneE164} | ID: ${u.id}`);
    }

    const { rows: rides } = await client.query(`SELECT count(*) as count FROM "Ride"`);
    const { rows: deliveries } = await client.query(`SELECT count(*) as count FROM "DeliveryRequest"`);
    const { rows: zones } = await client.query(`SELECT id, name, city FROM "ServiceZone"`);

    console.log(`Rides count: ${rides[0].count}`);
    console.log(`Deliveries count: ${deliveries[0].count}`);
    console.log(`Service Zones count: ${zones.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);
