import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { emptyCandidate, normalizeCandidate, validateCandidate } from "./candidateValidation";
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

  function update(field: keyof CandidateInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
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
    <form aria-busy={isSaving} className="candidateForm" noValidate onSubmit={handleSubmit}>
      <p className="formHint">Campos com * são obrigatórios.</p>
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
        <button className="primaryButton" disabled={isSaving} type="submit">
          {isSaving ? "Salvando..." : "Salvar candidato"}
        </button>
      </div>
    </form>
  );
}
