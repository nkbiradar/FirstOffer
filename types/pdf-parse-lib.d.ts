// pdf-parse's own index.js has a debug harness that misfires when imported
// as an ESM module (see lib/resume-match/extract-text.ts for the full
// story), so we import its inner implementation module directly instead.
// That subpath ships no types of its own -- @types/pdf-parse only covers
// the package root -- so declare it here with the same shape.
declare module "pdf-parse/lib/pdf-parse.js" {
  import type PdfParse from "pdf-parse";
  const parse: typeof PdfParse;
  export default parse;
}
