"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/opportunities?type=internship", label: "Internships" },
  { href: "/opportunities?type=full_time", label: "Full-Time" },
  { href: "/companies", label: "Companies" },
  { href: "/about", label: "About" },
];

type NavUser = { email: string | null } | null;

function isActive(href: string, pathname: string, search: string) {
  const [hrefPath, hrefQuery] = href.split("?");
  if (hrefPath !== pathname) return false;
  if (!hrefQuery) return !search;
  const params = new URLSearchParams(hrefQuery);
  const currentParams = new URLSearchParams(search);
  return Array.from(params.entries()).every(([key, value]) => currentParams.get(key) === value);
}

// Signed-in state (My Applications link, email, sign-out) vs signed-out
// (Sign in link) — small pill styling, matching the rest of the nav.
// Sign-out is a plain <form method="post"> to /api/auth/signout (no client
// JS needed for the mutation itself), matching the rest of the app.
//
// No "Admin" link here for a signed-out visitor or a signed-in job seeker —
// the public site still never advertises the admin surface to them.
// middleware.ts (page routes) and getAdminUser() (API routes) are what
// actually gate access, not the absence of a nav link, but hiding it here
// keeps regular users from ever seeing "Admin" as something to click. The
// admin themselves gets it back via the `isAdmin` prop below (see Navbar) —
// otherwise the only way back into /admin is remembering the URL, which
// turned out to be worse than the info-leak this was guarding against.
function AuthActions({ user }: { user: NavUser }) {
  if (!user) {
    return (
      <Link className="nav-admin-link" href="/login">
        Sign in
      </Link>
    );
  }

  return (
    <div className="nav-user">
      <Link className="nav-admin-link" href="/dashboard">
        Dashboard
      </Link>
      {user.email && <span className="nav-user-email">{user.email}</span>}
      <form action="/api/auth/signout" method="post" className="nav-signout-form">
        <button type="submit">Sign out</button>
      </form>
    </div>
  );
}

// The only client component in the public nav — needed for the mobile menu
// toggle and active-link highlighting. `user` and `isAdmin` are passed down
// from the root layout (a Server Component that already calls getUser())
// rather than fetched here, so there's no extra client-side auth round-trip.
function NavbarInner({ user, isAdmin }: { user: NavUser; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  // Purely cosmetic: adds a deeper shadow/border once the page has scrolled
  // past the very top, so the sticky nav reads as "lifted" over the page
  // rather than flat against it. No effect on layout or any other behavior.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container">
        <div className="navbar-inner">
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            <span className="brand-mark">F</span>
            FirstOffer
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={isActive(link.href, pathname, search) ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <AuthActions user={user} />
            {isAdmin && (
              <Link className="nav-admin-link" href="/admin">
                Admin
              </Link>
            )}
            <button
              type="button"
              className="nav-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <nav className={`mobile-menu ${open ? "open" : ""}`} aria-label="Mobile">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={isActive(link.href, pathname, search) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <form action="/api/auth/signout" method="post">
                <button type="submit" style={{ width: "100%", textAlign: "left" }}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// Static fallback (no active-link state) so useSearchParams doesn't force
// the whole site into client-only rendering — Next requires a Suspense
// boundary around it for statically-optimized pages to keep working. Still
// receives `user`/`isAdmin` so signed-in state doesn't flash/disappear
// during it.
function NavbarFallback({ user, isAdmin }: { user: NavUser; isAdmin: boolean }) {
  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <span className="brand">
            <span className="brand-mark">F</span>
            FirstOffer
          </span>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="navbar-actions">
            <AuthActions user={user} />
            {isAdmin && (
              <Link className="nav-admin-link" href="/admin">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Navbar({ user = null, isAdmin = false }: { user?: NavUser; isAdmin?: boolean }) {
  return (
    <Suspense fallback={<NavbarFallback user={user} isAdmin={isAdmin} />}>
      <NavbarInner user={user} isAdmin={isAdmin} />
    </Suspense>
  );
}
