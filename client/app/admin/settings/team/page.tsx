"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { Search, UserPlus, Lock, ShieldCheck, Mail, Phone, Building, X } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function TeamSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useDialog();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "doctor",
    department: "",
    password: ""
  });

  const { data: staff = [], loading, refetch } = useLiveData<any[]>("/staff", {
    initialData: [],
  });

  const handleForcePasswordReset = async (userId: string) => {
    const isConfirmed = await confirm({
      title: "Force Password Reset",
      description: "Force this user to reset their password on next login?",
      type: "warning",
      confirmText: "Force Reset"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/admin/users/${userId}/force-password-change`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin requested." })
      });
      toast.success("User forced to change password.");
    } catch (error: any) {
      toast.error(error.message || "Failed to force password reset.");
    }
  };

  const handleToggleStatus = async (staffMember: any) => {
    const isConfirmed = await confirm({
      title: `${staffMember.isActive ? 'Disable' : 'Enable'} Account`,
      description: `Are you sure you want to ${staffMember.isActive ? 'disable' : 'enable'} this account?`,
      type: staffMember.isActive ? "danger" : "info",
      confirmText: staffMember.isActive ? "Disable" : "Enable"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/staff/${staffMember.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !staffMember.isActive })
      });
      toast.success(`Account ${staffMember.isActive ? 'disabled' : 'enabled'}.`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update account status.");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest("/staff", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast.success("Staff member added successfully.");
      setIsAddModalOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", role: "doctor", department: "", password: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff member.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaff = (staff || []).filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Team Management</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manage staff accounts, access roles, and permissions.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search staff by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] focus:ring-1 focus:ring-blue-500 outline-none shadow-sm" 
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role & Dept</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-[13px] text-gray-500">Loading staff...</td></tr>
                ) : filteredStaff.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-[13px] text-gray-500">No staff found.</td></tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[12px] font-bold border border-blue-100">
                            {s.firstName?.[0]}{s.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-900">{s.firstName} {s.lastName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">ID: {s.id.substring(0,6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-[6px] text-[11px] font-bold capitalize inline-block mb-1">
                          {s.role}
                        </span>
                        <div className="text-[12px] text-gray-500 flex items-center gap-1">
                           <Building className="w-3 h-3" /> {s.department || "No Dept"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[12px] text-gray-600 space-y-1">
                          <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {s.email}</div>
                          {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {s.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${s.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {s.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleForcePasswordReset(s.userId)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors bg-white border border-gray-200 rounded-[8px]"
                            title="Force Password Reset"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(s)}
                            className={`text-[11px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white transition-colors ${s.isActive ? 'text-red-600 hover:bg-red-50 hover:border-red-200' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
                          >
                            {s.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-gray-900">Add Staff Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">First Name *</label>
                  <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Last Name *</label>
                  <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Role *</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500">
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                  <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Temporary Password *</label>
                <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none focus:border-blue-500" />
                <p className="text-[11px] text-gray-500 mt-1">User will use this to log in the first time.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 font-bold text-[13px] rounded-[10px] hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold text-[13px] rounded-[10px] hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSaving ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
