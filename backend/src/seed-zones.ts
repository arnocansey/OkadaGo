import "dotenv/config";
import { prisma } from "./common/prisma.js";

async function seedServiceZones() {
  console.log("Seeding Ghanaian Service Zones...");

  const zones = [
    {
      name: "Accra Central & Greater Accra",
      city: "Accra",
      countryCode: "GH",
      currency: "GHS",
      isActive: true,
      ridesEnabled: true,
      deliveriesEnabled: true,
      baseFare: 5.0,
      perKmFee: 2.5,
      perMinuteFee: 0.3,
      minimumFare: 10.0,
      cancellationFee: 5.0,
      waitingFeePerMin: 0.5,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-0.35, 5.50],
            [-0.35, 5.75],
            [-0.05, 5.75],
            [-0.05, 5.50],
            [-0.35, 5.50]
          ]
        ]
      }
    },
    {
      name: "Kumasi Metro",
      city: "Kumasi",
      countryCode: "GH",
      currency: "GHS",
      isActive: true,
      ridesEnabled: true,
      deliveriesEnabled: true,
      baseFare: 4.5,
      perKmFee: 2.2,
      perMinuteFee: 0.25,
      minimumFare: 8.0,
      cancellationFee: 4.0,
      waitingFeePerMin: 0.4,
      polygonGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-1.70, 6.60],
            [-1.70, 6.80],
            [-1.50, 6.80],
            [-1.50, 6.60],
            [-1.70, 6.60]
          ]
        ]
      }
    }
  ];

  for (const zone of zones) {
    const existing = await prisma.serviceZone.findFirst({
      where: { name: zone.name }
    });

    if (!existing) {
      const created = await prisma.serviceZone.create({
        data: zone as any
      });
      console.log(`Created service zone: ${created.name} (${created.id})`);
    } else {
      console.log(`Service zone already exists: ${existing.name} (${existing.id})`);
    }
  }

  // Update all existing riders to be assigned to the default Accra zone if they have none
  const defaultZone = await prisma.serviceZone.findFirst({ where: { isActive: true } });
  if (defaultZone) {
    const updated = await prisma.riderProfile.updateMany({
      where: { serviceZoneId: null },
      data: { serviceZoneId: defaultZone.id }
    });
    console.log(`Assigned default zone to ${updated.count} riders.`);
  }

  console.log("Service zones seeded successfully!");
}

seedServiceZones().catch(console.error).finally(() => process.exit(0));
