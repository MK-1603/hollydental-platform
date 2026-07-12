"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're on a large screen (desktop).
    // On mobile, this page acts as the menu index (rendered by layout).
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      router.replace("/admin/settings/general");
    }
  }, [router]);

  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-[15px] font-bold text-gray-900">Select a setting</h2>
      <p className="text-[13px] text-gray-500 mt-1 max-w-sm">Choose an option from the sidebar to view or modify its configuration.</p>
    </div>
  );
}
