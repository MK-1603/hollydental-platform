"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  User,
  Lock,
  Bell,
  ShieldCheck,
  Check,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Activity,
  Heart,
  Laptop,
  Calendar,
  MapPin,
  Sparkles,
  Clock,
  Fingerprint,
} from "lucide-react";

export default function PortalProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "personal" | "security" | "notifications" | "gdpr"
  >("personal");
  const [successMsg, setSuccessMsg] = useState("");

  // Track session details
  const [sessionTime, setSessionTime] = useState("0m");
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const mins = Math.floor((Date.now() - start) / 60000);
      setSessionTime(`${mins}m active`);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const patient = (user?.patientProfile ?? {}) as NonNullable<typeof user>["patientProfile"] & {};

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      
      {/* Immersive Profile Header */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">
          Profile Hub & Account Settings
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Manage your personal dental records, security parameters, and notification alerts.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Responsive Grid System: Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMN 1: Active Session & Profile Summary (Spans 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-navy to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden group">
            
            {/* Hologram aesthetic lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.1),_transparent_50%)] pointer-events-none" />
            <div className="absolute right-4 top-4 text-white/5 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-24 h-24" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              
              {/* Profile Avatar with status ring */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center font-bold text-gold text-2xl shadow-lg">
                  {patient.firstName?.[0] || "P"}{patient.lastName?.[0] || ""}
                </div>
                <span className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-navy animate-pulse" />
              </div>

              {/* Patient Basics */}
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold tracking-wide">
                  {patient.firstName || "Patient"} {patient.lastName || ""}
                </h3>
                <span className="inline-flex items-center gap-1 bg-gold/15 text-gold border border-gold/20 text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" /> Checked In
                </span>
              </div>

              {/* Active Session Parameters list */}
              <div className="w-full border-t border-white/10 pt-4 mt-2 space-y-3 text-left text-xs text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Session Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Active Connection
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">User Role</span>
                  <span className="font-bold text-white uppercase tracking-wider text-[10px]">Patient Profile</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Session Duration</span>
                  <span className="font-mono text-white flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gold" /> {sessionTime}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">System Host</span>
                  <span className="font-mono text-white flex items-center gap-1 text-[10px]"><Laptop className="w-3.5 h-3.5 text-gold" /> Local Sandbox</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Verified Identity</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure SSL</span>
                </div>
              </div>

              {/* Dynamic Demographics quick status box */}
              {(patient.bloodGroup || patient.age || patient.gender) && (
                <div className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Blood</span>
                    <span className="font-bold text-gold flex items-center justify-center gap-0.5">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" /> {patient.bloodGroup || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Age</span>
                    <span className="font-bold text-white flex items-center justify-center gap-0.5">
                      <Activity className="w-3.5 h-3.5 text-sky-400" /> {patient.age ? `${patient.age}y` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Gender</span>
                    <span className="font-bold text-white block truncate text-[10px]">
                      {patient.gender || "—"}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* COLUMN 2: Structured Settings Form Tabs (Spans 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Custom navigation tabs */}
          <div className="flex border-b border-gray-100 gap-6 text-xs font-semibold text-navy overflow-x-auto no-scrollbar">
            <TabButton
              active={activeTab === "personal"}
              onClick={() => {
                setActiveTab("personal");
                setSuccessMsg("");
              }}
              icon={<User className="w-4 h-4" />}
              label="Personal Profile"
            />
            <TabButton
              active={activeTab === "security"}
              onClick={() => {
                setActiveTab("security");
                setSuccessMsg("");
              }}
              icon={<Lock className="w-4 h-4" />}
              label="Credentials & Password"
            />
            <TabButton
              active={activeTab === "notifications"}
              onClick={() => {
                setActiveTab("notifications");
                setSuccessMsg("");
              }}
              icon={<Bell className="w-4 h-4" />}
              label="Preferences & Alerts"
            />
            <TabButton
              active={activeTab === "gdpr"}
              onClick={() => {
                setActiveTab("gdpr");
                setSuccessMsg("");
              }}
              icon={<ShieldCheck className="w-4 h-4" />}
              label="GDPR Privacy & Data"
            />
          </div>

          {/* Tab content wrapper */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
            {activeTab === "personal" && (
              <PersonalTab user={user} setUser={setUser} onSuccess={setSuccessMsg} />
            )}
            {activeTab === "security" && (
              <SecurityTab onSuccess={setSuccessMsg} />
            )}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "gdpr" && (
              <GdprTab
                userEmail={user?.email || ""}
                userData={user}
                onDeleted={() => {
                  logout("manual");
                  router.replace("/");
                }}
              />
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

/* ── Personal Tab Form — featuring Blood Group, Age, Gender, DOB ── */
function PersonalTab({
  user,
  setUser,
  onSuccess,
}: {
  user: any;
  setUser: (u: any) => void;
  onSuccess: (msg: string) => void;
}) {
  const patient = user?.patientProfile || {};

  const [form, setForm] = useState({
    firstName: patient.firstName || "",
    lastName: patient.lastName || "",
    phone: patient.phone || "",
    address: patient.address || "",
    bloodGroup: patient.bloodGroup || "",
    age: patient.age || "",
    gender: patient.gender || "",
    dateOfBirth: patient.dateOfBirth || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res: any = await apiRequest("/patients/me", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : null,
        }),
      });
      setUser({ ...user, patientProfile: res.patientProfile });
      onSuccess("Personal demographics saved successfully.");
      toast.success("Profile updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-50 pb-2.5">
        Personal Demographics & Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="First Name *">
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
            className={inputClass}
          />
        </Field>
        
        <Field label="Last Name *">
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
            className={inputClass}
          />
        </Field>
        
        <Field label="Phone Number *">
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className={inputClass}
          />
        </Field>
        
        <Field label="Email Address">
          <input
            type="email"
            disabled
            value={user?.email || ""}
            className={`${inputClass} cursor-not-allowed text-gray-400`}
          />
        </Field>

        {/* 🩸 BLOOD GROUP SELECTOR */}
        <Field label="Blood Group">
          <select
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            className={inputClass}
          >
            <option value="">Not Specified</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </Field>

        {/* 🔢 AGE INPUT */}
        <Field label="Patient Age">
          <input
            type="number"
            min="0"
            max="120"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className={inputClass}
            placeholder="e.g. 28"
          />
        </Field>

        {/* 🚻 GENDER SELECTOR */}
        <Field label="Gender Identification">
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className={inputClass}
          >
            <option value="">Not Specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </Field>

        {/* 📅 DATE OF BIRTH */}
        <Field label="Date of Birth">
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Postal / Delivery Address" className="col-span-1 md:col-span-2">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass}
            placeholder="e.g. Unit 6 Hollyhill Shopping Centre, Cork"
          />
        </Field>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gold hover:bg-gold-dark text-navy font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-colors disabled:opacity-50 uppercase tracking-wider"
      >
        {loading ? "Saving Parameters…" : "Save Demographic Settings"}
      </button>
    </form>
  );
}

/* ── Security Tab ── */
function SecurityTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  const strength = !next ? null : PASSWORD_REGEX.test(next) ? "strong" : next.length >= 6 ? "medium" : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!PASSWORD_REGEX.test(next)) {
      setError("Password must be ≥10 chars with uppercase, lowercase, digit and special character.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      onSuccess("Account password updated successfully.");
      toast.success("Password changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-50 pb-2.5">
        Security Credentials
      </h3>

      <PwField
        label="Current Password"
        value={current}
        show={show.current}
        onChange={(v) => {
          setCurrent(v);
          setError("");
        }}
        onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
      />
      
      <PwField
        label="New Secure Password"
        value={next}
        show={show.next}
        onChange={(v) => {
          setNext(v);
          setError("");
        }}
        onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
      />
      
      {next && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                strength === "strong"
                  ? "w-full bg-emerald-500"
                  : strength === "medium"
                  ? "w-2/3 bg-amber-400"
                  : "w-1/3 bg-red-400"
              }`}
            />
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              strength === "strong"
                ? "text-emerald-600"
                : strength === "medium"
                ? "text-amber-500"
                : "text-red-500"
            }`}
          >
            {strength} Strength
          </span>
        </div>
      )}
      
      <PwField
        label="Confirm New Password"
        value={confirm}
        show={show.confirm}
        onChange={(v) => {
          setConfirm(v);
          setError("");
        }}
        onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
      />
      
      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      
      <p className="text-[10px] text-gray-400 leading-relaxed">
        Credentials must be minimum 10 characters and contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character (@$!%*?&).
      </p>
      
      <button
        type="submit"
        disabled={loading || !current || !next || !confirm}
        className="bg-navy hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl text-xs shadow transition-colors disabled:opacity-50 uppercase tracking-wider"
      >
        {loading ? "Updating Credentials…" : "Update Password"}
      </button>
    </form>
  );
}

/* ── Notifications Tab ── */
function NotificationsTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-50 pb-2.5">
        Email & SMS Alerts
      </h3>
      <div className="space-y-3.5 text-xs text-navy font-semibold">
        <ToggleRow
          label="Appointment Confirmations"
          desc="Receive immediate booking confirmation summaries."
          defaultChecked
        />
        <ToggleRow
          label="Appointment Reminders"
          desc="Receive an SMS reminder 24 hours before each visit."
          defaultChecked
        />
        <ToggleRow
          label="Appointment Updates"
          desc="Email and SMS updates on requested visits, approvals and reminders."
          defaultChecked
        />
      </div>
    </div>
  );
}

/* ── GDPR Tab ── */
function GdprTab({
  userEmail,
  userData,
  onDeleted,
}: {
  userEmail: string;
  userData: any;
  onDeleted: () => void;
}) {
  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(userData, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "hollyhill_patient_data.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-50 pb-2.5">
          GDPR Compliance Tools
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed max-w-xl">
          Under European General Data Protection Regulations (GDPR), you have the right to request a complete machine-readable copy of your personal dental record file.
        </p>
        <button
          onClick={handleDownload}
          className="bg-navy hover:bg-gray-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors"
        >
          Export My Data (JSON)
        </button>
      </section>
      <DeleteAccountSection userEmail={userEmail} onDeleted={onDeleted} />
    </div>
  );
}

/* ── Helpers & Shared Form Styles ── */

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-medium shadow-2xs";

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3.5 flex items-center gap-1.5 border-b-2 font-bold transition-all whitespace-nowrap ${
        active ? "border-gold text-gold scale-102" : "border-transparent text-gray-400 hover:text-navy"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-navy uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function PwField({
  label,
  value,
  show,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={`${inputClass} pr-10`}
          placeholder="••••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors"
        >
          {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
        </button>
      </div>
    </Field>
  );
}

function ToggleRow({
  label,
  desc,
  defaultChecked,
}: {
  label: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none border border-gray-50 bg-gray-50/20 p-3 rounded-2xl hover:border-gold/30 hover:bg-gold/5 transition-all">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="accent-gold h-4.5 w-4.5 rounded mt-0.5 shrink-0"
      />
      <div>
        <span className="block text-navy font-bold">{label}</span>
        <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{desc}</span>
      </div>
    </label>
  );
}

/* ── Delete Account ── */
function DeleteAccountSection({
  userEmail,
  onDeleted,
}: {
  userEmail: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canDelete =
    confirmText.trim().toUpperCase() === "DELETE" && password.length > 0;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password, reason: reason || undefined }),
      });
      onDeleted();
    } catch (err: any) {
      setError(
        err?.message ||
          "Couldn't delete your account. Please try again or contact support."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 border-t border-gray-155 pt-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-55 text-red-600 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif text-sm font-bold text-navy">Delete Hollyhill account</h4>
          <p className="text-gray-500 text-xs leading-relaxed max-w-xl">
            This permanently removes your patient profile, credentials, messages, and transaction records. Confirmed clinical history is securely stored for medico-legal archiving.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border border-red-200 hover:bg-red-50/50 text-red-600 font-bold text-xs py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete my account
        </button>
      ) : (
        <form
          onSubmit={handleDelete}
          className="rounded-3xl border border-red-200 bg-red-50/10 p-5 space-y-4 max-w-xl animate-scale-in"
        >
          <div className="flex items-start gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 animate-bounce" />
            <p className="leading-relaxed">
              This action cannot be undone. You will be signed out and your profile for{" "}
              <span className="font-semibold text-red-800">{userEmail}</span> will be deleted.
            </p>
          </div>

          <Field label="Confirm by typing DELETE">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Enter current password *">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Tell us why (optional)">
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Your feedback helps us provide better service toCork patients."
              className={`${inputClass} resize-none`}
            />
          </Field>

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setPassword("");
                setReason("");
                setError("");
              }}
              className="text-xs font-bold text-navy hover:text-gold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canDelete || submitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 px-5 rounded-xl shadow disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {submitting ? "Deleting account…" : "Confirm Permanently Delete"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
