import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LiveLocationService,
  haversineDistanceKm,
} from "./location.service.js";
import { calculateBearingDegrees } from "../matching/matching.service.js";

describe("Real-time Live Location & Moving Motorcycle Telemetry Service", () => {
  const service = new LiveLocationService();

  describe("Haversine Distance & Bearing Calculations", () => {
    it("accurately calculates distance between Accra Central and Osu (~2.5km)", () => {
      // Accra Central (Tema Station) ~ 5.5451, -0.2012
      // Osu Oxford Street ~ 5.5568, -0.1824
      const dist = haversineDistanceKm(5.5451, -0.2012, 5.5568, -0.1824);
      assert.ok(dist > 2.0 && dist < 3.0, `Expected ~2.4km, got ${dist}`);
    });

    it("accurately calculates heading/bearing between two GPS coordinates", () => {
      // Heading directly East (lat constant, lon increases)
      const bearingEast = calculateBearingDegrees(5.6037, -0.1870, 5.6037, -0.1770);
      assert.ok(Math.abs(bearingEast - 90) < 1, `Expected ~90 deg, got ${bearingEast}`);

      // Heading directly North
      const bearingNorth = calculateBearingDegrees(5.6037, -0.1870, 5.6137, -0.1870);
      assert.ok(
        Math.abs(bearingNorth - 0) < 1 || Math.abs(bearingNorth - 360) < 1,
        `Expected ~0/360 deg, got ${bearingNorth}`
      );
    });
  });

  describe("Spatial Grid Indexing & Geofence Partitioning", () => {
    it("computes deterministic grid cell keys with 0.025 degree resolution (~2.78km)", () => {
      const cell1 = service.getGridKey(5.6037, -0.1870);
      const cell2 = service.getGridKey(5.6038, -0.1871);
      assert.equal(cell1, cell2, "Small movements within cell should yield identical key");

      const farCell = service.getGridKey(5.7500, -0.1000);
      assert.notEqual(cell1, farCell, "Far coordinates must be in distinct cells");
    });

    it("surrounding grid keys cover the 3x3 neighborhood", () => {
      const neighbors = service.getSurroundingGridKeys(5.6037, -0.1870, 3.0);
      assert.ok(neighbors.length >= 9, "Should cover at least 9 surrounding cells for 3km");
      const centerCell = service.getGridKey(5.6037, -0.1870);
      assert.ok(neighbors.includes(centerCell), "Center cell must be included in query");
    });
  });

  describe("Live Motorcycle Location Updates & Fleet Querying", () => {
    it("ingests rider location and correctly updates in-memory spatial index", async () => {
      const riderId = "rider-test-001";
      const result = await service.updateRiderLocation({
        riderId,
        latitude: 5.6037,
        longitude: -0.1870,
        speed: 28.5,
        heading: 85,
        status: "ONLINE",
      });

      assert.equal(result.live.riderId, riderId);
      assert.equal(result.live.speed, 28.5);
      assert.equal(result.live.heading, 85);
      assert.equal(result.live.status, "ONLINE");

      const stored = service.getRiderLocation(riderId);
      assert.ok(stored != null);
      assert.equal(stored.speed, 28.5);
    });

    it("discovers nearby online riders within radius and filters out far riders", async () => {
      // Rider 1 is at Circle (~1.5km from 5.5600, -0.2000)
      await service.updateRiderLocation({
        riderId: "rider-near",
        latitude: 5.5562,
        longitude: -0.2104,
        status: "ONLINE",
      });

      // Rider 2 is in Tema (~25km away)
      await service.updateRiderLocation({
        riderId: "rider-far",
        latitude: 5.6700,
        longitude: -0.0100,
        status: "ONLINE",
      });

      const nearby = service.getNearbyRiders(5.5600, -0.2000, 3.0);
      const riderIds = nearby.map((r) => r.riderId);

      assert.ok(riderIds.includes("rider-near"), "Nearby rider must be found");
      assert.ok(!riderIds.includes("rider-far"), "Far rider must NOT be included in 3km search");
    });

    it("does not expose busy or offline riders to passenger discovery", async () => {
      await service.updateRiderLocation({
        riderId: "rider-busy",
        latitude: 5.5600,
        longitude: -0.2000,
        status: "ON_TRIP",
      });

      const nearby = service.getNearbyRiders(5.5600, -0.2000, 3.0);
      const riderIds = nearby.map((r) => r.riderId);
      assert.ok(!riderIds.includes("rider-busy"), "Busy rider on trip must be hidden from discovery");
    });

    it("provides admin fleet snapshot with full telemetry details", async () => {
      const fleet = service.getAllAdminFleet();
      assert.ok(fleet.length > 0);
      const testRider = fleet.find((f) => f.riderId === "rider-test-001");
      assert.ok(testRider != null);
      assert.equal(testRider.speed, 28.5);
      assert.equal(testRider.heading, 85);
    });
  });

  describe("Shortest-Arc Angular Rotation Math (Anti-Spin Verification)", () => {
    it("computes shortest angular delta without 360 degree spin across North boundary", () => {
      // Turning from 355 deg (NNW) to 5 deg (NNE) should be +10 deg, NOT -350 deg
      const shortestArc = (from: number, to: number) => {
        return ((to - from + 540) % 360) - 180;
      };

      assert.equal(shortestArc(355, 5), 10, "355 -> 5 should turn clockwise by +10");
      assert.equal(shortestArc(5, 355), -10, "5 -> 355 should turn counter-clockwise by -10");
      assert.equal(shortestArc(0, 180), -180, "180 degree flip handled deterministically");
      assert.equal(shortestArc(90, 270), -180, "180 degree turn handled deterministically");
      assert.equal(shortestArc(10, 80), 70, "10 -> 80 should be +70");
      assert.equal(shortestArc(80, 10), -70, "80 -> 10 should be -70");
    });
  });
});
