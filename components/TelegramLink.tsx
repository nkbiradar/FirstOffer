"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Hero "Get daily job alerts on Telegram" pill. Clicking it opens a short
// 3-step guide for the paid Telegram channel (₹99/month, approved by hand):
// 1) pay via UPI, 2) email the screenshot to support@, 3) send a join
// request on Telegram. Configured with two Vercel env vars:
//   NEXT_PUBLIC_TELEGRAM_URL     — the channel's invite link (required;
//                                  the pill is hidden while it's empty)
//   NEXT_PUBLIC_TELEGRAM_UPI_ID  — UPI ID behind the "Pay with UPI app"
//                                  button (hidden while empty)
//   QR image                     — public/images/telegram-upi-qr.png
const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "";
const UPI_ID = process.env.NEXT_PUBLIC_TELEGRAM_UPI_ID || "";
const SUPPORT_EMAIL = "support@firstoffer.online";
const PRICE = "₹99";

// upi://pay deep link: on a phone it opens the student's UPI app
// (PhonePe, GPay, Paytm…) with the payee and ₹99 pre-filled. Only built
// when a UPI ID is configured; the ID itself isn't shown on the page.
const UPI_LINK = UPI_ID
  ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("FirstOffer")}&am=99&cu=INR&tn=${encodeURIComponent("Telegram Premium Alerts")}`
  : "";
// Payment QR image. Put the QR screenshot at public/images/telegram-upi-qr.png
// (or set NEXT_PUBLIC_TELEGRAM_QR_URL); a dashed placeholder shows until then.
const QR_SRC = process.env.NEXT_PUBLIC_TELEGRAM_QR_URL || "/images/telegram-upi-qr.png";

const MAIL_SUBJECT = "Telegram Premium Alerts – Payment Screenshot";
const MAIL_BODY = [
  "Hi FirstOffer team,",
  "",
  `I have paid ${PRICE} for Telegram Premium Alerts. My payment screenshot is attached.`,
  "",
  "Name:",
  "Telegram username:",
  "UPI transaction ID:",
  "",
  "Thank you.",
].join("\n");
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(MAIL_BODY)}`;

// For students who already paid FirstOffer earlier: no new payment, just
// proof of the old one so the join request can be matched and approved.
const PAID_SUBJECT = "Telegram Premium Alerts – Already Paid (Join Request)";
const PAID_BODY = [
  "Hi FirstOffer team,",
  "",
  "I have already paid FirstOffer earlier. Proof of my payment is attached, and I've sent a request to join the Telegram channel.",
  "",
  "Name:",
  "Email used on FirstOffer:",
  "Telegram username:",
  "Date of earlier payment:",
  "",
  "Thank you.",
].join("\n");
const PAID_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(PAID_SUBJECT)}&body=${encodeURIComponent(PAID_BODY)}`;

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TelegramGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2L6.7 13l-4.6-1.4c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z" />
    </svg>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label={`Copy ${label}`}
      className="tgm-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked — the value is still visible to copy by hand */
        }
      }}
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function QrBox() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="tgm-qr">
      {failed ? (
        <div className="tgm-qr-empty">
          <svg aria-hidden="true" fill="none" height="28" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width="28">
            <rect height="6" rx="1" width="6" x="3" y="3" />
            <rect height="6" rx="1" width="6" x="15" y="3" />
            <rect height="6" rx="1" width="6" x="3" y="15" />
            <path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2" strokeLinecap="round" />
          </svg>
          <span>QR code coming soon</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`UPI QR code to pay ${PRICE}`} height={180} onError={() => setFailed(true)} src={QR_SRC} width={180} />
      )}
      <span className="tgm-qr-caption">Scan with any UPI app</span>
    </div>
  );
}

export default function TelegramLink({ alreadyPaid = false }: { alreadyPaid?: boolean }) {
  const [open, setOpen] = useState(false);
  // Which flow the popup shows; members with active access start on "paid".
  const [tab, setTab] = useState<"new" | "paid">(alreadyPaid ? "paid" : "new");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!TELEGRAM_URL) return null;

  return (
    <>
      <button className="tg-link" onClick={() => setOpen(true)} type="button">
        <span aria-hidden="true" className="tg-link-icon">
          <TelegramGlyph />
        </span>
        <span className="tg-link-text">
          Get daily job alerts on <strong>Telegram</strong>
        </span>
        <svg aria-hidden="true" className="tg-link-arrow" fill="none" height="14" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="14">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        createPortal(
        <div className="tgm-overlay" onClick={() => setOpen(false)} role="presentation">
          <div
            aria-labelledby="tgm-title"
            aria-modal="true"
            className="tgm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button aria-label="Close" className="tgm-close" onClick={() => setOpen(false)} ref={closeRef} type="button">
              <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="18">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>

            <div className="tgm-head">
              <span aria-hidden="true" className="tgm-logo">
                <TelegramGlyph size={22} />
              </span>
              <div>
                <span className="tgm-eyebrow">Telegram Premium Alerts</span>
                <h2 className="tgm-title" id="tgm-title">
                  Get fresher jobs on Telegram, every day
                </h2>
              </div>
            </div>

            <p className="tgm-sub">
              New fresher, internship and off-campus openings delivered straight to your phone — so you can apply
              before everyone else.
            </p>

            <div aria-label="Choose your option" className="tgm-tabs" role="tablist">
              <button aria-selected={tab === "new"} className="tgm-tab" onClick={() => setTab("new")} role="tab" type="button">
                New member
              </button>
              <button aria-selected={tab === "paid"} className="tgm-tab" onClick={() => setTab("paid")} role="tab" type="button">
                Already paid
              </button>
            </div>

            {tab === "new" ? (
            <>
            <div className="tgm-price">
              <span className="tgm-price-amount">{PRICE}</span>
              <span className="tgm-price-period">/ month</span>
              <span className="tgm-price-note">One-time UPI payment · no auto-debit</span>
            </div>

            <ol className="tgm-steps">
              <li className="tgm-step">
                <span className="tgm-num">1</span>
                <div className="tgm-step-body">
                  <h3>Pay {PRICE} via UPI</h3>
                  <p>Pay with PhonePe, Google Pay, Paytm or any UPI app.</p>
                  {UPI_LINK && (
                    <a className="tgm-btn tgm-btn-pay" href={UPI_LINK}>
                      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="16">
                        <rect height="18" rx="2.5" width="12" x="6" y="3" />
                        <path d="M10.5 18h3" strokeLinecap="round" />
                      </svg>
                      Pay {PRICE} with UPI app
                    </a>
                  )}
                  <QrBox />
                </div>
              </li>

              <li className="tgm-step">
                <span className="tgm-num">2</span>
                <div className="tgm-step-body">
                  <h3>Email your payment screenshot</h3>
                  <p>Include your name and Telegram username so we can match your request.</p>
                  <div className="tgm-field">
                    <span className="tgm-field-label">Email</span>
                    <code className="tgm-field-value">{SUPPORT_EMAIL}</code>
                    <CopyButton label="email address" value={SUPPORT_EMAIL} />
                  </div>
                  <a className="tgm-btn tgm-btn-ghost" href={MAILTO}>
                    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
                      <rect height="14" rx="2" width="18" x="3" y="5" />
                      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Compose email
                  </a>
                </div>
              </li>

              <li className="tgm-step">
                <span className="tgm-num">3</span>
                <div className="tgm-step-body">
                  <h3>Send a request to join</h3>
                  <p>Open the channel on Telegram and tap &ldquo;Request to Join&rdquo;.</p>
                  <a className="tgm-btn tgm-btn-primary" href={TELEGRAM_URL} rel="noopener noreferrer" target="_blank">
                    <TelegramGlyph size={16} />
                    Request to join on Telegram
                  </a>
                </div>
              </li>
            </ol>
            </>
            ) : (
            <>
            <div className="tgm-paid-note">
              <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="18">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <strong>No need to pay again.</strong> If you&apos;ve already paid FirstOffer, just share proof of
                your earlier payment and request to join.
              </span>
            </div>

            <ol className="tgm-steps">
              <li className="tgm-step">
                <span className="tgm-num">1</span>
                <div className="tgm-step-body">
                  <h3>Share proof of your earlier payment</h3>
                  <p>
                    Email a screenshot of your earlier payment (or its confirmation) with your name, the email you
                    use on FirstOffer and your Telegram username.
                  </p>
                  <div className="tgm-field">
                    <span className="tgm-field-label">Email</span>
                    <code className="tgm-field-value">{SUPPORT_EMAIL}</code>
                    <CopyButton label="email address" value={SUPPORT_EMAIL} />
                  </div>
                  <a className="tgm-btn tgm-btn-ghost" href={PAID_MAILTO}>
                    <MailIcon />
                    Compose email
                  </a>
                </div>
              </li>

              <li className="tgm-step">
                <span className="tgm-num">2</span>
                <div className="tgm-step-body">
                  <h3>Send a request to join</h3>
                  <p>Open the channel on Telegram and tap &ldquo;Request to Join&rdquo;.</p>
                  <a className="tgm-btn tgm-btn-primary" href={TELEGRAM_URL} rel="noopener noreferrer" target="_blank">
                    <TelegramGlyph size={16} />
                    Request to join on Telegram
                  </a>
                </div>
              </li>
            </ol>
            </>
            )}

            <p className="tgm-foot">
              <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="15">
                <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tab === "new"
                ? "Requests are approved within 24 hours once your payment is verified."
                : "We approve your request once your earlier payment is matched — usually within 24 hours."}
            </p>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
