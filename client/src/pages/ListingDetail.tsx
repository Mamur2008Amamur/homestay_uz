import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Heart, Star, Share2, ChevronLeft, ChevronRight, X, Award, ShieldCheck, Users, MapPin, Home as HomeIcon, Check, Wifi, Car, Monitor, Utensils, Coffee, Tv, Wind, Bath, Lock } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/money";
import { stayAmenities, stayDesc, stayWeekPrice } from "@/data/stays";
import { useStays } from "@/data/useStays";
import NotFound from "./NotFound";

const nts = (a:string,b:string) => Math.max(1,Math.ceil((new Date(b).getTime()-new Date(a).getTime())/86400000));

export default function ListingDetail() {
  const { t, lang } = useLanguage();
  const [,params] = useRoute("/stay/:id");
  const [,navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const id = Number(params?.id);
  const catalogue = useStays();

  const raw = useMemo(()=>catalogue.find(s=>String(s.id)===String(id)),[catalogue, id]);
  const stay = useMemo(()=>raw ? {
    id: raw.id,
    title: lang === "ru" ? raw.titleRu : lang === "en" ? raw.titleEn : raw.titleUz,
    city: raw.city,
    region: raw.region,
    imageUrl: raw.images[0],
    pricePerNight: raw.pricePerNight,
    pricePerWeek: stayWeekPrice(raw),
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    guestCount: raw.guestCount,
    homeType: lang === "ru" ? raw.homeTypeRu : lang === "en" ? raw.homeTypeEn : raw.homeTypeUz,
    hostName: raw.hostName,
    hostAvatar: raw.hostAvatar,
    address: raw.address,
    email: raw.email,
    phone1: raw.phone1,
    phone2: raw.phone2,
    telegram: raw.telegram,
    desc: stayDesc(raw, lang),
  } : undefined, [raw, lang]);
  const images = useMemo(()=>raw?.images ?? [], [raw]);
  const hasReviews = !!stay && stay.reviewCount > 0;
  const similar = useMemo(
    ()=>catalogue.filter(s=>s.city===raw?.city && s.id!==raw?.id).slice(0,3),
    [catalogue, raw],
  );

  const [lightboxIdx, setLightboxIdx] = useState<number|null>(null);
  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests]     = useState(1);
  const [email, setEmail]       = useState("");
  const [code, setCode]         = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const wishlist   = trpc.wishlist.toggle.useMutation();
  const reqCode    = trpc.verification.requestCode.useMutation({ onSuccess:()=>{setCodeSent(true);toast.success(t.detail_email_sent);}, onError:e=>toast.error(e.message) });
  const verifyCode = trpc.verification.verifyCode.useMutation({ onSuccess:()=>{setVerified(true);toast.success(t.detail_email_confirmed);}, onError:e=>toast.error(e.message) });
  const booking    = trpc.bookings.create.useMutation();

  const nights    = checkIn && checkOut ? nts(checkIn,checkOut) : 0;
  const baseTotal = nights * (stay?.pricePerNight ?? 0);
  const svcFee    = Math.round(baseTotal * 0.05);
  const grandTotal = baseTotal + svcFee;

  const sendCode = () => {
    if (!isAuthenticated) { toast(t.detail_login_code); startLogin(); return; }
    if (!email) { toast(t.detail_enter_email); return; }
    reqCode.mutate({ email });
  };
  const confirmCode = () => { if(code.length!==6){toast(t.detail_enter_code);return;} verifyCode.mutate({email,code}); };
  const reserve = () => {
    if (!stay) return;
    if (!isAuthenticated) { toast(t.detail_login_book); startLogin(); return; }
    if (!checkIn||!checkOut) { toast(t.detail_select_dates); return; }
    if (!verified) { toast(t.detail_verify_first); return; }
    booking.mutate({ stayId: stay.id, email, checkIn: new Date(checkIn), checkOut: new Date(checkOut), guests },
      { onSuccess:()=>{ toast.success(t.detail_request_sent,{description:t.detail_host_will_confirm}); navigate(`/payment?listingId=${stay.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&total=${grandTotal}`); },
        onError:e=>toast.error(e.message) });
  };

  const hasAmenity = (key:string) => (raw ? stayAmenities(raw).includes(key) : true);
  const AMENITIES = [
    { key:"wifi",       icon:Wifi,       label:t.ld_amenity_wifi },
    { key:"parking",    icon:Car,        label:t.ld_amenity_parking },
    { key:"kitchen",    icon:Utensils,   label:t.ld_amenity_kitchen },
    { key:"breakfast",  icon:Coffee,     label:t.ld_amenity_breakfast },
    { key:"workspace",  icon:Monitor,    label:t.ld_amenity_workspace },
    { key:"tv",         icon:Tv,         label:t.ld_amenity_tv },
    { key:"ac",         icon:Wind,       label:t.ld_amenity_ac },
    { key:"bath",       icon:Bath,       label:t.ld_amenity_bath },
    { key:"lock",       icon:Lock,       label:t.ld_amenity_lock },
    { key:"shield",     icon:ShieldCheck,label:t.ld_amenity_shield },
  ];
  const availableAmenities = AMENITIES.filter(a=>hasAmenity(a.key));
  const visibleAmenities = showAllAmenities ? availableAmenities : availableAmenities.slice(0,6);

  const RATING_CATS = [
    { label:t.ld_cleanliness, val:4.9 },
    { label:t.ld_communication, val:5.0 },
    { label:t.ld_location, val:4.8 },
    { label:t.ld_value, val:4.7 },
  ];

  const REVIEWS_DATA = [
    { name:"Émilie D.", country:"Fransiya", avatar:"/listings/user-avatar.svg",  date:"Avg 2025", rating:5, text:"Juda iliq mezbon va toza uy. Hayotimning eng yaxshi sayohati!" },
    { name:"Toshie K.", country:"Yaponiya", avatar:"/listings/user-avatar.svg", date:"Iyul 2025", rating:5, text:"Mezbon shaharning yashirin joylarini ko'rsatdi. Tavsiya qilaman!" },
    { name:"Slavica M.",country:"Serbiya",  avatar:"/listings/user-avatar.svg", date:"Iyun 2025", rating:5, text:"Uy nihoyatda qulay, nonushta har kuni tayyor edi. Rahmat!" },
    { name:"Ahmed S.",  country:"Misr",     avatar:"/listings/user-avatar.svg", date:"May 2025",  rating:4, text:"Yaxshi joylashuv, mezbonlar samimiy. Yana kelaman." },
  ];

  if (!stay) return <NotFound/>;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <button onClick={()=>setLightboxIdx(null)} className="flex items-center gap-2 text-white font-semibold hover:opacity-75 transition-opacity">
              <X size={20}/> {t.ld_close}
            </button>
            <span className="text-white/60 text-sm">{lightboxIdx+1} / {images.length}</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-12">
            <img src={images[lightboxIdx]} alt="" className="max-h-full max-w-full object-contain rounded-lg"/>
            <button onClick={()=>setLightboxIdx(i=>Math.max(0,(i??0)-1))} disabled={lightboxIdx===0} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white disabled:opacity-30"><ChevronLeft size={20}/></button>
            <button onClick={()=>setLightboxIdx(i=>Math.min(images.length-1,(i??0)+1))} disabled={lightboxIdx===images.length-1} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white disabled:opacity-30"><ChevronRight size={20}/></button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-none">
            {images.map((src,i)=>(
              <button key={i} onClick={()=>setLightboxIdx(i)} className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i===lightboxIdx?"border-white":"border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={src} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center"><HomeIcon size={15} className="text-white"/></div>
            <span className="font-display font-bold text-xl text-[#e8175d] hidden sm:block">uyjoy.uz</span>
          </a>
          <button onClick={()=>window.history.back()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ChevronLeft size={16}/> {t.ld_back}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 sm:px-8 py-7">
        {/* Title */}
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3 leading-tight">{stay.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {hasReviews
                ? <span className="flex items-center gap-1 font-semibold"><Star size={14} className="fill-[#e8175d] text-[#e8175d]"/> {stay.rating} <span className="text-gray-500 font-normal">({stay.reviewCount} {t.ld_reviews_count})</span></span>
                : <span className="font-semibold text-[#e8175d] bg-[#fdf0f4] px-2.5 py-1 rounded-full text-xs">{t.rate_new}</span>}
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-gray-600"><Award size={14} className="text-[#e8175d]"/> {t.ld_verified_home}</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-gray-600"><MapPin size={14} className="text-[#e8175d]"/> {stay.address ?? `${stay.city}, ${stay.region}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-gray-700"><Share2 size={14}/> {t.ld_share}</button>
              <button onClick={()=>{if(!isAuthenticated){startLogin();return;}wishlist.mutate({listingId:stay.id},{onSuccess:r=>{setSaved(r.saved);toast(r.saved?t.toast_saved:t.toast_unsaved);}});}}
                className="flex items-center gap-1.5 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-gray-700">
                <Heart size={14} className={saved?"fill-[#e8175d] text-[#e8175d]":""}/> {t.ld_save}
              </button>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[280px] md:h-[460px] mb-9 relative">
          <div className="col-span-4 md:col-span-2 row-span-2 cursor-pointer group overflow-hidden" onClick={()=>setLightboxIdx(0)}>
            <img src={images[0]} alt="main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          </div>
          {[1,2,3,4].map(i=>(
            <div key={i} className="hidden md:block cursor-pointer group overflow-hidden" onClick={()=>setLightboxIdx(i < images.length ? i : 0)}>
              <img src={images[i]||images[0]} alt={`photo-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            </div>
          ))}
          <button onClick={()=>setLightboxIdx(0)} className="absolute bottom-4 right-4 bg-white border border-gray-900 px-4 py-1.5 rounded-lg text-sm font-semibold shadow hover:bg-gray-50 transition-colors">
            {t.ld_show_all_photos.replace("{n}", String(images.length))}
          </button>
        </div>

        {/* Content + Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-10 lg:gap-16">

          {/* LEFT */}
          <div>
            {/* Host */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
              <div>
                <h2 className="text-xl font-bold">{t.ld_host_prefix}{stay.hostName}</h2>
                <p className="text-gray-500 text-sm mt-1">{stay.guestCount} {t.detail_guests} · {stay.homeType} · {stay.city}</p>
              </div>
              <a href={`/host/${stay.id}`} className="shrink-0">
                <img src={stay.hostAvatar||"/listings/host-avatar.svg"} alt={stay.hostName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 hover:opacity-80 transition-opacity"/>
              </a>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-gray-200 mb-6">
              {[
                { icon:Award,       title:t.ld_highlights_superhost,  desc:t.ld_highlights_superhost_desc },
                { icon:ShieldCheck, title:t.ld_highlights_guarantee,  desc:t.ld_highlights_guarantee_desc },
                { icon:Users,       title:`${stay.guestCount} ${t.detail_guests}`, desc:t.ld_highlights_capacity_desc },
              ].map(h=>(
                <div key={h.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#fdf8f8] border border-[#f5e0e5]">
                  <h.icon size={20} className="text-[#e8175d] shrink-0 mt-0.5"/>
                  <div><p className="font-semibold text-sm text-gray-900">{h.title}</p><p className="text-xs text-gray-500 mt-0.5">{h.desc}</p></div>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border border-[#f0e5e0] bg-[#fffaf8] p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bog&apos;lanish</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p><span className="font-semibold text-gray-900">Manzil:</span> {stay.address ?? `${stay.city}, ${stay.region}`}</p>
                <a href={`mailto:${stay.email ?? ""}`} className="block hover:text-[#e8175d] transition-colors"><span className="font-semibold text-gray-900">Email:</span> {stay.email ?? "—"}</a>
                <a href={`tel:${(stay.phone1 ?? "").replace(/\s+/g, "")}`} className="block hover:text-[#e8175d] transition-colors"><span className="font-semibold text-gray-900">Telefon 1:</span> {stay.phone1 ?? "—"}</a>
                <a href={`tel:${(stay.phone2 ?? "").replace(/\s+/g, "")}`} className="block hover:text-[#e8175d] transition-colors"><span className="font-semibold text-gray-900">Telefon 2:</span> {stay.phone2 ?? "—"}</a>
                <a href={`https://t.me/${(stay.telegram ?? "").replace("@", "")}`} target="_blank" rel="noreferrer" className="block hover:text-[#e8175d] transition-colors"><span className="font-semibold text-gray-900">Telegram:</span> {stay.telegram ?? "—"}</a>
              </div>
            </div>

            {/* Description */}
            <div className="pb-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-bold mb-3">{t.ld_about}</h2>
              <p className="text-gray-600 text-[15px] leading-7">{stay.desc || t.detail_host_desc}</p>
              {raw?.source !== "user" && <p className="text-gray-600 text-[15px] leading-7 mt-2">{t.ld_about_extra}</p>}
            </div>

            {/* Amenities */}
            <div className="pb-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-bold mb-5">{t.detail_amenities}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {visibleAmenities.map(a=>(
                  <div key={a.key} className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
                    <a.icon size={20} strokeWidth={1.5} className="text-gray-700"/>
                    <span className="text-[15px]">{a.label}</span>
                    <Check size={14} className="text-green-500 ml-auto"/>
                  </div>
                ))}
              </div>
              {availableAmenities.length > 6 && (
                <button onClick={()=>setShowAllAmenities(v=>!v)} className="mt-4 px-5 py-2.5 rounded-xl border border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors">
                  {showAllAmenities ? t.ld_amenities_show_less : t.ld_amenities_show_all.replace("{n}", String(availableAmenities.length))}
                </button>
              )}
            </div>

            {/* Reviews */}
            <div className="pb-6 border-b border-gray-200 mb-6">
              {hasReviews ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <Star size={22} className="fill-[#e8175d] text-[#e8175d]"/>
                    <span className="font-bold text-xl">{stay.rating}</span>
                    <span className="text-gray-500">·</span>
                    <span className="font-semibold text-xl">{stay.reviewCount} {t.ld_reviews_count}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
                    {RATING_CATS.map(r=>(
                      <div key={r.label} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-24 shrink-0">{r.label}</span>
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gray-900 rounded-full" style={{width:`${(r.val/5)*100}%`}}/></div>
                        <span className="text-sm font-medium w-8 text-right">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {REVIEWS_DATA.map(r=>(
                      <div key={r.name}>
                        <div className="flex items-center gap-3 mb-2">
                          <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover"/>
                          <div><p className="font-semibold text-sm">{r.name}</p><p className="text-xs text-gray-400">{r.country} · {r.date}</p></div>
                          <div className="ml-auto flex gap-0.5">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={11} className="fill-[#e8175d] text-[#e8175d]"/>)}</div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl">
                  <Star size={26} className="mx-auto mb-3 text-gray-300"/>
                  <p className="font-semibold text-gray-900 mb-1">{t.rate_new}</p>
                  <p className="text-sm text-gray-500">{t.rate_no_reviews}</p>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <h2 className="text-xl font-bold mb-4">{t.ld_location_title}</h2>
              <div className="flex items-center gap-2 text-gray-600 mb-3"><MapPin size={16} className="text-[#e8175d] shrink-0"/><span className="text-sm">{stay.address ?? `${stay.city}, ${stay.region}`}, O'zbekiston</span></div>
              <div className="rounded-2xl overflow-hidden bg-gray-100 h-[220px] flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2 text-[#e8175d]"/>
                  <p className="text-sm font-medium">{stay.city} {t.ld_location_city}</p>
                  <p className="text-xs mt-1">{t.ld_location_note}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Booking widget */}
          <div>
            <div className="sticky top-[84px] bg-white border border-gray-200 rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="bg-[#e8175d] px-6 py-4 text-white">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold">{money(stay.pricePerNight)}</span>
                  <span className="text-white/75 pb-0.5 text-sm"> {t.ld_price_per_night}</span>
                </div>
                <p className="text-white/80 text-xs mt-0.5">
                  {t.price_week_from.replace("{n}", money(stay.pricePerWeek))}
                </p>
                {hasReviews
                  ? <div className="flex items-center gap-2 mt-1"><Star size={13} className="fill-white"/><span className="text-sm font-medium">{stay.rating} · {stay.reviewCount} {t.ld_reviews_count}</span></div>
                  : <div className="flex items-center gap-2 mt-1"><Star size={13} className="fill-white/70 text-white/70"/><span className="text-sm font-medium">{t.rate_new}</span></div>}
              </div>
              <div className="p-5 space-y-4">
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-gray-300">
                    <div className="p-3 border-r border-gray-300">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">{t.detail_checkin}</label>
                      <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="w-full text-sm outline-none bg-transparent text-gray-900"/>
                    </div>
                    <div className="p-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">{t.detail_checkout}</label>
                      <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="w-full text-sm outline-none bg-transparent text-gray-900"/>
                    </div>
                  </div>
                  <div className="p-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">{t.detail_guests_label}</label>
                    <select value={guests} onChange={e=>setGuests(Number(e.target.value))} className="w-full text-sm outline-none bg-transparent appearance-none text-gray-900">
                      {Array.from({length:stay.guestCount},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {t.detail_guests}</option>)}
                    </select>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-700"><span>{money(stay.pricePerNight)} × {nights} {t.ld_nights}</span><span>{money(baseTotal)}</span></div>
                    <div className="flex justify-between text-gray-700"><span>{t.ld_service_fee}</span><span>{money(svcFee)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200"><span>{t.ld_total}</span><span className="text-[#e8175d]">{money(grandTotal)}</span></div>
                  </div>
                )}

                <div className="space-y-2">
                  <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setVerified(false);setCodeSent(false);setCode("");}}
                    placeholder={t.detail_email} className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-[#e8175d] transition-all"/>
                  {codeSent && !verified && (
                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-2">{t.detail_code_hint}</p>
                      <div className="flex gap-2">
                        <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" placeholder="000000"
                          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm text-center tracking-widest font-mono outline-none focus:border-[#e8175d]"/>
                        <button onClick={confirmCode} disabled={verifyCode.isPending} className="bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">{t.detail_verify}</button>
                      </div>
                    </div>
                  )}
                  {verified
                    ? <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5"><Check size={14}/> {t.detail_verified_email}</p>
                    : <button onClick={sendCode} disabled={reqCode.isPending} className="w-full text-sm font-semibold underline text-gray-600 hover:text-gray-900 py-1 transition-colors">
                        {reqCode.isPending ? t.detail_sending : t.detail_send_code}
                      </button>
                  }
                </div>

                <button onClick={reserve} disabled={booking.isPending||!verified}
                  className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-50"
                  style={{background:"linear-gradient(to right,#E61E4D 0%,#E31C5F 50%,#D70466 100%)"}}>
                  {booking.isPending ? t.ld_sending : t.ld_reserve_btn}
                </button>
                <p className="text-center text-xs text-gray-400">{t.detail_no_payment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar stays */}
        <div className="mt-14 pt-10 border-t border-gray-200">
          <h2 className="font-display text-2xl font-bold mb-6">{t.ld_similar}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similar.map(s=>(
              <article key={s.id} className="group cursor-pointer" onClick={()=>navigate(`/stay/${s.id}`)}>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                  <img src={s.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <p className="font-semibold text-[14px] text-gray-900 line-clamp-1">{s.city}, {s.region}</p>
                <p className="text-[13px] text-gray-500 line-clamp-1">{lang === "ru" ? s.titleRu : lang === "en" ? s.titleEn : s.titleUz}</p>
                <p className="text-[14px] text-gray-900 mt-1">
                  <span className="font-semibold">{money(s.pricePerNight)}</span> <span className="text-gray-500">{t.ld_price_per_night}</span>
                  {s.pricePerWeek ? <> <span className="text-gray-400 text-xs">· {money(s.pricePerWeek)} {t.price_per_week}</span></> : null}
                </p>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
