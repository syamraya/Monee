

import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar — fixed di kiri, tidak ikut scroll */}
      <Sidebar />

      {/* Konten utama — scroll di dalam sini */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}