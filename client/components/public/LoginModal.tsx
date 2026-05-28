"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { apiRequest } from "@/lib/api";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  X,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Check,
} from "lucide-react";
import LoginOverlay from "@/components/common/LoginOverlay";
import Logo from "@/components/public/Logo";

export default function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    onLoginSuccess,
    openRegisterModal,
    loginModalView,
    setLoginModalView,
  } = useUIStore();
  const { login } = useAuthStore();

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot-password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Auto-close modal on route change
  useEffect(() => {
    const isRedirect =
      (prevPathname.endsWith("/login") || prevPathname.endsWith("/register")) &&
      pathname === "/";

    if (!isRedirect) {
      closeLoginModal();
    }
    setPrevPathname(pathname);
  }, [pathname, closeLoginModal, prevPathname]);

  // Reset form and lock scroll when modal opens/closes
  useEffect(() => {
    if (isLoginModalOpen) {
      // Pre-fill email when an invite link includes ?email=...
      let prefilled = "";
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams(window.location.search);
          const fromUrl = params.get("email");
          if (fromUrl) prefilled = fromUrl;
        } catch {
          // ignore — URL parsing failures shouldn't block login
        }
      }
      setEmail(prefilled);
      setPassword("");
      setShowPassword(false);
      setError("");
      setForgotEmail(prefilled);
      setForgotSuccess(false);
      setForgotError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.mustChangePassword) {
        setLoginModalView("force-change-password");
        setLoading(false);
        return;
      }

      login(data.user);

      // Role-based redirect always wins for admins so they don't land on
      // patient-only routes like /portal/booking that may have been set as
      // the post-login next path.
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (onLoginSuccess) {
        onLoginSuccess();
      } else if (data.user.role === "patient") {
        router.push("/portal/dashboard");
      }

      closeLoginModal();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");

    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSuccess(true);
    } catch (err: any) {
      // Treat "user not found" as success-equivalent to avoid leaking account presence
      const status = err?.status;
      if (status === 404) {
        setForgotSuccess(true);
      } else {
        setForgotError(err?.message || "Couldn't send reset email. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const isForgot = loginModalView === "forgot";

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-navy/40 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-4 overflow-y-auto no-scrollbar">
      {loading && <LoginOverlay />}
      {/* Backdrop (desktop only) */}
      <div
        className="hidden md:block absolute inset-0 transition-opacity duration-300"
        onClick={loginModalView === "force-change-password" ? undefined : closeLoginModal}
      />

      <div className="relative w-full h-full md:h-auto min-h-screen md:min-h-0 md:max-w-[880px] md:max-h-[92vh] md:overflow-hidden bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 grid grid-cols-1 md:grid-cols-12 z-10 animate-fade-up">
        {loginModalView !== "force-change-password" && (
          <>
            {/* Mobile Top Bar with Back Button */}
            <div className="md:hidden px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20">
              <button
                onClick={closeLoginModal}
                className="flex items-center gap-1.5 text-gray-600 hover:text-navy font-semibold text-sm transition-colors py-1.5 focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4 text-gold" />
                <span>Back</span>
              </button>
              <Logo variant="full" theme="dark" size={28} asLink={false} />
            </div>
            {/* Desktop Close Button */}
            <button
              onClick={closeLoginModal}
              className="hidden md:block absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors z-30 focus:outline-none border border-gray-100"
              aria-label="Close login"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Left brand panel */}
        <aside className="hidden md:flex md:col-span-5 bg-off-white border-r border-gray-100 p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5">
            <Logo variant="full" theme="dark" size={48} asLink={false} />
          </div>

          <div className="relative z-10 space-y-6 my-auto pt-8">
            <div className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>
                {loginModalView === "forgot"
                  ? "Account Recovery"
                  : loginModalView === "force-change-password"
                  ? "Security Action Required"
                  : "Premium Patient Portal"}
              </span>
            </div>
            <h3 className="font-serif text-3xl font-bold leading-tight text-navy">
              {loginModalView === "forgot"
                ? "Reset your password"
                : loginModalView === "force-change-password"
                ? "Secure your portal account"
                : "Welcome to your smile hub"}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {loginModalView === "forgot"
                ? "Enter the email tied to your patient account and we'll send a secure reset link."
                : loginModalView === "force-change-password"
                ? "Please set a new, complex password to replace the temporary default password. This ensures your account and medical data remain highly secure."
                : "Log in to manage appointments, access clinical records, request prescriptions, and securely message Dr. Roghay Alizadeh."}
            </p>

            {loginModalView !== "force-change-password" ? (
              <ul className="space-y-2.5 pt-1">
                <FeatureLine label="Instant online scheduling" />
                <FeatureLine label="Clinical notes & imaging records" />
                <FeatureLine label="Direct practitioner chat" />
              </ul>
            ) : (
              <ul className="space-y-2.5 pt-1">
                <FeatureLine label="Encrypted credential storage" />
                <FeatureLine label="Robust security standards" />
                <FeatureLine label="Compliant medical portal" />
              </ul>
            )}
          </div>

          <div className="relative z-10 text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
            Cork, Ireland
          </div>
        </aside>

        {/* Right panel */}
        <div className="col-span-1 md:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">
          <div className="space-y-6 max-w-md mx-auto w-full">
            {loginModalView === "forgot" ? (
              <ForgotView
                email={forgotEmail}
                setEmail={setForgotEmail}
                loading={forgotLoading}
                success={forgotSuccess}
                error={forgotError}
                onSubmit={handleForgot}
                onBack={() => {
                  setForgotSuccess(false);
                  setForgotError("");
                  setLoginModalView("signin");
                }}
              />
            ) : loginModalView === "force-change-password" ? (
              <ForceChangePasswordView
                onSuccess={(user) => {
                  login(user);
                  if (user.role === "admin") {
                    router.push("/admin/dashboard");
                  } else if (onLoginSuccess) {
                    onLoginSuccess();
                  } else if (user.role === "patient") {
                    router.push("/portal/dashboard");
                  }
                  closeLoginModal();
                }}
              />
            ) : (
              <SignInView
                email={email}
                password={password}
                showPassword={showPassword}
                loading={loading}
                error={error}
                onEmail={setEmail}
                onPassword={setPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                onSubmit={handleLogin}
                onForgot={() => setLoginModalView("forgot")}
                onRegister={openRegisterModal}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Views -------------------- */

function SignInView({
  email,
  password,
  showPassword,
  loading,
  error,
  onEmail,
  onPassword,
  onToggleShow,
  onSubmit,
  onForgot,
  onRegister,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onToggleShow: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onRegister: () => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <h2 className="font-serif text-3xl font-bold text-navy leading-none">Sign in</h2>
        <p className="text-gray-500 text-xs leading-relaxed">
          Enter your credentials to access your secure patient or staff area.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email Address" icon={<Mail className="w-3.5 h-3.5 text-gold" />}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="name@example.com"
            className={inputClass}
          />
        </Field>

        <Field
          label="Password"
          icon={<Lock className="w-3.5 h-3.5 text-gold" />}
          trailing={
            <button
              type="button"
              onClick={onForgot}
              className="text-[10px] font-bold text-gold hover:text-gold-dark hover:underline transition-colors cursor-pointer border-0 bg-transparent p-0"
            >
              Forgot password?
            </button>
          }
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-navy transition-colors focus:outline-none rounded-md"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
        >
          {loading ? "Signing In…" : "Sign In"}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500 pt-3 border-t border-gray-100">
        New to Hollyhill Dental?{" "}
        <button
          type="button"
          onClick={() => onRegister()}
          className="text-gold font-bold hover:text-gold-dark hover:underline cursor-pointer border-0 bg-transparent"
        >
          Register a patient account
        </button>
      </div>
    </>
  );
}

function ForgotView({
  email,
  setEmail,
  loading,
  success,
  error,
  onSubmit,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  success: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-navy transition-colors cursor-pointer border-0 bg-transparent p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </button>
        <h2 className="font-serif text-3xl font-bold text-navy leading-none">Forgot password</h2>
        <p className="text-gray-500 text-xs leading-relaxed">
          Enter your account email and we&apos;ll send instructions to reset it.
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-navy">Check your inbox</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              If an account exists for <span className="font-semibold text-navy">{email}</span>,
              we&apos;ve sent a password reset link. The link expires in 30 minutes.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] font-bold text-gold hover:text-gold-dark hover:underline transition-colors cursor-pointer border-0 bg-transparent p-0 mt-1"
            >
              Return to sign in
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email Address" icon={<Mail className="w-3.5 h-3.5 text-gold" />}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={inputClass}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </>
  );
}

/* -------------------- Helpers -------------------- */

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function FeatureLine({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600">
      <ChevronRight className="w-3.5 h-3.5 text-gold shrink-0" />
      <span>{label}</span>
    </li>
  );
}

function ForceChangePasswordView({
  onSuccess,
}: {
  onSuccess: (user: any) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Strength checks
  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  const isFormValid = isPasswordValid && passwordsMatch && currentPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoginOverlay />}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-red-500" />
          <span>Security Action Required</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-navy leading-none">Change Password</h2>
        <p className="text-gray-500 text-xs leading-relaxed">
          For your security, you must change your default password before accessing your dashboard.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current Password" icon={<Lock className="w-3.5 h-3.5 text-gold" />}>
          <input
            type={showPasswords ? "text" : "password"}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>

        <Field label="New Password" icon={<Lock className="w-3.5 h-3.5 text-gold" />}>
          <input
            type={showPasswords ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>

        {/* Password Strength Checklist */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password Requirements</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <CheckItem met={hasMinLength} label="At least 10 characters" />
            <CheckItem met={hasUppercase} label="At least 1 uppercase letter" />
            <CheckItem met={hasLowercase} label="At least 1 lowercase letter" />
            <CheckItem met={hasDigit} label="At least 1 number" />
            <CheckItem met={hasSpecial} label="At least 1 special char (@$!%*?&)" />
          </div>
        </div>

        <Field label="Confirm New Password" icon={<Lock className="w-3.5 h-3.5 text-gold" />}>
          <input
            type={showPasswords ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>

        {confirmPassword && !passwordsMatch && (
          <p className="text-red-500 text-[10px] font-semibold">
            Passwords do not match
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-medium">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={() => setShowPasswords(!showPasswords)}
              className="accent-gold h-4 w-4 rounded"
            />
            Show passwords
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Updating Password…" : "Update Password & Log In"}
        </button>
      </form>
    </>
  );
}

function CheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors ${met ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${met ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-300"}`}>
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
