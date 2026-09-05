import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MatchingService,
  calculateBearingDegrees,
} from "./matching.service.js";
import {
  DispatchService,
  DISPATCH_ROUNDS,
} from "./dispatch.service.js";

describe("OkadaGo 11-Factor Matching & Dispatch Engine", () => {
  const matchingService = new MatchingService();
  const dispatchService = new DispatchService();

  describe("Compass Bearing Calculation", () => {
    it("computes cardinal bearings accurately", () => {
      // Due North (latitude increases, longitude constant)
      const north = calculateBearingDegrees(5.6037, -0.1870, 5.6137, -0.1870);
      assert.ok(Math.abs(north - 0) < 1 || Math.abs(north - 360) < 1, `Expected ~0/360, got ${north}`);

      // Due East (latitude constant, longitude increases/moves east)
      const east = calculateBearingDegrees(5.6037, -0.1870, 5.6037, -0.1770);
      assert.ok(Math.abs(east - 90) < 1, `Expected ~90, got ${east}`);

      // Due South (latitude decreases)
      const south = calculateBearingDegrees(5.6037, -0.1870, 5.5937, -0.1870);
      assert.ok(Math.abs(south - 180) < 1, `Expected ~180, got ${south}`);

      // Due West (longitude decreases)
      const west = calculateBearingDegrees(5.6037, -0.1870, 5.6037, -0.1970);
      assert.ok(Math.abs(west - 270) < 1, `Expected ~270, got ${west}`);
    });
  });

  describe("Safety Pickup PIN Generation", () => {
    it("generates a cryptographically valid 4-digit PIN", () => {
      for (let i = 0; i < 50; i++) {
        const pin = dispatchService.generateSafetyPin();
        assert.equal(pin.length, 4, "PIN must be exactly 4 digits");
        assert.ok(/^\d{4}$/.test(pin), "PIN must consist of numbers only");
        const num = Number(pin);
        assert.ok(num >= 1000 && num <= 9999, "PIN must be between 1000 and 9999");
      }
    });
  });

  describe("Multi-Round Escalation Configuration", () => {
    it("defines 3 progressive concentric rings with 10s timeouts", () => {
      assert.equal(DISPATCH_ROUNDS.length, 3);
      assert.equal(DISPATCH_ROUNDS[0].round, 1);
      assert.equal(DISPATCH_ROUNDS[0].radiusKm, 1.2);
      assert.equal(DISPATCH_ROUNDS[0].timeoutSec, 10);

      assert.equal(DISPATCH_ROUNDS[1].round, 2);
      assert.equal(DISPATCH_ROUNDS[1].radiusKm, 2.5);

      assert.equal(DISPATCH_ROUNDS[2].round, 3);
      assert.equal(DISPATCH_ROUNDS[2].radiusKm, 4.0);
    });
  });

  describe("Intelligent 11-Factor Candidate Ranking", () => {
    it("prioritizes closer riders with heading toward pickup and high reliability", () => {
      const candidates = [
        {
          riderId: "rider-far",
          displayName: "Kofi Far Away",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 3.5,
          etaMinutes: 10,
          ratingAverage: 4.8,
          acceptanceRate: 90,
          cancellationRate: 2,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
          currentHeading: 180,
          bearingToPickup: 0, // Heading away
        },
        {
          riderId: "rider-near-ideal",
          displayName: "Kwame Ideal",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.8,
          etaMinutes: 2,
          ratingAverage: 4.95,
          acceptanceRate: 98,
          cancellationRate: 1,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
          currentHeading: 90,
          bearingToPickup: 90, // Heading directly toward pickup
        },
        {
          riderId: "rider-near-unreliable",
          displayName: "Ama Unreliable",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.9,
          etaMinutes: 3,
          ratingAverage: 3.2,
          acceptanceRate: 50,
          cancellationRate: 35, // High penalty
          isOnline: true,
          isApproved: true,
          isAvailable: true,
          currentHeading: null,
          bearingToPickup: null,
        },
      ];

      const ranked = matchingService.rankCandidates({
        requestedServiceZoneId: "accra-zone",
        maxPickupRadiusKm: 5.0,
        candidates,
      });

      assert.equal(ranked.length, 3);
      const first = ranked[0]!;
      const second = ranked[1]!;
      // Kwame should be #1 by far
      assert.equal(first.riderId, "rider-near-ideal");
      assert.ok(first.score > second.score, "Ideal candidate should outscore second candidate");
      assert.ok(first.directionScore > 0.8, "Aligned heading should receive high direction score");
      assert.ok(first.rationale.length > 0, "Should include rationale breakdown");
    });

    it("filters out ineligible riders (offline, unapproved, unavailable, outside radius)", () => {
      const candidates = [
        {
          riderId: "rider-offline",
          displayName: "Offline Rider",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.5,
          etaMinutes: 2,
          ratingAverage: 5.0,
          acceptanceRate: 100,
          cancellationRate: 0,
          isOnline: false, // Ineligible
          isApproved: true,
          isAvailable: true,
        },
        {
          riderId: "rider-unapproved",
          displayName: "Unapproved Rider",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.5,
          etaMinutes: 2,
          ratingAverage: 5.0,
          acceptanceRate: 100,
          cancellationRate: 0,
          isOnline: true,
          isApproved: false, // Ineligible
          isAvailable: true,
        },
        {
          riderId: "rider-busy",
          displayName: "Busy Rider",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.5,
          etaMinutes: 2,
          ratingAverage: 5.0,
          acceptanceRate: 100,
          cancellationRate: 0,
          isOnline: true,
          isApproved: true,
          isAvailable: false, // Ineligible
        },
        {
          riderId: "rider-outside-ring",
          displayName: "Outside Ring",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 2.2, // Outside Round 1 (1.2km)
          etaMinutes: 6,
          ratingAverage: 5.0,
          acceptanceRate: 100,
          cancellationRate: 0,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
        },
        {
          riderId: "rider-eligible",
          displayName: "Eligible Rider",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.8,
          etaMinutes: 2,
          ratingAverage: 4.8,
          acceptanceRate: 95,
          cancellationRate: 2,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
        },
      ];

      const ranked = matchingService.rankCandidates({
        requestedServiceZoneId: "accra-zone",
        maxPickupRadiusKm: 1.2, // Round 1 radius
        candidates,
      });

      assert.equal(ranked.length, 1, "Only eligible candidate within 1.2km should be returned");
      assert.equal(ranked[0]!.riderId, "rider-eligible");
    });

    it("respects custom admin assignment rule weights", () => {
      const candidates = [
        {
          riderId: "rider-closest",
          displayName: "Closest Low Rating",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 0.3,
          etaMinutes: 1,
          ratingAverage: 3.8,
          acceptanceRate: 80,
          cancellationRate: 5,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
        },
        {
          riderId: "rider-highest-rated",
          displayName: "Further Top Rating",
          serviceZoneId: "accra-zone",
          distanceToPickupKm: 1.1,
          etaMinutes: 3,
          ratingAverage: 5.0,
          acceptanceRate: 99,
          cancellationRate: 0,
          isOnline: true,
          isApproved: true,
          isAvailable: true,
        },
      ];

      // With heavy rating weight, the 5.0-star rider wins
      const ratingWeighted = matchingService.rankCandidates(
        {
          requestedServiceZoneId: "accra-zone",
          maxPickupRadiusKm: 2.0,
          candidates,
        },
        {
          weightProximity: 0.1,
          weightEta: 0.1,
          weightRating: 0.7,
          weightAcceptance: 0.1,
        }
      );
      assert.equal(ratingWeighted[0]!.riderId, "rider-highest-rated");

      // With heavy proximity weight, the 0.3km rider wins
      const proximityWeighted = matchingService.rankCandidates(
        {
          requestedServiceZoneId: "accra-zone",
          maxPickupRadiusKm: 2.0,
          candidates,
        },
        {
          weightProximity: 0.7,
          weightEta: 0.1,
          weightRating: 0.1,
          weightAcceptance: 0.1,
        }
      );
      assert.equal(proximityWeighted[0]!.riderId, "rider-closest");
    });
  });
});
