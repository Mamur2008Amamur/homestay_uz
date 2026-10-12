import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Home as HomeIcon, CreditCard, Smartphone, Check, Shield, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { useStays } from "@/data/useStays";

type PayMethod = "card" | "payme" | "click";

export default function PaymentPage() {
  const { t, lang } = useLanguage();
  const [, navigate] = useLocation();
  const catalogue = useStays();
  const params    = new URLSearchParams(window.location.search);
  const listingId = Number(params.get("listingId"));
  const checkIn   = params.get("checkIn")   || "";
  const checkOut  = params.get("checkOut")  || "";
  const guests    = Number(params.get("guests") || 1);
  const stay      = catalogue.find(s => String(s.id) === String(listingId));
  const nightly   = stay?.pricePerNight ?? 0;
  const total     = Number(params.get("total")) || Math.round(nightly * 1.05);

  const [method, setMethod]   = useState<PayMethod>("card");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvv, setCvv]         = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const createPayment = trpc.payments.create.useMutation();

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)) : 1;
  const basePrice  = Math.round(total / 1.05);
  const serviceFee = total - basePrice;

  const fmtCard = (v:string) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = (v:string) => v.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})(\d)/,"$1/$2");

  const pay = async () => {
    if (method==="card" && (!cardNum||!expiry||!cvv||!name)) { toast.error(t.pay_err_card); return; }
    if ((method==="payme"||method==="click") && !phone) { toast.error(t.pay_err_phone); return; }

    setLoading(true);

    try {
      if (method === "card") {
        await new Promise(r=>setTimeout(r, 1200));
      } else {
        const result = await createPayment.mutateAsync({
          bookingId: listingId || Date.now(),
          amount: total,
          method,
          phone,
          account: `booking-${listingId || Date.now()}`,
        });

        if (result.redirectUrl) {
          window.location.assign(result.redirectUrl);
          return;
        }
      }

      setDone(true);
      toast.success(method === "card" ? "Payment completed successfully." : "Payment request created successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be processed.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"><Check size={36} className="text-green-500"/></div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">{t.pay_success_title}</h1>
        <p className="text-gray-500 mb-4">{t.pay_success_desc}</p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-left space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">{t.pay_booking_num}</span><span className="font-bold">#UJ{listingId}-{Date.now().toString().slice(-5)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t.pay_checkin_label}</span><span className="font-medium">{checkIn}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t.pay_checkout_label}</span><span className="font-medium">{checkOut}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t.pay_paid}</span><span className="font-bold text-green-600">{money(total)}</span></div>
        </div>
        <button onClick={()=>navigate("/")} className="w-full py-3.5 rounded-xl font-bold text-white transition-opacity" style={{background:"linear-gradient(to right,#E61E4D 0%,#D70466 100%)"}}>
          {t.pay_go_home}
        </button>
      </div>
    </div>
  );

  const METHODS = [
    { id:"card"  as PayMethod, label:t.pay_card,   icon:CreditCard,  color:"#3b82f6" },
    { id:"payme" as PayMethod, label:t.pay_payme,  icon:Smartphone,  color:"#1dc74c" },
    { id:"click" as PayMethod, label:t.pay_click,  icon:Smartphone,  color:"#f97316" },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center"><HomeIcon size={15} className="text-white"/></div>
            <span className="font-display font-bold text-xl text-[#e8175d] hidden sm:block">uyjoy.uz</span>
          </a>
          <button onClick={()=>window.history.back()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ChevronLeft size={16}/> {t.hp_back}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 sm:px-8 py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{t.pay_title}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* LEFT */}
          <div className="space-y-6">
            {/* Method */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-4">{t.pay_method}</h2>
              <div className="grid grid-cols-3 gap-3">
                {METHODS.map(m=>(
                  <button key={m.id} onClick={()=>setMethod(m.id)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method===m.id?"border-[#e8175d] bg-[#fdf8f8]":"border-gray-200 hover:border-gray-300"}`}>
                    <m.icon size={22} style={{color:method===m.id?"#e8175d":m.color}}/>
                    <span className={`text-xs font-semibold ${method===m.id?"text-[#e8175d]":"text-gray-700"}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card form */}
            {method==="card" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-lg">{t.pay_card_details}</h2>
                <div className="rounded-2xl p-5 text-white h-[160px] relative overflow-hidden" style={{background:"linear-gradient(135deg,#e8175d 0%,#9333ea 100%)"}}>
                  <div className="flex justify-between items-start mb-6"><CreditCard size={28} className="opacity-80"/><span className="text-sm font-medium opacity-70">UYJOY CARD</span></div>
                  <p className="font-mono text-lg tracking-widest mb-3">{cardNum||"0000 0000 0000 0000"}</p>
                  <div className="flex items-end justify-between">
                    <div><p className="text-[10px] uppercase opacity-60 mb-0.5">{t.pay_card_name}</p><p className="text-sm font-medium">{name||"TO'LIQ ISM"}</p></div>
                    <div className="text-right"><p className="text-[10px] uppercase opacity-60 mb-0.5">{t.pay_card_expiry}</p><p className="text-sm font-medium">{expiry||"MM/YY"}</p></div>
                  </div>
                </div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t.pay_card_number}</label>
                  <input value={cardNum} onChange={e=>setCardNum(fmtCard(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d] font-mono tracking-wider"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t.pay_card_expiry}</label>
                    <input value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d]"/></div>
                  <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t.pay_card_cvv}</label>
                    <input value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} placeholder="•••" maxLength={3} type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d]"/></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t.pay_card_name}</label>
                  <input value={name} onChange={e=>setName(e.target.value.toUpperCase())} placeholder="ALISHER KARIMOV" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d] uppercase"/></div>
              </div>
            )}

            {/* Payme / Click */}
            {(method==="payme"||method==="click") && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">{method==="payme"?t.pay_payme:t.pay_click}</h2>
                <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{background:method==="payme"?"#e8f8ee":"#fff4ed"}}>
                  <Smartphone size={22} style={{color:method==="payme"?"#1dc74c":"#f97316"}}/>
                  <p className="text-sm text-gray-700">{method==="payme"?t.pay_payme_desc:t.pay_click_desc}</p>
                </div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.pay_phone}</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+998 90 000 00 00" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d]"/>
              </div>
            )}

            {/* Security */}
            <div className="flex flex-wrap gap-4">
              {[{icon:Shield,l:t.pay_security_ssl},{icon:Lock,l:t.pay_security_data},{icon:Check,l:t.pay_security_pci}].map(b=>(
                <div key={b.l} className="flex items-center gap-2 text-sm text-gray-500"><b.icon size={15} className="text-green-500"/> {b.l}</div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="sticky top-[84px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#e8175d] px-6 py-4 text-white"><h3 className="font-bold text-base">{t.pay_summary}</h3></div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {stay ? <img src={stay.images[0]} alt="" className="w-full h-full object-cover"/> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                      {stay ? (lang === "ru" ? stay.titleRu : lang === "en" ? stay.titleEn : stay.titleUz) : t.sr_all_listings}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {stay && stay.reviewCount > 0
                        ? <><Star size={11} className="fill-[#e8175d] text-[#e8175d]"/><span className="text-xs text-gray-500">{stay.rating} · {t.ld_verified_home}</span></>
                        : <span className="text-xs text-[#e8175d] font-semibold">{t.rate_new}</span>}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  {[{l:t.pay_checkin,v:checkIn||"—"},{l:t.pay_checkout,v:checkOut||"—"},{l:t.pay_guests_label,v:`${guests} ta`},{l:t.pay_nights_label,v:`${nights}`}].map(r=>(
                    <div key={r.l} className="flex justify-between"><span className="text-gray-500">{r.l}</span><span className="font-medium text-gray-900">{r.v}</span></div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700"><span>{t.pay_base_price}</span><span>{money(basePrice)}</span></div>
                  <div className="flex justify-between text-gray-700"><span>{t.pay_service_fee}</span><span>{money(serviceFee)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2"><span>{t.pay_total}</span><span className="text-[#e8175d]">{money(total)}</span></div>
                </div>
                <button onClick={pay} disabled={loading} className="w-full py-4 rounded-xl text-white font-bold text-base transition-all disabled:opacity-70 flex items-center justify-center gap-2" style={{background:"linear-gradient(to right,#E61E4D 0%,#D70466 100%)"}}>
                  {loading ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> {t.pay_loading}</> : <><Lock size={16}/> {money(total)} {t.pay_btn}</>}
                </button>
                <p className="text-center text-xs text-gray-400">{t.pay_secure_note}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
