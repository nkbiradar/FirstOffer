// Reads the per-request CSP nonce that proxy.ts generates and forwards as
// the "x-nonce" request header. Server Components call this and pass the
// result to every inline <script> (JSON-LD structured data, mainly) so
// those scripts stay allowed under the strict script-src in proxy.ts
// without needing a blanket 'unsafe-inline'.
import { headers } from "next/headers";

export async function getNonce(): Promise<string | undefined> {
  const headerList = await headers();
  return headerList.get("x-nonce") ?? undefined;
}
