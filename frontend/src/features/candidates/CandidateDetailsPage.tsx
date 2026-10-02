import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getCandidate } from "./candidateApi";
import type { Candidate } from "./types";

export function CandidateDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [result, setResult] = useState<{ id?: string; candidate?: Candidate; error?: string }>({});
  const candidate = result.id === id ? result.candidate : undefined;
  const error = result.id === id ? result.error : undefined;

  useEffect(() => {
    const controller = new AbortController();
    getCandidate(id!, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ id, candidate: data });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            id,
            error:
              cause instanceof Error ? cause.message : "Não foi possível carregar o candidato.",
          });
      });
    return () => controller.abort();
  }, [id]);

  return (
    <>
      <Link className="textLink" to="/">
        Voltar aos candidatos
      </Link>
      <header className="pageIntro">
        <h1>{candidate?.fullName || "Detalhes do candidato"}</h1>
      </header>
      {location.state?.saved && (
        <p className="notice success" role="status">
          Candidato cadastrado com sucesso.
        </p>
      )}
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : !candidate ? (
        <p role="status">Carregando candidato...</p>
      ) : (
        <section className="detailsPanel">
          <dl className="detailsGrid">
            <div>
              <dt>E-mail</dt>
              <dd>{candidate.email}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{candidate.phone || "Não informado"}</dd>
            </div>
            <div>
              <dt>Área ou cargo de interesse</dt>
              <dd>{candidate.interestArea || "Não informado"}</dd>
            </div>
            <div>
              <dt>Data de cadastro</dt>
              <dd>{new Date(candidate.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
            <div>
              <dt>Resumo profissional</dt>
              <dd className="summary">{candidate.professionalSummary || "Não informado"}</dd>
            </div>
          </dl>
        </section>
      )}
    </>
  );
}
