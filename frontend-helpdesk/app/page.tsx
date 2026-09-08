import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Portal IT Helpdesk</h1>
      <p className="text-gray-600 mb-8">Sistem pelaporan kendala IT terintegrasi.</p>

      <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
        Masuk ke Sistem
      </Link>
    </div>
  );
}