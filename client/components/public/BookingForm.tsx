"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SERVICES, ServiceType } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useBookingStore } from "@/store/useBookingStore";
import { formatDate } from "@/lib/utils";
import {
  generateSlotsForDate,
  isFutureSlot,
  maxIsoDate,
  todayIsoDate,
  validateBookingDate,
  CLINIC_SCHEDULE,
} from "@/lib/bookingHours";
import { Calendar, Clock, CheckCircle, Search, Info, ShieldCheck, ArrowRight, ArrowLeft, ChevronRight, User, Star, ChevronLeft, CalendarDays, Lock, CreditCard, Mail, ShieldAlert, Activity } from "lucide-react";

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  date: z.string().min(1, "Please select an appointment date"),
  time: z.string().min(1, "Please select an appointment time"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(6, "Valid phone number is required"),
  email: z.string().email("Please enter a valid email"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STEPS = [
  { id: 1, label: "Service" },
  { id: 2, label: "Dentist" },
  { id: 3, label: "Date" },
  { id: 4, label: "Time" },
  { id: 5, label: "Patient Info" },
  { id: 6, label: "Review" },
  { id: 7, label: "Confirmation" },
] as const;

interface BookingFormProps {
  compact?: boolean;
  onClose?: () => void;
}

export default function BookingForm({ compact = false, onClose }: BookingFormProps) {
  const { user } = useAuthStore();
  const { openLoginModal, bookingServiceSlug } = useUIStore();
  const router = useRouter();

  const bookingStore = useBookingStore();
  const step = bookingStore.step;
  const setStep = (s: number) => bookingStore.setBookingData({ step: s });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [serverSlots, setServerSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showInlineLogin, setShowInlineLogin] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [bookingResult, setBookingResult] = useState<{
    appointment: any;
    service: ServiceType | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: bookingStore.serviceId || "",
      date: bookingStore.date || "",
      time: bookingStore.time || "",
      firstName: user?.patientProfile?.firstName || bookingStore.guestDetails?.firstName || "",
      lastName: user?.patientProfile?.lastName || bookingStore.guestDetails?.lastName || "",
      phone: user?.patientProfile?.phone || bookingStore.guestDetails?.phone || "",
      email: user?.email || bookingStore.guestDetails?.email || "",
      notes: bookingStore.notes || "",
    },
  });

  const watchedDate = watch("date");
  const watchedServiceId = watch("serviceId");

  useEffect(() => {
    if (user) {
      setValue("firstName", user.patientProfile?.firstName || "");
      setValue("lastName", user.patientProfile?.lastName || "");
      setValue("phone", user.patientProfile?.phone || "");
      setValue("email", user.email || "");
    }
  }, [user, setValue]);

  useEffect(() => {
    if (bookingServiceSlug) {
      const service = SERVICES.find((s) => s.slug === bookingServiceSlug);
      if (service) {
        setSelectedService(service);
        setValue("serviceId", service.slug, { shouldValidate: true });
        setStep(2);
      }
    }
  }, [bookingServiceSlug, setValue]);

  useEffect(() => {
    if (!watchedDate || !watchedServiceId) {
      setServerSlots(null);
      return;
    }
    const dateError = validateBookingDate(watchedDate);
    if (dateError) {
      setServerSlots(null);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    apiRequest(
      `/appointments/slots?date=${encodeURIComponent(watchedDate)}&service=${encodeURIComponent(
        watchedServiceId
      )}`
    )
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.slots)
          ? data.slots
          : null;
        setServerSlots(list);
      })
      .catch(() => {
        if (!cancelled) setServerSlots(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [watchedDate, watchedServiceId]);

  const availableSlots = useMemo(() => {
    if (!watchedDate) return [];
    const generated = generateSlotsForDate(watchedDate, {
      durationMinutes: selectedService?.duration || 30,
    });
    if (!serverSlots) return generated;
    const allowed = new Set(generated);
    return serverSlots.filter((s) => allowed.has(s));
  }, [watchedDate, selectedService, serverSlots]);

  useEffect(() => {
    const time = watch("time");
    if (!time) return;
    if (!availableSlots.includes(time)) {
      setValue("time", "");
    }
  }, [availableSlots, setValue, watch]);

  const filteredServices = useMemo(
    () =>
      SERVICES.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      ),
    [searchTerm]
  );

  const selectService = (service: ServiceType) => {
    setSelectedService(service);
    setValue("serviceId", service.slug, { shouldValidate: true });
    bookingStore.setBookingData({ serviceId: service.slug });
    setStep(2);
  };

  const handleDateSelect = (dateStr: string) => {
    const dateError = validateBookingDate(dateStr);
    if (dateError) {
      setValue("date", "", { shouldValidate: true });
      setValue("time", "", { shouldValidate: true });
      setError("date", { type: "manual", message: dateError });
      return;
    }
    clearErrors("date");
    setValue("date", dateStr, { shouldValidate: true });
    setValue("time", "");
  };

  const handleTimeSelect = (timeStr: string) => {
    if (!isFutureSlot(watchedDate, timeStr)) {
      setError("time", {
        type: "manual",
        message: "That slot is no longer available. Please pick another time.",
      });
      return;
    }
    clearErrors("time");
    setValue("time", timeStr, { shouldValidate: true });
  };


  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (data.mustChangePassword) {
        setLoginError("Please login via the main portal to change your password first.");
        setLoginLoading(false);
        return;
      }
      useAuthStore.getState().login(data.user);
      setShowInlineLogin(false);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const goNext = async () => {
    if (step === 2) {
      // Dentist selection is UI only, just proceed
      setStep(3);
    } else if (step === 3) {
      const dateError = validateBookingDate(watchedDate);
      if (dateError) {
        setError("date", { type: "manual", message: dateError });
        return;
      }
      const ok = await trigger(["date"]);
      if (!ok) return;
      bookingStore.setBookingData({ date: watchedDate });
      setStep(4);
    } else if (step === 4) {
      const time = watch("time");
      if (!time || !isFutureSlot(watchedDate, time)) {
        setError("time", {
          type: "manual",
          message: "Please pick a valid future time slot.",
        });
        return;
      }
      const ok = await trigger(["time"]);
      if (!ok) return;
      bookingStore.setBookingData({ time: watch("time") });
      setStep(5);
    } else if (step === 5) {
      const ok = await trigger(["firstName", "lastName", "email", "phone"]);
      if (!ok) return;
      bookingStore.setBookingData({
        guestDetails: {
          firstName: watch("firstName"),
          lastName: watch("lastName"),
          phone: watch("phone"),
          email: watch("email"),
        }
      });
      setStep(6);
    }
  };

  const goPrev = () => setStep(Math.max(1, step - 1));

  const onSubmit = async (values: BookingFormValues) => {
    const dateError = validateBookingDate(values.date);
    if (dateError) {
      setError("date", { type: "manual", message: dateError });
      setStep(3);
      return;
    }
    if (!isFutureSlot(values.date, values.time)) {
      setError("time", {
        type: "manual",
        message: "Slot has expired. Please choose another time.",
      });
      setStep(4);
      return;
    }

    if (!user) {
      setSubmitError(
        "Please sign in to submit your appointment request."
      );
      openLoginModal(() => {
        handleSubmit(onSubmit)();
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId: values.serviceId,
          appointmentDate: values.date,
          appointmentTime: values.time,
          notes: values.notes,
          patient: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
          },
        }),
      });

      const appointment = result?.appointment || result;

      setBookingResult({ appointment, service: selectedService });

      import("canvas-confetti")
        .then((confetti) => {
          confetti.default({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        })
        .catch(() => undefined);

      bookingStore.clearBookingData();
      setStep(7); // Go to confirmation step instead of closing immediately
    } catch (error: any) {
      setSubmitError(error?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleNote = useMemo(() => {
    if (!watchedDate) return null;
    const date = new Date(`${watchedDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.getDay();
    const sched = CLINIC_SCHEDULE[day];
    if (!sched.open) return "Closed on this day.";
    return `Clinic hours: ${sched.open} – ${sched.close}`;
  }, [watchedDate]);

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* Stepper Header */}
      {step < 7 && (
        <div className="sticky top-0 z-30 bg-[#FAFBFC]/95 backdrop-blur-sm pt-4 pb-4 mb-5 border-b border-[#E7ECF2] flex">
          <div className="flex-1">
            <ol className="flex items-center justify-between w-full">
              {STEPS.slice(0, 6).map((s, idx) => {
                const isActive = step === s.id;
                const isComplete = step > s.id;
                return (
                  <li key={s.id} className="flex flex-col items-center relative flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                      isActive ? "bg-[#1E73BE] text-white shadow-md scale-110" : 
                      isComplete ? "bg-navy text-white" : "bg-white text-gray-400 border border-[#E7ECF2]"
                    }`}>
                      {isComplete ? <CheckCircle className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`hidden md:block absolute -bottom-6 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap transition-colors ${
                      isActive ? "text-[#1E73BE]" : isComplete ? "text-navy" : "text-gray-400"
                    }`}>
                      {s.label}
                    </span>
                    {idx < 5 && (
                      <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 transition-colors ${
                        isComplete ? "bg-navy" : "bg-[#E7ECF2]"
                      }`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* STEP 1: SERVICE */}
      {step === 1 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#FAFBFC] pb-4 pt-2 z-10 sticky top-0">
            <div className="space-y-1 mb-4 text-center">
              <h3 className="font-serif text-2xl text-navy font-bold">Select Service</h3>
              <p className="text-gray-500 text-xs font-light">Choose your preferred treatment.</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#E7ECF2] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:ring-1 focus:ring-[#1E73BE] transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 min-h-0 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filteredServices.length === 0 ? (
                <div className="col-span-full text-center py-8 text-sm text-gray-400">No services match "{searchTerm}".</div>
              ) : (
                filteredServices.map((service) => (
                  <button
                    type="button"
                    key={service.slug}
                    onClick={() => selectService(service)}
                    className="text-left bg-white border border-[#E7ECF2] hover:border-[#1E73BE] rounded-[20px] p-6 cursor-pointer transition-all flex flex-col justify-between hover:shadow-[0_12px_24px_rgba(30,115,190,0.08)] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#1E73BE] bg-[#1E73BE]/10 px-3 py-1 rounded-full">
                        {service.category}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-navy mt-4">{service.name}</h4>
                      <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed font-light">{service.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E7ECF2] mt-5 pt-4 text-xs">
                      <span className="text-gray-400 font-medium">{service.duration} mins</span>
                      <span className="font-bold text-navy text-sm">&euro;{service.priceFrom} – &euro;{service.priceTo}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DENTIST */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in flex flex-col h-full">
          <div className="space-y-2 shrink-0">
            <h3 className="font-serif text-3xl text-navy font-bold">Choose Dentist</h3>
            <p className="text-gray-500 text-sm font-light">Select your preferred clinical specialist.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1">
            <button
              type="button"
              onClick={() => goNext()}
              className="w-full text-left bg-white border border-[#1E73BE] rounded-[24px] p-6 transition-all hover:shadow-[0_12px_30px_rgba(30,115,190,0.12)] flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E73BE]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-24 h-24 rounded-full overflow-hidden border border-[#E7ECF2] shrink-0 shadow-sm relative z-10">
                <img src="/doctor.png" alt="Dr. Roghay Alizadeh" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 relative z-10 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-serif text-xl font-bold text-navy">Dr. Roghay Alizadeh</h4>
                  <span className="bg-[#1E73BE]/10 text-[#1E73BE] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Available</span>
                </div>
                <p className="text-[#1E73BE] text-xs font-semibold uppercase tracking-wider mt-1">Principal Dentist & Aesthetic Specialist</p>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed font-light">Dr. Alizadeh specializes in cosmetic and restorative dentistry, providing a calm and pain-free experience tailored to your unique smile.</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-600"><Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> 4.9/5 Rating</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-600"><User className="w-3.5 h-3.5 text-gray-400" /> 10+ Yrs Exp.</span>
                </div>
              </div>
            </button>
          </div>

          <div className="shrink-0 mt-auto pt-6 flex justify-between border-t border-[#E7ECF2]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-navy font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE */}
      {step === 3 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#FAFBFC] pb-4 pt-2 z-10 sticky top-0">
            <div className="space-y-1 text-center">
              <h3 className="font-serif text-2xl text-navy font-bold">Select Date</h3>
              <p className="text-gray-500 text-xs font-light">Choose your preferred day for the appointment.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            <div className="bg-white border border-[#E7ECF2] rounded-2xl p-5 shadow-sm max-w-sm mx-auto">
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#1E73BE]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy">Appointment Date</h4>
                  <p className="text-xs text-gray-500">Pick a day that works for you.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5 shrink-0">
                <button type="button" onClick={() => handleDateSelect(todayIsoDate())} className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${watchedDate === todayIsoDate() ? "bg-[#1E73BE] text-white border-[#1E73BE] shadow-md" : "bg-[#FAFBFC] text-navy border-[#E7ECF2] hover:border-[#1E73BE] hover:bg-white"}`}>
                  Today
                </button>
                <button type="button" onClick={() => {
                  const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
                  handleDateSelect(tmrw.toISOString().split("T")[0]);
                }} className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${watchedDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0] ? "bg-[#1E73BE] text-white border-[#1E73BE] shadow-md" : "bg-[#FAFBFC] text-navy border-[#E7ECF2] hover:border-[#1E73BE] hover:bg-white"}`}>
                  Tomorrow
                </button>
                <button type="button" onClick={() => {
                  const nextWk = new Date(); nextWk.setDate(nextWk.getDate() + 7);
                  handleDateSelect(nextWk.toISOString().split("T")[0]);
                }} className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${watchedDate === new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0] ? "bg-[#1E73BE] text-white border-[#1E73BE] shadow-md" : "bg-[#FAFBFC] text-navy border-[#E7ECF2] hover:border-[#1E73BE] hover:bg-white"}`}>
                  Next Week
                </button>
              </div>

              <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Or select specific date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayIsoDate()}
                    max={maxIsoDate()}
                    value={watchedDate || ""}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full bg-white border border-[#E7ECF2] rounded-xl py-3 px-4 text-sm font-semibold text-navy focus:outline-none focus:border-[#1E73BE] focus:ring-1 focus:ring-[#1E73BE] transition-all cursor-pointer shadow-sm appearance-none"
                    style={{ WebkitAppearance: 'none' }}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                     <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {scheduleNote && (
                <div className="mt-5 bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl p-3.5 flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#1E73BE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-navy">Clinic Availability</p>
                    <p className="text-xs text-gray-500 mt-0.5">{scheduleNote}</p>
                  </div>
                </div>
              )}
              {errors.date && <p className="text-[10px] text-red-500 mt-2 font-medium">{errors.date.message}</p>}
            </div>
          </div>

          <div className="shrink-0 mt-2 pt-4 flex justify-between border-t border-[#E7ECF2]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-navy font-semibold text-xs py-2.5 px-5 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1.5">
               <ArrowLeft className="w-3.5 h-3.5" /> Back
             </button>
             <button type="button" onClick={goNext} disabled={!watchedDate} className="bg-navy hover:bg-[#173B6D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-6 rounded-full transition-colors flex items-center gap-1.5 shadow-md">
               Continue <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>
      )}

      {/* STEP 4: TIME */}
      {step === 4 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#FAFBFC] pb-4 pt-2 z-10 sticky top-0">
            <div className="space-y-1 text-center">
              <h3 className="font-serif text-2xl text-navy font-bold">Select Time</h3>
              <p className="text-gray-500 text-xs font-light">Choose a time slot for {watchedDate}.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            <div className="bg-white border border-[#E7ECF2] rounded-2xl p-5 shadow-sm max-w-sm mx-auto flex flex-col">
              <div className="flex items-center gap-3 mb-5 shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#1E73BE]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy">Available Slots</h4>
                  <p className="text-xs text-gray-500">Pick a time that works for you.</p>
                </div>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg shimmer bg-gray-100" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center flex flex-col items-center justify-center h-32">
                  <Info className="w-5 h-5 text-red-400 mb-2" />
                  <p className="text-xs text-red-600 font-bold">No available slots</p>
                  <p className="text-[10px] text-red-500 mt-1">Please select a different day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-64">
                  {availableSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTimeSelect(t)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-semibold text-center transition-all focus:outline-none focus:ring-2 focus:ring-[#1E73BE]/30 ${
                        watch("time") === t
                          ? "bg-navy text-white shadow-md border border-navy"
                          : "bg-[#FAFBFC] border border-[#E7ECF2] text-navy hover:border-[#1E73BE] hover:text-[#1E73BE] hover:bg-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && <p className="text-[10px] text-red-500 mt-4 font-medium">{errors.time.message}</p>}
            </div>
          </div>

          <div className="shrink-0 mt-2 pt-4 flex justify-between border-t border-[#E7ECF2]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-navy font-semibold text-xs py-2.5 px-5 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1.5">
               <ArrowLeft className="w-3.5 h-3.5" /> Back
             </button>
             <button type="button" onClick={goNext} disabled={!watch("time")} className="bg-navy hover:bg-[#173B6D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-6 rounded-full transition-colors flex items-center gap-1.5 shadow-md">
               Continue <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>
      )}

      {/* STEP 5: PATIENT INFO */}
      {step === 5 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#FAFBFC] pb-4 pt-2 z-10 sticky top-0">
            <div className="space-y-1 text-center">
              <h3 className="font-serif text-2xl text-navy font-bold">{showInlineLogin ? 'Sign In Securely' : 'Patient Details'}</h3>
              <p className="text-gray-500 text-xs font-light">{showInlineLogin ? 'Log in to fast-track your booking' : 'How can we contact you regarding this appointment?'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            {showInlineLogin ? (
              <div className="bg-white border border-[#E7ECF2] rounded-2xl p-6 shadow-sm max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-[#1E73BE]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Welcome Back</h4>
                    <p className="text-xs text-gray-500">Sign in to continue</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy ml-1">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy ml-1">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {loginError && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-start gap-2 border border-red-100">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{loginError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleInlineLogin}
                    disabled={loginLoading || !loginEmail || !loginPassword}
                    className="w-full bg-navy hover:bg-[#173B6D] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loginLoading ? <Activity className="w-4 h-4 animate-spin" /> : 'Sign In & Continue'}
                  </button>
                  
                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setShowInlineLogin(false)} className="text-xs text-gray-500 hover:text-navy underline underline-offset-2">
                      Continue as Guest Instead
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E7ECF2] rounded-2xl p-5 md:p-6 shadow-sm max-w-lg mx-auto">
                {!user && (
                  <div className="bg-[#1E73BE]/5 border border-[#1E73BE]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between text-navy shrink-0 shadow-sm gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="w-5 h-5 text-[#1E73BE] shrink-0" />
                      <span className="font-medium">Have an account? Fast-track your booking.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineLogin(true)}
                      className="bg-white border border-[#E7ECF2] text-navy hover:text-[#1E73BE] hover:border-[#1E73BE] font-semibold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                    >
                      Sign In Securely
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy ml-1">First Name</label>
                      <input
                        {...register("firstName")}
                        placeholder="e.g. Jane"
                        className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      />
                      {errors.firstName && <p className="text-[10px] text-red-500 ml-1">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy ml-1">Last Name</label>
                      <input
                        {...register("lastName")}
                        placeholder="e.g. Doe"
                        className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      />
                      {errors.lastName && <p className="text-[10px] text-red-500 ml-1">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy ml-1">Phone Number</label>
                      <input
                        {...register("phone")}
                        placeholder="08X XXX XXXX"
                        className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      />
                      {errors.phone && <p className="text-[10px] text-red-500 ml-1">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-navy ml-1">Email Address</label>
                      <input
                        {...register("email")}
                        placeholder="jane.doe@example.com"
                        className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors"
                      />
                      {errors.email && <p className="text-[10px] text-red-500 ml-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy ml-1">Medical Notes (Optional)</label>
                    <textarea
                      {...register("notes")}
                      placeholder="Let us know if you have any allergies or specific requirements..."
                      rows={2}
                      className="w-full bg-[#FAFBFC] border border-[#E7ECF2] rounded-xl p-4 text-sm focus:outline-none focus:border-[#1E73BE] focus:bg-white transition-colors resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!showInlineLogin && (
            <div className="shrink-0 mt-2 pt-4 flex justify-between border-t border-[#E7ECF2]">
               <button type="button" onClick={goPrev} className="text-gray-500 hover:text-navy font-semibold text-xs py-2.5 px-5 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                 <ArrowLeft className="w-3.5 h-3.5" /> Back
               </button>
               <button type="button" onClick={goNext} className="bg-navy hover:bg-[#173B6D] text-white font-semibold text-xs py-2.5 px-6 rounded-full transition-colors flex items-center gap-1.5 shadow-md">
                 Review Booking <ArrowRight className="w-3.5 h-3.5" />
               </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: REVIEW */}
      {step === 6 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in flex flex-col h-full overflow-y-auto custom-scrollbar px-1 py-4">
          <div className="space-y-2 shrink-0">
            <h3 className="font-serif text-3xl text-navy font-bold">Review & Confirm</h3>
            <p className="text-gray-500 text-sm font-light">Please verify your appointment details below.</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="bg-white border border-[#E7ECF2] rounded-[24px] overflow-hidden shadow-sm">
               <div className="bg-[#FAFBFC] p-6 border-b border-[#E7ECF2] flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-[#1E73BE]/10 flex items-center justify-center text-[#1E73BE]">
                   <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-serif text-xl font-bold text-navy">{selectedService?.name}</h4>
                   <p className="text-sm text-gray-500 mt-1">with Dr. Roghay Alizadeh</p>
                 </div>
               </div>

               <div className="p-6 md:p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <p className="text-[11px] uppercase font-bold tracking-widest text-gray-400 mb-1">Date</p>
                     <p className="text-base font-semibold text-navy">{watchedDate ? formatDate(watchedDate) : "-"}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-bold tracking-widest text-gray-400 mb-1">Time</p>
                     <p className="text-base font-semibold text-navy">{watch("time")}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-bold tracking-widest text-gray-400 mb-1">Patient</p>
                     <p className="text-base font-semibold text-navy">{watch("firstName")} {watch("lastName")}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-bold tracking-widest text-gray-400 mb-1">Contact</p>
                     <p className="text-sm text-navy">{watch("phone")}</p>
                   </div>
                 </div>

                 <div className="border-t border-[#E7ECF2] pt-6 flex justify-between items-center">
                   <div>
                     <p className="text-sm font-medium text-navy">Estimated Cost</p>
                     <p className="text-xs text-gray-400 mt-1">Finalized at clinic</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xl font-bold text-[#1E73BE]">&euro;{selectedService?.priceFrom} – &euro;{selectedService?.priceTo}</p>
                   </div>
                 </div>
               </div>
            </div>

            {submitError && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-[16px] p-4 text-sm text-red-600 font-medium">
                {submitError}
              </div>
            )}
          </div>

          <div className="shrink-0 mt-auto pt-6 flex justify-between border-t border-[#E7ECF2]">
             <button type="button" onClick={goPrev} disabled={submitting} className="text-gray-500 hover:text-navy font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <button type="submit" disabled={submitting} className="bg-navy hover:bg-[#173B6D] disabled:opacity-50 text-white font-semibold text-sm py-4 px-10 rounded-full transition-colors shadow-lg flex items-center gap-2">
               {submitting ? "Processing Securely..." : "Confirm Booking"}
             </button>
          </div>
        </form>
      )}

      {/* STEP 7: CONFIRMATION */}
      {step === 7 && bookingResult && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in py-10 px-4 overflow-y-auto custom-scrollbar">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
            <CheckCircle className="w-12 h-12 text-emerald-600 relative z-10" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4">
            Appointment Confirmed
          </h2>
          <p className="text-gray-600 max-w-md text-base leading-relaxed mb-8">
            Thank you, <span className="font-semibold text-navy">{bookingResult.appointment?.patientName || "Valued Patient"}</span>.
            Your <span className="font-semibold text-navy">{bookingResult.service?.name}</span> appointment is securely booked for:
          </p>
          <div className="bg-[#FAFBFC] border border-[#E7ECF2] rounded-[24px] p-6 w-full max-w-sm mb-10 shadow-sm">
            <p className="text-lg font-bold text-navy mb-1">
              {formatDate(bookingResult.appointment?.appointmentDate)}
            </p>
            <p className="text-lg font-bold text-[#1E73BE]">
              {bookingResult.appointment?.appointmentTime}
            </p>
          </div>
          <div className="space-y-4 w-full max-w-xs">
            <button
              onClick={() => {
                onClose?.();
                router.push("/portal/appointments");
              }}
              className="w-full bg-navy hover:bg-[#173B6D] text-white font-semibold py-4 px-6 rounded-full transition-all shadow-md hover:scale-[1.01]"
            >
              View My Appointments
            </button>
            <button
              onClick={() => {
                onClose?.();
                router.push("/");
              }}
              className="w-full bg-white hover:bg-gray-50 border border-[#E7ECF2] text-navy font-semibold py-4 px-6 rounded-full transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
