// Hero "Get daily job alerts on WhatsApp" pill — opens the free FirstOffer
// WhatsApp Channel. Channel posts only link back to job pages here, so the
// apply details stay behind the website's membership.
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbEAe3eFSAsw8baLWz33";

export default function WhatsAppChannelLink() {
  return (
    <a className="tg-link wa-link" href={WHATSAPP_CHANNEL_URL} rel="noopener noreferrer" target="_blank">
      <span aria-hidden="true" className="tg-link-icon wa-link-icon">
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
        </svg>
      </span>
      <span className="tg-link-text">
        Get daily job alerts on <strong>WhatsApp</strong>
      </span>
      <svg aria-hidden="true" className="tg-link-arrow" fill="none" height="14" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="14">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
