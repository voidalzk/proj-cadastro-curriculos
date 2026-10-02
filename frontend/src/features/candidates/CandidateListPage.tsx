import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCandidates } from "./candidateApi";
import type { Candidate } from "./types";

export function CandidateListPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getCandidates(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCandidates(data);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Não foi possível carregar os candidatos.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setIsLoading(true);
    setError("");
    setAttempt((current) => current + 1);
  }

  const filteredCandidates = candidates.filter((candidate) =>
    [candidate.fullName, candidate.email, candidate.interestArea ?? ""].some((value) =>
      value.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")),
    ),
  );

  return (
    <>
      <header className="pageIntro introWithAction">
        <h1>Candidatos</h1>
        <Link className="primaryButton" to="/candidates/new">
          Novo candidato
        </Link>
      </header>
      <section aria-label="Candidatos cadastrados" aria-busy={isLoading}>
        <div className="listToolbar">
          <p className="candidateCount">
            {!isLoading && !error
              ? `${candidates.length} ${candidates.length === 1 ? "candidato" : "candidatos"}`
              : "Consulta de candidatos"}
          </p>
          <label className="searchField">
            <span>Buscar candidatos</span>
            <input
              type="search"
              placeholder="Buscar por nome, e-mail ou cargo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {isLoading ? (
          <p className="emptyState" role="status">
            Carregando candidatos...
          </p>
        ) : error ? (
          <div className="emptyState">
            <p className="notice error" role="alert">
              {error}
            </p>
            <button className="secondaryButton" onClick={retry} type="button">
              Tentar novamente
            </button>
          </div>
        ) : filteredCandidates.length ? (
          <div
            className="tableContainer"
            role="region"
            aria-label="Lista de candidatos"
            tabIndex={0}
          >
            <table>
              <caption className="visuallyHidden">Candidatos cadastrados</caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Área ou cargo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>{candidate.fullName}</td>
                    <td>{candidate.email}</td>
                    <td>{candidate.interestArea || "Não informado"}</td>
                    <td>
                      <Link
                        className="textLink"
                        to={`/candidates/${candidate.id}`}
                        aria-label={`Ver detalhes de ${candidate.fullName}`}
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emptyState">
            <h3>{search ? "Nenhum candidato encontrado" : "Nenhum candidato cadastrado"}</h3>
            <p>
              {search
                ? "Tente buscar por outro nome, e-mail ou cargo."
                : "Use o botão Novo candidato para fazer o primeiro cadastro."}
            </p>
            {!search && (
              <Link className="textLink" to="/candidates/new">
                Cadastrar primeiro candidato
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}
