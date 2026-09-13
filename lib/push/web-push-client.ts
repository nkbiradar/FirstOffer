// Sends "new opportunities added" browser push notifications. See
// public/sw.js (the service worker that displays them),
// components/PushNotificationPrompt.tsx (how visitors opt in),
// app/api/push/subscribe/route.ts (how a subscription is stored), and the
// trigger points in app/api/admin/opportunities/*.
//
// Requires VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT — generate
// a keypair once with `npx web-push generate-vapid-keys` and add all three
// to .env.local and Vercel. Until they're set, sendPushToAllSubscribers()
// logs a clear message and does nothing, rather than breaking the
// opportunity publish flow it's called from.
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.error(
      "Push notifications aren't configured — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.",
    );
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Sends one push notification to every stored subscription. Best-effort —
 * failures for individual subscribers (browser uninstalled, permission
 * revoked, etc.) never throw; a subscription that the push service reports
 * as gone (404/410) is deleted so the table doesn't grow stale forever.
 * Never throws, so a notification problem can never break the admin
 * publish flow that calls this.
 */
export async function sendPushToAllSubscribers(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error) {
    console.error("Could not load push subscriptions:", error.message);
    return;
  }
  if (!subscriptions || subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id as string);
        } else {
          console.error("Push send failed:", err instanceof Error ? err.message : err);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }
}
