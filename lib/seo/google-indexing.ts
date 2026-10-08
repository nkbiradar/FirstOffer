import crypto from "crypto";
import { getSiteUrl } from "@/lib/site-url";

// Google Indexing API — tells Google the moment a job page is published,
// updated or taken down, instead of waiting days for a normal crawl. Google
// supports this API specifically for pages with JobPosting structured data
// (https://developers.google.com/search/apis/indexing-api/v3/quickstart),
// and it matters a lot here: every listing auto-expires after 48 hours, so
// without it most jobs disappear before Google ever finds them.
//
// Setup (one-time, see the delivery notes):
//   GOOGLE_INDEXING_CLIENT_EMAIL = service account email
//   GOOGLE_INDEXING_PRIVATE_KEY  = its private key (the "-----BEGIN PRIVATE
//                                  KEY-----..." value; literal \n is fine)
// and add that service account as an OWNER of the property in Google Search
// Console. Until both env vars are set, every function here is a silent
// no-op, so nothing breaks before setup.
//
// Never throws: a failed notification must never fail the admin action
// that triggered it. Default quota is 200 publish requests/day.

type NotificationType = "URL_UPDATED" | "URL_DELETED";

let cachedToken: { value: string; expiresAt: number } | null = null;

function getCredentials(): { email: string; key: string } | null {
  const email = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  return { email, key: rawKey.replace(/\\n/g, "\n") };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(email: string, key: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${base64url(signer.sign(key))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`token request failed: ${data.error_description ?? res.status}`);
  }
  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in ?? 3600) };
  return data.access_token;
}

/** Notifies Google about each URL. Returns how many succeeded. */
export async function notifyGoogleIndexing(urls: string[], type: NotificationType = "URL_UPDATED"): Promise<number> {
  const creds = getCredentials();
  if (!creds || urls.length === 0) return 0;
  // Never ping Google from local/preview builds.
  if (!/^https:\/\//.test(getSiteUrl()) || getSiteUrl().includes("localhost")) return 0;

  let ok = 0;
  try {
    const token = await getAccessToken(creds.email, creds.key);
    for (const url of urls) {
      try {
        const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url, type }),
        });
        if (res.ok) ok += 1;
        else console.error(`Google Indexing ${type} failed for ${url}:`, res.status, await res.text());
      } catch (err) {
        console.error(`Google Indexing ${type} threw for ${url}:`, err);
      }
    }
  } catch (err) {
    console.error("Google Indexing API unavailable:", err);
  }
  return ok;
}

/** Convenience wrapper for opportunity ids → public detail-page URLs. */
export function notifyGoogleJobs(ids: string[], type: NotificationType = "URL_UPDATED"): Promise<number> {
  const siteUrl = getSiteUrl();
  return notifyGoogleIndexing(
    ids.map((id) => `${siteUrl}/opportunities/${id}`),
    type,
  );
}
