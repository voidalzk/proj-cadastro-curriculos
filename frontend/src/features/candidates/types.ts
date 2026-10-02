export type CandidateInput = {
  fullName: string;
  email: string;
  phone: string;
  interestArea: string;
  professionalSummary: string;
};

export type Candidate = Omit<CandidateInput, "phone" | "interestArea" | "professionalSummary"> & {
  id: string;
  phone: string | null;
  interestArea: string | null;
  professionalSummary: string | null;
  createdAt: string;
};

export type CandidateErrors = Partial<Record<keyof CandidateInput, string>>;
