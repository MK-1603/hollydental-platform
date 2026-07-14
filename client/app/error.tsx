"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
    // console.error(error);

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-[16px] border border-gray-200 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-8">
          We encountered an unexpected error. Our team has been notified and is looking into it.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-[8px] hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 border border-gray-200 rounded-[8px] hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
