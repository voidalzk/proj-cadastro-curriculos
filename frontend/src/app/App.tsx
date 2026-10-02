import { NavLink, Route, Routes } from "react-router-dom";
import { CandidateListPage } from "../features/candidates/CandidateListPage";
import { CreateCandidatePage } from "../features/candidates/CreateCandidatePage";
import { CandidateDetailsPage } from "../features/candidates/CandidateDetailsPage";

export function App() {
  return (
    <div>
      <header className="siteHeader">
        <div className="headerContent">
          <NavLink className="siteTitle" to="/">
            Cadastro de currículos
          </NavLink>
          <nav aria-label="Navegação principal">
            <NavLink end to="/">
              Candidatos
            </NavLink>
            <NavLink to="/candidates/new">Novo cadastro</NavLink>
          </nav>
        </div>
      </header>
      <main className="workspace">
        <Routes>
          <Route path="/" element={<CandidateListPage />} />
          <Route path="/candidates/new" element={<CreateCandidatePage />} />
          <Route path="/candidates/:id" element={<CandidateDetailsPage />} />
          <Route
            path="*"
            element={
              <section>
                <h1>Página não encontrada</h1>
                <NavLink to="/">Voltar aos candidatos</NavLink>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
