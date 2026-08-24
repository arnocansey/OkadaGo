/**
 * Clears all database data EXCEPT the admin user and admin profile.
 *
 * Usage:  npx tsx prisma/scripts/clear-data.ts
 */

import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ordered so child rows are deleted before parent rows.
const DELETES: string[] = [
  // Tier 1 — leaf / standalone
  `DELETE FROM "AssignmentAuditLog"`,
  `DELETE FROM "AssignmentRule"`,
  `DELETE FROM "MessageTemplate"`,
  `DELETE FROM "GoPointRedemption"`,
  `DELETE FROM "GoPointLedger"`,
  `DELETE FROM "GoPointBalance"`,
  `DELETE FROM "GoPointRule"`,
  `DELETE FROM "OpsJobHeartbeat"`,
  `DELETE FROM "EscalationRule"`,
  `DELETE FROM "ScheduledBroadcast"`,
  `DELETE FROM "PlatformSetting"`,
  `DELETE FROM "PricingRule"`,
  `DELETE FROM "RiderOnlineLog"`,
  `DELETE FROM "RiderPayoutAccount"`,
  `DELETE FROM "RiderDocument"`,
  `DELETE FROM "Vehicle"`,
  `DELETE FROM "DispatcherProfile"`,
  `DELETE FROM "AdminNote"`,
  `DELETE FROM "SavedPaymentMethod"`,
  `DELETE FROM "SavedPlace"`,
  `DELETE FROM "EmergencyContact"`,
  `DELETE FROM "Notification"`,
  `DELETE FROM "Referral"`,
  `DELETE FROM "SupportTicketMessage"`,
  `DELETE FROM "SupportTicket"`,
  `DELETE FROM "Incident"`,
  `DELETE FROM "Review"`,
  `DELETE FROM "Rating"`,
  `DELETE FROM "PromoRedemption"`,
  `DELETE FROM "DeliveryStop"`,
  `DELETE FROM "DeliveryRequest"`,
  `DELETE FROM "RideLocation"`,
  `DELETE FROM "RideEvent"`,
  `DELETE FROM "WalletTransaction"`,
  `DELETE FROM "PayoutRequest"`,
  `DELETE FROM "Payment"`,
  `DELETE FROM "Wallet"`,
  `DELETE FROM "Ride"`,
  `DELETE FROM "PromoCode"`,
  `DELETE FROM "UserDevice"`,
  `DELETE FROM "AuditLog"`,
  `DELETE FROM "PassengerProfile"`,
  `DELETE FROM "RiderProfile"`,
  `DELETE FROM "ServiceZone"`,
  // User (root) — delete non-admin only
  // UserSession — clear admin sessions too so they must re-login
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("Finding admin user...");
    const { rows } = await client.query(
      `SELECT id, email, "fullName" FROM "User" WHERE role = 'ADMIN' AND "deletedAt" IS NULL LIMIT 1`
    );

    if (rows.length === 0) {
      console.error("No admin user found. Aborting.");
      process.exit(1);
    }

    const admin = rows[0];
    console.log(`Admin: ${admin.fullName} (${admin.email}) [${admin.id}]`);
    console.log("Clearing data...\n");

    for (const sql of DELETES) {
      const table = sql.match(/"(\w+)"/)?.[1] ?? "??";
      try {
        const result = await client.query(sql);
        console.log(`  ✓ ${table} — ${result.rowCount} rows`);
      } catch (err: any) {
        console.log(`  ⚠ ${table} — ${err.message?.slice(0, 100)}`);
      }
    }

    // Clear ALL user sessions
    const sessResult = await client.query(`DELETE FROM "UserSession"`);
    console.log(`  ✓ UserSession — ${sessResult.rowCount} rows`);

    // Delete non-admin AdminProfiles (references User)
    const adminProfileResult = await client.query(
      `DELETE FROM "AdminProfile" WHERE "userId" != $1`,
      [admin.id]
    );
    console.log(`  ✓ AdminProfile (non-admin) — ${adminProfileResult.rowCount} rows`);

    // Delete non-admin users last (no children remain)
    const userResult = await client.query(
      `DELETE FROM "User" WHERE id != $1`,
      [admin.id]
    );
    console.log(`  ✓ User (non-admin) — ${userResult.rowCount} rows`);

    console.log("\nDone. Admin credentials preserved.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
