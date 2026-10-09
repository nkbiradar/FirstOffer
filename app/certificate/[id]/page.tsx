import type { Metadata } from "next";
import Link from "next/link";
import { getCertificateById } from "@/lib/data/referral-rewards";
import PrintButton from "@/components/PrintButton";

type Params = { id: string };

export const metadata: Metadata = {
  title: "Certificate Verification — FirstOffer",
  robots: { index: false, follow: false },
};

const COPY = {
  ambassador: {
    title: "Certificate of Recognition",
    role: "Campus Ambassador",
    body: (n: number) =>
      `for outstanding peer outreach as a FirstOffer Campus Ambassador, helping ${n} job seekers get Full Access to fresher opportunities on FirstOffer.`,
  },
  internship: {
    title: "Certificate of Internship",
    role: "Growth Intern",
    body: () =>
      "for successfully completing the FirstOffer Growth Internship (1 month, remote), contributing to campus outreach, community growth and content.",
  },
} as const;

export default async function CertificatePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const cert = await getCertificateById(id.toUpperCase());

  if (!cert) {
    return (
      <main className="page">
        <div className="container cert-verify-missing">
          <h1>Certificate not found</h1>
          <p>
            No FirstOffer certificate matches <strong>{id}</strong>. Check the ID and try again, or contact
            support@firstoffer.online.
          </p>
          <Link className="btn btn-primary" href="/">
            Go to FirstOffer
          </Link>
        </div>
      </main>
    );
  }

  const copy = COPY[cert.kind];
  const issued = new Date(cert.issued_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <main className="page cert-page">
      <div className="container">
        <div className="cert-verified">
          <span aria-hidden="true">✓</span> Verified — this certificate was issued by FirstOffer.
        </div>

        <article className="cert">
          <div className="cert-inner">
            <p className="cert-brand">FirstOffer</p>
            <h1 className="cert-title">{copy.title}</h1>
            <p className="cert-presented">This is presented to</p>
            <p className="cert-name">{cert.full_name}</p>
            <p className="cert-role">{copy.role}</p>
            <p className="cert-body">{copy.body(cert.paid_referrals)}</p>
            <div className="cert-footer">
              <div>
                <p className="cert-sign">Nayan Kumar Biradar</p>
                <p className="cert-meta">Founder, FirstOffer</p>
              </div>
              <div className="cert-right">
                <p className="cert-meta">Issued {issued}</p>
                <p className="cert-meta">Certificate ID: {cert.id}</p>
                <p className="cert-meta">Verify: firstoffer.online/certificate/{cert.id}</p>
              </div>
            </div>
          </div>
        </article>

        <div className="cert-actions">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
