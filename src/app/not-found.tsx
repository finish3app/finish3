import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <span className="text-7xl mb-6">🔍</span>
      <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
        Page not found
      </h1>
      <p className="text-gray-500 text-lg mb-10 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-8 py-3.5 bg-[#4B5CC4] hover:bg-[#3A4AB3] text-white rounded-full font-medium transition-colors text-[15px] shadow-sm"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
