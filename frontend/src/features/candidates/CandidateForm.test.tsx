import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CandidateForm } from "./CandidateForm";

describe("Formulário do candidato", () => {
  it("mantém os dados preenchidos quando o servidor falha", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("Não foi possível conectar ao servidor."));
    render(
      <MemoryRouter>
        <CandidateForm onSave={onSave} />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Nome completo/), "Ana Silva");
    await user.type(screen.getByLabelText(/E-mail/), "ANA@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao servidor.",
    );
    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Ana Silva");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("ANA@example.com");
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@example.com" }));
    expect(screen.getByRole("button", { name: "Salvar candidato" })).toBeEnabled();
  });

  it("foca o primeiro campo inválido e não envia o cadastro", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <MemoryRouter>
        <CandidateForm onSave={onSave} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));

    expect(screen.getByLabelText(/Nome completo/)).toHaveFocus();
    expect(screen.getByText("Informe o e-mail.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
