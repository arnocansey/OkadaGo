"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { hasExternalApiBaseUrl, postJson } from "@/lib/api";

interface RankedCandidate {
  riderId: string;
  displayName: string;
  score: number;
  distanceToPickupKm: number;
  etaMinutes: number;
  rationale: string[];
}

interface MatchingPreviewResponse {
  requestedServiceZoneId: string;
  candidateCount: number;
  eligibleCount: number;
  rankedCandidates: RankedCandidate[];
}

interface CandidateFormRow {
  riderId: string;
  displayName: string;
  serviceZoneId: string;
  distanceToPickupKm: string;
  etaMinutes: string;
  ratingAverage: string;
  acceptanceRate: string;
  cancellationRate: string;
  isOnline: boolean;
  isApproved: boolean;
  isAvailable: boolean;
}

function createBlankCandidate(): CandidateFormRow {
  return {
    riderId: "",
    displayName: "",
    serviceZoneId: "",
    distanceToPickupKm: "",
    etaMinutes: "",
    ratingAverage: "",
    acceptanceRate: "",
    cancellationRate: "",
    isOnline: true,
    isApproved: true,
    isAvailable: true
  };
}

export function MatchingWorkbench() {
  const [requestedServiceZoneId, setRequestedServiceZoneId] = useState("");
  const [maxPickupRadiusKm, setMaxPickupRadiusKm] = useState("6");
  const [candidates, setCandidates] = useState<CandidateFormRow[]>([]);

  const mutation = useMutation({
    mutationFn: async () =>
      postJson<MatchingPreviewResponse, unknown>("/matching/preview", {
        requestedServiceZoneId,
        maxPickupRadiusKm: Number(maxPickupRadiusKm),
        candidates: candidates.map((candidate) => ({
          riderId: candidate.riderId,
          displayName: candidate.displayName,
          serviceZoneId: candidate.serviceZoneId,
          distanceToPickupKm: Number(candidate.distanceToPickupKm),
          etaMinutes: Number(candidate.etaMinutes),
          ratingAverage: Number(candidate.ratingAverage),
          acceptanceRate: Number(candidate.acceptanceRate),
          cancellationRate: Number(candidate.cancellationRate),
          isOnline: candidate.isOnline,
          isApproved: candidate.isApproved,
          isAvailable: candidate.isAvailable
        }))
      })
  });

  function updateCandidate(index: number, patch: Partial<CandidateFormRow>) {
    setCandidates((current) =>
      current.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, ...patch } : candidate
      )
    );
  }

  function removeCandidate(index: number) {
    setCandidates((current) => current.filter((_, candidateIndex) => candidateIndex !== index));
  }

  return (
    <section className="workbench-card">
      <div className="workbench-header">
        <p className="kicker">Dispatch ranking surface</p>
        <h4>Rider ranking preview</h4>
        <p className="body-muted">
          Add live candidate riders from your dispatch feed and inspect how the ranking logic orders them.
        </p>
      </div>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to enable matching previews.</strong>
          <p>This ranking form needs the backend service.</p>
        </div>
      ) : null}

      <div className="two-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Requested service zone ID</label>
          <input
            className="input"
            value={requestedServiceZoneId}
            onChange={(event) => setRequestedServiceZoneId(event.target.value)}
            placeholder="Enter zone identifier"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Max pickup radius km</label>
          <input
            className="input"
            value={maxPickupRadiusKm}
            onChange={(event) => setMaxPickupRadiusKm(event.target.value)}
            placeholder="6"
          />
        </div>
      </div>

      <div className="button-row" style={{ marginTop: 18 }}>
        <button
          className="button-secondary"
          type="button"
          onClick={() => setCandidates((current) => [...current, createBlankCandidate()])}
        >
          Add rider candidate
        </button>
        <button
          className="button"
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !hasExternalApiBaseUrl}
        >
          {mutation.isPending ? "Ranking..." : "Rank candidates"}
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>No rider candidates added yet.</strong>
          <p>Add candidates from your real dispatch feed to test eligibility and ranking.</p>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 18 }}>
          {candidates.map((candidate, index) => (
            <article key={`${candidate.riderId}-${index}`} className="workbench-subcard">
              <div className="button-row" style={{ justifyContent: "space-between" }}>
                <h4 style={{ marginBottom: 0 }}>Candidate {index + 1}</h4>
                <button className="button-ghost" type="button" onClick={() => removeCandidate(index)}>
                  Remove
                </button>
              </div>
              <div className="four-up" style={{ marginTop: 18 }}>
                {[
                  ["riderId", "Rider ID"],
                  ["displayName", "Display name"],
                  ["serviceZoneId", "Service zone"],
                  ["distanceToPickupKm", "Distance km"],
                  ["etaMinutes", "ETA minutes"],
                  ["ratingAverage", "Rating"],
                  ["acceptanceRate", "Acceptance %"],
                  ["cancellationRate", "Cancellation %"]
                ].map(([name, label]) => (
                  <div className="field-group" key={name}>
                    <label className="field-label">{label}</label>
                    <input
                      className="input"
                      value={candidate[name as keyof CandidateFormRow] as string}
                      onChange={(event) =>
                        updateCandidate(index, {
                          [name]: event.target.value
                        } as Partial<CandidateFormRow>)
                      }
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                {[
                  ["isOnline", "Online"],
                  ["isApproved", "Approved"],
                  ["isAvailable", "Available"]
                ].map(([name, label]) => (
                  <label key={name} className="checkbox-pill">
                    <input
                      type="checkbox"
                      checked={candidate[name as keyof CandidateFormRow] as boolean}
                      onChange={(event) =>
                        updateCandidate(index, {
                          [name]: event.target.checked
                        } as Partial<CandidateFormRow>)
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {mutation.isError ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Matching preview failed.</strong>
          <p>{mutation.error.message}</p>
        </div>
      ) : null}

      {mutation.data ? (
        <div className="stack" style={{ marginTop: 18 }}>
          <article className="workbench-subcard">
            <h4>Eligibility summary</h4>
            <div className="workbench-metric-list">
              <p className="body-muted">
                Input candidates: <strong>{mutation.data.candidateCount}</strong>
              </p>
              <p className="body-muted">
                Eligible after filtering: <strong>{mutation.data.eligibleCount}</strong>
              </p>
            </div>
          </article>
          {mutation.data.rankedCandidates.map((candidate) => (
            <article key={candidate.riderId} className="workbench-subcard">
              <h4>
                {candidate.displayName} - score {candidate.score}
              </h4>
              <p className="body-muted">
                {candidate.distanceToPickupKm}km away - ETA {candidate.etaMinutes} minutes
              </p>
              <ul className="workbench-list">
                {candidate.rationale.map((reason) => (
                  <li key={reason}>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
