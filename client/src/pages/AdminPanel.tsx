import { useState } from "react";
import { Link } from "wouter";
import {
  ShieldCheck, Users, Home as HomeIcon, DollarSign, Calendar,
  CheckCircle2, Clock, XCircle, Search, RefreshCw, ChevronRight, Phone
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { money } from "@/lib/money";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "users">("overview");

  const statsQuery = trpc.admin.stats.useQuery();
  const bookingsQuery = trpc.admin.bookings.useQuery();
  const usersQuery = trpc.admin.users.useQuery();

  const updateStatusMutation = trpc.admin.updateBookingStatus.useMutation({
    onSuccess: () => {
      toast.success("Bron holati yangilandi!");
      bookingsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Xatolik yuz berdi");
    },
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center text-white">
                <HomeIcon size={16} />
              </div>
              <span className="font-display font-bold text-xl text-[#e8175d]">uyjoy.uz</span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 text-white font-mono font-semibold">
              Admin boshqaruv
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
              Saytga qaytish
            </Link>
            <Link href="/my-bookings" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
              Mening buyurtmalarim
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-[#e8175d]" size={26} /> UyJoy Boshqaruv Markazi
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Saytdagi uylar, foydalanuvchilar va barcha kelib tushgan buyurtmalarni nazorat qilish
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "overview" ? "bg-[#e8175d] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Umumiy hisobot
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "bookings" ? "bg-[#e8175d] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Barcha bronlar ({bookingsQuery.data?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "users" ? "bg-[#e8175d] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Foydalanuvchilar ({usersQuery.data?.length ?? 0})
            </button>
          </div>
        </div>

        {/* 1. Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Jami uylar</span>
                  <HomeIcon size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {statsQuery.data?.totalListings ?? 28} ta
                </p>
                <p className="text-[11px] text-green-600 font-medium mt-1">Faol va qidiruvda</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Jami bronlar</span>
                  <Calendar size={20} className="text-[#e8175d]" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {statsQuery.data?.totalBookings ?? 0} ta
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-1">Buyurtmalar soni</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Foydalanuvchilar</span>
                  <Users size={20} className="text-purple-500" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {statsQuery.data?.totalUsers ?? 1} ta
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-1">Ro&apos;yxatdan o&apos;tganlar</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Jami aylanma</span>
                  <DollarSign size={20} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-600">
                  {money(statsQuery.data?.totalRevenueUzs ?? 0)}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-1">Bron qilingan mablag&apos;</p>
              </div>
            </div>

            {/* Quick Actions & Recent Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-3">Admin huquqlari va imkoniyatlari:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                <div className="p-4 rounded-xl bg-[#faf8f6] border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">1. Bronlarni tasdiqlash</p>
                  <p>Mijozlar uyni band qilganda statusini bir bosish bilan &quot;Tasdiqlangan&quot; yoki &quot;Bekor qilingan&quot;ga o&apos;tkazish mumkin.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#faf8f6] border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">2. Telegram bot ogohlantirish</p>
                  <p>Har bir yangi buyurtma va joylangan uy haqida Telegram bot orqali avtomatik ravishda to&apos;liq ma&apos;lumot keladi.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#faf8f6] border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">3. Foydalanuvchilar nazorati</p>
                  <p>Ro&apos;yxatdan o&apos;tgan mijozlar emailing va kirgan vaqtlarini bemalol tekshirib borishingiz mumkin.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900">Mijozlar buyurtmalari</h2>
              <button
                onClick={() => bookingsQuery.refetch()}
                className="text-xs font-semibold text-[#e8175d] flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} /> Yangilash
              </button>
            </div>

            {bookingsQuery.isLoading ? (
              <div className="p-10 text-center text-xs text-gray-400">Yuklanmoqda...</div>
            ) : !bookingsQuery.data || bookingsQuery.data.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-400">Hozircha bronlar yo&apos;q</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfaf8] border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Uy nomi</th>
                      <th className="py-3 px-4">Sana (Kelish / Ketish)</th>
                      <th className="py-3 px-4">Mehmonlar</th>
                      <th className="py-3 px-4">Jami summa</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookingsQuery.data.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-700">#B{b.id}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {b.stayTitle} <span className="text-gray-400 font-normal">({b.stayCity})</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono">
                          {new Date(b.checkIn).toLocaleDateString("uz-UZ")} — {new Date(b.checkOut).toLocaleDateString("uz-UZ")}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{b.guests} kishi</td>
                        <td className="py-3 px-4 font-bold text-[#e8175d]">{money(b.totalAmountUzs)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            b.status === "paid" ? "bg-green-100 text-green-700" :
                            b.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {b.status === "paid" ? "Tasdiqlangan" : b.status === "pending" ? "Kutilmoqda" : b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatusMutation.mutate({ bookingId: b.id, status: "paid" })}
                                className="px-2.5 py-1 rounded-md bg-green-600 text-white font-bold text-[10px] hover:bg-green-700 transition-colors"
                              >
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => updateStatusMutation.mutate({ bookingId: b.id, status: "cancelled" })}
                                className="px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-[10px] hover:bg-red-700 transition-colors"
                              >
                                Bekor qilish
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900">Ro&apos;yxatdan o&apos;tgan foydalanuvchilar</h2>
              <button
                onClick={() => usersQuery.refetch()}
                className="text-xs font-semibold text-[#e8175d] flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} /> Yangilash
              </button>
            </div>

            {usersQuery.isLoading ? (
              <div className="p-10 text-center text-xs text-gray-400">Yuklanmoqda...</div>
            ) : !usersQuery.data || usersQuery.data.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-400">Foydalanuvchilar topilmadi</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfaf8] border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Ism</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Ro&apos;yxatdan o&apos;tgan vaqti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersQuery.data.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-500">#{u.id}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{u.name || "Noma'lum"}</td>
                        <td className="py-3 px-4 text-gray-600">{u.email || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString("uz-UZ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
