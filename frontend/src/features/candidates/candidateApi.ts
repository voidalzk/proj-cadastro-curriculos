import { apiRequest } from "../../lib/api";
import type { Candidate, CandidateInput } from "./types";

export function getCandidates(signal?: AbortSignal) {
  return apiRequest<Candidate[]>("/candidates", { signal });
}

export function getCandidate(id: string, signal?: AbortSignal) {
  return apiRequest<Candidate>(`/candidates/${encodeURIComponent(id)}`, { signal });
}

export function createCandidate(input: CandidateInput) {
  return apiRequest<Candidate>("/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
