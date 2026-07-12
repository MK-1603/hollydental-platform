"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest } from "@/lib/api";
import { Lock, Eye, EyeOff, ShieldAlert, ShieldCheck, CheckCircle2 } from "lucide-react";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 10, label: "At least 10 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "Lowercase letter" },
  { test: (p: string) => /\d/.test(p), label: "A number" },
  {
    test: (p: string) => /[@$!%*?&]/.test(p),
    label: "Special character (@ $ ! % * ? &)",
  },
];

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-sm font-semibold text-navy">Loading…</p>
        </div>
      }
    >
      <ChangePasswordInner />
    </Suspense>
  );
}

function ChangePasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isForced = !!user?.mustChangePassword;
  const nextPath = searchParams.get("next") || "";

  // If the user navigates here without being signed in, send them home.
  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(newPassword) })),
    [newPassword]
  );
  const allValid = ruleResults.every((r) => r.ok);
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const strength = useMemo(() => {
    const passed = ruleResults.filter((r) => r.ok).length;
    if (passed <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/5" };
    if (passed === 2) return { label: "Fair", color: "bg-amber-500", width: "w-2/5" };
    if (passed === 3) return { label: "Good", color: "bg-amber-400", width: "w-3/5" };
    if (passed === 4) return { label: "Strong", color: "bg-emerald-500", width: "w-4/5" };
    return { label: "Excellent", color: "bg-emerald-600", width: "w-full" };
  }, [ruleResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!allValid) {
      setError("Your new password doesn't meet the security requirements.");
      return;
    }
    if (!matches) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (data?.user) {
        login(data.user);
      }
      setSuccess(
        "Your password has been updated. Redirecting you back to your dashboard…"
      );
      setTimeout(() => {
        const target =
          nextPath && nextPath.startsWith("/")
            ? nextPath
            : user?.role === "admin"
            ? "/admin/dashboard"
            : "/portal/dashboard";
        router.replace(target);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Couldn't update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-navy">
              {isForced ? "Set a new password" : "Change your password"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isForced
                ? "For your security, the clinic requires you to set a new password before continuing."
                : "Choose a strong password you don't use elsewhere."}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-lg flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Current password"
            icon={<Lock className="w-3.5 h-3.5 text-gold" />}
          >
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pr-11`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-navy transition-colors focus:outline-none"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </Field>

          <Field
            label="New password"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-gold" />}
          >
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-11`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-navy transition-colors focus:outline-none"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {newPassword && (
              <div className="space-y-2 mt-1">
                <div className="h-1 bg-gray-100 rounded-full w-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} ${strength.width} transition-all`}
                  />
                </div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500">
                  {strength.label} password
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                  {ruleResults.map((rule) => (
                    <li
                      key={rule.label}
                      className={`text-[11px] flex items-center gap-1.5 ${
                        rule.ok ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 ${
                          rule.ok ? "text-emerald-500" : "text-gray-300"
                        }`}
                      />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Field>

          <Field
            label="Confirm new password"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-gold" />}
          >
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !matches && (
              <p className="text-[11px] text-red-500">Passwords don&apos;t match yet.</p>
            )}
          </Field>

          <button
            type="submit"
            disabled={submitting || !allValid || !matches}
            className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>

        {!isForced && (
          <p className="text-[11px] text-gray-400 text-center">
            Tip: use a phrase only you know — passphrases beat short passwords.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
