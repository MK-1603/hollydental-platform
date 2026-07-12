export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* Core pulse ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        {/* Inner spinning ring */}
        <div className="absolute h-12 w-12 animate-spin rounded-full border-[3px] border-solid border-blue-600 border-t-transparent"></div>
        {/* Center dot */}
        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
      </div>
    </div>
  );
}
