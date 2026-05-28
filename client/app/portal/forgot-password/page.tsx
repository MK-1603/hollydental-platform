"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Eye, EyeOff, Lock, Check, AlertCircle, ArrowLeft } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = !next ? null : PASSWORD_REGEX.test(next) ? "strong" : next.length >= 6 ? "medium" : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (!PASSWORD_REGEX.test(next)) {
      setError("Password must be ≥10 chars with uppercase, lowercase, digit and special character (@$!%*?&).");
      return;
    }
    setLoading(true);
    try {
      // Sign in first to verify identity, then change password
      await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: current }),
      });
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Check your email and current password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-navy">Password Updated</h2>
          <p className="text-gray-500 text-xs mt-2">Your password has been changed successfully. You can now sign in with your new password.</p>
        </div>
        <button
          onClick={() => router.replace("/portal/login")}
          className="bg-gold hover:bg-yellow-500 text-navy font-bold py-3 px-8 rounded-xl text-sm shadow transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-navy" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy">Reset Your Password</h1>
        <p className="text-gray-500 text-xs leading-relaxed">
          Enter your email and current password to set a new one. Your current password is required to verify your identity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <Field label="Email Address">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
            placeholder="your@email.com"
            className={inputCls}
          />
        </Field>

        <PwField
          label="Current Password"
          value={current}
          show={show.current}
          onChange={(v) => { setCurrent(v); setError(""); }}
          onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
          placeholder="Your existing password"
        />

        <PwField
          label="New Password"
          value={next}
          show={show.next}
          onChange={(v) => { setNext(v); setError(""); }}
          onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
          placeholder="Min 10 chars, upper, lower, digit, symbol"
        />

        {next && (
          <div className="flex items-center gap-2 -mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${
                strength === "strong" ? "w-full bg-emerald-500" :
                strength === "medium" ? "w-2/3 bg-amber-400" : "w-1/3 bg-red-400"
              }`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              strength === "strong" ? "text-emerald-600" :
              strength === "medium" ? "text-amber-500" : "text-red-500"
            }`}>{strength}</span>
          </div>
        )}

        <PwField
          label="Confirm New Password"
          value={confirm}
          show={show.confirm}
          onChange={(v) => { setConfirm(v); setError(""); }}
          onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          placeholder="Repeat new password"
        />

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <p className="text-[10px] text-gray-400 leading-relaxed">
          Min 10 characters · uppercase · lowercase · digit · special character (@$!%*?&)
        </p>

        <button
          type="submit"
          disabled={loading || !email || !current || !next || !confirm}
          className="w-full bg-navy hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm shadow transition-colors disabled:opacity-50"
        >
          {loading ? "Updating password…" : "Reset Password"}
        </button>
      </form>

      <div className="text-center">
        <Link href="/portal/login" className="text-xs text-gray-400 hover:text-navy flex items-center justify-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

/* ── Helpers ── */
const inputCls =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function PwField({ label, value, show, onChange, onToggle, placeholder }: {
  label: string; value: string; show: boolean; placeholder?: string;
  onChange: (v: string) => void; onToggle: () => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder || "••••••••••"}
          className={`${inputCls} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  );
}
