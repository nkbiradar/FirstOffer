"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const next = searchParams.get("next") || "/admin";
  // Set by app/auth/callback/route.ts when a Google sign-in attempt started
  // here fails — distinct from `error`, which is only for the password
  // form's own signInWithPassword failures below.
  const oauthError = searchParams.get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <main className="admin-login">
      <div className="card admin-login-card">
        <span className="eyebrow" style={{ justifySelf: "start" }}>
          <span className="eyebrow-dot" />
          Admin access
        </span>
        <h1>Sign in</h1>
        <p className="admin-login-sub">FirstOffer admin only — daily opportunity management.</p>

        {/* Signing in with Google here still goes through the same ADMIN_EMAILS
            allowlist check as password login — see middleware.ts and
            getAdminUser() in lib/supabase/auth.ts. A Google account that
            isn't allowlisted lands right back on this page. */}
        <GoogleSignInButton next={next} label="Sign in with Google" />
        {oauthError && <p className="admin-login-error">{oauthError}</p>}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error && <p className="admin-login-error">{error}</p>}

          <button disabled={isLoading} type="submit">
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
