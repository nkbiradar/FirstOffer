// Small "Get daily job alerts on Telegram" link under the hero buttons.
// Set TELEGRAM_URL to the channel link (https://t.me/...). While it's
// empty the link is hidden, so the site never shows a dead button.
export const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "";

export default function TelegramLink() {
  if (!TELEGRAM_URL) return null;
  return (
    <a className="tg-link" href={TELEGRAM_URL} rel="noopener noreferrer" target="_blank">
      <span aria-hidden="true" className="tg-link-icon">
        <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
          <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2L6.7 13l-4.6-1.4c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z" />
        </svg>
      </span>
      <span className="tg-link-text">
        Get daily job alerts on <strong>Telegram</strong>
      </span>
      <svg aria-hidden="true" className="tg-link-arrow" fill="none" height="14" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="14">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
