"use client";

import LoginModal from "@/components/public/LoginModal";
import RegisterModal from "@/components/public/RegisterModal";
import BookingModal from "@/components/public/BookingModal";

import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Mount both auth modals once at the root layout so they're available
 * on every route (public, portal, admin). The modals only render when
 * their corresponding flag is set in the UI store, so this is cheap.
 */
export default function AuthModals() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginModal />
      <RegisterModal />
      <BookingModal />
    </GoogleOAuthProvider>
  );
}
