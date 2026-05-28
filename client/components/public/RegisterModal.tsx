"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { apiRequest } from "@/lib/api";
import Logo from "@/components/public/Logo";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  X,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Heart,
  Activity,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import LoginOverlay from "@/components/common/LoginOverlay";

export default function RegisterModal() {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useUIStore();
  const { login } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    age: "",
    gdprConsent: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // Reset form and lock scroll when modal opens/closes
  useEffect(() => {
    if (isRegisterModalOpen) {
      setStep(1);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        gender: "male",
        bloodGroup: "",
        age: "",
        gdprConsent: false,
      });
      setError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRegisterModalOpen]);

  if (!isRegisterModalOpen) return null;

  // Password strength indicator
  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return { label: "", color: "bg-gray-200", width: "w-0" };
    if (p.length < 6) return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
    if (p.length < 10) return { label: "Medium", color: "bg-amber-500", width: "w-2/3" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };

  const strength = getPasswordStrength();

  // Validate current step before advancing
  const handleNextStep = () => {
    setError("");
    
    if (step === 1) {
      if (!formData.email || !formData.email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError("Password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError("Please enter both your first and last names.");
        return;
      }
      if (!formData.phone.trim()) {
        setError("Please enter your contact mobile number.");
        return;
      }
      if (!formData.dateOfBirth) {
        setError("Please select your date of birth.");
        return;
      }
      if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        setError("Please enter a valid age (1-120).");
        return;
      }
      if (!formData.bloodGroup) {
        setError("Please select your blood group.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNextStep();
      return;
    }

    if (!formData.gdprConsent) {
      setError("You must accept the GDPR terms to register.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      login(data.user);
      closeRegisterModal();
      router.push("/portal/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-navy/40 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-4 overflow-y-auto no-scrollbar">
      {loading && <LoginOverlay message="Creating your patient account..." />}
      {/* Backdrop (desktop only) */}
      <div
        className="hidden md:block absolute inset-0 transition-opacity duration-300 animate-fade-in"
        onClick={closeRegisterModal}
      />

      {/* Light Modal Container */}
      <div className="relative w-full h-auto md:h-auto min-h-screen md:min-h-0 md:max-w-[900px] md:max-h-[92vh] md:overflow-hidden bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 grid grid-cols-1 md:grid-cols-12 z-10 animate-fade-up">
        {/* Mobile Top Bar with Back Button */}
        <div className="md:hidden px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20">
          <button
            onClick={step > 1 ? handlePrevStep : closeRegisterModal}
            className="flex items-center gap-1.5 text-gray-600 hover:text-navy font-semibold text-sm transition-colors py-1.5 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 text-gold" />
            <span>{step > 1 ? "Back" : "Close"}</span>
          </button>
          <Logo variant="full" theme="dark" size={28} asLink={false} />
        </div>
        
        {/* Desktop Close Button */}
        <button
          onClick={closeRegisterModal}
          className="hidden md:block absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors z-30 focus:outline-none border border-gray-100"
          aria-label="Close registration"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Brand Panel */}
        <aside className="hidden md:flex md:col-span-5 bg-off-white border-r border-gray-100 p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5">
            <Logo variant="full" theme="dark" size={48} asLink={false} />
          </div>

          <div className="relative z-10 space-y-6 my-auto pt-8">
            <div className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Step-by-Step Portal Signup</span>
            </div>
            <h3 className="font-serif text-3xl font-bold leading-tight text-navy">
              Create your clinical account
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Register in under 60 seconds to unlock full booking controls, secure file
              uploads for your medical history, and direct messaging.
            </p>

            <ul className="space-y-3 pt-1">
              <FeatureLine label="Direct secure communication" />
              <FeatureLine label="Instant billing invoice receipts" />
              <FeatureLine label="Track and manage treatment timelines" />
            </ul>
          </div>

          <div className="relative z-10 text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
            Cork, Ireland
          </div>
        </aside>

        {/* Right Form */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="space-y-6 max-w-md mx-auto w-full">
            
            {/* Visual Step Timeline */}
            <div className="relative flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-100 -z-10" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gold transition-all duration-500 -z-10"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
              
              {/* Step 1 Circle */}
              <button
                type="button"
                onClick={() => step > 1 && setStep(1)}
                disabled={step === 1}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                  step > 1
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : step === 1
                    ? "bg-navy border-navy text-white shadow-lg shadow-navy/20"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </button>
              
              {/* Step 2 Circle */}
              <button
                type="button"
                onClick={() => step > 2 && setStep(2)}
                disabled={step <= 2}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                  step > 2
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : step === 2
                    ? "bg-navy border-navy text-white shadow-lg shadow-navy/20"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </button>
              
              {/* Step 3 Circle */}
              <button
                type="button"
                disabled
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                  step === 3
                    ? "bg-navy border-navy text-white shadow-lg shadow-navy/20"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                "3"
              </button>
            </div>

            {/* Step Label Headers */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                Step {step} of 3
              </span>
              <h2 className="font-serif text-2xl font-bold text-navy leading-none">
                {step === 1 && "Account Credentials"}
                {step === 2 && "Demographics & Info"}
                {step === 3 && "Consent & Confirmation"}
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed">
                {step === 1 && "Secure your patient portal account with login details."}
                {step === 2 && "Provide your clinical details and medical parameters."}
                {step === 3 && "Verify your summary details and finalize setup."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* STEP 1: LOGIN DETAILS */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <Field label="Email Address" icon={<Mail className="w-3.5 h-3.5 text-gold" />}>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@example.com"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Choose Secure Password" icon={<Lock className="w-3.5 h-3.5 text-gold" />}>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-navy transition-colors focus:outline-none rounded-md"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1.5 mt-2">
                        <div className="h-1 bg-gray-100 rounded-full w-full overflow-hidden">
                          <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                          {strength.label} password strength
                        </span>
                      </div>
                    )}
                  </Field>
                </div>
              )}

              {/* STEP 2: PROFILE & DEMOGRAPHICS */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" icon={<User className="w-3.5 h-3.5 text-gold" />}>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder="John"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Last Name" icon={<User className="w-3.5 h-3.5 text-gold" />}>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Doe"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Mobile" icon={<Phone className="w-3.5 h-3.5 text-gold" />}>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="087 123 4567"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Birth Date" icon={<Calendar className="w-3.5 h-3.5 text-gold" />}>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Age numeric field */}
                    <div className="col-span-4">
                      <Field label="Age" icon={<Activity className="w-3.5 h-3.5 text-gold" />}>
                        <input
                          type="number"
                          required
                          min="1"
                          max="120"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          placeholder="28"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    {/* Blood Group select */}
                    <div className="col-span-8">
                      <Field label="Blood Group" icon={<Heart className="w-3.5 h-3.5 text-gold" />}>
                        <select
                          required
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className={inputClass}
                        >
                          <option value="" disabled>Select Blood Group</option>
                          <option value="A+">A+ (A Positive)</option>
                          <option value="A-">A- (A Negative)</option>
                          <option value="B+">B+ (B Positive)</option>
                          <option value="B-">B- (B Negative)</option>
                          <option value="AB+">AB+ (AB Positive)</option>
                          <option value="AB-">AB- (AB Negative)</option>
                          <option value="O+">O+ (O Positive)</option>
                          <option value="O-">O- (O Negative)</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* Gender Custom Segmented tag selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gold" />
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["male", "female", "other"].map((g) => {
                        const active = formData.gender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFormData({ ...formData, gender: g })}
                            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                              active
                                ? "bg-navy border-gold text-white shadow-md shadow-navy/10 scale-102"
                                : "bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-500"
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & CONSENT */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Summary Grid Display */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-2">
                      <ShieldCheck className="w-4 h-4 text-gold" />
                      Account Detail Summary
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Full Name</span>
                        <span className="text-navy font-bold">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Mobile Phone</span>
                        <span className="text-navy font-bold">{formData.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block font-medium">Email Address</span>
                        <span className="text-navy font-bold truncate block">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Age / Gender</span>
                        <span className="text-navy font-bold uppercase">{formData.age} yrs / {formData.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Blood Group</span>
                        <span className="text-navy font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full inline-block mt-0.5 font-sans">
                          {formData.bloodGroup}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Birth Date</span>
                        <span className="text-navy font-bold">{formData.dateOfBirth}</span>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 select-none bg-gold/5 p-3 rounded-lg border border-gold/20 hover:bg-gold/10 transition-colors">
                    <input
                      type="checkbox"
                      required
                      checked={formData.gdprConsent}
                      onChange={(e) =>
                        setFormData({ ...formData, gdprConsent: e.target.checked })
                      }
                      className="accent-gold mt-0.5"
                    />
                    <span className="leading-relaxed">
                      I authorize HollyHill Dental Clinic to securely store my digital clinical profile records and accept the GDPR data protection terms.
                    </span>
                  </label>
                </div>
              )}

              {/* ACTION NAVIGATION BUTTONS */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex-1 border-2 border-navy hover:bg-navy hover:text-white text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <span>Next Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !formData.gdprConsent}
                    className="flex-1 bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <span>{loading ? "Registering…" : "Create Account"}</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Already have account */}
            <div className="text-center text-xs text-gray-500 pt-3 border-t border-gray-100">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => openLoginModal()}
                className="text-gold font-bold hover:text-gold-dark hover:underline cursor-pointer border-0 bg-transparent"
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
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

function FeatureLine({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600">
      <ChevronRight className="w-3.5 h-3.5 text-gold shrink-0" />
      <span>{label}</span>
    </li>
  );
}
