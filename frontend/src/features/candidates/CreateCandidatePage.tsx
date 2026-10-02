import { useNavigate } from "react-router-dom";
import { CandidateForm } from "./CandidateForm";
import { createCandidate } from "./candidateApi";
import type { CandidateInput } from "./types";

export function CreateCandidatePage() {
  const navigate = useNavigate();

  async function handleSave(input: CandidateInput) {
    const candidate = await createCandidate(input);
    navigate(`/candidates/${candidate.id}`, { state: { saved: true } });
  }

  return (
    <>
      <header className="pageIntro">
        <h1>Novo candidato</h1>
      </header>
      <CandidateForm onSave={handleSave} />
    </>
  );
}
