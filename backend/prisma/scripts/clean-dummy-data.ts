import "dotenv/config";
import { prisma } from "../../src/common/prisma.js";

async function cleanDummyData() {
  try {
    console.log("Starting dummy data cleanup...\n");

    // 1. Clear leaf/dependent records
    console.log("Clearing transactions, payments, and logs...");
    await prisma.walletTransaction.deleteMany();
    await prisma.payoutRequest.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.rideLocation.deleteMany();
    await prisma.rideEvent.deleteMany();
    await prisma.deliveryStop.deleteMany();
    await prisma.assignmentAuditLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.supportTicketMessage.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.adminNote.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.referral.deleteMany();
    await prisma.promoRedemption.deleteMany();
    await prisma.userDevice.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.riderOnlineLog.deleteMany();
    await prisma.riderPayoutAccount.deleteMany();
    await prisma.riderDocument.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.savedPaymentMethod.deleteMany();
    await prisma.savedPlace.deleteMany();
    await prisma.emergencyContact.deleteMany();
    await prisma.goPointRedemption.deleteMany();
    await prisma.goPointLedger.deleteMany();
    await prisma.goPointBalance.deleteMany();
    console.log("  ✓ Logs and transactions cleared.");

    // 2. Clear Trips and Deliveries
    console.log("Clearing rides and deliveries...");
    const delRes = await prisma.deliveryRequest.deleteMany();
    const rideRes = await prisma.ride.deleteMany();
    console.log(`  ✓ Cleared ${delRes.count} deliveries and ${rideRes.count} rides.`);

    // 3. Find dummy users
    const allUsers = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, phoneE164: true, role: true }
    });

    const dummyUsers = allUsers.filter(
      (u) =>
        u.phoneE164.startsWith("+233555") ||
        u.fullName.toLowerCase().includes("test") ||
        u.fullName.toLowerCase().includes("kwame") ||
        u.fullName.toLowerCase().includes("ama") ||
        u.fullName.toLowerCase().includes("you me")
    );

    console.log(`\nFound ${dummyUsers.length} dummy users:`);
    for (const u of dummyUsers) {
      console.log(`  - [${u.role}] ${u.fullName} (${u.phoneE164 || u.email})`);
    }

    if (dummyUsers.length > 0) {
      const dummyUserIds = dummyUsers.map((u) => u.id);

      await prisma.passengerProfile.deleteMany({ where: { userId: { in: dummyUserIds } } });
      await prisma.riderProfile.deleteMany({ where: { userId: { in: dummyUserIds } } });
      await prisma.dispatcherProfile.deleteMany({ where: { userId: { in: dummyUserIds } } });
      await prisma.wallet.deleteMany({ where: { userId: { in: dummyUserIds } } });

      const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: dummyUserIds } }
      });
      console.log(`  ✓ Deleted ${deletedUsers.count} dummy users.`);
    }

    // 4. List remaining users
    const remainingUsers = await prisma.user.findMany({
      select: { id: true, role: true, fullName: true, email: true, phoneE164: true, createdAt: true },
      orderBy: { createdAt: "asc" }
    });

    console.log(`\n========================================`);
    console.log(`Remaining Users in Database (${remainingUsers.length}):`);
    console.log(`========================================`);
    for (const u of remainingUsers) {
      console.log(`- [${u.role}] ${u.fullName} | Email: ${u.email} | Phone: ${u.phoneE164} | ID: ${u.id}`);
    }

    console.log("\nDummy data removal successfully completed!");
  } finally {
    await prisma.$disconnect();
  }
}

cleanDummyData().catch(async (err) => {
  console.error("Cleanup failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
