// IndexNow: tells Bing (and Yandex, Seznam, Naver…) about new or removed
// pages instantly, instead of waiting for them to re-crawl. The key file
// public/86ed9ea96f88e748268556bcf739aac3.txt proves we own the site.
// Docs: https://www.indexnow.org/documentation
import { getSiteUrl } from "@/lib/site-url";

export const INDEXNOW_KEY = "86ed9ea96f88e748268556bcf739aac3";

export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  const siteUrl = getSiteUrl();
  if (urls.length === 0 || !/^https:\/\//.test(siteUrl) || siteUrl.includes("localhost")) return false;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: INDEXNOW_KEY,
        keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });
    if (!res.ok && res.status !== 202) console.error("IndexNow failed:", res.status, await res.text());
    return res.ok || res.status === 202;
  } catch (err) {
    console.error("IndexNow threw:", err);
    return false;
  }
}
