import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface BookingState {
  step: number;
  serviceId: string | null;
  date: string | null;
  time: string | null;
  notes: string;
  guestDetails: GuestDetails | null;

  setBookingData: (data: Partial<BookingState>) => void;
  clearBookingData: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      step: 1,
      serviceId: null,
      date: null,
      time: null,
      notes: "",
      guestDetails: null,

      setBookingData: (data) => set((state) => ({ ...state, ...data })),
      clearBookingData: () =>
        set({
          step: 1,
          serviceId: null,
          date: null,
          time: null,
          notes: "",
          guestDetails: null,
        }),
    }),
    {
      name: "hollyhill-booking",
      partialize: (state) => ({
        step: state.step,
        serviceId: state.serviceId,
        date: state.date,
        time: state.time,
        notes: state.notes,
        guestDetails: state.guestDetails,
      }),
    }
  )
);
