"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { apiRequest } from "@/lib/api";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Activity, X, ArrowLeft, CheckCircle2, Check, FileText, ShieldCheck } from "lucide-react";
import LoginOverlay from "@/components/common/LoginOverlay";
import ProcessingView from "@/components/public/ProcessingView";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processState, setProcessState] = useState<'idle'|'processing'|'success'>('idle');
  const [error, setError] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    const isRedirect =
      (prevPathname.endsWith("/login") || prevPathname.endsWith("/register")) &&
      pathname === "/";
    if (!isRedirect) closeLoginModal();
    setPrevPathname(pathname);
  }, [pathname, closeLoginModal, prevPathname]);

  useEffect(() => {
    if (isLoginModalOpen) {
      let prefilled = "";
      if (typeof window !== "undefined") {
        try {
          const params = new URLSearchParams(window.location.search);
          const fromUrl = params.get("email");
          if (fromUrl) prefilled = fromUrl;
        } catch { }
      }
      setEmail(prefilled);
      setPassword("");
      setShowPassword(false);
      setError("");
      setProcessState("idle");
      setForgotEmail(prefilled);
      setForgotSuccess(false);
      setForgotError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isLoginModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setCapsLockOn(typeof e.getModifierState === 'function' ? e.getModifierState("CapsLock") : false);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isLoginModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessState('processing');
    setError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.mustChangePassword) {
        setLoginModalView("force-change-password");
        setProcessState('idle');
        return;
      }
      login(data.user);
      setProcessState('success');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
        else if (data.user.role === "admin") router.push("/admin/dashboard");
        else if (data.user.role === "patient") router.push("/portal/dashboard");
        closeLoginModal();
      }, 1500);
    } catch (err: any) {
      if (err.message === "ACCOUNT_DEACTIVATED") {
        setError("ACCOUNT_DEACTIVATED");
        setProcessState('idle');
        return;
      }
      setError(err.message || "Invalid credentials. Please try again.");
      setProcessState('idle');
    }
  };

  const handleReactivate = async () => {
    setProcessState('processing');
    setError("");
    try {
      await apiRequest("/auth/reactivate", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Just re-login after successful reactivation
      handleLogin(new Event('submit') as any);
    } catch (err: any) {
      setError(err.message || "Failed to reactivate account.");
      setProcessState('idle');
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
      const status = err?.status;
      if (status === 404) setForgotSuccess(true);
      else setForgotError(err?.message || "Couldn't send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex overflow-y-auto overflow-x-hidden font-inter no-scrollbar bg-white md:bg-[#0F172A]/40 md:backdrop-blur-sm transition-all duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        @keyframes custom-slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-slide {
          animation: custom-slide-up 0.2s ease-out forwards;
        }
      `}</style>
      
      <div className="hidden md:block absolute inset-0 bg-transparent animate-fade-in" onClick={closeLoginModal} />

      

      {/* Centered Authentication Container */}
      <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-4 md:p-8 relative z-10">

        {/* Floating Card */}
        <div className="w-full h-auto min-h-screen md:min-h-0 md:max-w-[960px] md:w-[960px] max-h-[90vh] md:overflow-hidden bg-white md:rounded-[24px] md:shadow-2xl md:border md:border-gray-100 flex flex-col md:flex-row relative animate-card-slide z-10 transition-all duration-200 ease-in-out">
          {processState !== 'idle' ? (
            <ProcessingView type="login" status={processState} />
          ) : (
            <>

          {/* LEFT PANEL */}
          <div className="hidden md:flex w-[42%] bg-[#F8FAFC] border-r border-[#E2E8F0] pt-[36px] pb-[32px] px-8 lg:px-10 flex-col relative overflow-hidden justify-center">
            {/* Logo */}
            <div className="flex items-center justify-start">
              <Logo variant="full" theme="dark" size={36} asLink={false} />
            </div>

            {/* Premium Badge */}
            <div className="mt-[20px] mb-[24px] inline-flex items-center gap-2 bg-[#EEF6FF] border border-[#2563EB]/20 text-[#2563EB] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max shadow-sm transition-all hover:bg-[#E0F2FE]">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> PREMIUM PATIENT PORTAL
            </div>

            {/* Headline */}
            <h2 className="text-[28px] lg:text-[32px] font-bold text-[#0F172A] leading-[1.12] mb-[20px] max-w-[340px]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome to your<br />Smile Hub
            </h2>

            {/* Description */}
            <p className="text-[#64748B] text-[14px] leading-relaxed max-w-[340px] mb-[28px]">
              Access your secure clinic portal to manage your appointments, review treatment records, and communicate with your care team.
            </p>

            {/* Security Card */}
            <div className="mt-auto pt-[20px]">
              <div className="bg-[#EEF6FF] rounded-[18px] p-[20px] flex items-start gap-4 border border-[#2563EB]/10">
                <div className="w-[44px] h-[44px] flex items-center justify-center bg-white rounded-full text-[#2563EB] shadow-sm shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-[#0F172A] text-[13px] font-medium leading-relaxed">
                    Your information is protected using enterprise-grade encryption and secure authentication.
                  </p>
                </div>
              </div>
              <div className="mt-[20px] text-[11px] font-bold text-[#64748B] uppercase tracking-widest">
                HollyHill Dental • Premium Care
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-full md:w-[58%] p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative bg-white h-[100dvh] md:h-auto md:min-h-0 overflow-y-auto md:overflow-visible transition-all duration-200 ease-in-out">

            <button
              onClick={closeLoginModal}
              className="absolute top-6 right-5 md:top-6 md:right-6 p-2 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none bg-white md:bg-transparent shadow-sm md:shadow-none z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:hidden mb-4 mt-2 flex justify-center">
              <Logo variant="full" theme="dark" size={26} asLink={false} />
            </div>

            <div className="w-full max-w-[380px] mx-auto flex-1 flex flex-col justify-center pb-6 md:pb-0">
              {loginModalView === "forgot" ? (
                <ForgotView
                  email={forgotEmail} setEmail={setForgotEmail} loading={forgotLoading} success={forgotSuccess}
                  error={forgotError} onSubmit={handleForgot} onBack={() => { setForgotSuccess(false); setForgotError(""); setLoginModalView("signin"); }}
                />
              ) : loginModalView === "force-change-password" ? (
                <ForceChangePasswordView
                  capsLockOn={capsLockOn} onSuccess={(user: any) => {
                    login(user);
                    if (user.role === "admin") router.push("/admin/dashboard");
                    else if (onLoginSuccess) onLoginSuccess();
                    else if (user.role === "patient") router.push("/portal/dashboard");
                    closeLoginModal();
                  }}
                />
              ) : (
                <SignInView
                  email={email} password={password} showPassword={showPassword} loading={loading} error={error}
                  capsLockOn={capsLockOn}
                  onEmail={setEmail} onPassword={setPassword} onToggleShow={() => setShowPassword((v: boolean) => !v)}
                  onSubmit={handleLogin} onForgot={() => setLoginModalView("forgot")} onRegister={() => openRegisterModal(onLoginSuccess || undefined)}
                  onReactivate={handleReactivate}
                />
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Views -------------------- */

function SignInView({ 
  email, password, showPassword, loading, error, capsLockOn,
  onEmail, onPassword, onToggleShow, onSubmit, onForgot, onRegister, onGoogleLogin, onReactivate 
}: any) {
  const buttonClass = "w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-[14px] font-bold py-[14px] rounded-[14px] shadow-[0_2px_4px_rgba(15,23,42,0.06)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.1)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="animate-fade-up w-full">
      <div className="mb-[24px] text-center md:text-left">
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#0F172A] mb-[12px]" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome Back</h2>
        <p className="text-[#64748B] text-[13px] md:text-[14px] leading-relaxed">Sign in securely to continue to HollyHill Dental.</p>
      </div>

      <button type="button" onClick={onGoogleLogin} className="w-full h-[52px] rounded-[14px] px-[16px] bg-white border border-[#E2E8F0] flex items-center justify-center gap-3 text-[14px] md:text-[15px] font-semibold text-[#0F172A] shadow-sm hover:bg-[#F8FAFC] hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#E2E8F0]/50 mb-[20px] group">
        <svg className="w-[20px] h-[20px] group-hover:scale-110 transition-transform duration-200 ease-out" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center justify-center gap-4 mb-[20px]">
        <div className="h-[1px] bg-[#E2E8F0] flex-1"></div>
        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Or continue with email</span>
        <div className="h-[1px] bg-[#E2E8F0] flex-1"></div>
      </div>

      {error === "ACCOUNT_DEACTIVATED" ? (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[12px] md:text-[13px] p-4 rounded-[14px] flex flex-col gap-2 mb-[20px]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-semibold">Your account is deactivated.</span>
          </div>
          <button type="button" onClick={onReactivate} disabled={loading} className="mt-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg self-start transition-colors disabled:opacity-50 text-[12px]">
            {loading ? "Reactivating..." : "Reactivate Account"}
          </button>
        </div>
      ) : error ? (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[12px] md:text-[13px] p-4 rounded-[14px] flex items-center gap-3 mb-[20px]">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col">
        <div className="mb-[16px]">
          <FloatingInput
            id="email" label="Email Address" type="email" value={email} onChange={(e: any) => onEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />} placeholder="name@example.com"
          />
        </div>

        <div className="mb-[16px]">
          <FloatingInput
            id="password" label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e: any) => onPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />} placeholder="••••••••"
            capsLockWarning={capsLockOn} showToggle={true} isPasswordVisible={showPassword} onToggle={onToggleShow}
          />
        </div>

        <div className="flex items-center justify-between mb-[24px]">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-[16px] h-[16px] rounded-[4px] border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]/20 transition-all cursor-pointer" />
            <span className="text-[13px] font-medium text-[#64748B] group-hover:text-[#0F172A] transition-colors">Remember Me</span>
          </label>
          <button type="button" onClick={onForgot} className="text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={loading} className={`${buttonClass} mb-[24px]`}>
          {loading ? (
            <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing In...</>
          ) : "Sign In"}
        </button>
      </form>

      <div className="text-center text-[14px] font-medium text-[#64748B] mb-[12px]">
        New to HollyHill Dental?{" "}
        <button type="button" onClick={onRegister} className="text-[#2563EB] font-bold hover:text-[#1D4ED8] transition-colors">
          Register
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-medium text-[#94A3B8]">
        <button className="hover:text-[#0F172A] transition-colors">Need Help?</button>
        <button className="hover:text-[#0F172A] transition-colors">Privacy Policy</button>
        <button className="hover:text-[#0F172A] transition-colors">Terms of Service</button>
      </div>
    </div>
  );
}

function ForgotView({ email, setEmail, loading, success, error, onSubmit, onBack }: any) {
  return (
    <div className="animate-fade-up w-full">
      <div className="mb-[24px] text-center md:text-left">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-[16px]">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </button>
        <h2 className="text-[28px] font-bold text-[#0F172A] mb-[8px]" style={{ fontFamily: "'Playfair Display', serif" }}>Reset Password</h2>
        <p className="text-[#64748B] text-[14px] leading-relaxed">Enter your account email and we'll send secure instructions to reset it.</p>
      </div>

      {success ? (
        <div className="rounded-[20px] border border-[#10B981]/20 bg-[#10B981]/5 p-8 flex flex-col gap-4 text-center items-center mb-[20px]">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
          </div>
          <div className="space-y-3">
            <p className="text-[18px] font-bold text-[#0F172A]">Check your inbox</p>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              If an account exists for <span className="font-semibold text-[#0F172A]">{email}</span>, we've sent a secure reset link. It expires in 30 minutes.
            </p>
          </div>
          <button type="button" onClick={onBack} className="mt-6 text-[14px] font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors bg-[#EEF6FF] px-6 py-2.5 rounded-full">
            Return to sign in
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[13px] p-4 rounded-[14px] flex items-center gap-3 mb-[20px]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="mb-[20px]">
              <FloatingInput
                id="forgotEmail" label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />} placeholder="name@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className={buttonClass + " mb-[20px]"}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-medium text-[#94A3B8]">
        <button className="hover:text-[#0F172A] transition-colors">Need Help?</button>
        <button className="hover:text-[#0F172A] transition-colors">Privacy Policy</button>
        <button className="hover:text-[#0F172A] transition-colors">Terms of Service</button>
      </div>
    </div>
  );
}

function ForceChangePasswordView({ onSuccess, capsLockOn }: any) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial && passwordsMatch && currentPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up w-full">
      <div className="mb-[24px] text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-[16px]">
          <Lock className="w-3.5 h-3.5" /> Security Action Required
        </div>
        <h2 className="text-[28px] font-bold text-[#0F172A] mb-[8px]" style={{ fontFamily: "'Playfair Display', serif" }}>Update Password</h2>
        <p className="text-[#64748B] text-[14px] leading-relaxed">For your security, you must change your default password before accessing your medical records.</p>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[13px] p-4 rounded-[14px] flex items-center gap-3 mb-[20px]">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-[18px]">
          <FloatingInput
            id="currentPassword" label="Current Password" type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />} placeholder="••••••••"
          />
        </div>

        <div className="mb-[18px]">
          <FloatingInput
            id="newPassword" label="New Password" type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />} placeholder="••••••••"
          />
        </div>

        <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E2E8F0] space-y-3 mb-[18px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Security Requirements</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <CheckItem met={hasMinLength} label="Min 10 chars" />
            <CheckItem met={hasUppercase} label="1 uppercase" />
            <CheckItem met={hasLowercase} label="1 lowercase" />
            <CheckItem met={hasDigit} label="1 number" />
            <CheckItem met={hasSpecial} label="1 special char" />
          </div>
        </div>

        <div className="mb-[18px]">
          <FloatingInput
            id="confirmPassword" label="Confirm New Password" type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />} placeholder="••••••••"
            capsLockWarning={capsLockOn} showToggle={true} isPasswordVisible={showPasswords} onToggle={() => setShowPasswords(!showPasswords)}
          />
          {confirmPassword && !passwordsMatch && <p className="text-[#DC2626] text-[13px] font-medium pt-1 px-4">Passwords do not match</p>}
        </div>

        <button type="submit" disabled={loading || !isFormValid} className={buttonClass + " mb-[20px]"}>
          {loading ? "Updating..." : "Update & Access Portal"}
        </button>
      </form>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

const buttonClass = "w-full h-[52px] rounded-[14px] bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] text-white font-bold text-[15px] tracking-wide shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-[2px] transition-all duration-200 ease-out disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2";

function FloatingInput({ id, label, icon, type, value, onChange, placeholder = " ", required = true, capsLockWarning = false, showToggle = false, onToggle = undefined, isPasswordVisible = false }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-[16px] top-[16px] text-[#94A3B8] peer-focus:text-[#2563EB] transition-colors z-10 pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="peer w-full h-[52px] pl-[46px] pr-[76px] pt-[16px] pb-[4px] text-[15px] font-medium text-[#0F172A] bg-white border border-[#E2E8F0] rounded-[14px] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all placeholder-transparent shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
        placeholder={placeholder}
      />
      <label
        htmlFor={id}
        className="absolute left-[46px] top-[8px] text-[10px] font-bold text-[#64748B] uppercase tracking-widest transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-[8px] peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-[#2563EB] peer-focus:uppercase peer-focus:tracking-widest cursor-text pointer-events-none"
      >
        {label}
      </label>

      <div className="absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
        {capsLockWarning && (
          <div className="flex items-center gap-1 bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm" title="Caps Lock is ON">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CAPS</span>
          </div>
        )}
        {showToggle && (
          <button type="button" onClick={onToggle} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none p-1 rounded-md" aria-label="Toggle password visibility">
            {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="flex items-center gap-[16px] p-[16px] h-[72px] rounded-[16px] bg-white border border-[#E2E8F0]/80 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] group">
      <div className="w-[44px] h-[44px] flex items-center justify-center rounded-[14px] bg-[#EEF6FF] text-[#2563EB] shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="font-bold text-[#0F172A] text-[16px] leading-tight mb-[2px]">{title}</h4>
        <p className="text-[13px] text-[#64748B] leading-tight">{desc}</p>
      </div>
    </div>
  );
}

function CheckItem({ met, label }: any) {
  return (
    <div className={`flex items-center gap-2 transition-colors ${met ? "text-[#10B981] font-bold" : "text-[#94A3B8] font-medium"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${met ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#F1F5F9] text-[#94A3B8]"}`}>
        <Check className="w-3 h-3 stroke-[3]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
