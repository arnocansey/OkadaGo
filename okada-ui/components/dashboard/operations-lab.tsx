"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson, hasExternalApiBaseUrl, patchJson, postJson } from "@/lib/api";

interface ServiceZoneRecord {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string;
  perKmFee: string;
  perMinuteFee: string;
  minimumFare: string;
}

interface PassengerRecord {
  id: string;
  userId: string;
  referralCode: string;
  user: {
    id: string;
    fullName: string;
    phoneE164: string;
    preferredCurrency: string;
  };
}

interface RiderRecord {
  id: string;
  displayCode: string;
  onlineStatus: boolean;
  city: string | null;
  user: {
    id: string;
    fullName: string;
    phoneE164: string;
    preferredCurrency: string;
  };
  serviceZone: {
    id: string;
    name: string;
  } | null;
}

interface RideRecord {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  finalFare: string | null;
  estimatedFare: string | null;
  currency: string;
  passenger: {
    user: {
      fullName: string;
    };
  };
  rider: {
    user: {
      fullName: string;
    };
  } | null;
  serviceZone: {
    name: string;
  } | null;
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="workbench-card workbench-section-card">
      <h4>{title}</h4>
      <p className="body-muted">{description}</p>
      <div style={{ marginTop: 18 }}>{children}</div>
    </article>
  );
}

export function OperationsLab() {
  const queryClient = useQueryClient();
  const [zoneForm, setZoneForm] = useState({
    name: "",
    city: "",
    countryCode: "GH",
    currency: "GHS",
    baseFare: "",
    perKmFee: "",
    perMinuteFee: "",
    minimumFare: "",
    cancellationFee: "",
    waitingFeePerMin: ""
  });
  const [passengerForm, setPassengerForm] = useState({
    fullName: "",
    phoneCountryCode: "+233",
    phoneLocal: "",
    phoneE164: "",
    preferredCurrency: "GHS",
    defaultServiceCity: ""
  });
  const [riderForm, setRiderForm] = useState({
    fullName: "",
    phoneCountryCode: "+233",
    phoneLocal: "",
    phoneE164: "",
    preferredCurrency: "GHS",
    city: "",
    serviceZoneId: "",
    vehicleMake: "",
    vehicleModel: "",
    plateNumber: ""
  });
  const [topUpForm, setTopUpForm] = useState({
    userId: "",
    currency: "GHS",
    amount: "",
    walletType: "passenger_cashless"
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    riderProfileId: "",
    serviceZoneId: "",
    onlineStatus: true,
    latitude: "",
    longitude: ""
  });

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZoneRecord[]>("/bootstrap/service-zones?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const passengersQuery = useQuery({
    queryKey: ["passengers"],
    queryFn: () => fetchJson<PassengerRecord[]>("/bootstrap/passengers?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: hasExternalApiBaseUrl
  });

  const queryKeysToRefresh = useMemo(
    () => [["service-zones"], ["passengers"], ["riders"], ["rides"]],
    []
  );

  function invalidateAll() {
    queryKeysToRefresh.forEach((queryKey) => {
      void queryClient.invalidateQueries({ queryKey });
    });
  }

  const createZone = useMutation({
    mutationFn: async () =>
      postJson("/bootstrap/service-zones", {
        ...zoneForm,
        baseFare: Number(zoneForm.baseFare),
        perKmFee: Number(zoneForm.perKmFee),
        perMinuteFee: Number(zoneForm.perMinuteFee),
        minimumFare: Number(zoneForm.minimumFare),
        cancellationFee: Number(zoneForm.cancellationFee),
        waitingFeePerMin: Number(zoneForm.waitingFeePerMin),
        polygonGeoJson: {
          type: "FeatureCollection",
          features: []
        }
      }),
    onSuccess: () => {
      invalidateAll();
      setZoneForm({
        name: "",
        city: "",
        countryCode: "GH",
        currency: "GHS",
        baseFare: "",
        perKmFee: "",
        perMinuteFee: "",
        minimumFare: "",
        cancellationFee: "",
        waitingFeePerMin: ""
      });
    }
  });

  const createPassenger = useMutation({
    mutationFn: async () => postJson("/bootstrap/passengers", passengerForm),
    onSuccess: () => {
      invalidateAll();
      setPassengerForm({
        fullName: "",
        phoneCountryCode: "+233",
        phoneLocal: "",
        phoneE164: "",
        preferredCurrency: "GHS",
        defaultServiceCity: ""
      });
    }
  });

  const createRider = useMutation({
    mutationFn: async () =>
      postJson("/bootstrap/riders", {
        fullName: riderForm.fullName,
        phoneCountryCode: riderForm.phoneCountryCode,
        phoneLocal: riderForm.phoneLocal,
        phoneE164: riderForm.phoneE164,
        preferredCurrency: riderForm.preferredCurrency,
        city: riderForm.city,
        serviceZoneId: riderForm.serviceZoneId || undefined,
        approvalStatus: "approved",
        vehicle:
          riderForm.vehicleMake && riderForm.vehicleModel && riderForm.plateNumber
            ? {
                make: riderForm.vehicleMake,
                model: riderForm.vehicleModel,
                plateNumber: riderForm.plateNumber
              }
            : undefined
      }),
    onSuccess: () => {
      invalidateAll();
      setRiderForm({
        fullName: "",
        phoneCountryCode: "+233",
        phoneLocal: "",
        phoneE164: "",
        preferredCurrency: "GHS",
        city: "",
        serviceZoneId: "",
        vehicleMake: "",
        vehicleModel: "",
        plateNumber: ""
      });
    }
  });

  const topUpWallet = useMutation({
    mutationFn: async () =>
      postJson("/wallets/top-up", {
        userId: topUpForm.userId,
        currency: topUpForm.currency,
        amount: Number(topUpForm.amount),
        walletType: topUpForm.walletType
      }),
    onSuccess: () => {
      setTopUpForm({
        userId: "",
        currency: "GHS",
        amount: "",
        walletType: "passenger_cashless"
      });
    }
  });

  const updateAvailability = useMutation({
    mutationFn: async () =>
      patchJson(`/riders/${availabilityForm.riderProfileId}/availability`, {
        serviceZoneId: availabilityForm.serviceZoneId || undefined,
        onlineStatus: availabilityForm.onlineStatus,
        latitude: availabilityForm.latitude ? Number(availabilityForm.latitude) : undefined,
        longitude: availabilityForm.longitude ? Number(availabilityForm.longitude) : undefined
      }),
    onSuccess: () => {
      invalidateAll();
    }
  });

  return (
    <section className="ops-white-card ops-lab-surface">
      <p className="kicker">Operations lab</p>
      <h3>Real database setup and control surface</h3>
      <p className="body-muted" style={{ marginBottom: 18 }}>
        Create real service zones, passengers, riders, fund wallets, and bring riders online against
        your live Postgres database.
      </p>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state">
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to use the live operations lab.</strong>
          <p>The setup flow needs the standalone backend service.</p>
        </div>
      ) : (
        <div className="stack">
          <div className="two-up">
            <Section title="Create service zone" description="Zones power pricing and rider supply.">
              <div className="four-up">
                {[
                  ["name", "Zone name"],
                  ["city", "City"],
                  ["baseFare", "Base fare"],
                  ["perKmFee", "Per km fee"],
                  ["perMinuteFee", "Per minute fee"],
                  ["minimumFare", "Minimum fare"],
                  ["cancellationFee", "Cancellation fee"],
                  ["waitingFeePerMin", "Waiting fee / min"]
                ].map(([name, label]) => (
                  <div className="field-group" key={name}>
                    <label className="field-label">{label}</label>
                    <input
                      className="input"
                      value={zoneForm[name as keyof typeof zoneForm]}
                      onChange={(event) =>
                        setZoneForm((current) => ({ ...current, [name]: event.target.value }))
                      }
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                <select
                  className="select"
                  value={zoneForm.countryCode}
                  onChange={(event) =>
                    setZoneForm((current) => ({ ...current, countryCode: event.target.value }))
                  }
                >
                  <option value="GH">Ghana</option>
                  <option value="NG">Nigeria</option>
                </select>
                <select
                  className="select"
                  value={zoneForm.currency}
                  onChange={(event) =>
                    setZoneForm((current) => ({ ...current, currency: event.target.value }))
                  }
                >
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                </select>
                <button className="button" type="button" onClick={() => createZone.mutate()}>
                  {createZone.isPending ? "Creating..." : "Create zone"}
                </button>
              </div>
            </Section>

            <Section
              title="Create passenger"
              description="Passengers get wallets and a referral code automatically."
            >
              <div className="four-up">
                {[
                  ["fullName", "Full name"],
                  ["phoneCountryCode", "Country code"],
                  ["phoneLocal", "Local phone"],
                  ["phoneE164", "Phone E.164"],
                  ["defaultServiceCity", "Default city"]
                ].map(([name, label]) => (
                  <div className="field-group" key={name}>
                    <label className="field-label">{label}</label>
                    <input
                      className="input"
                      value={passengerForm[name as keyof typeof passengerForm]}
                      onChange={(event) =>
                        setPassengerForm((current) => ({ ...current, [name]: event.target.value }))
                      }
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                <select
                  className="select"
                  value={passengerForm.preferredCurrency}
                  onChange={(event) =>
                    setPassengerForm((current) => ({
                      ...current,
                      preferredCurrency: event.target.value
                    }))
                  }
                >
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                </select>
                <button className="button" type="button" onClick={() => createPassenger.mutate()}>
                  {createPassenger.isPending ? "Creating..." : "Create passenger"}
                </button>
              </div>
            </Section>
          </div>

          <div className="two-up">
            <Section
              title="Create rider"
              description="Approved riders can immediately go online after creation."
            >
              <div className="four-up">
                {[
                  ["fullName", "Full name"],
                  ["phoneCountryCode", "Country code"],
                  ["phoneLocal", "Local phone"],
                  ["phoneE164", "Phone E.164"],
                  ["city", "City"],
                  ["vehicleMake", "Vehicle make"],
                  ["vehicleModel", "Vehicle model"],
                  ["plateNumber", "Plate number"]
                ].map(([name, label]) => (
                  <div className="field-group" key={name}>
                    <label className="field-label">{label}</label>
                    <input
                      className="input"
                      value={riderForm[name as keyof typeof riderForm]}
                      onChange={(event) =>
                        setRiderForm((current) => ({ ...current, [name]: event.target.value }))
                      }
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                <select
                  className="select"
                  value={riderForm.preferredCurrency}
                  onChange={(event) =>
                    setRiderForm((current) => ({
                      ...current,
                      preferredCurrency: event.target.value
                    }))
                  }
                >
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                </select>
                <select
                  className="select"
                  value={riderForm.serviceZoneId}
                  onChange={(event) =>
                    setRiderForm((current) => ({ ...current, serviceZoneId: event.target.value }))
                  }
                >
                  <option value="">No zone yet</option>
                  {(zonesQuery.data ?? []).map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                <button className="button" type="button" onClick={() => createRider.mutate()}>
                  {createRider.isPending ? "Creating..." : "Create rider"}
                </button>
              </div>
            </Section>

            <Section
              title="Top up wallet"
              description="Fund passenger or promo wallets for real ride completion tests."
            >
              <div className="four-up">
                <div className="field-group">
                  <label className="field-label">User</label>
                  <select
                    className="select"
                    value={topUpForm.userId}
                    onChange={(event) =>
                      setTopUpForm((current) => ({ ...current, userId: event.target.value }))
                    }
                  >
                    <option value="">Select passenger</option>
                    {(passengersQuery.data ?? []).map((passenger) => (
                      <option key={passenger.user.id} value={passenger.user.id}>
                        {passenger.user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Currency</label>
                  <select
                    className="select"
                    value={topUpForm.currency}
                    onChange={(event) =>
                      setTopUpForm((current) => ({ ...current, currency: event.target.value }))
                    }
                  >
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Wallet type</label>
                  <select
                    className="select"
                    value={topUpForm.walletType}
                    onChange={(event) =>
                      setTopUpForm((current) => ({ ...current, walletType: event.target.value }))
                    }
                  >
                    <option value="passenger_cashless">Passenger cashless</option>
                    <option value="promo_credit">Promo credit</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Amount</label>
                  <input
                    className="input"
                    value={topUpForm.amount}
                    onChange={(event) =>
                      setTopUpForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                <button className="button" type="button" onClick={() => topUpWallet.mutate()}>
                  {topUpWallet.isPending ? "Funding..." : "Top up wallet"}
                </button>
              </div>
            </Section>
          </div>

          <Section
            title="Rider availability"
            description="Bring approved riders online with coordinates so matching can find them."
          >
            <div className="four-up">
              <div className="field-group">
                <label className="field-label">Rider</label>
                <select
                  className="select"
                  value={availabilityForm.riderProfileId}
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({
                      ...current,
                      riderProfileId: event.target.value
                    }))
                  }
                >
                  <option value="">Select rider</option>
                  {(ridersQuery.data ?? []).map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Service zone</label>
                <select
                  className="select"
                  value={availabilityForm.serviceZoneId}
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({
                      ...current,
                      serviceZoneId: event.target.value
                    }))
                  }
                >
                  <option value="">Select zone</option>
                  {(zonesQuery.data ?? []).map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Latitude</label>
                <input
                  className="input"
                  value={availabilityForm.latitude}
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({ ...current, latitude: event.target.value }))
                  }
                  placeholder="5.6037"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Longitude</label>
                <input
                  className="input"
                  value={availabilityForm.longitude}
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({ ...current, longitude: event.target.value }))
                  }
                  placeholder="-0.1870"
                />
              </div>
            </div>
            <div className="button-row" style={{ marginTop: 18 }}>
              <label className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={availabilityForm.onlineStatus}
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({
                      ...current,
                      onlineStatus: event.target.checked
                    }))
                  }
                />
                Rider online
              </label>
              <button className="button" type="button" onClick={() => updateAvailability.mutate()}>
                {updateAvailability.isPending ? "Updating..." : "Update availability"}
              </button>
            </div>
          </Section>

          <div className="three-up">
            <Section title="Service zones" description="Current persisted operating zones.">
              <ul className="workbench-list">
                {(zonesQuery.data ?? []).map((zone) => (
                  <li key={zone.id}>
                    <span>{zone.name}</span>
                    <strong>
                      {zone.city} - {zone.currency}
                    </strong>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Passengers" description="Recent passenger profiles in the database.">
              <ul className="workbench-list">
                {(passengersQuery.data ?? []).map((passenger) => (
                  <li key={passenger.id}>
                    <span>{passenger.user.fullName}</span>
                    <strong>{passenger.user.phoneE164}</strong>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Riders" description="Recent riders and current availability.">
              <ul className="workbench-list">
                {(ridersQuery.data ?? []).map((rider) => (
                  <li key={rider.id}>
                    <span>{rider.user.fullName}</span>
                    <strong>{rider.onlineStatus ? "online" : "offline"}</strong>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Latest rides" description="Persisted rides from the live backend.">
            {(ridesQuery.data ?? []).length === 0 ? (
              <div className="empty-state">
                <strong>No persisted rides yet.</strong>
                <p>Create passengers, riders, and zones first, then request a ride from the passenger workspace.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Rider</th>
                      <th>Status</th>
                      <th>Zone</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ridesQuery.data ?? []).map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.passenger.user.fullName}</td>
                        <td>{ride.rider?.user.fullName ?? "Unassigned"}</td>
                        <td>{ride.status}</td>
                        <td>{ride.serviceZone?.name ?? "No zone"}</td>
                        <td>
                          {ride.finalFare ?? ride.estimatedFare ?? "0"} {ride.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}
    </section>
  );
}
