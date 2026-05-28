import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest, onSessionEvent } from "@/lib/api";

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "patient";
  mustChangePassword?: boolean;
  patientProfile?: PatientProfile | null;
  profilePicUrl?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
  /** Why the session ended last (if it did). Useful for showing a toast. */
  sessionEndedReason: "manual" | "expired" | "idle" | null;
  login: (userData: UserProfile) => void;
  /**
   * Clear the local session immediately and fire a best-effort logout call
   * to the server in the background. Always returns instantly.
   */
  logout: (reason?: "manual" | "expired" | "idle") => void;
  performLogoutTransition: (router: any) => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  /** Hydrate from /auth/me only when we don't already have a persisted user. */
  initialize: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      isLoggingOut: false,
      sessionEndedReason: null,

      login: (userData) =>
        set({ user: userData, isInitialized: true, sessionEndedReason: null }),

      logout: (reason = "manual") => {
        // Clear local state first so the UI reacts instantly.
        set({
          user: null,
          isInitialized: true,
          sessionEndedReason: reason,
        });

        // Best-effort server call. Don't await — if the server is slow or
        // the cookie is already invalid we don't want to block the UI.
        if (typeof window !== "undefined") {
          apiRequest("/auth/logout", {
            method: "POST",
            silentAuth: true,
          } as any).catch(() => {
            /* ignored — local logout already happened */
          });
        }
      },

      performLogoutTransition: async (router) => {
        set({ isLoggingOut: true });
        
        // Let the beautiful logout loading screen show for a moment
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Execute actual session clearance
        get().logout("manual");
        
        // Redirect to homepage
        router.replace("/");
        
        // Leave the transition screen active briefly while the router mounts /
        await new Promise((resolve) => setTimeout(resolve, 800));
        set({ isLoggingOut: false });
      },

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),

      initialize: async () => {
        const currentUser = get().user;

        if (currentUser) {
          set({ isInitialized: true, isLoading: false });
          return currentUser;
        }

        // Don't show a loading spinner for this call — the layout shouldn't
        // block on a server roundtrip during navigation.
        try {
          const data = await apiRequest("/auth/me", { silentAuth: true } as any);
          const user: UserProfile | null = data?.user ?? data ?? null;
          set({ user, isInitialized: true, isLoading: false });
          return user;
        } catch (err: any) {
          if (err?.status === 401) {
            set({ user: null, isInitialized: true, isLoading: false });
          } else {
            // Network / 500 / 429 — keep previous state, just mark initialized.
            set({ isInitialized: true, isLoading: false });
          }
          return get().user;
        }
      },
    }),
    {
      name: "hollyhill-auth",
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

/* -------------------- Global session listener -------------------- */
/**
 * When the API layer reports a 401, clear the user immediately so guarded
 * routes can redirect.
 */
if (typeof window !== "undefined") {
  onSessionEvent((event) => {
    if (event === "expired") {
      const { user } = useAuthStore.getState();
      if (user) {
        useAuthStore.setState({
          user: null,
          isInitialized: true,
          sessionEndedReason: "expired",
        });
      }
    }
  });
}
