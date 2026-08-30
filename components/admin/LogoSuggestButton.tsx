"use client";

type Props = {
  // name= attribute of the "logo URL" text input in the same <form> — this
  // button writes its guess directly into that input via the DOM, so the
  // surrounding form can stay a plain server-rendered <form method="post">
  // (see OpportunityForm.tsx's comment on why that matters) instead of
  // needing to become a client component just for this one convenience.
  logoFieldName: string;
  // Either the company name is already known (editing an existing company
  // row — pass it directly), or it's still being typed into a sibling
  // input (the "create new company" flow on the opportunity form — pass
  // that input's name= instead and this reads its live value on click).
  companyName?: string;
  nameFieldName?: string;
};

// Cuts a small, recurring bit of admin toil: hand-finding and pasting a
// logo URL for every new company. Google's favicon endpoint needs no
// signup/API key and is good enough for a first-pass logo — this is a
// starting guess the admin can look at and override, not an automatic
// fetch of a "real" logo (there's no free, keyless API that reliably
// returns a proper company logo rather than a favicon).
export default function LogoSuggestButton({ logoFieldName, companyName, nameFieldName }: Props) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!form) return;

    const logoInput = form.elements.namedItem(logoFieldName) as HTMLInputElement | null;
    if (!logoInput) return;

    let name = companyName ?? "";
    if (!name && nameFieldName) {
      const nameInput = form.elements.namedItem(nameFieldName) as HTMLInputElement | null;
      name = nameInput?.value.trim() ?? "";
    }
    if (!name) {
      logoInput.focus();
      return;
    }

    // Naive company-name → domain guess ("Acme Corp Pvt Ltd" → "acmecorppvtltd.com").
    // Wrong often enough that this is explicitly a starting point, not an
    // auto-fill the admin can skip checking — the field stays editable.
    const domainGuess = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
    logoInput.value = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainGuess)}&sz=128`;
    logoInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={handleClick}
      title="Guess a logo from the company name — double-check it before saving"
    >
      Suggest logo
    </button>
  );
}
