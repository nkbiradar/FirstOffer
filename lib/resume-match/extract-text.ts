// Resume text extraction for the Resume Keyword Matcher. The file is read
// into memory, converted to plain text, compared against the job, and then
// discarded — nothing here writes the resume to disk, Supabase Storage, or
// any database table. See app/api/resume-match/route.ts.
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — generous for a text resume
const MIN_TEXT_LENGTH = 30;

export type ExtractResult = { ok: true; text: string } | { ok: false; error: string };

function finalize(rawText: string): ExtractResult {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  if (cleaned.length < MIN_TEXT_LENGTH) {
    return {
      ok: false,
      error:
        "Couldn't find readable text in that file. If it's a scanned/image resume, try uploading a text-based PDF or a DOCX instead.",
    };
  }
  return { ok: true, text: cleaned };
}

export async function extractResumeText(file: File): Promise<ExtractResult> {
  if (file.size === 0) {
    return { ok: false, error: "That file looks empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "Resume file is too large — please keep it under 5MB." };
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return finalize(result.text);
      } finally {
        await parser.destroy();
      }
    }

    if (
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return finalize(result.value);
    }

    if (name.endsWith(".txt") || file.type === "text/plain") {
      return finalize(buffer.toString("utf-8"));
    }
  } catch (error) {
    console.error("Resume text extraction failed:", error);
    return {
      ok: false,
      error: "Could not read that file — try exporting your resume as a PDF and uploading again.",
    };
  }

  return { ok: false, error: "Unsupported file type — please upload a PDF, DOCX, or TXT resume." };
}
