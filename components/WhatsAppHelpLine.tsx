// "Doubt / trust issue? Message us on WhatsApp" line under the channel link
// on the homepage hero. Opens a chat with the founder's WhatsApp number.
const HELP_NUMBER = "916363976632"; // +91 63639 76632
const HELP_TEXT = "Hi FirstOffer, I have a question:";

export default function WhatsAppHelpLine() {
  const href = `https://wa.me/${HELP_NUMBER}?text=${encodeURIComponent(HELP_TEXT)}`;
  return (
    <p className="wa-help">
      <span aria-hidden="true">🤝</span> Any doubt, issue or trust concern? We&apos;re active —{" "}
      <a href={href} rel="noopener noreferrer" target="_blank">
        WhatsApp us at <strong>+91 63639 76632</strong>
      </a>
    </p>
  );
}
