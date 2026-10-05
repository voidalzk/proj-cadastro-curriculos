import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateForm } from "./CandidateForm";
import { extractResume } from "./resumeApi";
import type { ResumeExtraction } from "./types";

vi.mock("./resumeApi", () => ({ extractResume: vi.fn() }));

const extracted: ResumeExtraction = {
  fullName: "Ana Silva",
  email: "ana@example.com",
  phone: "(11) 98765-4321",
  warnings: [],
};

function renderForm(onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter>
      <CandidateForm onSave={onSave} />
    </MemoryRouter>,
  );
  return onSave;
}

beforeEach(() => {
  vi.mocked(extractResume).mockReset();
});

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

  it("importa, permite corrigir e só salva quando solicitado", async () => {
    const user = userEvent.setup();
    const onSave = renderForm();
    vi.mocked(extractResume).mockResolvedValue(extracted);
    const file = new File(["pdf"], "curriculo.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Arquivo PDF"), file);
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Confira os dados antes de salvar");
    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Ana Silva");
    expect(screen.getByLabelText(/Telefone/)).toHaveValue("(11) 98765-4321");
    expect(extractResume).toHaveBeenCalledWith(file);
    expect(onSave).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/E-mail/));
    await user.type(screen.getByLabelText(/E-mail/), "CORRIGIDO@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ email: "corrigido@example.com" }),
    );
  });

  it("mantém os campos digitados e preenche somente os vazios", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/Nome completo/), "Nome digitado");
    await user.type(screen.getByLabelText(/Telefone/), "11999999999");
    await user.type(screen.getByLabelText(/Área ou cargo/), "Backend");
    await user.type(screen.getByLabelText(/Resumo profissional/), "Resumo digitado");
    vi.mocked(extractResume).mockResolvedValue(extracted);
    await user.upload(screen.getByLabelText("Arquivo PDF"), new File(["pdf"], "curriculo.pdf"));
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));
    await screen.findByRole("status");

    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Nome digitado");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("ana@example.com");
    expect(screen.getByLabelText(/Telefone/)).toHaveValue("11999999999");
    expect(screen.getByLabelText(/Área ou cargo/)).toHaveValue("Backend");
    expect(screen.getByLabelText(/Resumo profissional/)).toHaveValue("Resumo digitado");
  });

  it("avisa sobre extração parcial e exige completar os campos obrigatórios", async () => {
    const user = userEvent.setup();
    const onSave = renderForm();
    vi.mocked(extractResume).mockResolvedValue({
      ...extracted,
      fullName: null,
      phone: null,
      warnings: ["Nome não identificado.", "Telefone não identificado."],
    });
    await user.upload(screen.getByLabelText("Arquivo PDF"), new File(["pdf"], "curriculo.pdf"));
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));

    expect(await screen.findByRole("status")).toHaveTextContent("PDF lido parcialmente");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("ana@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Nome completo/)).toHaveFocus();
    await user.type(screen.getByLabelText(/Nome completo/), "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("permite salvar manualmente após falha de leitura sem perder os dados", async () => {
    const user = userEvent.setup();
    const onSave = renderForm();
    await user.type(screen.getByLabelText(/Nome completo/), "Ana Silva");
    await user.type(screen.getByLabelText(/E-mail/), "ana@example.com");
    vi.mocked(extractResume).mockRejectedValue(new Error("O PDF está protegido."));
    await user.upload(screen.getByLabelText("Arquivo PDF"), new File(["pdf"], "curriculo.pdf"));
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("continuar o cadastro manualmente");
    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Ana Silva");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("ana@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Ana Silva", email: "ana@example.com" }),
    );
  });

  it.each([
    ["vazio.pdf", "", 0, "vazio"],
    ["curriculo.txt", "texto", 5, "arquivo PDF"],
    ["grande.pdf", "pdf", 5 * 1024 * 1024 + 1, "5 MB"],
  ])("rejeita %s antes de enviar ao backend", async (name, content, size, message) => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm();
    const file = new File([content], name);
    Object.defineProperty(file, "size", { value: size });
    await user.upload(screen.getByLabelText("Arquivo PDF"), file);
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(extractResume).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar candidato" })).toBeEnabled();
  });

  it("aceita um arquivo com exatamente 5 MB", async () => {
    const user = userEvent.setup();
    renderForm();
    vi.mocked(extractResume).mockResolvedValue(extracted);
    const file = new File(["pdf"], "curriculo.pdf");
    Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("Arquivo PDF"), file);
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));
    await screen.findByRole("status");
    expect(extractResume).toHaveBeenCalledOnce();
  });

  it("mostra processamento e preserva o que é digitado enquanto o PDF é lido", async () => {
    const user = userEvent.setup();
    renderForm();
    let finish!: (value: ResumeExtraction) => void;
    vi.mocked(extractResume).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await user.upload(screen.getByLabelText("Arquivo PDF"), new File(["pdf"], "curriculo.pdf"));
    await user.click(screen.getByRole("button", { name: "Importar PDF" }));
    expect(screen.getByRole("button", { name: "Lendo PDF..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar candidato" })).toBeDisabled();
    await user.type(screen.getByLabelText(/Nome completo/), "Nome revisado");
    await act(async () => finish(extracted));
    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Nome revisado");
    expect(screen.getByRole("button", { name: "Salvar candidato" })).toBeEnabled();
  });

  it("salva sem selecionar nem importar um arquivo", async () => {
    const user = userEvent.setup();
    const onSave = renderForm();
    await user.type(screen.getByLabelText(/Nome completo/), "Ana Silva");
    await user.type(screen.getByLabelText(/E-mail/), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar candidato" }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(extractResume).not.toHaveBeenCalled();
  });
});
