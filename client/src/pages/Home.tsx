import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Search, Heart, Star, ChevronDown, Globe2, UserCircle2,
  MapPin, Calendar, Users, Home as HomeIcon, ArrowRight,
  Wifi, Car, Utensils, Coffee, Shield, Clock, Award, Heart as HeartIcon,
  TrendingUp, Mountain, Landmark, Building2, TreePine, Gem, X, Check,
  ChevronLeft, ChevronRight
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/i18n";
import { money } from "@/lib/money";
import { CITY_IMAGES, type StayItem } from "@/data/stays";
import { useStays } from "@/data/useStays";

// ── Types ─────────────────────────────────────────────────────────────────────
type Stay = {
  id:number; title:string; city:string; region:string; imageUrl:string;
  pricePerNight:number; pricePerWeek?:number; rating:number; reviewCount:number; guestCount:number;
  homeType:string; hostName:string; hostAvatar?:string|null;
  featured?:number; images?:string[]; category?:string; source?:string;
};

// Convert shared stays to local Stay format based on current language
function staysToDisplay(lang: string, stays: StayItem[]): Stay[] {
  return stays.map(s => ({
    id: s.id,
    title: lang === "ru" ? s.titleRu : lang === "en" ? s.titleEn : s.titleUz,
    city: s.city,
    region: s.region,
    imageUrl: s.images[0],
    images: s.images,
    pricePerNight: s.pricePerNight,
    pricePerWeek: s.pricePerWeek,
    rating: s.rating,
    reviewCount: s.reviewCount,
    guestCount: s.guestCount,
    homeType: lang === "ru" ? s.homeTypeRu : lang === "en" ? s.homeTypeEn : s.homeTypeUz,
    hostName: s.hostName,
    hostAvatar: s.hostAvatar,
    featured: s.featured,
    category: s.category,
    source: s.source,
  }));
}

// ── Lang Dropdown ─────────────────────────────────────────────────────────────
function LangDrop() {
  const { lang, setLang, currentLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
        <Globe2 size={16}/> <span className="text-sm font-medium">{currentLang.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl py-1.5 z-50 border border-gray-100">
          {languages.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l.code);setOpen(false);}}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${lang===l.code?"font-semibold text-[#e8175d]":"text-gray-700"}`}>
              <span>{l.flag}</span>{l.name}{lang===l.code&&<Check size={13} className="ml-auto text-[#e8175d]"/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User Menu ─────────────────────────────────────────────────────────────────
function UserNav({ transparent }:{transparent:boolean}) {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [,nav] = useLocation();
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[]);
  const cls = transparent ? "text-white" : "text-gray-700";
  const savedAvatar = typeof window !== "undefined" ? localStorage.getItem("uyjoy_user_avatar") : null;
  const avatarSrc = savedAvatar || "/listings/user-avatar.svg";

  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(v=>!v)} className={`flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity ${cls}`}>
        {isAuthenticated ? (
          <img
            src={avatarSrc}
            alt={user?.name || "Profil"}
            className="w-7 h-7 rounded-full object-cover border-2 border-white/80 shadow-xs"
          />
        ) : (
          <UserCircle2 size={26}/>
        )}
        <span className="hidden sm:block">{isAuthenticated ? user?.name?.split(" ")[0] : t.nav_login}</span>
        <ChevronDown size={13}/>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl py-1.5 z-50 border border-gray-100 text-sm">
          {!isAuthenticated
            ? <><button onClick={()=>{setOpen(false);startLogin();}} className="w-full text-left px-4 py-3 hover:bg-gray-50 font-semibold text-gray-900">{t.nav_login}</button>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={()=>{setOpen(false);nav("/hosting");}} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_hosting}</button>
                <button onClick={()=>{setOpen(false);nav("/help");}} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_help}</button></>
            : <><div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">{t.greeting}, {user?.name}</div>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={()=>{setOpen(false);nav("/hosting");}} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_hosting}</button>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={()=>{setOpen(false);logout();}} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_logout}</button></>
          }
        </div>
      )}
    </div>
  );
}

// ── Stay Card ─────────────────────────────────────────────────────────────────
function StayCard({stay,saved,onSave,onOpen}:{stay:Stay;saved:boolean;onSave:(s:Stay)=>void;onOpen:(id:number)=>void}) {
  const { t } = useLanguage();
  const imgs = stay.images?.length ? stay.images : [stay.imageUrl];
  const [emblaRef,emblaApi] = useEmblaCarousel({loop:true});
  const [idx,setIdx] = useState(0);
  const [hovered,setHovered] = useState(false);
  const prev = useCallback((e:React.MouseEvent)=>{e.stopPropagation();emblaApi?.scrollPrev();},[emblaApi]);
  const next = useCallback((e:React.MouseEvent)=>{e.stopPropagation();emblaApi?.scrollNext();},[emblaApi]);
  useEffect(()=>{if(!emblaApi)return;emblaApi.on("select",()=>setIdx(emblaApi.selectedScrollSnap()));},[emblaApi]);
  return (
    <article className="group cursor-pointer" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={()=>onOpen(stay.id)}>
      <div className="relative aspect-[20/19] rounded-2xl overflow-hidden bg-gray-100">
        <div className="overflow-hidden h-full w-full" ref={emblaRef}>
          <div className="flex h-full">
            {imgs.map((src,i)=>(
              <div key={i} className="h-full w-full flex-[0_0_100%]">
                <img src={src} alt={stay.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent rounded-b-2xl pointer-events-none"/>
        <button onClick={e=>{e.stopPropagation();onSave(stay);}} className="absolute right-3 top-3 z-10 transition-transform hover:scale-110 active:scale-95">
          <Heart size={23} className={saved?"fill-[#e8175d] text-[#e8175d]":"fill-black/25 stroke-white"} strokeWidth={2}/>
        </button>
        {stay.featured===1 && <span className="absolute left-3 top-3 bg-[#e8175d] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{t.home_selected}</span>}
        {stay.source==="user" && <span className="absolute left-3 top-3 bg-white/90 text-[#e8175d] text-[10px] font-bold px-2.5 py-1 rounded-full">{t.post_my_listings}</span>}
        {imgs.length>1 && (
          <><button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"><ChevronLeft size={14}/></button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"><ChevronRight size={14}/></button></>
        )}
        {imgs.length>1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {imgs.slice(0,5).map((_,i)=><span key={i} className={`block rounded-full transition-all ${i===idx?"w-2 h-2 bg-white":"w-1.5 h-1.5 bg-white/60"}`}/>)}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-[14px] text-gray-900 line-clamp-1">{stay.city}, {stay.region}</p>
          {stay.reviewCount > 0
            ? <span className="flex items-center gap-0.5 text-[13px] font-medium shrink-0"><Star size={13} className="fill-gray-900"/> {stay.rating.toFixed(2)}</span>
            : <span className="text-[11px] font-semibold text-[#e8175d] bg-[#fdf0f4] px-2 py-0.5 rounded-full shrink-0">{t.rate_new}</span>}
        </div>
        <p className="text-[13px] text-gray-500 line-clamp-1">{stay.title}</p>
        <p className="text-[13px] text-gray-500">{stay.homeType} · {stay.guestCount} {t.card_guest}</p>
        <p className="text-[14px] text-gray-900">
          <span className="font-semibold">{money(stay.pricePerNight)}</span> <span className="text-gray-500">{t.card_per_night}</span>
          {stay.pricePerWeek ? <> <span className="text-gray-400">· {money(stay.pricePerWeek)} {t.price_per_week}</span></> : null}
        </p>
      </div>
    </article>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { t, lang } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const [,setLoc] = useLocation();
  const catalogue = useStays();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests]     = useState(1);
  const [showDestDrop, setShowDestDrop] = useState(false);
  const [category, setCategory] = useState("all");
  const [saved, setSaved]       = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  const wishlist  = trpc.wishlist.toggle.useMutation();

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>60);
    window.addEventListener("scroll",h); return ()=>window.removeEventListener("scroll",h);
  },[]);

  // Yangi kelgan va hali kirmagan foydalanuvchiga ro'yxatdan o'tish oynasini ochish
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        startLogin("register");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Close dest dropdown on outside click
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(destRef.current&&!destRef.current.contains(e.target as Node))setShowDestDrop(false);};
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const DESTINATIONS = useMemo(() => {
    const counts = new Map<string, number>();
    catalogue.forEach((stay) => {
      const city = stay.city;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    });
    if (!counts.has("Samarqand")) counts.set("Samarqand", 0);

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        img: CITY_IMAGES[name] ?? CITY_IMAGES["Samarqand"],
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [catalogue]);

  const HOME_STATS = useMemo(() => {
    const totalHomes = catalogue.length;
    const totalCities = new Set(catalogue.map((stay) => stay.city)).size;
    return [
      { n: String(totalHomes), l: t.home_stats_homes },
      { n: String(totalCities), l: t.home_stats_cities },
      { n: "4.9★", l: t.home_stats_rating },
      { n: "1K+", l: t.home_stats_guests },
    ];
  }, [catalogue, t]);

  const localStays = useMemo(()=>staysToDisplay(lang, catalogue),[lang, catalogue]);
  const allStays = localStays;

  const visible = useMemo(()=>{
    if(category==="all") return allStays;
    return allStays.filter(s=>s.category===category);
  },[allStays,category]);

  const save = (item:Stay)=>{
    if(!isAuthenticated){toast(t.toast_save_login);startLogin();return;}
    wishlist.mutate({listingId:item.id},{onSuccess:r=>{setSaved(v=>r.saved?[...v,item.id]:v.filter(x=>x!==item.id));toast(r.saved?t.toast_saved:t.toast_unsaved);}});
  };

  const doSearch = (dest?:string)=>{
    const p=new URLSearchParams();
    const target=dest ?? destination;
    if(target) p.set("query",target);
    if(checkIn)  p.set("checkIn",checkIn);
    if(checkOut) p.set("checkOut",checkOut);
    if(guests>1) p.set("guests",String(guests));
    setLoc(`/search?${p.toString()}`);
  };

  const CATS = [
    {id:"all",      label:t.cat_all,       icon:HomeIcon},
    {id:"historic", label:t.cat_historic,  icon:Landmark},
    {id:"mountains",label:t.cat_mountains, icon:Mountain},
    {id:"city",     label:t.cat_national,  icon:Building2},
    {id:"nature",   label:t.cat_nature,    icon:TreePine},
    {id:"luxury",   label:t.cat_luxury,    icon:Gem},
    {id:"popular",  label:t.cat_popular,   icon:TrendingUp},
  ];

  const WHY = [
    {icon:Shield,    color:"#e8175d", title:t.home_why_1_title, desc:t.home_why_1_desc},
    {icon:Clock,     color:"#f97316", title:t.home_why_2_title, desc:t.home_why_2_desc},
    {icon:Award,     color:"#8b5cf6", title:t.home_why_3_title, desc:t.home_why_3_desc},
    {icon:HeartIcon, color:"#ec4899", title:t.home_why_4_title, desc:t.home_why_4_desc},
  ];

  const AMENITIES_LIST = [
    {icon:Wifi,     label:t.ld_amenity_wifi,      bg:"#eff6ff", color:"#3b82f6"},
    {icon:Car,      label:t.ld_amenity_parking,   bg:"#f0fdf4", color:"#22c55e"},
    {icon:Utensils, label:t.ld_amenity_kitchen,   bg:"#fff7ed", color:"#f97316"},
    {icon:Coffee,   label:t.ld_amenity_breakfast, bg:"#fdf4ff", color:"#a855f7"},
    {icon:Shield,   label:t.ld_amenity_shield,    bg:"#fff1f2", color:"#e8175d"},
    {icon:Award,    label:t.ld_highlights_superhost, bg:"#f0fdfa", color:"#14b8a6"},
  ];

  const REVIEWS_DATA = [
    {name:"Émilie D.", country:"Fransiya", avatar:"/listings/user-avatar.svg",  rating:5, stay:"Samarqand", text: lang==="ru"?"Очень тёплые хозяева и чистый дом. Лучший опыт в моей жизни!" : lang==="en"?"Very warm hosts and clean house. The best experience of my life!":"Juda iliq mezbonlar va toza uy. Hayotimning eng yaxshi tajribasi!"},
    {name:"Toshie K.", country:"Yaponiya", avatar:"/listings/user-avatar.svg", rating:5, stay:"Buxoro",   text: lang==="ru"?"Исторический гостевой дом в Бухаре — как музей! Хозяин показал все скрытые места.":"Buxorodagi tarixiy mehmon uyi — o'zi bir muzey! Mezbon barcha yashirin joylarni ko'rsatdi."},
    {name:"Slavica M.",country:"Serbiya",  avatar:"/listings/user-avatar.svg", rating:5, stay:"Toshkent", text: lang==="ru"?"Квартира в Ташкенте очень современная и удобная. Завтрак каждый день был вкусным.":"Toshkentdagi kvartira juda zamonaviy va qulay edi. Har kuni mazali nonushta tayyorlashdi."},
  ];

  const transparent = !scrolled;
  const navTextCls  = transparent ? "text-white" : "text-gray-700";

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled?"bg-white shadow-sm border-b border-gray-200":"bg-transparent"}`}>
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 h-[72px] flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#e8175d] flex items-center justify-center shadow-sm"><HomeIcon size={18} className="text-white"/></div>
            <span className={`font-display font-bold text-[22px] hidden sm:block transition-colors ${transparent?"text-white":"text-[#e8175d]"}`}>
              uyjoy<span className={transparent?"text-white/70":"text-gray-400"}>.uz</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {[{label:t.nav_directions,href:"/search"},{label:t.nav_inspire,href:"/inspire"}].map(item=>(
              <a key={item.label} href={item.href} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${transparent?"text-white hover:bg-white/15":"text-gray-700 hover:bg-gray-100"}`}>{item.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <a href="/post" className={`hidden md:block px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${transparent?"border-white text-white hover:bg-white hover:text-[#e8175d]":"border-[#e8175d] text-[#e8175d] hover:bg-[#e8175d] hover:text-white"}`}>
              {t.nav_post_room}
            </a>
            <div className={navTextCls}><LangDrop/></div>
            <UserNav transparent={transparent}/>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-[600px] sm:min-h-[680px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85"
            alt="Samarqand Registon maydoni, O'zbekiston"
            className="w-full h-full object-cover scale-105 filter brightness-95"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://commons.wikimedia.org/wiki/Special:FilePath/RegistanSquare_Samarkand.jpg?width=1920";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/75"/>
        </div>
        <div className="relative z-10 w-full mx-auto max-w-[900px] px-5 sm:px-8 pt-20 pb-16 text-center">
          <h1 className="font-display text-[38px] sm:text-[56px] font-bold text-white leading-tight mb-3 animate-rise drop-shadow-lg">{t.home_hero_title}</h1>
          <p className="text-white/80 text-lg sm:text-xl mb-10 animate-rise-delay">{t.home_hero_subtitle}</p>

          {/* Search box */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-visible animate-rise-delay2 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(120px,1.2fr)_1fr_1fr_auto]">
              {/* Destination */}
              <div ref={destRef} className="relative border-b sm:border-b-0 sm:border-r border-gray-200">
                <div className="flex items-center gap-2 px-3 py-4">
                  <MapPin size={18} className="text-[#e8175d] shrink-0"/>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{t.home_search_dest}</p>
                    <input value={destination} onChange={e=>{setDestination(e.target.value);setShowDestDrop(true);}} onFocus={()=>setShowDestDrop(true)}
                      placeholder={t.home_search_dest_ph} className="w-full min-w-0 text-sm font-medium text-gray-900 outline-none placeholder-gray-400 bg-transparent"/>
                  </div>
                  {destination && <button onClick={()=>{setDestination("");setShowDestDrop(false);}}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>}
                </div>
                {showDestDrop && (
                  <div className="absolute top-full left-0 sm:w-[280px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 py-2 mt-1">
                    {DESTINATIONS.filter(d=>!destination||d.name.toLowerCase().includes(destination.toLowerCase())).map(d=>(
                      <button key={d.name} onClick={()=>{setDestination(d.name);setShowDestDrop(false);}} className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-left">
                        <img src={d.img} alt={d.name} className="w-10 h-10 rounded-lg object-cover"/>
                        <div><p className="text-sm font-semibold text-gray-900">{d.name}</p><p className="text-xs text-gray-400">{d.count} {t.home_homes_count}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Check-in */}
              <div className="border-b sm:border-b-0 sm:border-r border-gray-200 flex items-center gap-3 px-5 py-4">
                <Calendar size={18} className="text-[#e8175d] shrink-0"/>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{t.home_search_checkin}</p>
                  <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="w-full text-sm font-medium text-gray-900 outline-none bg-transparent"/>
                </div>
              </div>
              {/* Check-out */}
              <div className="border-b sm:border-b-0 sm:border-r border-gray-200 flex items-center gap-3 px-5 py-4">
                <Calendar size={18} className="text-[#e8175d] shrink-0"/>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{t.home_search_checkout}</p>
                  <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="w-full text-sm font-medium text-gray-900 outline-none bg-transparent"/>
                </div>
              </div>
              {/* Guests + Search */}
              <div className="flex items-center">
                <div className="flex items-center gap-2 px-4 py-4 border-r border-gray-200 sm:border-r-0">
                  <Users size={18} className="text-[#e8175d] shrink-0"/>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{t.home_search_guests}</p>
                    <select value={guests} onChange={e=>setGuests(Number(e.target.value))} className="text-sm font-medium text-gray-900 outline-none bg-transparent appearance-none pr-3">
                      {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} {t.home_search_guests_count}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={()=>doSearch()} className="m-2 bg-[#e8175d] hover:bg-[#c0124d] text-white font-bold rounded-xl px-6 py-3.5 flex items-center gap-2 transition-colors shrink-0 text-sm">
                  <Search size={16}/> {t.home_search_btn}
                </button>
              </div>
            </div>
          </div>

          {/* City chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {DESTINATIONS.map(d=>(
              <button key={d.name} onClick={()=>{setDestination(d.name);doSearch(d.name);}}
                className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium backdrop-blur-sm border border-white/30 transition-colors">
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#e8175d] text-white">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {HOME_STATS.map(s=>(
            <div key={s.l}><p className="font-display text-2xl sm:text-3xl font-bold">{s.n}</p><p className="text-sm text-white/75 mt-0.5">{s.l}</p></div>
          ))}
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8 py-14">
        <div className="flex items-end justify-between mb-7">
          <div><p className="kicker mb-1">{t.home_dest_section}</p><h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{t.home_dest_title}</h2></div>
          <a href="/search" className="hidden sm:flex items-center gap-1.5 text-[#e8175d] font-semibold text-sm hover:gap-2.5 transition-all">{t.home_see_all} <ArrowRight size={16}/></a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {DESTINATIONS.map(d=>(
            <a key={d.name} href={`/search?query=${d.name}`} className="group relative aspect-[3/4] rounded-2xl overflow-hidden block">
              <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="font-display font-bold text-base">{d.name}</p>
                <p className="text-xs text-white/75">{d.count} {t.home_homes_count}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="bg-[#fdf8f8] py-14">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="text-center mb-10"><p className="kicker mb-1">{t.home_why_kicker}</p><h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{t.home_why_title}</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(w=>(
              <div key={w.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{backgroundColor:w.color+"20"}}><w.icon size={22} style={{color:w.color}}/></div>
                <h3 className="font-display font-bold text-[17px] text-gray-900 mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8 py-14">
        <div className="flex items-end justify-between mb-6">
          <div><p className="kicker mb-1">{t.home_listings_kicker}</p><h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{t.home_listings_title}</h2></div>
          <a href="/search" className="hidden sm:flex items-center gap-1.5 text-[#e8175d] font-semibold text-sm hover:gap-2.5 transition-all">{t.home_see_all} <ArrowRight size={16}/></a>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mb-8 pb-1">
          {CATS.map(cat=>{const Icon=cat.icon; const active=category===cat.id; return (
            <button key={cat.id} onClick={()=>setCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${active?"bg-[#e8175d] text-white border-[#e8175d]":"border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"}`}>
              <Icon size={15}/> {cat.label}
            </button>
          );})}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {visible.map(item=><StayCard key={item.id} stay={item} saved={saved.includes(item.id)} onSave={save} onOpen={id=>setLoc(`/stay/${id}`)}/>)}
        </div>
      </section>

      {/* ── HOST CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/20100929_bukhara_4997.jpg/1280px-20100929_bukhara_4997.jpg" alt="Host" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#e8175d]/92 to-[#c0124d]/82"/>
        </div>
        <div className="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-3">{t.home_host_kicker}</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 leading-tight">{t.home_host_title}</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">{t.home_host_desc}</p>
            <a href="/post" className="inline-flex items-center gap-2 bg-white text-[#e8175d] font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-colors text-base shadow-lg">
              {t.home_host_cta} <ArrowRight size={18}/>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{n:"0%",l:t.home_host_stat1},{n:"24/7",l:t.home_host_stat2},{n:"3 min",l:t.home_host_stat3},{n:"100%",l:t.home_host_stat4}].map(s=>(
              <div key={s.l} className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-white border border-white/20">
                <p className="font-display text-3xl font-bold">{s.n}</p><p className="text-sm text-white/75 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AMENITIES ── */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8 py-14">
        <div className="text-center mb-10"><p className="kicker mb-1">{t.home_amenities_kicker}</p><h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{t.home_amenities_title}</h2></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {AMENITIES_LIST.map(a=>(
            <div key={a.label} className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{backgroundColor:a.bg}}><a.icon size={22} style={{color:a.color}}/></div>
              <p className="text-sm font-semibold text-gray-700 text-center">{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="bg-[#fdf8f8] py-14">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          <div className="flex items-end justify-between mb-8">
            <div><p className="kicker mb-1">{t.home_reviews_kicker}</p><h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{t.home_reviews_title}</h2></div>
            <a href="/reviews" className="hidden sm:flex items-center gap-1.5 text-[#e8175d] font-semibold text-sm">{t.home_see_all} <ArrowRight size={16}/></a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS_DATA.map(r=>(
              <div key={r.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s=><Star key={s} size={14} className="fill-[#e8175d] text-[#e8175d]"/>)}</div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <img src={r.avatar} alt={r.name} className="w-11 h-11 rounded-full object-cover"/>
                  <div><p className="font-semibold text-sm text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.country} · {r.stay}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="mx-auto max-w-[1320px] px-5 sm:px-8 py-14">
        <div className="bg-gradient-to-br from-[#e8175d] to-[#c0124d] rounded-3xl p-8 sm:p-14 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">{t.home_newsletter_title}</h2>
          <p className="text-white/75 mb-8 max-w-lg mx-auto">{t.home_newsletter_desc}</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e=>{e.preventDefault();toast.success(t.home_newsletter_success);}}>
            <input type="email" placeholder={t.home_newsletter_placeholder} required className="flex-1 rounded-xl px-5 py-3.5 text-gray-900 text-sm outline-none placeholder-gray-400 bg-white"/>
            <button type="submit" className="bg-white text-[#e8175d] font-bold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm shrink-0">{t.home_newsletter_btn}</button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center"><HomeIcon size={15} className="text-white"/></div><span className="font-display font-bold text-xl text-[#e8175d]">uyjoy.uz</span></div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{t.footer_desc}</p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-xs font-medium text-gray-500 hover:text-[#e8175d] transition-colors">{t.home_footer_social_tg}</a>
                <a href="#" className="text-xs font-medium text-gray-500 hover:text-[#e8175d] transition-colors">{t.home_footer_social_ig}</a>
              </div>
            </div>
            {[
              {title:t.home_footer_company, links:[{l:t.footer_about,h:"/about"},{l:t.footer_partner,h:"/about"},{l:t.footer_blog,h:"/inspire"},{l:t.footer_contact,h:"/help"}]},
              {title:t.home_footer_explore_col, links:[{l:"Samarqand",h:"/search?query=Samarqand"},{l:"Buxoro",h:"/search?query=Buxoro"},{l:"Toshkent",h:"/search?query=Toshkent"},{l:"Xiva",h:"/search?query=Xiva"}]},
              {title:t.home_footer_help_col, links:[{l:t.footer_help_center,h:"/help"},{l:t.footer_privacy,h:"/help"},{l:t.footer_terms,h:"/help"},{l:t.footer_contact,h:"/help"}]},
            ].map(col=>(
              <div key={col.title}>
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4">{col.title}</h4>
                <ul className="space-y-2.5">{col.links.map(lnk=><li key={lnk.l}><a href={lnk.h} className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors">{lnk.l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
            <p>{t.home_copyright}</p>
            <div className="flex gap-4">
              <a href="/help" className="hover:text-gray-700 transition-colors">{t.footer_privacy}</a>
              <span>·</span>
              <a href="/help" className="hover:text-gray-700 transition-colors">{t.footer_terms}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
