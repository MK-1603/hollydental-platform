"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Clock, Stethoscope, CheckCircle2, AlertCircle, XCircle, Activity, PlayCircle, Hourglass, Bell, ShieldCheck } from "lucide-react";

type Appointment = {
  id: string;
  patientId: string;
  serviceId: string;
  serviceName?: string;
  doctorId: string | null;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  status: string;
  type: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const PROGRESS = [
  { key: "pending", label: "Submitted", icon: Hourglass },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "arrived", label: "Arrived", icon: Bell },
  { key: "in_progress", label: "In Progress", icon: PlayCircle },
  { key: "completed", label: "Completed", icon: ShieldCheck },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  arrived: 2,
  in_progress: 3,
  completed: 4,
};

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    apiRequest(`/appointments/${id}`)
      .then((data) => {
        if (cancelled) return;
        setAppt(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load appointment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!appt) return -1;
    if (appt.status === "cancelled" || appt.status === "no_show") return -1;
    return STATUS_INDEX[appt.status] ?? 0;
  }, [appt]);

  const handleCancel = async () => {
    if (!appt) return;
    const ok = await toast.confirm({
      title: "Cancel this appointment?",
      message: "You can rebook anytime from the booking page.",
      confirmText: "Yes, cancel",
      danger: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await apiRequest(`/appointments/${appt.id}`, { method: "DELETE" });
      toast.success("Appointment cancelled.");
      router.push("/portal/appointments");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 shimmer rounded" />
        <div className="h-[200px] shimmer rounded-xl" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="border border-red-100 bg-red-50/60 rounded-2xl p-8 max-w-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-navy">
              Couldn&apos;t load appointment
            </h2>
            <p className="text-sm text-gray-600">
              {error || "The appointment may have been removed."}
            </p>
            <Link
              href="/portal/appointments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = appt.status === "cancelled" || appt.status === "no_show";
  const isFinal = appt.status === "completed" || isCancelled;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/portal/appointments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to appointments
      </Link>

      <header className="space-y-2 border-b border-gray-100 pb-5">
        <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
          Appointment Detail
        </span>
        <h1 className="font-serif text-3xl font-bold text-navy">
          {appt.serviceName || appt.serviceId.replace(/-/g, " ")}
        </h1>
        <p className="text-gray-600 text-sm">
          {formatDate(appt.appointmentDate)} at {appt.appointmentTime}
        </p>
      </header>

      {/* Progress Timeline */}
      <section className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-serif text-base font-bold text-navy flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold" /> Progress timeline
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <XCircle className="w-4 h-4" /> This appointment was {appt.status === "no_show" ? "marked as no-show" : "cancelled"}.
          </div>
        ) : (
          <ol className="grid grid-cols-5 gap-2 text-[10px]">
            {PROGRESS.map((step, idx) => {
              const Icon = step.icon;
              const reached = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <li key={step.key} className="flex flex-col items-center text-center gap-1.5">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      reached
                        ? "bg-gold text-navy"
                        : "bg-gray-100 text-gray-400"
                    } ${isCurrent ? "ring-2 ring-gold/40" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span
                    className={`uppercase font-semibold tracking-wider ${
                      reached ? "text-navy" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <p className="text-[11px] text-gray-500 leading-relaxed">
          You&apos;ll receive a push notification on this device whenever the clinic
          updates the status of your appointment.
        </p>
      </section>

      {/* Detail card */}
      <section className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-base font-bold text-navy">Appointment details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <DetailRow icon={<CalendarDays className="w-3.5 h-3.5 text-gold" />} label="Date">
            {formatDate(appt.appointmentDate)}
          </DetailRow>
          <DetailRow icon={<Clock className="w-3.5 h-3.5 text-gold" />} label="Time">
            {appt.appointmentTime}
          </DetailRow>
          <DetailRow icon={<Stethoscope className="w-3.5 h-3.5 text-gold" />} label="Treatment">
            {appt.serviceName || appt.serviceId.replace(/-/g, " ")}
          </DetailRow>
          <DetailRow label="Duration">{appt.durationMinutes} minutes</DetailRow>
          <DetailRow label="Status" className="capitalize">
            {appt.status.replace("_", " ")}
          </DetailRow>
          <DetailRow label="Type" className="capitalize">
            {appt.type}
          </DetailRow>
          <DetailRow label="Reference">
            <span className="font-mono">{appt.id.substring(0, 8).toUpperCase()}</span>
          </DetailRow>
          <DetailRow label="Booked on">{formatDate(appt.createdAt)}</DetailRow>
        </dl>

        {appt.notes && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-xs leading-relaxed text-gray-600">
            <p className="font-bold text-navy text-[10px] uppercase tracking-wider mb-1">
              Notes
            </p>
            {appt.notes}
          </div>
        )}
      </section>

      {/* Actions */}
      {!isFinal && (
        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 bg-red-50/60 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Cancelling…" : "Cancel appointment"}
          </button>
          <Link
            href="/portal/messages"
            className="text-xs font-semibold text-navy border border-gray-200 hover:border-gold hover:text-gold px-4 py-2 rounded-lg transition-colors"
          >
            Message the clinic
          </Link>
        </section>
      )}
    </div>
  );
}

function DetailRow({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd className={`text-sm font-semibold text-navy ${className || ""}`}>{children}</dd>
    </div>
  );
}
