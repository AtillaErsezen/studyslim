"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { GravityStarsBackground } from '@/components/animate-ui/components/backgrounds/gravity-stars';
import {ShimmeringText} from "@/components/ui/shadcn-io/shimmering-text";


function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setInfo("Account created! Please check your email to verify, then log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const callbackURL = searchParams.get("redirect") || "/dashboard";
      // sign in user via email
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL,
      });
   
      if (error?.code) {
        setError("Invalid email or password. Please make sure you have already registered an account and try again.");
        setLoading(false);
        return;
      }

      router.push(typeof callbackURL === "string" ? callbackURL : "/");
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
          <GravityStarsBackground className="absolute inset-0 pointer-events-none rounded-xl" />
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)] px-4">
      <div className="fixed top-6 left-6 z-50 cursor-pointer" onClick={() => window.location.href = '/'}>
        <span className="text-2xl font-bold text-black">Study<span className="text-primary">Slim</span></span>
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col justify-center items-center mb-16 gap-5"> 
          <span className="text-6xl font-bold text-foreground">High <span className="text-primary">Grades,</span></span>
          <div className="flex items-center gap-3">
            <span className="text-6xl font-bold text-foreground">High</span>
            <ShimmeringText
              className="text-6xl font-bold text-primary"
              text="Income"
              color="#6366f1"
              duration={2}
              wave
            />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white dark:bg-[color-mix(in_oklab,var(--color-card),black_10%)] shadow-sm p-6">
          <h1 className="text-2xl font-bold">Log in</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Don't have an account? <a href="/register" className="underline">Register</a>
          </p>

          {info && (
            <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded px-3 py-2">
              {info}
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                placeholder="you@uva.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4"
                />
                Remember me
              </label>
              <a href="/register" className="text-sm underline">Create account</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-black/85 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}