import { describe, expect, it } from "vitest";
import { emptyCandidate, normalizeCandidate, validateCandidate } from "./candidateValidation";

describe("Validação do candidato", () => {
  it("exige nome e e-mail", () => {
    expect(validateCandidate(emptyCandidate)).toEqual({
      fullName: "Informe o nome completo.",
      email: "Informe o e-mail.",
    });
  });

  it.each(["ana", "ana@empresa", "ana @example.com", "ana@example.com outro"])(
    "rejeita e-mail inválido: %s",
    (email) => {
      expect(validateCandidate({ ...emptyCandidate, fullName: "Ana Silva", email }).email).toBe(
        "Informe um e-mail válido.",
      );
    },
  );

  it("aceita o cadastro com os opcionais vazios", () => {
    expect(
      validateCandidate({ ...emptyCandidate, fullName: "Ana Silva", email: "ana@example.com" }),
    ).toEqual({});
  });

  it("normaliza espaços e e-mail antes de salvar", () => {
    expect(
      normalizeCandidate({
        ...emptyCandidate,
        fullName: " Ana Silva ",
        email: " ANA@example.com ",
      }),
    ).toMatchObject({ fullName: "Ana Silva", email: "ana@example.com" });
  });

  it("rejeita resumo que ultrapassa o limite do banco", () => {
    expect(
      validateCandidate({ ...emptyCandidate, professionalSummary: "a".repeat(3001) })
        .professionalSummary,
    ).toBeDefined();
  });
});
