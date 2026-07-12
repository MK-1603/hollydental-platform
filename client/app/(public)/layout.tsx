import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";

import Preloader from "@/components/public/Preloader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Preloader />
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <CookieConsentBanner />

    </div>
  );
}

