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
} from "lucide-react";
import LoginOverlay from "@/components/common/LoginOverlay";

export default function RegisterModal() {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useUIStore();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gdprConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Password strength indicator
  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return { label: "", color: "bg-gray-200", width: "w-0" };
    if (p.length < 6) return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
    if (p.length < 10) return { label: "Medium", color: "bg-amber-500", width: "w-2/3" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-navy/40 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-4 overflow-y-auto no-scrollbar">
      {loading && <LoginOverlay message="Creating your account..." />}
      {/* Backdrop (desktop only) */}
      <div
        className="hidden md:block absolute inset-0 transition-opacity duration-300 animate-fade-in"
        onClick={closeRegisterModal}
      />

      {/* Light Modal Container */}
      <div className="relative w-full h-full md:h-auto min-h-screen md:min-h-0 md:max-w-[880px] md:max-h-[92vh] md:overflow-hidden bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 grid grid-cols-1 md:grid-cols-12 z-10 animate-fade-up">
        {/* Mobile Top Bar with Back Button */}
        <div className="md:hidden px-6 pt-6 flex items-center justify-between border-b border-gray-50 bg-white z-20">
          <button
            onClick={closeRegisterModal}
            className="flex items-center gap-1.5 text-gray-600 hover:text-navy font-semibold text-sm transition-colors py-2 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 text-gold" />
            <span>Back</span>
          </button>
          <Logo variant="icon" theme="dark" size={32} asLink={false} />
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
            <div className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>Patient Registration</span>
            </div>
            <h3 className="font-serif text-3xl font-bold leading-tight text-navy">
              Create your clinical account
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Register in under 60 seconds to unlock full booking controls, secure file
              uploads for your medical history, and direct messaging.
            </p>

            <ul className="space-y-2.5 pt-1">
              <FeatureLine label="Access your treatment roadmap" />
              <FeatureLine label="Upload and store files safely" />
              <FeatureLine label="Track appointment requests &amp; replies" />
            </ul>
          </div>

          <div className="relative z-10 text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
            Cork, Ireland
          </div>
        </aside>

        {/* Right Form */}
        <div className="col-span-1 md:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">
          <div className="space-y-5 max-w-md mx-auto w-full">
            <div className="space-y-1.5">
              <h2 className="font-serif text-3xl font-bold text-navy leading-none">
                Register
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed">
                Enter your patient details to set up your account.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
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

              <Field label="Choose Password" icon={<Lock className="w-3.5 h-3.5 text-gold" />}>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className={inputClass}
                />
                {formData.password && (
                  <div className="space-y-1 mt-2">
                    <div className="h-1 bg-gray-100 rounded-full w-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      {strength.label} password
                    </span>
                  </div>
                )}
              </Field>

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

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 select-none">
                <input
                  type="checkbox"
                  required
                  checked={formData.gdprConsent}
                  onChange={(e) =>
                    setFormData({ ...formData, gdprConsent: e.target.checked })
                  }
                  className="accent-gold mt-0.5"
                />
                <span>I accept the GDPR storage terms & privacy policy.</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
              >
                {loading ? "Registering…" : "Create Account"}
              </button>
            </form>

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
