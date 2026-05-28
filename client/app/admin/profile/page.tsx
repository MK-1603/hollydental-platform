"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest, apiUpload } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Camera, User, Lock, Check, Eye, EyeOff, AlertCircle } from "lucide-react";

type Tab = "profile" | "password";

export default function AdminProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-gray-500 text-xs mt-1">
          Manage your display name, profile picture and account password.
        </p>
      </div>

      <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold text-navy">
        <TabBtn label="Profile" icon={<User className="w-3.5 h-3.5" />} active={tab === "profile"} onClick={() => setTab("profile")} />
        <TabBtn label="Change Password" icon={<Lock className="w-3.5 h-3.5" />} active={tab === "password"} onClick={() => setTab("password")} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {tab === "profile" && <ProfileTab />}
        {tab === "password" && <PasswordTab />}
      </div>
    </div>
  );
}

/* ── Profile Tab ── */
function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setSuccess(false);
    try {
      const res: any = await apiRequest("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      setUser({ ...user!, displayName: res.user.displayName });
      setSuccess(true);
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res: any = await apiUpload("/auth/profile-pic", { file }, { method: "PATCH" });
      if (res?.profilePicUrl) {
        setUser({ ...user!, profilePicUrl: res.profilePicUrl });
        toast.success("Profile picture updated.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-navy text-gold flex items-center justify-center font-bold text-3xl uppercase select-none">
            {user?.profilePicUrl ? (
              <img src={user.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{(user?.displayName || user?.email || "D")[0].toUpperCase()}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-gold hover:bg-yellow-500 text-navy p-2 rounded-full cursor-pointer shadow border-2 border-white transition-colors">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={handlePicChange} className="hidden" disabled={uploading} />
          </label>
        </div>
        <p className="text-[10px] text-gray-400 text-center">
          {uploading ? "Uploading…" : "JPG, PNG or WEBP · Max 5 MB"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="flex-1 space-y-4">
        <Field label="Display Name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSuccess(false); }}
            placeholder="e.g. Dr. Roghay Alizadeh"
            className={inputCls}
          />
        </Field>
        <Field label="Email Address">
          <input type="email" value={user?.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
          <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here. Contact system admin.</p>
        </Field>
        <Field label="Role">
          <input type="text" value="Clinical Admin" disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
        </Field>

        {success && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs">
            <Check className="w-4 h-4 shrink-0" /> Profile saved successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="bg-gold hover:bg-yellow-500 text-navy font-bold py-2.5 px-6 rounded-lg text-xs shadow transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

/* ── Password Tab ── */
function PasswordTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  const strength = !next ? null : PASSWORD_REGEX.test(next) ? "strong" : next.length >= 6 ? "medium" : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (!PASSWORD_REGEX.test(next)) {
      setError("Password must be ≥10 chars with uppercase, lowercase, digit and special character.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      toast.success("Password changed successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <PasswordField
        label="Current Password"
        value={current}
        show={show.current}
        onChange={(v) => { setCurrent(v); setSuccess(false); setError(""); }}
        onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
      />
      <PasswordField
        label="New Password"
        value={next}
        show={show.next}
        onChange={(v) => { setNext(v); setSuccess(false); setError(""); }}
        onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
      />
      {next && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                strength === "strong" ? "w-full bg-emerald-500" :
                strength === "medium" ? "w-2/3 bg-amber-400" : "w-1/3 bg-red-400"
              }`}
            />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            strength === "strong" ? "text-emerald-600" :
            strength === "medium" ? "text-amber-500" : "text-red-500"
          }`}>{strength}</span>
        </div>
      )}
      <PasswordField
        label="Confirm New Password"
        value={confirm}
        show={show.confirm}
        onChange={(v) => { setConfirm(v); setSuccess(false); setError(""); }}
        onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
      />

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs">
          <Check className="w-4 h-4 shrink-0" /> Password changed successfully.
        </div>
      )}

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Min 10 characters · uppercase · lowercase · digit · special character (@$!%*?&)
      </p>

      <button
        type="submit"
        disabled={saving || !current || !next || !confirm}
        className="bg-navy hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow transition-colors disabled:opacity-50"
      >
        {saving ? "Updating…" : "Update Password"}
      </button>
    </form>
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

function PasswordField({
  label, value, show, onChange, onToggle,
}: {
  label: string; value: string; show: boolean;
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
          className={`${inputCls} pr-10`}
          placeholder="••••••••••"
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

function TabBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
        active ? "border-gold text-gold" : "border-transparent text-gray-400 hover:text-navy"
      }`}
    >
      {icon} {label}
    </button>
  );
}
