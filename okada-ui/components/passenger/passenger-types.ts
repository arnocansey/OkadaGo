export type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

export type ActiveRide = {
  id: string;
  status: string;
  destinationAddress: string;
  rider: {
    currentLatitude: string | number | null;
    currentLongitude: string | number | null;
    user: {
      fullName: string;
    };
  } | null;
} | null;

export type RoutePreviewData = {
  provider: "mapbox" | "osrm" | "google";
  distanceKm: number;
  durationMinutes: number;
  route: Array<[number, number]>;
} | null;
