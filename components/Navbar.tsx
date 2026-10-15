"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/fresher-jobs", label: "Fresher Jobs" },
  { href: "/tech-jobs", label: "Tech Jobs" },
  { href: "/off-campus-jobs", label: "Off-Campus" },
  { href: "/opportunities", label: "All Openings" },
  { href: "/companies", label: "Companies" },
  { href: "/resume", label: "Resume Help" },
  // Free "What Worked For Me" stories — its own section, not part of Internal HR.
  { href: "/what-worked", label: "What Worked" },
  // Deliberately styled differently below (nav-link-hot) — this is the
  // entry point to the ₹149/month Internal HR Openings product and is meant
  // to stand out from the plain listing links next to it.
  { href: "/internal-openings", label: "Internal HR", hot: true },
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
function AuthActions({ user, isAdmin }: { user: NavUser; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link className="nav-admin-link" href="/login">
        Sign in
      </Link>
    );
  }

  // Signed in: one compact account button (avatar + "Account") that opens a
  // small menu with Dashboard, Admin (admins only) and Sign out. This used
  // to be four separate pills in the top bar, which overflowed the screen
  // once the nav had 8 links (Admin was pushed off-screen).
  const initial = user.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <div className="nav-account" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="nav-account-btn"
        onClick={() => setOpen((v) => !v)}
        title={user.email ?? undefined}
        type="button"
      >
        <span className="nav-user-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="nav-account-label">Account</span>
        <svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="14">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="nav-account-menu" role="menu">
          {user.email && <p className="nav-account-email">{user.email}</p>}
          <Link href="/dashboard" onClick={() => setOpen(false)} role="menuitem">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} role="menuitem">
              Admin
            </Link>
          )}
          <form action="/api/auth/signout" method="post">
            <button role="menuitem" type="submit">
              Sign out
            </button>
          </form>
        </div>
      )}
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
            <Image src="/images/brand-mark.png" alt="" width={30} height={30} className="brand-mark" priority />
            FirstOffer
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  isActive(link.href, pathname, search) ? "active" : "",
                  link.hot ? "nav-link-hot" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <AuthActions user={user} isAdmin={isAdmin} />
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
              className={[
                isActive(link.href, pathname, search) ? "active" : "",
                link.hot ? "nav-link-hot" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mobile-menu-divider" role="separator" />
          {user ? (
            <>
              {user.email && (
                <span className="mobile-menu-account">
                  <span className="nav-user-avatar" aria-hidden="true">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                  {user.email}
                </span>
              )}
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)}>
                  Admin
                </Link>
              )}
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="mobile-menu-signout">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              Sign in
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
            <Image src="/images/brand-mark.png" alt="" width={30} height={30} className="brand-mark" />
            FirstOffer
          </span>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={link.hot ? "nav-link-hot" : ""}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="navbar-actions">
            <AuthActions user={user} isAdmin={isAdmin} />
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
