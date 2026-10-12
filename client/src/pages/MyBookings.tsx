import { useState } from "react";
import { Link } from "wouter";
import {
  Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle,
  Home as HomeIcon, ChevronRight, Phone, ShieldCheck, User
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { money } from "@/lib/money";
import { startLogin } from "@/const";

export default function MyBookings() {
  const { user, isAuthenticated, loading } = useAuth();
  const bookingsQuery = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: Boolean(isAuthenticated),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            <CheckCircle2 size={13} /> Tasdiqlangan (To'langan)
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <Clock size={13} /> Kutilmoqda (Mezbon tasdiqlashi)
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <XCircle size={13} /> Bekor qilingan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center text-white">
              <HomeIcon size={16} />
            </div>
            <span className="font-display font-bold text-xl text-[#e8175d]">uyjoy.uz</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
              Bosh sahifa
            </Link>
            <Link href="/post" className="text-xs font-semibold text-[#e8175d] hover:underline">
              Xona joylash
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Mening buyurtmalarim
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Siz band qilgan uylar, sayohat sanalari va buyurtma holati
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-xs">
            <User size={36} className="mx-auto mb-3 text-[#e8175d]" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Profilingizga kiring</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              Buyurtmalaringiz tarixini va uylar holatini ko'rish uchun avval hisobingizga kiring
            </p>
            <button
              onClick={() => startLogin()}
              className="px-6 py-2.5 rounded-xl bg-[#e8175d] text-white text-xs font-bold shadow-sm hover:bg-[#c0124d] transition-all"
            >
              Kirish yoki Ro'yxatdan o'tish
            </button>
          </div>
        ) : bookingsQuery.isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Buyurtmalar yuklanmoqda...
          </div>
        ) : !bookingsQuery.data || bookingsQuery.data.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Hozircha buyurtmalar yo'q</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              O'zbekistonning go'zal shaharlaridan o'zingizga yoqqan xonadon yoki milliy hovlini tanlab bron qiling.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e8175d] text-white text-xs font-bold shadow-sm hover:bg-[#c0124d] transition-all"
            >
              Uylarni ko'rish <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingsQuery.data.map((b) => {
              const checkIn = new Date(b.checkIn).toLocaleDateString("uz-UZ");
              const checkOut = new Date(b.checkOut).toLocaleDateString("uz-UZ");

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-[#e8175d]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={b.stay?.imageUrl || "/listings/bogishamol-exterior-1.png"}
                      alt={b.stay?.titleUz || "Uy"}
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-gray-900">
                          {b.stay?.titleUz || `Uy #${b.stayId}`}
                        </h3>
                        {getStatusBadge(b.status)}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} className="text-[#e8175d]" />
                        {b.stay?.address || b.stay?.city || "Samarqand"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          {checkIn} — {checkOut}
                        </span>
                        <span>·</span>
                        <span>{b.guests} ta mehmon</span>
                        {b.stay?.phone1 && (
                          <>
                            <span>·</span>
                            <a
                              href={`tel:${b.stay.phone1}`}
                              className="text-[#e8175d] hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Phone size={11} /> {b.stay.phone1}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex md:flex-col items-center md:items-end justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Jami to'lov</p>
                      <p className="text-lg font-bold text-[#e8175d]">{money(b.totalAmountUzs)}</p>
                    </div>
                    {b.stay?.id && (
                      <Link
                        href={`/stay/${b.stay.id}`}
                        className="mt-2 text-xs font-semibold text-gray-700 hover:text-[#e8175d] flex items-center gap-1"
                      >
                        Uyni ko'rish <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
