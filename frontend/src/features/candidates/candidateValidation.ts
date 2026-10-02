import type { CandidateErrors, CandidateInput } from "./types";

export const emptyCandidate: CandidateInput = {
  fullName: "",
  email: "",
  phone: "",
  interestArea: "",
  professionalSummary: "",
};

export function normalizeCandidate(input: CandidateInput): CandidateInput {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    interestArea: input.interestArea.trim(),
    professionalSummary: input.professionalSummary.trim(),
  };
}

export function validateCandidate(input: CandidateInput): CandidateErrors {
  const errors: CandidateErrors = {};
  if (!input.fullName.trim()) errors.fullName = "Informe o nome completo.";
  else if (input.fullName.length > 150)
    errors.fullName = "O nome deve ter no máximo 150 caracteres.";

  if (!input.email.trim()) errors.email = "Informe o e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.email = "Informe um e-mail válido.";
  else if (input.email.length > 254) errors.email = "O e-mail deve ter no máximo 254 caracteres.";

  if (input.phone.length > 30) errors.phone = "O telefone deve ter no máximo 30 caracteres.";
  if (input.interestArea.length > 150)
    errors.interestArea = "A área ou cargo deve ter no máximo 150 caracteres.";
  if (input.professionalSummary.length > 3000)
    errors.professionalSummary = "O resumo deve ter no máximo 3000 caracteres.";
  return errors;
}
