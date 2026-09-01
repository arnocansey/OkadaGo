import "dotenv/config";
import { prisma } from "../common/prisma.js";

async function seedAccra() {
  console.log("Seeding Accra Launch Service Zone & Linking Riders...");

  // 1. Upsert Accra Service Zone by name
  const accraZone = await prisma.serviceZone.upsert({
    where: { name: "Greater Accra Metropolitan Area" },
    update: {
      city: "Accra",
      countryCode: "GH",
      currency: "GHS",
      isActive: true,
      ridesEnabled: true,
      deliveriesEnabled: true,
      baseFare: 5.00,
      perKmFee: 2.50,
      perMinuteFee: 0.35,
      minimumFare: 8.00,
      cancellationFee: 5.00,
      waitingFeePerMin: 0.50,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-0.38, 5.48],
            [0.08, 5.48],
            [0.08, 5.82],
            [-0.38, 5.82],
            [-0.38, 5.48]
          ]
        ]
      }
    },
    create: {
      name: "Greater Accra Metropolitan Area",
      city: "Accra",
      countryCode: "GH",
      currency: "GHS",
      isActive: true,
      ridesEnabled: true,
      deliveriesEnabled: true,
      baseFare: 5.00,
      perKmFee: 2.50,
      perMinuteFee: 0.35,
      minimumFare: 8.00,
      cancellationFee: 5.00,
      waitingFeePerMin: 0.50,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-0.38, 5.48],
            [0.08, 5.48],
            [0.08, 5.82],
            [-0.38, 5.82],
            [-0.38, 5.48]
          ]
        ]
      }
    }
  });

  console.log(`Accra Service Zone configured: ${accraZone.name} - ID: ${accraZone.id}`);

  // 2. Link all active riders to Accra zone
  const updatedRiders = await prisma.riderProfile.updateMany({
    data: { serviceZoneId: accraZone.id }
  });
  console.log(`Linked ${updatedRiders.count} riders to Accra Service Zone.`);

  console.log("Accra launch seed complete!");
}

seedAccra()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
