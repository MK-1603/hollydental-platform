"use client";

import { useEffect, useState } from "react";
import { CLINIC } from "@/lib/constants";
import { apiRequest, apiUpload } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import {
  Save,
  Check,
  Users,
  UserPlus,
  ShieldCheck,
  Copy,
  AlertCircle,
  Mail,
  Camera,
} from "lucide-react";

type Tab = "clinic" | "rules" | "team";

interface StaffMember {
  id: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  profilePicUrl?: string | null;
  createdAt: string;
}

function DoctorProfilePicCard() {
  const { user, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res: any = await apiUpload("/auth/profile-pic", { file }, { method: "PATCH" });
      if (res && res.profilePicUrl) {
        setUser({ ...user!, profilePicUrl: res.profilePicUrl });
        toast.success("Profile picture updated successfully.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-3xl p-6 bg-[#fdfcf9] flex flex-col items-center text-center space-y-5 shadow-sm border-b-[3px] border-b-gold/20">
      <div className="text-left w-full border-b border-gray-100 pb-3">
        <h3 className="font-serif text-sm font-bold text-navy">
          Your Profile Picture
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Visible in the navigation bar and comments</p>
      </div>
      <div className="relative group mt-3">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-navy text-gold flex items-center justify-center font-bold text-3xl uppercase select-none">
          {user?.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt="Profile Pic"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{user?.email[0] || "D"}</span>
          )}
        </div>
        <label className="absolute bottom-1 right-1 bg-gold hover:bg-gold-dark text-navy p-2.5 rounded-full cursor-pointer shadow-md transition-colors border border-white hover:scale-105">
          <Camera className="w-4 h-4" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-navy truncate max-w-[200px]">{user?.email}</p>
        <p className="text-[10px] text-gold font-bold uppercase tracking-wider">
          {user?.role === "admin" ? "Principal Dentist" : "Staff User"}
        </p>
        <p className="text-[9px] text-gray-400 mt-2">
          {uploading ? "Uploading picture..." : "Supports JPG, PNG or WEBP (Max 5MB)"}
        </p>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("clinic");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [clinicDetails, setClinicDetails] = useState({
    name: CLINIC.name,
    address: CLINIC.address,
    phone: CLINIC.phone,
    email: CLINIC.email,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setTimeout(() => {
      setLoading(false);
      setSuccess("Clinic configurations saved successfully.");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-navy">
          System Settings
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Configure clinic details, scheduling rules, and clinical team
          access.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" /> {success}
        </div>
      )}

      <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold text-navy overflow-x-auto">
        <TabButton
          label="Clinic Details"
          active={activeTab === "clinic"}
          onClick={() => {
            setActiveTab("clinic");
            setSuccess("");
          }}
        />
        <TabButton
          label="Scheduling Rules"
          active={activeTab === "rules"}
          onClick={() => {
            setActiveTab("rules");
            setSuccess("");
          }}
        />
        <TabButton
          label="Clinical Team"
          active={activeTab === "team"}
          onClick={() => {
            setActiveTab("team");
            setSuccess("");
          }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {activeTab === "clinic" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Clinic Name">
                  <input
                    type="text"
                    value={clinicDetails.name}
                    onChange={(e) =>
                      setClinicDetails({ ...clinicDetails, name: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Enquiry Phone">
                  <input
                    type="text"
                    value={clinicDetails.phone}
                    onChange={(e) =>
                      setClinicDetails({ ...clinicDetails, phone: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Enquiry Email">
                  <input
                    type="email"
                    value={clinicDetails.email}
                    onChange={(e) =>
                      setClinicDetails({ ...clinicDetails, email: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Postal Address">
                    <input
                      type="text"
                      value={clinicDetails.address}
                      onChange={(e) =>
                        setClinicDetails({
                          ...clinicDetails,
                          address: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
  
              <button
                type="submit"
                disabled={loading}
                className="bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 px-6 rounded-lg text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving…" : "Save Clinic Details"}
              </button>
            </form>
            
            <div className="lg:col-span-1">
              <DoctorProfilePicCard />
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSuccess("Scheduling rules saved successfully.");
            }}
            className="space-y-4 max-w-md"
          >
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-navy">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-gold h-4 w-4 mt-0.5 rounded"
                />
                <div>
                  <span className="block">
                    Require manual approval for online bookings
                  </span>
                  <span className="block text-[10px] text-gray-400 font-normal">
                    Patient bookings remain in <em>pending</em> until approved
                    on the Approvals page.
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-navy">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-gold h-4 w-4 mt-0.5 rounded"
                />
                <div>
                  <span className="block">Same-day booking restriction</span>
                  <span className="block text-[10px] text-gray-400 font-normal">
                    Prevent patients from scheduling online within 2 hours of
                    the slot.
                  </span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="bg-navy text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow transition-colors"
            >
              Save Scheduling Rules
            </button>
          </form>
        )}

        {activeTab === "team" && <TeamTab currentUserId={user?.id || ""} />}
      </div>
    </div>
  );
}

/* -------------------- Team Tab -------------------- */

function TeamTab({ currentUserId }: { currentUserId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCredential, setIssuedCredential] = useState<{
    email: string;
    password: string;
    loginUrl: string;
    invite: { subject: string; body: string };
  } | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/staff");
      setStaff(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load staff list:", err);
      toast.error(err?.message || "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, string> = { email: formEmail.trim() };
      if (formPassword.trim().length > 0) body.password = formPassword.trim();
      if (formName.trim().length > 0) body.name = formName.trim();

      const resp: any = await apiRequest("/admin/staff", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setIssuedCredential({
        email: resp.user.email,
        password: resp.temporaryPassword,
        loginUrl: resp.loginUrl,
        invite: resp.invite,
      });
      setStaff((prev) => [resp.user, ...prev]);
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setShowForm(false);
      toast.success("Doctor account created.");
    } catch (err: any) {
      setError(err?.message || "Failed to create doctor account.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    if (member.id === currentUserId) {
      toast.error("You can't deactivate your own account.");
      return;
    }
    const next = !member.isActive;
    if (
      !confirm(
        next
          ? `Re-activate ${member.email}? They'll be able to sign in again.`
          : `Deactivate ${member.email}? They will lose access immediately.`
      )
    ) {
      return;
    }
    try {
      const resp: any = await apiRequest(`/admin/staff/${member.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === resp.user.id ? { ...s, isActive: resp.user.isActive } : s
        )
      );
      toast.success(next ? "Account re-activated." : "Account deactivated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update account status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-serif text-base font-bold text-navy flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" /> Clinical Team
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-lg">
            Add new doctors or admin staff. New accounts must change the temporary password on first login.
          </p>
        </div>
        {!showForm && !issuedCredential && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-gold hover:bg-gold-dark text-navy font-bold py-2 px-4 rounded-lg text-xs shadow flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Doctor
          </button>
        )}
      </div>

      {/* Issued Credential Banner */}
      {issuedCredential && (
        <CredentialPanel
          credential={issuedCredential}
          onClose={() => setIssuedCredential(null)}
        />
      )}

      {/* Add Doctor Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-gold/20 bg-gold/5 rounded-2xl p-5 space-y-4"
        >
          <h4 className="font-serif text-sm font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" /> New Doctor Account
          </h4>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email *">
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="doctor@hollyhilldental.ie"
                className={inputClass}
              />
            </Field>
            <Field label="Display name (optional)">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Dr. Sarah Walsh"
                className={inputClass}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Temporary password (optional)">
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate a secure 12-character password"
                  className={inputClass}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Minimum 8 characters. The doctor will be forced to change this on first login.
                </p>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 px-5 rounded-lg text-xs shadow disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? "Creating…" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Staff Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-5 space-y-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-2 shimmer rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 shimmer rounded w-full" />
              <div className="h-8 shimmer rounded-lg" />
            </div>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl p-12 text-center bg-white space-y-3">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <h4 className="font-serif text-sm font-semibold text-navy">No team members yet</h4>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Add your first clinical staff member using the "Add Doctor" button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((member) => {
            const initial = member.email[0]?.toUpperCase() || "D";
            const isSelf = member.id === currentUserId;
            const joinDate = new Date(member.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <div
                key={member.id}
                className={`border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-4 ${
                  isSelf ? "border-gold/30 bg-gold/5" : "border-gray-100"
                }`}
              >
                {/* Card top: avatar + name */}
                <div className="flex items-center gap-3">
                  {member.profilePicUrl ? (
                    <img
                      src={member.profilePicUrl}
                      alt={member.email}
                      className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-gold/30 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm uppercase border-2 shrink-0 shadow-sm ${
                      member.isActive
                        ? "bg-navy text-gold border-navy/20"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    }`}>
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-navy truncate">{member.email}</span>
                      {isSelf && (
                        <span className="text-[9px] uppercase tracking-wider bg-gold/15 text-gold px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          member.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                        {member.isActive ? "Active" : "Disabled"}
                      </span>
                      {member.mustChangePassword && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                          Must reset
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-50" />

                {/* Metadata */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="font-bold text-navy uppercase tracking-wider">Role</span>
                    <span className="ml-auto font-semibold">Clinical Admin</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="font-bold text-navy uppercase tracking-wider">Joined</span>
                    <span className="ml-auto font-semibold">{joinDate}</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  type="button"
                  onClick={() => toggleStatus(member)}
                  disabled={isSelf}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                    member.isActive
                      ? "border border-gray-200 text-navy hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                      : "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {isSelf
                    ? "Current account"
                    : member.isActive
                    ? "Deactivate Account"
                    : "Re-activate Account"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CredentialPanel({
  credential,
  onClose,
}: {
  credential: {
    email: string;
    password: string;
    loginUrl: string;
    invite: { subject: string; body: string };
  };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<
    "email" | "password" | "link" | "invite" | null
  >(null);
  const handleCopy = async (
    which: "email" | "password" | "link" | "invite",
    value: string
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore — older browsers
    }
  };

  const mailtoHref = `mailto:${encodeURIComponent(
    credential.email
  )}?subject=${encodeURIComponent(
    credential.invite.subject
  )}&body=${encodeURIComponent(credential.invite.body)}`;

  return (
    <div className="border border-gold/40 bg-gold/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-serif text-sm font-bold text-navy">
            Account ready — share these credentials securely
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Send the doctor the sign-in link plus their temporary password.
            They'll be forced to choose a new password on first sign-in, so
            the password below stops working immediately afterwards.
            <strong className="text-navy">
              {" "}
              The temporary password won't be shown again.
            </strong>
          </p>
        </div>
      </div>

      <CredentialField
        label="Sign-in link"
        value={credential.loginUrl}
        copied={copied === "link"}
        onCopy={() => handleCopy("link", credential.loginUrl)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CredentialField
          label="Email"
          value={credential.email}
          copied={copied === "email"}
          onCopy={() => handleCopy("email", credential.email)}
        />
        <CredentialField
          label="Temporary password"
          value={credential.password}
          copied={copied === "password"}
          onCopy={() => handleCopy("password", credential.password)}
          mono
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <a
          href={mailtoHref}
          className="bg-gold hover:bg-gold-dark text-navy font-bold py-2 px-4 rounded-lg text-xs shadow inline-flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          Send invite by email
        </a>
        <button
          type="button"
          onClick={() => handleCopy("invite", credential.invite.body)}
          className="border border-gold/40 hover:border-gold text-navy font-bold py-2 px-4 rounded-lg text-xs inline-flex items-center gap-1.5"
        >
          {copied === "invite" ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Invite text
              copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy invite text
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-navy text-xs font-semibold hover:text-gold inline-flex items-center gap-1.5 ml-auto"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function CredentialField({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-gold">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`flex-1 text-navy font-semibold truncate ${
            mono ? "font-mono text-sm tracking-wider" : "text-sm"
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="text-[11px] font-bold text-navy hover:text-gold transition-colors inline-flex items-center gap-1"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
        active
          ? "border-gold text-gold"
          : "border-transparent text-gray-400 hover:text-navy"
      }`}
    >
      {label}
    </button>
  );
}
