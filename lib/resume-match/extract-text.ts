// Resume text extraction for the Resume Keyword Matcher. The file is read
// into memory, converted to plain text, compared against the job, and then
// discarded — nothing here writes the resume to disk, Supabase Storage, or
// any database table. See app/api/resume-match/route.ts.
//
// Uses pdf-parse@1.x (not 2.x) deliberately: 2.x pulls in pdfjs-dist +
// @napi-rs/canvas, a native/compiled dependency that needs system shared
// libraries pdf-parse's own build doesn't ship. It worked in local dev and
// in this project's Linux verification container, but crashed on every
// upload in Vercel's actual serverless runtime -- and because the import
// is evaluated at module load, it broke DOCX/TXT uploads too, not just
// PDFs. pdf-parse@1.x only depends on "debug" + "node-ensure", both pure
// JS, so there's no native binary to break in any environment.
//
// Importing "pdf-parse/lib/pdf-parse.js" instead of the package root is
// also deliberate: pdf-parse's own index.js has a leftover debug harness
// gated on `!module.parent` that's meant to no-op when the package is
// required normally, but that check doesn't hold up under how Next.js
// evaluates ESM imports -- it fires for real and crashes every request
// with "ENOENT: ./test/data/05-versions-space.pdf". The actual parser
// lives one level down with none of that, so import it directly.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
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
      const data = await pdfParse(buffer);
      return finalize(data.text);
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
