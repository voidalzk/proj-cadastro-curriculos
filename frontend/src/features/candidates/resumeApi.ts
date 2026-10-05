import { apiRequest } from "../../lib/api";
import type { ResumeExtraction } from "./types";

export function extractResume(file: File) {
  const data = new FormData();
  data.append("file", file);
  return apiRequest<ResumeExtraction>("/resumes/extract", { method: "POST", body: data });
}
