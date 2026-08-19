import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "FirstOffer",
  description: "Fresher opportunities, collected and organized in one place.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            FirstOffer
          </Link>
          <nav className="site-nav">
            <Link href="/opportunities">Opportunities</Link>
            <Link href="/opportunities?type=internship">Internships</Link>
            <Link href="/opportunities?type=full_time">Full-Time</Link>
            <Link href="/companies">Companies</Link>
            <Link href="/about">About</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
