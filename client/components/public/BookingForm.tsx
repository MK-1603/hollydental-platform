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
import { Calendar, Clock, CheckCircle, Search, Info, ShieldCheck, ArrowRight, ArrowLeft, ChevronRight, User, Star, ChevronLeft, CalendarDays, Lock, CreditCard, Mail, ShieldAlert, Activity, ChevronDown, Filter } from "lucide-react";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
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

  const filteredServices = useMemo(() => {
    let filtered = SERVICES.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }
    return filtered;
  }, [searchTerm, selectedCategory]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, ServiceType[]> = {};
    filteredServices.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [filteredServices]);

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
        <div className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-sm pt-4 pb-4 mb-5 border-b border-[#E2E8F0] flex">
          <div className="flex-1">
            <ol className="flex items-center justify-between w-full">
              {STEPS.slice(0, 6).map((s, idx) => {
                const isActive = step === s.id;
                const isComplete = step > s.id;
                return (
                  <li key={s.id} className="flex flex-col items-center relative flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all z-10 ${
                      isActive ? "bg-[#2563EB] text-white shadow-sm scale-110" : 
                      isComplete ? "bg-slate-900 text-white" : "bg-white text-gray-400 border border-[#E2E8F0]"
                    }`}>
                      {isComplete ? <CheckCircle className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`hidden md:block absolute -bottom-6 text-[10px] uppercase font-semibold tracking-wider whitespace-nowrap transition-colors ${
                      isActive ? "text-[#2563EB]" : isComplete ? "text-slate-900" : "text-gray-400"
                    }`}>
                      {s.label}
                    </span>
                    {idx < 5 && (
                      <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 transition-colors ${
                        isComplete ? "bg-slate-900" : "bg-[#E2E8F0]"
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
          <div className="shrink-0 bg-[#F8FAFC] pb-4 pt-2 z-30 sticky top-0">
            <div className="space-y-1 mb-6 text-center">
              <h3 className="font-serif text-2xl text-slate-900 font-semibold">Select Service</h3>
              <p className="text-gray-500 text-xs font-light">Choose your preferred treatment.</p>
            </div>
            
            <div className="flex gap-3 w-full relative z-20">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search treatments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 hover:border-[#2563EB] transition-all shadow-sm flex items-center gap-2 h-full"
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="hidden sm:inline">
                    {selectedCategory === 'all' ? 'All' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-fade-in">
                      {['all', 'general', 'cosmetic', 'orthodontics', 'advanced'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                            selectedCategory === cat
                              ? "bg-[#2563EB]/5 text-[#2563EB]"
                              : "text-gray-600 hover:bg-gray-50 hover:text-slate-900"
                          }`}
                        >
                          {cat === 'all' ? 'All Treatments' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 min-h-0 mt-2">
            <div className="space-y-8 pb-8">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">No services match "{searchTerm}".</div>
              ) : (
                Object.entries(groupedServices).map(([category, services]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm">
                        {category}
                      </h4>
                      <div className="h-px bg-[#E2E8F0] flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <button
                          type="button"
                          key={service.slug}
                          onClick={() => selectService(service)}
                          className="group relative text-left bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-5 cursor-pointer transition-all duration-200 ease-out flex flex-col justify-between   overflow-hidden"
                        >
                          
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[10px] uppercase font-semibold tracking-wide text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full">
                                 {service.category}
                               </span>
                               <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#2563EB] transition-colors group-hover:translate-x-1 duration-200 ease-out" />
                            </div>
                            <h4 className="font-serif text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#2563EB] transition-colors">{service.name}</h4>
                            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed font-light">{service.description}</p>
                          </div>
                          
                          <div className="relative z-10 flex items-center justify-between border-t border-gray-100 mt-5 pt-4 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{service.duration} mins</span>
                            </div>
                            <div className="font-semibold text-slate-900 text-sm bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-[#2563EB]/5 group-hover:text-[#2563EB] transition-colors">
                              &euro;{service.priceFrom} {service.priceTo > service.priceFrom ? `– \u20AC${service.priceTo}` : ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
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
            <h3 className="font-serif text-3xl text-slate-900 font-semibold">Choose Dentist</h3>
            <p className="text-gray-500 text-sm font-light">Select your preferred clinical specialist.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar p-1 items-start">
            <button
              type="button"
              onClick={() => goNext()}
              className="group relative text-left bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-5 cursor-pointer transition-all duration-200 ease-out flex flex-col   overflow-hidden"
            >
              
              
              <div className="flex flex-row items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-[#E2E8F0] shrink-0 shadow-sm bg-gray-50">
                  <img src="/doctor.png" alt="Dr. Roghay Alizadeh" className="w-full h-full object-cover group- transition-transform duration-200 ease-out" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors truncate">
                    Dr. Roghay Alizadeh
                  </h4>
                  <p className="text-[#2563EB] text-[11px] font-semibold mt-0.5 truncate">
                    Principal Dentist & Aesthetic Specialist
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 mt-4">
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                  Specializes in cosmetic and restorative dentistry, providing a calm and pain-free experience tailored to your unique smile.
                </p>
              </div>
              
              <div className="relative z-10 flex items-center justify-between border-t border-gray-100 mt-4 pt-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> 4.9/5
                  </span>
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    <User className="w-3.5 h-3.5 text-gray-400" /> 10+ Yrs
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-100">
                  Available
                </span>
              </div>
            </button>
          </div>

          <div className="shrink-0 mt-auto pt-6 flex justify-between border-t border-[#E2E8F0]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-slate-900 font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE */}
      {step === 3 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#F8FAFC] pb-6 pt-2 z-10 sticky top-0">
            <div className="space-y-2 text-center">
              <h3 className="font-serif text-3xl text-slate-900 font-semibold">Select Date</h3>
              <p className="text-gray-500 text-sm font-light">Choose your preferred day for the appointment.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            <div className="max-w-md mx-auto w-full space-y-6 pb-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 mt-4">
                <button type="button" onClick={() => handleDateSelect(todayIsoDate())} className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center ${watchedDate === todayIsoDate() ? "bg-[#2563EB] text-white border-[#2563EB]  shadow-[#2563EB]/30 " : "bg-white text-slate-900 border-[#E2E8F0] hover:border-[#2563EB]  hover:shadow-sm"}`}>
                  Today
                </button>
                <button type="button" onClick={() => {
                  const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
                  handleDateSelect(tmrw.toISOString().split("T")[0]);
                }} className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center ${watchedDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0] ? "bg-[#2563EB] text-white border-[#2563EB]  shadow-[#2563EB]/30 " : "bg-white text-slate-900 border-[#E2E8F0] hover:border-[#2563EB]  hover:shadow-sm"}`}>
                  Tomorrow
                </button>
                <button type="button" onClick={() => {
                  const nextWk = new Date(); nextWk.setDate(nextWk.getDate() + 7);
                  handleDateSelect(nextWk.toISOString().split("T")[0]);
                }} className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center ${watchedDate === new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0] ? "bg-[#2563EB] text-white border-[#2563EB]  shadow-[#2563EB]/30 " : "bg-white text-slate-900 border-[#E2E8F0] hover:border-[#2563EB]  hover:shadow-sm"}`}>
                  Next Week
                </button>
              </div>

              <div className="relative bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 block text-center sm:text-left">Or Select Specific Date</label>
                <div className="relative group">
                  <input
                    type="date"
                    min={todayIsoDate()}
                    max={maxIsoDate()}
                    value={watchedDate || ""}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="relative w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-4 px-5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all cursor-pointer shadow-sm group-hover:shadow-sm group-hover:bg-white group-hover:border-[#2563EB]/50 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ WebkitAppearance: 'none' }}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none group-hover:text-[#2563EB] transition-colors text-gray-400">
                     <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              {scheduleNote && (
                <div className="mt-6 bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Clinic Availability</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{scheduleNote}</p>
                  </div>
                </div>
              )}
              {errors.date && <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5"/> {errors.date.message}</p>}
            </div>
          </div>

          <div className="shrink-0 mt-2 pt-6 flex justify-between border-t border-[#E2E8F0]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-slate-900 font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <button type="button" onClick={goNext} disabled={!watchedDate} className="bg-[#2563EB] hover:bg-[#1A365D] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-8 rounded-full transition-all  flex items-center gap-2  shadow-[#2563EB]/25">
               Continue <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      {/* STEP 4: TIME */}
      {step === 4 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#F8FAFC] pb-6 pt-2 z-10 sticky top-0">
            <div className="space-y-2 text-center">
              <h3 className="font-serif text-3xl text-slate-900 font-semibold">Select Time</h3>
              <p className="text-gray-500 text-sm font-light">Choose a time slot for {watchedDate ? formatDate(watchedDate) : ''}.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            <div className="max-w-md mx-auto w-full space-y-6 pb-8 flex flex-col">

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl shimmer bg-gray-100" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-9 text-center flex flex-col items-center justify-center min-h-[200px] mt-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Info className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-base text-red-600 font-semibold mb-1">No Available Slots</p>
                  <p className="text-xs text-red-500 font-medium">We're fully booked on this day. Please select another date.</p>
                  <button type="button" onClick={goPrev} className="mt-6 px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-full text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm">
                    Choose Another Date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar pr-1 max-h-[350px] mt-4">
                  {availableSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTimeSelect(t)}
                      className={`py-3.5 px-2 rounded-xl text-sm font-semibold text-center transition-all duration-200 ease-out focus:outline-none ${
                        watch("time") === t
                          ? "bg-[#2563EB] text-white  shadow-[#2563EB]/30  border-transparent"
                          : "bg-white border border-[#E2E8F0] text-slate-900 hover:border-[#2563EB] hover:text-[#2563EB] hover:shadow-sm "
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && <p className="text-xs text-red-500 mt-5 font-medium flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5"/> {errors.time.message}</p>}
            </div>
          </div>

          <div className="shrink-0 mt-2 pt-6 flex justify-between border-t border-[#E2E8F0]">
             <button type="button" onClick={goPrev} className="text-gray-500 hover:text-slate-900 font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <button type="button" onClick={goNext} disabled={!watch("time")} className="bg-[#2563EB] hover:bg-[#1A365D] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-8 rounded-full transition-all  flex items-center gap-2  shadow-[#2563EB]/25">
               Continue <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}      {/* STEP 5: PATIENT INFO */}
      {step === 5 && (
        <div className="flex flex-col h-full animate-fade-in min-h-0 pb-4">
          <div className="shrink-0 bg-[#F8FAFC] pb-6 pt-2 z-10 sticky top-0">
            <div className="space-y-2 text-center">
              <h3 className="font-serif text-3xl text-slate-900 font-semibold">{showInlineLogin ? 'Sign In Securely' : 'Patient Details'}</h3>
              <p className="text-gray-500 text-sm font-light">{showInlineLogin ? 'Log in to fast-track your booking' : 'How can we contact you regarding this appointment?'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 min-h-0">
            {showInlineLogin ? (
              <div className="max-w-md mx-auto w-full space-y-6 pb-8">
                
                <button
                  type="button"
                  className="w-full bg-white border border-[#E2E8F0] hover:bg-gray-50 text-slate-900 font-semibold text-sm py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Or with email</span>
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-sm"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {loginError && (
                    <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl flex items-start gap-2 border border-red-100">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="font-semibold">{loginError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleInlineLogin}
                    disabled={loginLoading || !loginEmail || !loginPassword}
                    className="w-full bg-[#2563EB] hover:bg-[#1A365D] disabled:opacity-50 text-white font-semibold text-sm py-4 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {loginLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Sign In & Continue'}
                  </button>
                  
                  <div className="text-center pt-4">
                    <button type="button" onClick={() => setShowInlineLogin(false)} className="text-sm font-semibold text-gray-500 hover:text-slate-900 transition-colors">
                      Continue as Guest Instead
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto w-full space-y-8 pb-8 px-2">
                {!user && (
                  <div className="bg-white border border-[#2563EB]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between text-slate-900 shrink-0 shadow-sm gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#2563EB]" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Already have an account?</p>
                        <p className="text-xs text-gray-500 mt-0.5">Sign in to fast-track your booking.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineLogin(true)}
                      className="bg-white border border-[#E2E8F0] text-slate-900 hover:text-[#2563EB] hover:border-[#2563EB] font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm w-full sm:w-auto"
                    >
                      Sign In Securely
                    </button>
                  </div>
                )}

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 sm:p-9 shadow-sm">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center shrink-0 border border-[#2563EB]/10 shadow-sm">
                      <User className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 font-serif">Your Details</h4>
                      <p className="text-sm text-gray-500 font-light mt-0.5">Please provide your contact information.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">First Name</label>
                        <input
                          {...register("firstName")}
                          placeholder="e.g. Jane"
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all shadow-sm"
                        />
                        {errors.firstName && <p className="text-[10px] text-red-500 ml-1 font-semibold mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Last Name</label>
                        <input
                          {...register("lastName")}
                          placeholder="e.g. Doe"
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all shadow-sm"
                        />
                        {errors.lastName && <p className="text-[10px] text-red-500 ml-1 font-semibold mt-1">{errors.lastName.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Phone Number</label>
                        <input
                          {...register("phone")}
                          placeholder="08X XXX XXXX"
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all shadow-sm"
                        />
                        {errors.phone && <p className="text-[10px] text-red-500 ml-1 font-semibold mt-1">{errors.phone.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Email Address</label>
                        <input
                          {...register("email")}
                          placeholder="jane.doe@example.com"
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all shadow-sm"
                        />
                        {errors.email && <p className="text-[10px] text-red-500 ml-1 font-semibold mt-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Medical Notes (Optional)</label>
                      <textarea
                        {...register("notes")}
                        placeholder="Let us know if you have any allergies or specific requirements..."
                        rows={3}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:bg-white transition-all shadow-sm resize-none custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!showInlineLogin && (
            <div className="shrink-0 mt-2 pt-6 flex justify-between border-t border-[#E2E8F0]">
               <button type="button" onClick={goPrev} className="text-gray-500 hover:text-slate-900 font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
                 <ArrowLeft className="w-4 h-4" /> Back
               </button>
               <button type="button" onClick={goNext} className="bg-[#2563EB] hover:bg-[#1A365D] text-white font-semibold text-sm py-3 px-8 rounded-full transition-colors flex items-center gap-2 shadow-sm">
                 Review Booking <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: REVIEW */}
      {step === 6 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in flex flex-col h-full overflow-y-auto custom-scrollbar px-1 py-4">
          <div className="space-y-2 shrink-0">
            <h3 className="font-serif text-3xl text-slate-900 font-semibold">Review & Confirm</h3>
            <p className="text-gray-500 text-sm font-light">Please verify your appointment details below.</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-[#F8FAFC] p-7 border-b border-[#E2E8F0] flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                   <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-serif text-xl font-semibold text-slate-900">{selectedService?.name}</h4>
                   <p className="text-sm text-gray-500 mt-1">with Dr. Roghay Alizadeh</p>
                 </div>
               </div>

               <div className="p-7 md:p-9 space-y-6">
                 <div className="grid grid-cols-2 gap-7">
                   <div>
                     <p className="text-[11px] uppercase font-semibold tracking-wide text-gray-400 mb-1">Date</p>
                     <p className="text-base font-semibold text-slate-900">{watchedDate ? formatDate(watchedDate) : "-"}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-semibold tracking-wide text-gray-400 mb-1">Time</p>
                     <p className="text-base font-semibold text-slate-900">{watch("time")}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-semibold tracking-wide text-gray-400 mb-1">Patient</p>
                     <p className="text-base font-semibold text-slate-900">{watch("firstName")} {watch("lastName")}</p>
                   </div>
                   <div>
                     <p className="text-[11px] uppercase font-semibold tracking-wide text-gray-400 mb-1">Contact</p>
                     <p className="text-sm text-slate-900">{watch("phone")}</p>
                   </div>
                 </div>

                 <div className="border-t border-[#E2E8F0] pt-6 flex justify-between items-center">
                   <div>
                     <p className="text-sm font-medium text-slate-900">Estimated Cost</p>
                     <p className="text-xs text-gray-400 mt-1">Finalized at clinic</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xl font-semibold text-[#2563EB]">&euro;{selectedService?.priceFrom} – &euro;{selectedService?.priceTo}</p>
                   </div>
                 </div>
               </div>
            </div>

            {submitError && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">
                {submitError}
              </div>
            )}
          </div>

          <div className="shrink-0 mt-auto pt-6 flex justify-between border-t border-[#E2E8F0]">
             <button type="button" onClick={goPrev} disabled={submitting} className="text-gray-500 hover:text-slate-900 font-semibold text-sm py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm py-4 px-10 rounded-full transition-colors  flex items-center gap-2">
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
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            Appointment Confirmed
          </h2>
          <p className="text-gray-600 max-w-md text-base leading-relaxed mb-8">
            Thank you, <span className="font-semibold text-slate-900">{bookingResult.appointment?.patientName || "Valued Patient"}</span>.
            Your <span className="font-semibold text-slate-900">{bookingResult.service?.name}</span> appointment is securely booked for:
          </p>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 w-full max-w-sm mb-10 shadow-sm">
            <p className="text-lg font-semibold text-slate-900 mb-1">
              {formatDate(bookingResult.appointment?.appointmentDate)}
            </p>
            <p className="text-lg font-semibold text-[#2563EB]">
              {bookingResult.appointment?.appointmentTime}
            </p>
          </div>
          <div className="space-y-4 w-full max-w-xs">
            <button
              onClick={() => {
                onClose?.();
                router.push("/portal/appointments");
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 rounded-full transition-all shadow-sm hover:scale-[1.01]"
            >
              View My Appointments
            </button>
            <button
              onClick={() => {
                onClose?.();
                router.push("/");
              }}
              className="w-full bg-white hover:bg-gray-50 border border-[#E2E8F0] text-slate-900 font-semibold py-4 px-6 rounded-full transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function handleSubmit(onSubmit: any): import("react").SubmitEventHandler<HTMLFormElement> | undefined {
  throw new Error("Function not implemented.");
}


