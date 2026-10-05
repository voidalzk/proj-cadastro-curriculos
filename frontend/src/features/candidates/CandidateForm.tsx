import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { emptyCandidate, normalizeCandidate, validateCandidate } from "./candidateValidation";
import { extractResume } from "./resumeApi";
import type { CandidateErrors, CandidateInput } from "./types";

const fields: Array<{
  key: keyof CandidateInput;
  label: string;
  type: string;
  maxLength: number;
  required?: boolean;
  autoComplete?: string;
}> = [
  {
    key: "fullName",
    label: "Nome completo",
    type: "text",
    maxLength: 150,
    required: true,
    autoComplete: "name",
  },
  {
    key: "email",
    label: "E-mail",
    type: "email",
    maxLength: 254,
    required: true,
    autoComplete: "email",
  },
  { key: "phone", label: "Telefone", type: "tel", maxLength: 30, autoComplete: "tel" },
  { key: "interestArea", label: "Área ou cargo de interesse", type: "text", maxLength: 150 },
  { key: "professionalSummary", label: "Resumo profissional", type: "textarea", maxLength: 3000 },
];

export function CandidateForm({ onSave }: { onSave(input: CandidateInput): Promise<void> }) {
  const [form, setForm] = useState<CandidateInput>(emptyCandidate);
  const [errors, setErrors] = useState<CandidateErrors>({});
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");

  async function handleImport() {
    if (isImporting || isSaving) return;
    setImportError("");
    setImportMessage("");

    if (!file || file.size === 0) {
      setImportError("Selecione um PDF que não esteja vazio.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError("O PDF deve ter no máximo 5 MB.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setImportError("Envie um arquivo PDF.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await extractResume(file);
      // A importação preenche apenas campos vazios para preservar o que foi digitado.
      setForm((current) => ({
        ...current,
        fullName: current.fullName.trim() ? current.fullName : result.fullName || "",
        email: current.email.trim() ? current.email : result.email || "",
        phone: current.phone.trim() ? current.phone : result.phone || "",
      }));
      setErrors({});
      setImportMessage(
        result.warnings.length
          ? `PDF lido parcialmente. ${result.warnings.join(" ")} Confira os dados e complete o formulário.`
          : "PDF lido. Confira os dados antes de salvar. Campos já preenchidos foram mantidos.",
      );
    } catch (cause) {
      setImportError(
        `${cause instanceof Error ? cause.message : "Não foi possível importar o PDF."} Você pode continuar o cadastro manualmente.`,
      );
    } finally {
      setIsImporting(false);
    }
  }

  function update(field: keyof CandidateInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || isImporting) return;
    setError("");
    const input = normalizeCandidate(form);
    const nextErrors = validateCandidate(input);
    setErrors(nextErrors);
    const invalidField = fields.find((field) => nextErrors[field.key]);
    if (invalidField) {
      event.currentTarget.querySelector<HTMLElement>(`#${invalidField.key}`)?.focus();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o candidato.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      aria-busy={isSaving || isImporting}
      className="candidateForm"
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="formHint">Campos com * são obrigatórios.</p>
      <fieldset className="resumeUpload" disabled={isSaving || isImporting}>
        <legend>
          Importar currículo <small>opcional</small>
        </legend>
        <p className="formHint" id="resume-hint">
          PDF de até 5 MB. Você também pode preencher os dados abaixo sem arquivo.
        </p>
        <label htmlFor="resume">Arquivo PDF</label>
        <input
          id="resume"
          type="file"
          accept=".pdf,application/pdf"
          aria-describedby="resume-hint"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setImportError("");
            setImportMessage("");
          }}
        />
        <button className="secondaryButton" type="button" onClick={handleImport}>
          {isImporting ? "Lendo PDF..." : "Importar PDF"}
        </button>
      </fieldset>
      {importError && (
        <p className="notice error" role="alert">
          {importError}
        </p>
      )}
      {importMessage && (
        <p className="notice" role="status">
          {importMessage}
        </p>
      )}
      <fieldset disabled={isSaving} className="formGrid">
        <legend className="visuallyHidden">Dados do candidato</legend>
        {fields.map((field) => {
          const props = {
            id: field.key,
            name: field.key,
            value: form[field.key],
            maxLength: field.maxLength,
            required: field.required,
            "aria-invalid": Boolean(errors[field.key]),
            "aria-describedby": errors[field.key] ? `${field.key}-error` : undefined,
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              update(field.key, event.target.value),
          };
          return (
            <div className="field" key={field.key}>
              <label htmlFor={field.key}>
                {field.label} {field.required ? <span>*</span> : <small>opcional</small>}
              </label>
              {field.type === "textarea" ? (
                <textarea {...props} rows={5} />
              ) : (
                <input {...props} autoComplete={field.autoComplete} type={field.type} />
              )}
              {errors[field.key] && (
                <p className="fieldError" id={`${field.key}-error`}>
                  {errors[field.key]}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="formActions">
        <Link className="textLink" to="/">
          Voltar à listagem
        </Link>
        <button className="primaryButton" disabled={isSaving || isImporting} type="submit">
          {isSaving ? "Salvando..." : "Salvar candidato"}
        </button>
      </div>
    </form>
  );
}
