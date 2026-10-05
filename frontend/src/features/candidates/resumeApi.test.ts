import { afterEach, describe, expect, it, vi } from "vitest";
import { extractResume } from "./resumeApi";

afterEach(() => vi.unstubAllGlobals());

describe("Importação do currículo", () => {
  it("envia multipart e deixa o navegador definir o Content-Type", async () => {
    const result = {
      fullName: "Ana Silva",
      email: null,
      phone: null,
      warnings: ["E-mail não identificado."],
    };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const file = new File(["pdf"], "curriculo.pdf", { type: "application/pdf" });

    expect(await extractResume(file)).toEqual(result);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("/api/resumes/extract");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("file")).toBe(file);
    expect(options.headers).toBeUndefined();
  });

  it("mostra a mensagem de leitura retornada pelo backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ title: "O PDF está protegido." }), { status: 422 }),
        ),
    );
    await expect(extractResume(new File(["pdf"], "curriculo.pdf"))).rejects.toThrow(
      "O PDF está protegido.",
    );
  });
});
