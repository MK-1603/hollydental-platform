"use client";

import { useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import { CalendarClock, Check, RefreshCw, X, User, Mail, Phone, StickyNote, Inbox, Send } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface PendingAppointment {
  id: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
  patientId?: string;
}

function normalizePending(raw: any): PendingAppointment[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.appointments)
      ? raw.appointments
      : Array.isArray(raw?.data)
        ? raw.data
        : [];
  return list.filter((a: any) => a?.status === "pending");
}

export default function AdminApprovalsPage() {
  // Primary feed (server may support ?status=pending)
  const {
    data: pending = [],
    loading,
    refetch,
  } = useLiveData<PendingAppointment[]>("/appointments?status=pending", {
    intervalMs: 15000,
    select: normalizePending,
    initialData: [],
  });

  const queue = useMemo<PendingAppointment[]>(() => {
    return [...pending].sort((a, b) => {
      const aDate = new Date(
        `${a.appointmentDate}T${a.appointmentTime || "00:00"}`
      ).getTime();
      const bDate = new Date(
        `${b.appointmentDate}T${b.appointmentTime || "00:00"}`
      ).getTime();
      return aDate - bDate;
    });
  }, [pending]);

  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const updateNote = (id: string, value: string) =>
    setNotes((prev) => ({ ...prev, [id]: value }));

  const sendPatientMessage = async (
    appt: PendingAppointment,
    body: string
  ) => {
    if (!appt.patientId || !body) return;
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({ patientId: appt.patientId, body }),
      });
    } catch {
      // Non-fatal — the status change still succeeded.
    }
  };

  const updateStatus = async (
    appt: PendingAppointment,
    status: "confirmed" | "cancelled"
  ) => {
    setActingId(appt.id);
    setSuccess(null);
    const note = notes[appt.id]?.trim();

    try {
      await apiRequest(`/appointments/${appt.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, note: note || undefined }),
      });

      // Push a message to the patient with the result + optional note
      const summary =
        status === "confirmed"
          ? `Your appointment on ${formatDate(appt.appointmentDate)} at ${appt.appointmentTime
          } has been confirmed.`
          : `Unfortunately, your requested appointment on ${formatDate(
            appt.appointmentDate
          )} at ${appt.appointmentTime} could not be confirmed.`;
      const fullMessage = note ? `${summary}\n\n${note}` : summary;
      await sendPatientMessage(appt, fullMessage);

      updateNote(appt.id, "");
      setSuccess(
        status === "confirmed"
          ? "Appointment approved and patient notified."
          : "Appointment declined and patient notified."
      );
      refetch();
    } catch (err: any) {
      toast.error(`Failed to update appointment: ${err?.message || "please try again."}`);
    } finally {
      setActingId(null);
    }
  };

  const sendQuickReply = async (appt: PendingAppointment) => {
    const note = notes[appt.id]?.trim();
    if (!note) return;
    setActingId(appt.id);
    setSuccess(null);
    try {
      await sendPatientMessage(appt, note);
      updateNote(appt.id, "");
      setSuccess("Message sent to the patient.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="pb-6 w-full max-w-5xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC] border-b border-gray-200 py-4 px-4 md:px-6 flex items-start md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-gold/10 px-2.5 py-1 rounded-full">
            <CalendarClock className="w-3 h-3" /> Live Booking Queue
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy truncate">
            Approvals
          </h1>
          <p className="text-gray-500 text-xs md:text-sm leading-relaxed hidden sm:block">
            Auto-refreshes every 15 seconds. Approve, decline, or message the patient inline.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 mt-1 md:mt-0">
          <button
            onClick={refetch}
            className="bg-white shadow-sm border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
          <span className="text-[11px] text-gray-500 font-medium mr-1">
            {queue.length} pending
          </span>
        </div>
      </header>

      <div className="px-4 md:px-6 pt-6 space-y-6">
        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 text-emerald-700 text-xs px-4 py-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Queue */}
        {loading && queue.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[160px] shimmer rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-3 max-w-md mx-auto">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-serif text-base font-semibold text-navy">
              No pending requests
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              All caught up. New bookings will appear here for approval as patients submit them.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((appt) => {
              const patientName = appt.patient
                ? `${appt.patient.firstName || ""} ${appt.patient.lastName || ""}`.trim()
                : "Patient";
              const isBusy = actingId === appt.id;

              return (
                <article
                  key={appt.id}
                  className="border border-gray-100 bg-white rounded-2xl shadow-sm p-5 md:p-6 space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Date column */}
                    <div className="md:col-span-3 md:border-r md:border-gray-100 md:pr-5 space-y-2">
                      <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                        Requested Slot
                      </span>
                      <h4 className="font-serif text-lg font-bold text-navy leading-tight">
                        {formatDate(appt.appointmentDate)}
                      </h4>
                      <p className="text-sm font-semibold text-navy">
                        {appt.appointmentTime}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-9 space-y-2.5 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold tracking-widest text-gray-400">
                          Treatment
                        </span>
                        <h5 className="font-serif text-base font-semibold text-navy capitalize">
                          {String(appt.serviceId || "appointment").replace(/-/g, " ")}
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-navy">
                        <DetailRow
                          icon={<User className="w-3.5 h-3.5 text-gold" />}
                          value={patientName || "—"}
                        />
                        {appt.patient?.email && (
                          <DetailRow
                            icon={<Mail className="w-3.5 h-3.5 text-gold" />}
                            value={appt.patient.email}
                          />
                        )}
                        {appt.patient?.phone && (
                          <DetailRow
                            icon={<Phone className="w-3.5 h-3.5 text-gold" />}
                            value={appt.patient.phone}
                          />
                        )}
                      </div>

                      {appt.notes && (
                        <div className="bg-off-white border border-gray-100 rounded-lg p-3 text-xs text-gray-600 leading-relaxed flex gap-2">
                          <StickyNote className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                          <p className="whitespace-pre-line">{appt.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline reply + actions */}
                  <div className="rounded-xl border border-gray-100 bg-off-white p-4 space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gold flex items-center gap-1.5">
                      <Send className="w-3 h-3" /> Reply to patient (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes[appt.id] || ""}
                      onChange={(e) => updateNote(appt.id, e.target.value)}
                      placeholder="Add a message — sent to the patient when you approve, decline, or hit Send."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <button
                        type="button"
                        disabled={isBusy || !(notes[appt.id] || "").trim()}
                        onClick={() => sendQuickReply(appt)}
                        className="inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold py-2 px-3.5 rounded-lg text-xs disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Send message only
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(appt, "cancelled")}
                          disabled={isBusy}
                          className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(appt, "confirmed")}
                          disabled={isBusy}
                          className="bg-gold hover:bg-gold-dark text-navy font-bold py-2 px-4 rounded-lg text-xs shadow flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isBusy ? "Working…" : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 truncate">
      {icon}
      <span className="truncate">{value}</span>
    </div>
  );
}
