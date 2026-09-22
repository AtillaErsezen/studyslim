"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { GravityStarsBackground } from '@/components/animate-ui/components/backgrounds/gravity-stars';
import {ShimmeringText} from "@/components/ui/shadcn-io/shimmering-text";

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [universityId, setUniversityId] = useState<string>('');
  const [role, setRole] = useState<"student" | "tutor" | null>(null);
  const [universities, setUniversities] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Fetch universities for dropdown
    fetch('/api/universities')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUniversities(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch universities:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 9) {
      setError("Password must be at least 9 characters long.");
      return;
    }
    if (role === "tutor" && !universityId) {
      setError("Please select your university.");
      return;
    }
    setLoading(true);
    try {
      // register new user via email
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        image: undefined,
      });

      if (error?.code) {
        const map: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered",
        };
        setError(map[error.code] || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      if (role === "tutor") {
        try {
          await fetch("/api/tutors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // userId will be set by the API from session
              bio: "",
              courseTags: [],
              hourlyRate: 0,
              languages: [],
              universityId: universityId,
              // ... other default values
            })
          });
        } catch (err) {
          console.error("Failed to create tutor profile in db:", err);
          // Optionally show warning, but don't block registration
        }
      }
      // Validate redirect to prevent open redirects
      const isValidRedirect = (path: string | null): boolean => {
        if (!path) return false;
        // Only allow internal redirects starting with /
        return path.startsWith('/') && !path.includes('://');
      };
      const redirect = search.get("redirect");
      const next = isValidRedirect(redirect) 
        ? `/login?registered=true&redirect=${encodeURIComponent(redirect ?? "")}` 
        : "/login?registered=true";
      router.push(next);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
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
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Already have an account? <a href="/login" className="underline">Log in</a>
          </p>

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                placeholder="Jane Doe"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="off"
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Account type</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`flex flex-col items-center cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    role === "student" 
                      ? "border-primary bg-primary/5" 
                      : "border-[var(--color-border)] hover:border-primary/50"
                  }`}
                  onClick={() => setRole(role === "student" ? null : "student")}
                >
                  <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">I'm a student</span>
                </div>
                <div 
                  className={`flex flex-col items-center cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    role === "tutor" 
                      ? "border-primary bg-primary/5" 
                      : "border-[var(--color-border)] hover:border-primary/50"
                  }`}
                  onClick={() => setRole(role === "tutor" ? null : "tutor")}
                >
                  <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>  
                  </div>
                  <span className="text-sm font-medium">I'm a tutor</span>
                </div>
              </div>
            </div>

            {role === "tutor" && (
              <div>
                <label className="block text-sm font-medium mb-1">University</label>
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select your university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-black/85 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}