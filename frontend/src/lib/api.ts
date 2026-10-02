const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

type ApiProblem = {
  title?: string;
  errors?: Record<string, string[]>;
};

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  if (!response.ok) {
    const problem: ApiProblem | null = await response.json().catch(() => null);
    const validationMessage = problem?.errors && Object.values(problem.errors).flat().join(" ");
    throw new Error(validationMessage || problem?.title || "Não foi possível concluir a operação.");
  }

  return response.json() as Promise<T>;
}
