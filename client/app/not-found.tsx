import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-[16px] border border-gray-200 shadow-xl text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link
          href="/admin"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-[8px] hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
