// Career Kit 2027 — the downloadable files sold as a one-time ₹179 lifetime
// product (see CAREER_KIT_PRICE_INR in lib/payments/razorpay.ts). Files live
// in /private/career-kit (NOT /public); app/api/career-kit serves them only
// to buyers. The `key` is the only thing that ever reaches the URL — never a
// file path.
export type CareerKitFile = {
  key: string;
  file: string;
  title: string;
  detail: string;
  format: string;
  emoji: string;
};

export const CAREER_KIT_FILES: CareerKitFile[] = [
  {
    key: "hr-contacts",
    file: "FirstOffer_HR_Contacts_2027.pdf",
    title: "3,100+ HR Contacts — Company-wise",
    detail: "HR heads, TA leads & recruiters across 1,470+ companies, A–Z",
    format: "PDF",
    emoji: "📇",
  },
  {
    key: "hr-email-directory",
    file: "FirstOffer_HR_Email_Directory_2027.pdf",
    title: "HR Email Directory — 12 Countries",
    detail: "740+ company HR & careers emails: India, Gulf, USA, Europe & more",
    format: "PDF",
    emoji: "🌍",
  },
  {
    key: "career-links",
    file: "FirstOffer_500_Companies_Career_Links_2027.pdf",
    title: "500+ Companies Hiring — Career Links",
    detail: "Official careers pages + roles each company hires for",
    format: "PDF",
    emoji: "🔗",
  },
  {
    key: "referral-guide",
    file: "FirstOffer_How_to_Apply_for_Job_Referral.pdf",
    title: "How to Get a Job Referral — 6-Step Guide",
    detail: "From finding the Job ID to getting referred",
    format: "PDF",
    emoji: "🤝",
  },
  {
    key: "referral-mail",
    file: "FirstOffer_HR_Referral_Mail_Template.docx",
    title: "Referral Mail Template + Real Example",
    detail: "Copy-paste email that gets HR replies",
    format: "Word",
    emoji: "✉️",
  },
  {
    key: "resume-template",
    file: "FirstOffer_ATS_Resume_Template.pdf",
    title: "ATS-Friendly Resume Template",
    detail: "One-page fresher format that passes ATS checks",
    format: "PDF",
    emoji: "📄",
  },
  {
    key: "resume-template-tex",
    file: "FirstOffer_ATS_Resume_Template.tex",
    title: "Resume Template — Editable (Overleaf)",
    detail: "Upload to overleaf.com, edit, and download your PDF",
    format: "LaTeX",
    emoji: "✏️",
  },
];

export function getCareerKitFile(key: string | null): CareerKitFile | undefined {
  return CAREER_KIT_FILES.find((f) => f.key === key);
}
