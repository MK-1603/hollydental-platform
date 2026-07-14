"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { apiRequest } from "@/lib/api";
import Logo from "@/components/public/Logo";
import { User, Mail, Lock, Phone, Calendar, X, Activity, ShieldAlert, ArrowLeft, Eye, EyeOff, Check, Heart, ShieldCheck, ArrowRight, ChevronDown, Search, Sparkle, MessageSquare, FileText, CalendarCheck, ReceiptText } from "lucide-react";
import LoginOverlay from "@/components/common/LoginOverlay";
import ProcessingView from "@/components/public/ProcessingView";
import { useGoogleLogin } from "@react-oauth/google";

import { COUNTRIES } from "@/lib/countries";
import { text } from "stream/consumers";

export default function RegisterModal() {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal, onRegisterSuccess } = useUIStore();
  const { login } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: { country: "IE", dialCode: "+353", number: "", formatted: "" },
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    age: "",
    gdprConsent: false,
    googleId: "",
    profilePicUrl: "",
    isGoogleAuth: false,
  });

  const [loading, setLoading] = useState(false);
  const [processState, setProcessState] = useState<'idle'|'processing'|'success'>('idle');
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Auto-close modal on route change
  useEffect(() => {
    const isRedirect =
      (prevPathname.endsWith("/login") || prevPathname.endsWith("/register")) &&
      pathname === "/";

    if (!isRedirect) {
      closeRegisterModal();
    }
    setPrevPathname(pathname);
  }, [pathname, closeRegisterModal, prevPathname]);

  // Reset form
  useEffect(() => {
    if (isRegisterModalOpen) {
      setStep(1);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: { country: "IE", dialCode: "+353", number: "", formatted: "" },
        dateOfBirth: "",
        gender: "male",
        bloodGroup: "",
        age: "",
        gdprConsent: false,
        googleId: "",
        profilePicUrl: "",
        isGoogleAuth: false,
      });
      setError("");
      setProcessState("idle");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRegisterModalOpen]);

  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (!isNaN(birthDate.getTime()) && birthDate <= today) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setFormData((prev) => ({ ...prev, age: age.toString() }));
      } else {
        setFormData((prev) => ({ ...prev, age: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, age: "" }));
    }
  }, [formData.dateOfBirth]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setProcessState('processing');
      setError("");
      try {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch Google profile");
        const payload = await response.json();
        
        // Check if email already exists
        const checkRes = await apiRequest("/auth/check-email", {
          method: "POST",
          body: JSON.stringify({ email: payload.email }),
        });
        
        if (checkRes.exists) {
          setError("Account already registered. Redirecting to sign in...");
          setTimeout(() => {
            closeRegisterModal();
            openLoginModal(onRegisterSuccess || undefined);
          }, 1500);
          return;
        }

        setFormData(prev => ({
          ...prev,
          email: payload.email,
          firstName: payload.given_name || "",
          lastName: payload.family_name || "",
          googleId: payload.sub,
          profilePicUrl: payload.picture || "",
          isGoogleAuth: true
        }));
        setProcessState('idle');
        setStep(2);
      } catch (err: any) {
        setError(err.message || "Google integration failed.");
        setProcessState('idle');
      }
    },
    onError: () => {
      setError("Google authentication was unsuccessful.");
    }
  });

  if (!isRegisterModalOpen) return null;

  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return { label: "", color: "bg-gray-200", width: "w-0" };

    let score = 0;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\\d/.test(p)) score++;
    if (/[@$!%*?&]/.test(p)) score++;

    if (score < 2) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
    if (score < 4) return { label: "Medium", color: "bg-amber-500", width: "w-2/4" };
    if (score < 5) return { label: "Strong", color: "bg-emerald-500", width: "w-3/4" };
    return { label: "Very Strong", color: "bg-indigo-500", width: "w-full" };
  };

  const strength = getPasswordStrength();
  const isMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const handleNextStep = async () => {
    setError("");

    if (step === 1) {
      if (!formData.email || !formData.email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      
      setLoading(true);
      try {
        const checkRes = await apiRequest("/auth/check-email", {
          method: "POST",
          body: JSON.stringify({ email: formData.email }),
        });
        if (checkRes.exists) {
          setError("Account already registered. Redirecting to sign in...");
          setTimeout(() => {
            closeRegisterModal();
            openLoginModal(onRegisterSuccess || undefined);
          }, 1500);
          return;
        }
        setStep(2);
      } catch (err: any) {
        setError("Failed to verify email. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError("Please ensure your password meets all requirements below.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError("Please enter both your first and last names.");
        return;
      }
      if (!formData.phone.number.trim()) {
        setError("Please enter your contact mobile number.");
        return;
      }
      if (!formData.dateOfBirth) {
        setError("Please select your date of birth.");
        return;
      }
      if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        setError("You must be at least 1 year old to register.");
        return;
      }
      if (!formData.bloodGroup) {
        setError("Please select your blood group.");
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      handleNextStep();
      return;
    }

    if (!formData.gdprConsent) {
      setError("You must accept the GDPR terms to register.");
      return;
    }

    setProcessState('processing');
    setError("");

    try {
      const { confirmPassword, phone, isGoogleAuth, ...restData } = formData;
      const submitData = {
        ...restData,
        phone: phone.formatted || `${phone.dialCode} ${phone.number}`,
      };
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(submitData),
      });

      login(data.user);
      setProcessState('success');
      setTimeout(() => {
        closeRegisterModal();
        if (onRegisterSuccess) onRegisterSuccess();
        else router.push("/portal/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try a different email.");
      setProcessState('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex overflow-y-auto overflow-x-hidden font-inter no-scrollbar bg-white md:bg-[#0F172A]/40 md:backdrop-blur-sm transition-all duration-300">
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');" +
        "@keyframes custom-slide-up { from { opacity: 0; transform: translateY(30px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }" +
        ".animate-card-slide { animation: custom-slide-up 0.2s ease-out forwards; }"
      }</style>
      
      <div className="hidden md:block absolute inset-0 bg-transparent animate-fade-in" onClick={closeRegisterModal} />

      

      {/* Centered Authentication Container */}
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-0 sm:p-4 md:p-8 relative z-10">
        
        {/* Mobile Top Bar */}
        <div className="md:hidden absolute top-0 left-0 right-0 px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white z-20">
          <button onClick={step > 1 ? handlePrevStep : closeRegisterModal} className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] font-semibold text-sm transition-colors py-1.5 focus:outline-none">
            <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            <span>{step > 1 ? "Back" : "Close"}</span>
          </button>
          <Logo variant="full" theme="dark" size={28} asLink={false} />
        </div>

        {/* Floating Card - Master Design Spec */}
        <div className="w-full h-auto min-h-[100dvh] md:min-h-0 md:max-w-[960px] md:w-[960px] h-[98vh] max-h-[98vh] md:overflow-hidden bg-white md:rounded-[24px] md:shadow-2xl md:border md:border-[#F1F5F9] flex flex-col md:flex-row relative animate-card-slide z-10 transition-all duration-200 ease-in-out">
          {processState !== 'idle' ? (
            <ProcessingView type="register" status={processState} />
          ) : (
            <>

          {/* LEFT PANEL (42%) */}
          <div className="hidden md:flex w-[42%] bg-[#F8FAFC] border-r border-[#E2E8F0] pt-[12px] pb-[16px] px-8 lg:px-10 flex-col justify-between relative overflow-hidden">
            
            <div className="w-[85%] mx-auto flex flex-col h-full relative z-10">
              
              {/* Logo */}
              <div className="flex items-center justify-center mb-[12px]">
                <Logo variant="full" theme="dark" size={36} asLink={false} />
              </div>

              {/* Premium Badge */}
              <div className="mb-[16px] inline-flex items-center gap-2 bg-[#EEF6FF] border border-[#2563EB]/20 text-[#2563EB] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max shadow-sm transition-all hover:bg-[#E0F2FE]">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> PREMIUM ONBOARDING
              </div>

              {/* Heading */}
              <h2 className="text-[28px] lg:text-[32px] font-bold text-[#0F172A] leading-[1.2] mb-[4px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Create Your<br />Secure Account
              </h2>

              {/* Description */}
              <p className="text-[#64748B] text-[14px] leading-relaxed mb-[16px] font-medium">
                Securely access appointments, medical records, prescriptions, and communicate with your healthcare provider from anywhere.
              </p>

              {/* Feature List */}
              <div className="flex flex-col mb-auto">
                <div className="flex items-start gap-4 py-1.5 border-b border-[#E2E8F0]/80">
                  <div className="w-[24px] h-[24px] rounded-full bg-[#EEF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Secure Messaging</h5>
                    <p className="text-[12px] text-[#64748B]">HIPAA encrypted communication</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-1.5">
                  <div className="w-[24px] h-[24px] rounded-full bg-[#EEF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-[#0F172A] mb-0.5">Medical Records</h5>
                    <p className="text-[12px] text-[#64748B]">Access your clinical history</p>
                  </div>
                </div>

              </div>

              {/* Security Card */}
              <div className="mt-[12px] bg-[#EEF6FF] rounded-[14px] p-[14px] flex items-start gap-3 border border-[#2563EB]/10 max-h-[70px]">
                <div className="w-[32px] h-[32px] flex items-center justify-center bg-white rounded-full text-[#2563EB] shadow-sm shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col justify-center h-full">
                  <h5 className="text-[#0F172A] text-[12px] font-bold mb-0.5 leading-none">Enterprise Security</h5>
                  <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap text-[9px] text-[#64748B] font-medium uppercase tracking-wider leading-none mt-1">
                    <span>256-bit</span>
                    <span>•</span>
                    <span>HIPAA</span>
                    <span>•</span>
                    <span>Cloud</span>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* RIGHT PANEL (58%) */}
          <div className="w-full md:w-[58%] px-5 pb-8 pt-[84px] sm:p-8 lg:p-10 flex flex-col justify-start md:justify-center relative bg-white min-h-[100dvh] md:h-auto md:min-h-0 overflow-y-auto md:overflow-visible transition-none md:transition-all duration-200 ease-in-out">
            <button
              onClick={closeRegisterModal}
              className="absolute top-6 right-5 md:top-8 md:right-8 p-2 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none bg-white md:bg-transparent shadow-sm md:shadow-none z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col justify-start pb-[20px] md:pb-[30px] pt-[20px] md:pt-[30px]">
              
              {/* Premium Horizontal Stepper */}
              <div className="mb-[16px] md:mb-[20px] w-full mt-2 md:mt-0">
                <div className="relative flex items-start justify-between w-full">
                  <div className="absolute top-[12px] left-[12%] right-[12%] h-[2px] bg-[#F1F5F9] -z-10" />
                  <div
                    className="absolute top-[12px] left-[12%] h-[2px] bg-[#2563EB] transition-all duration-500 -z-10"
                    style={{ width: `${((step - 1) / 3) * 76}%` }}
                  />
                  {[1, 2, 3, 4].map((s) => {
                    const isCompleted = step > s;
                    const isCurrent = step === s;
                    return (
                      <div key={s} className="flex flex-col items-center flex-1">
                        <div className="bg-white px-1 mb-1.5">
                          <div
                            className={"w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-bold shadow-sm transition-all duration-300 " +
                              (isCompleted
                                ? "bg-[#10B981] text-white border-none"
                                : isCurrent
                                ? "bg-[#2563EB] text-white border-none ring-4 ring-[#2563EB]/10 scale-110"
                                : "bg-white text-[#94A3B8] border-2 border-[#E2E8F0]")
                            }
                          >
                            {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : s}
                          </div>
                        </div>
                        <span
                          className={"text-[9px] md:text-[10px] uppercase tracking-wide md:tracking-widest font-bold transition-colors text-center " +
                            (isCurrent ? "text-[#0F172A]" : isCompleted ? "text-[#10B981]" : "text-[#94A3B8]")
                          }
                        >
                          {s === 1 ? "Identity" : s === 2 ? "Security" : s === 3 ? "Details" : "Review"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Header */}
              <div className="text-center md:text-left mb-[8px]">
                <h2 className="text-[22px] md:text-[24px] font-bold text-[#0F172A] mb-[8px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step === 1 && "Account Identity"}
                  {step === 2 && "Account Security"}
                  {step === 3 && "Demographics"}
                  {step === 4 && "Review & Consent"}
                </h2>
                <p className="text-[14px] text-[#64748B] leading-relaxed">
                  {step === 1 && "Enter your email or use Google to begin."}
                  {step === 2 && "Create a secure password for your patient portal."}
                  {step === 3 && "Provide your clinical details and medical parameters."}
                  {step === 4 && "Verify your summary details and finalize setup."}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-[10px] p-[10px] bg-[#FEF2F2] border border-[#FCA5A5] rounded-[16px] flex items-start gap-3 animate-fade-in">
                  <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <p className="text-[13px] font-medium text-[#991B1B] leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="w-full flex flex-col space-y-[16px]">
                
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="flex flex-col gap-[12px] animate-fade-in">
                    <div className="mb-[12px] flex justify-center w-full">
                      <button
                        type="button"
                        onClick={() => googleLogin()}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-bold h-[48px] rounded-[16px] text-[15px] transition-all duration-200 shadow-sm hover:shadow focus:outline-none"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 mb-[12px]">
                      <div className="h-[1px] bg-[#E2E8F0] flex-1"></div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Or continue with email</span>
                      <div className="h-[1px] bg-[#E2E8F0] flex-1"></div>
                    </div>

                    <FloatingField label="Email Address" icon={<Mail className="w-4 h-4" />}>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john.doe@example.com"
                        className={inputClass}
                        disabled={formData.isGoogleAuth}
                      />
                    </FloatingField>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="flex flex-col gap-[12px] animate-fade-in">
                    {formData.isGoogleAuth && (
                      <FloatingField label="Email Address (Locked)" icon={<Mail className="w-4 h-4" />}>
                        <input
                          type="email"
                          readOnly
                          value={formData.email}
                          className={inputClass + " bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"}
                        />
                      </FloatingField>
                    )}

                    <FloatingField label="Secure Password" icon={<Lock className="w-4 h-4" />}>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className={inputClass + " pr-12"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FloatingField>

                    <FloatingField label="Confirm Password" icon={<Lock className="w-4 h-4" />}>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className={inputClass + " pr-12 " + (isMatch ? 'border-[#10B981] focus:border-[#10B981] focus:ring-[#10B981]/15' : formData.confirmPassword ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15' : '')}
                        />
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 transition-opacity">
                            {isMatch && <Check className="w-4 h-4 text-[#10B981]" />}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FloatingField>

                    {/* Password Quality Module */}
                    <div className="group relative focus-within:z-20 mt-[4px]">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[18px] p-[16px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">Password Quality</span>
                          <span className={"text-[11px] font-bold uppercase tracking-widest " + (strength.label === "Weak" ? "text-[#EF4444]" : strength.label === "Medium" ? "text-[#F59E0B]" : strength.label === "Strong" ? "text-[#10B981]" : "text-[#2563EB]")}>
                            {formData.password.length === 0 ? "Empty" : strength.label === "Excellent" || strength.label === "Very Strong" ? "Healthcare Grade" : strength.label}
                          </span>
                        </div>
                        <div className="h-[6px] w-full bg-[#E2E8F0] rounded-full overflow-hidden flex gap-1 mb-[4px]">
                          <div className={"h-full rounded-full transition-all duration-500 " + (formData.password.length > 0 ? (strength.label === "Weak" ? "bg-[#EF4444] w-1/4" : strength.label === "Medium" ? "bg-[#F59E0B] w-2/4" : strength.label === "Strong" ? "bg-[#10B981] w-3/4" : "bg-[#2563EB] w-full") : "w-0")} />
                        </div>
                        
                        {/* Requirements list expands on focus-within */}
                        <div className={"overflow-hidden transition-all duration-300 ease-in-out " + (strength.label === "Very Strong" || formData.password.length === 0 ? "max-h-0 opacity-0" : "group-focus-within:max-h-[140px] group-focus-within:opacity-100 max-h-0 opacity-0 group-focus-within:mt-3")}>
                          <div className="grid grid-cols-2 gap-y-1.5">
                            <div className={"flex items-center gap-2 text-[11px] font-medium " + (formData.password.length >= 10 ? "text-[#10B981]" : "text-[#64748B]")}><Check className="w-3.5 h-3.5" /> 10 Characters</div>
                            <div className={"flex items-center gap-2 text-[11px] font-medium " + (/[A-Z]/.test(formData.password) ? "text-[#10B981]" : "text-[#64748B]")}><Check className="w-3.5 h-3.5" /> Uppercase</div>
                            <div className={"flex items-center gap-2 text-[11px] font-medium " + (/[a-z]/.test(formData.password) ? "text-[#10B981]" : "text-[#64748B]")}><Check className="w-3.5 h-3.5" /> Lowercase</div>
                            <div className={"flex items-center gap-2 text-[11px] font-medium " + (/\d/.test(formData.password) ? "text-[#10B981]" : "text-[#64748B]")}><Check className="w-3.5 h-3.5" /> Number</div>
                            <div className={"flex items-center gap-2 text-[11px] font-medium " + (/[@$!%*?&]/.test(formData.password) ? "text-[#10B981]" : "text-[#64748B]")}><Check className="w-3.5 h-3.5" /> Special Char</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="flex flex-col gap-[12px] animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                      <FloatingField label="First Name" icon={<User className="w-4 h-4" />}>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                          className={inputClass}
                        />
                      </FloatingField>
                      <FloatingField label="Last Name" icon={<User className="w-4 h-4" />}>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                          className={inputClass}
                        />
                      </FloatingField>
                    </div>

                    <div className="relative group">
                      <label className="absolute left-[16px] -top-2 bg-white px-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider z-[60] pointer-events-none transition-colors group-focus-within:text-[#2563EB]">
                        Mobile Number
                      </label>
                      <IntlPhoneSelector
                        value={formData.phone}
                        onChange={(phoneObj) => setFormData({ ...formData, phone: phoneObj })}
                      />
                    </div>

                    <div className="relative group mt-[2px]">
                      <label className="absolute left-[16px] -top-2 bg-white px-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider z-20 pointer-events-none transition-colors group-focus-within:text-[#2563EB]">
                        Date of Birth
                      </label>
                      <DateSelector 
                        value={formData.dateOfBirth} 
                        onChange={(val) => setFormData({ ...formData, dateOfBirth: val })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-[12px] mt-[2px]">
                      <FloatingField label="Age" icon={<Calendar className="w-4 h-4" />}>
                        <input
                          type="number"
                          readOnly
                          value={formData.age}
                          className={inputClass + " bg-[#F8FAFC] text-[#64748B] cursor-not-allowed border-[#E2E8F0]/80 focus:ring-0 pl-[42px]"}
                          placeholder="Auto"
                        />
                      </FloatingField>

                      <div className="relative group col-span-1">
                        <label className="absolute left-[16px] -top-2 bg-white px-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider z-20 pointer-events-none transition-colors group-focus-within:text-[#2563EB]">
                          Gender
                        </label>
                        <PremiumSelect value={formData.gender} onChange={(val) => setFormData({ ...formData, gender: val })} options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} placeholder="Select" />
                      </div>

                      <div className="relative group col-span-1">
                        <label className="absolute left-[16px] -top-2 bg-white px-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider z-20 pointer-events-none transition-colors group-focus-within:text-[#2563EB]">
                          Blood
                        </label>
                        <PremiumSelect value={formData.bloodGroup} onChange={(val) => setFormData({ ...formData, bloodGroup: val })} options={['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'].map(v => ({value:v, label:v==='Unknown'?'Unk':v}))} placeholder="Select" />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="flex flex-col gap-[16px] animate-fade-in">
                    <div className="relative bg-white border border-[#E2E8F0] rounded-[24px] p-6 shadow-sm overflow-hidden mb-2">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB] rounded-full blur-[60px] opacity-5 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#10B981] rounded-full blur-[60px] opacity-[0.02] pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <Logo variant="icon" theme="dark" size={24} asLink={false} />
                          <span className="font-bold tracking-widest text-[11px] uppercase text-[#64748B]">Digital Profile</span>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 relative z-10">
                        <div className="col-span-2">
                          <span className="text-[#94A3B8] block font-medium text-[10px] uppercase tracking-wider mb-1">Patient Name</span>
                          <span className="text-[#0F172A] font-bold text-[18px] leading-none block" style={{ fontFamily: "'Playfair Display', serif" }}>{formData.firstName} {formData.lastName}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block font-medium text-[10px] uppercase tracking-wider mb-1">Contact</span>
                          <span className="text-[#0F172A] font-medium text-[13px]">{formData.phone.formatted || (formData.phone.dialCode + " " + formData.phone.number)}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block font-medium text-[10px] uppercase tracking-wider mb-1">Parameters</span>
                          <span className="text-[#0F172A] font-medium text-[13px] uppercase">{formData.age} Y / {formData.gender} / <span className="text-[#10B981] font-bold">{formData.bloodGroup}</span></span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer text-[13px] text-[#475569] select-none bg-white p-4 rounded-[18px] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-200 group shadow-sm">
                      <input
                        type="checkbox"
                        required
                        checked={formData.gdprConsent}
                        onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981]/20 border-[#CBD5E1] transition-colors"
                      />
                      <span className="leading-relaxed font-medium group-hover:text-[#0F172A] transition-colors">
                        I authorize HollyHill Dental Clinic to securely store my digital clinical profile records and accept the HIPAA/GDPR data protection terms.
                      </span>
                    </label>
                  </div>
                )}

                {/* ACTION NAVIGATION BUTTONS */}
                <div className="flex gap-[12px] pt-[8px]">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={loading}
                      className="flex-[1] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] font-bold h-[48px] rounded-[16px] text-[14px] transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none shadow-sm hover:-translate-y-[2px]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </button>
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-[2] bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e40af] text-white font-bold h-[48px] rounded-[16px] text-[15px] shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-[2px] transition-all duration-200 ease-out flex items-center justify-center gap-2 focus:outline-none"
                    >
                      <span>Next Details</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !formData.gdprConsent}
                      className="flex-[2] bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold h-[48px] rounded-[16px] text-[15px] shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:-translate-y-[2px] transition-all duration-200 ease-out disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
                    >
                      <span>{loading ? "Registering..." : "Create Account"}</span>
                      {!loading && <Check className="w-5 h-5" strokeWidth={3} />}
                    </button>
                  )}
                </div>
              </form>

            </div>
            {/* Footer - Restored to Flow */}
            <div className="text-center text-[14px] font-medium text-[#64748B] pt-[12px] mt-auto">

              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { closeRegisterModal(); openLoginModal(onRegisterSuccess || undefined); }}
                className="text-[#2563EB] font-bold hover:text-[#1D4ED8] transition-colors focus:outline-none"
              >
                Sign In
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


function PremiumSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative w-full group" ref={ref}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={"w-full flex items-center justify-between bg-white border rounded-[16px] px-3 h-[44px] text-[14px] font-medium transition-all duration-200 focus:outline-none " + (isOpen ? "border-[#2563EB] ring-4 ring-[#2563EB]/15" : "border-[#E2E8F0] hover:border-[#CBD5E1]")}>
        <span className={selected ? "text-[#0F172A]" : "text-[#94A3B8]"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={"w-4 h-4 transition-transform duration-200 shrink-0 " + (isOpen ? "rotate-180 text-[#2563EB]" : "text-[#94A3B8] group-hover:text-[#64748B]")} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E2E8F0] shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[12px] z-[80] max-h-[180px] overflow-y-auto custom-scrollbar py-1 animate-fade-in origin-top">
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setIsOpen(false); }} className={"w-full text-left px-3 py-2 text-[13px] transition-colors " + (value === opt.value ? "bg-[#EEF6FF] text-[#2563EB] font-bold" : "text-[#475569] hover:bg-[#F8FAFC]")}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// UTILITY COMPONENTS
// -------------------------------------------------------------

const inputClass =
  "w-full bg-white border border-[#E2E8F0] rounded-[16px] pl-[42px] pr-4 h-[44px] text-[14px] text-[#0F172A] font-medium placeholder-transparent focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-200 shadow-[0_2px_10px_rgba(15,23,42,0.02)]";

function FloatingField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-[14px] top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-200 group-focus-within:text-[#2563EB] text-[#94A3B8]">
        {icon}
      </div>
      {children}
      <label className="absolute left-[42px] -top-2 bg-white px-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider transition-all duration-200 group-focus-within:text-[#2563EB] z-10 pointer-events-none">
        {label}
      </label>
    </div>
  );
}

// Enterprise Phone Picker with Search
function IntlPhoneSelector({ value, onChange }: { value: any, onChange: (val: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountry = COUNTRIES.find(c => c.code === value.country) || COUNTRIES[0];
  
  const filteredCountries = useMemo(() => {
    const s = search.toLowerCase();
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.dial.includes(s) || 
      c.code.toLowerCase().includes(s)
    );
  }, [search]);

  return (
    <div className="relative flex items-center w-full h-[44px] group" ref={wrapperRef}>
      <button 
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
        className="absolute left-[1px] top-[1px] bottom-[1px] px-3 flex items-center gap-1.5 bg-white hover:bg-[#F8FAFC] border-r border-[#E2E8F0] rounded-l-[15px] transition-colors focus:outline-none z-10"
      >
        <span className="text-sm leading-none font-bold text-[#64748B]">{selectedCountry.code}</span>
        <span className="text-[13px] font-bold text-[#0F172A]">{selectedCountry.dial}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
      </button>
      
      <input
        type="tel"
        required
        value={value.number}
        onChange={(e) => {
          const number = e.target.value.replace(/[^\d\s-]/g, '');
          onChange({ ...value, number, formatted: selectedCountry.dial + " " + number });
        }}
        placeholder="087 123 4567"
        className="w-full bg-white border border-[#E2E8F0] rounded-[16px] pl-[105px] pr-4 h-[44px] text-[14px] text-[#0F172A] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 transition-all duration-200 shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
      />

      {isOpen && (
        <div className="absolute top-[60px] left-0 w-[320px] bg-white border border-[#E2E8F0] shadow-2xl rounded-[16px] z-[100] p-2 space-y-2 animate-fade-in origin-top-left">
          <div className="relative px-2 pt-2 pb-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search country or code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] pl-9 pr-3 h-[36px] text-xs focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              autoFocus
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar px-1 pb-1">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#64748B]">No countries found.</div>
            ) : (
              filteredCountries.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange({ ...value, country: c.code, dialCode: c.dial, formatted: c.dial + " " + value.number });
                    setIsOpen(false);
                  }}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors duration-200 " + (value.country === c.code ? 'bg-[#EEF6FF] text-[#2563EB] font-bold' : 'text-[#475569] hover:bg-[#F8FAFC]')}
                >
                  <span className="text-xs leading-none font-bold text-[#94A3B8]">{c.code}</span>
                  <span className="text-[13px] flex-1 text-left">{c.name}</span>
                  <span className="text-[11px] font-medium text-[#94A3B8]">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enterprise Date Selector
function DateSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");

    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split("-");
            if (y && m && d) { setYear(y); setMonth(m); setDay(d); }
        }
    }, [value]);

    useEffect(() => {
        if (day && month && year) onChange(year + "-" + month.padStart(2, '0') + "-" + day.padStart(2, '0'));
    }, [day, month, year]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 100}, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => ({ value: String(i + 1), label: m }));
    const daysCount = (month && year) ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
    const days = Array.from({length: daysCount}, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

    return (
        <div className="grid grid-cols-3 gap-2">
            <PremiumSelect value={month} onChange={setMonth} options={months} placeholder="Month" />
            <PremiumSelect value={day} onChange={setDay} options={days} placeholder="Day" />
            <PremiumSelect value={year} onChange={setYear} options={years} placeholder="Year" />
        </div>
    );
}
