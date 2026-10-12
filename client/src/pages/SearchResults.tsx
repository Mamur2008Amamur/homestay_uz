import { useMemo, useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Heart, Home as HomeIcon, Search, Star, Globe2, SlidersHorizontal, X, ChevronDown, Check, Grid3X3, List, Wifi, Car, Utensils, Coffee } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/i18n";
import { money } from "@/lib/money";
import { stayAmenities, type StayItem } from "@/data/stays";
import { useStays } from "@/data/useStays";

type Stay = { id:number; title:string; city:string; region:string; imageUrl:string; pricePerNight:number; pricePerWeek?:number; rating:number; reviewCount:number; guestCount:number; homeType:string; hostName:string; hostAvatar?:string|null; amenities:string[] };

function buildDemo(lang: string, stays: StayItem[]): Stay[] {
  return stays.map(s => ({
    id: s.id,
    title: lang === "ru" ? s.titleRu : lang === "en" ? s.titleEn : s.titleUz,
    city: s.city,
    region: s.region,
    imageUrl: s.images[0],
    pricePerNight: s.pricePerNight,
    pricePerWeek: s.pricePerWeek,
    rating: s.rating,
    reviewCount: s.reviewCount,
    guestCount: s.guestCount,
    homeType: lang === "ru" ? s.homeTypeRu : lang === "en" ? s.homeTypeEn : s.homeTypeUz,
    hostName: s.hostName,
    hostAvatar: s.hostAvatar,
    amenities: stayAmenities(s),
  }));
}

function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const [, nav] = useLocation();
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-[#f0e5e0] bg-white/85 backdrop-blur-xl shadow-[0_10px_30px_rgba(20,28,35,0.04)]">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 h-[68px] flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 shrink-0 rounded-full px-1.5 py-1.5 transition hover:bg-[#fff2f7]">
          <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,#ff4d7a,#e8175d)] flex items-center justify-center shadow-[0_10px_20px_rgba(232,23,93,0.22)]"><HomeIcon size={15} className="text-white"/></div>
          <span className="font-display font-bold text-xl text-[#e8175d] hidden sm:block">uyjoy.uz</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <div ref={langRef} className="relative">
            <button onClick={() => setLangOpen(v=>!v)} className="p-2.5 rounded-full bg-[#f7f2ef] hover:bg-[#f0e7e2] transition-colors text-gray-700 shadow-sm"><Globe2 size={17}/></button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl py-1.5 z-50 border border-gray-100">
                {languages.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${lang === l.code ? "font-semibold text-[#e8175d]" : "text-gray-700"}`}>
                    <span>{l.flag}</span>{l.name}{lang === l.code && <Check size={13} className="ml-auto text-[#e8175d]"/>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div ref={userRef} className="relative">
            <button onClick={() => setUserOpen(v=>!v)} className="flex items-center gap-2 border border-[#f0e5e0] rounded-full py-1.5 pl-3 pr-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)] transition-shadow bg-white text-sm shadow-sm">
              <SlidersHorizontal size={15} className="text-gray-600"/>
              <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#4b5563,#111827)] flex items-center justify-center overflow-hidden shadow-sm">
                <span className="text-white text-xs font-bold">{user?.name?.[0] ?? "U"}</span>
              </div>
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl py-1.5 z-50 border border-gray-100 text-sm">
                {!isAuthenticated
                  ? <><button onClick={() => { setUserOpen(false); startLogin(); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 font-semibold">{t.nav_login}</button>
                      <div className="h-px bg-gray-100 my-1"/>
                      <button onClick={() => { setUserOpen(false); nav("/hosting"); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_hosting}</button></>
                  : <><div className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wide">{t.greeting}, {user?.name}</div>
                      <div className="h-px bg-gray-100 my-1"/>
                      <button onClick={() => { setUserOpen(false); logout(); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700">{t.nav_logout}</button></>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function FilterSidebar({ minP, maxP, types, amenities, minRating, onMinP, onMaxP, onTypes, onAmenities, onMinRating, onClose, isMobile }: {
  minP:number; maxP:number; types:string[]; amenities:string[]; minRating:number;
  onMinP:(v:number)=>void; onMaxP:(v:number)=>void; onTypes:(v:string[])=>void;
  onAmenities:(v:string[])=>void; onMinRating:(v:number)=>void; onClose:()=>void; isMobile:boolean;
}) {
  const { t } = useLanguage();
  const toggle = (arr:string[], val:string, setter:(v:string[])=>void) => setter(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val]);
  const typeOptions = [t.type_house, t.type_cottage, t.type_guesthouse, t.type_room, t.type_apartment];
  const amenityOptions = [
    { key:"wifi",     icon:Wifi,     label:t.ld_amenity_wifi },
    { key:"parking",  icon:Car,      label:t.ld_amenity_parking },
    { key:"kitchen",  icon:Utensils, label:t.ld_amenity_kitchen },
    { key:"breakfast",icon:Coffee,   label:t.ld_amenity_breakfast },
  ];

  const content = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t.sr_filter_price}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0"><label className="text-xs text-gray-500 mb-1 block">{t.sr_filter_price_min}</label>
            <input type="number" value={minP} onChange={e=>onMinP(Number(e.target.value))} step={50000} className="w-full min-w-0 appearance-none border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#e8175d]"/></div>
          <div className="min-w-0"><label className="text-xs text-gray-500 mb-1 block">{t.sr_filter_price_max}</label>
            <input type="number" value={maxP} onChange={e=>onMaxP(Number(e.target.value))} step={50000} className="w-full min-w-0 appearance-none border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#e8175d]"/></div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t.sr_filter_type}</h3>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map(tp=>(
            <button key={tp} onClick={()=>toggle(types,tp,onTypes)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${types.includes(tp)?"bg-[#e8175d] text-white border-[#e8175d]":"border-gray-200 text-gray-700 hover:border-gray-400"}`}>{tp}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t.sr_filter_amenities}</h3>
        <div className="space-y-2">
          {amenityOptions.map(a=>(
            <label key={a.key} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${amenities.includes(a.key)?"bg-[#e8175d] border-[#e8175d]":"border-gray-300 group-hover:border-[#e8175d]"}`} onClick={()=>toggle(amenities,a.key,onAmenities)}>
                {amenities.includes(a.key) && <Check size={11} className="text-white"/>}
              </div>
              <a.icon size={15} className="text-gray-500"/>
              <span className="text-sm text-gray-700">{a.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t.sr_filter_rating}</h3>
        <div className="flex gap-2">
          {[0,4,4.5,4.8].map(r=>(
            <button key={r} onClick={()=>onMinRating(r)}
              className={`flex-1 py-2 rounded-lg text-sm border transition-all ${minRating===r?"bg-[#e8175d] text-white border-[#e8175d]":"border-gray-200 text-gray-700 hover:border-gray-400"}`}>
              {r===0?t.sr_filter_all:`${r}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-6 z-10 animate-rise max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg">{t.sr_filters}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={18}/></button>
        </div>
        {content}
        <button onClick={onClose} className="w-full mt-6 py-3.5 bg-[#e8175d] text-white font-semibold rounded-xl hover:bg-[#c0124d] transition-colors">{t.sr_filter_apply}</button>
      </div>
    </div>
  );
  return <div className="w-[240px] shrink-0">{content}</div>;
}

export default function SearchResults() {
  const { t, lang } = useLanguage();
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const catalogue = useStays();

  // URL'dan o'qish: marshrut o'zgarganda holat ham yangilanadi.
  const readParams = () => new URLSearchParams(window.location.search);
  const [inputVal, setInputVal] = useState(() => readParams().get("query") || "");
  const [query, setQuery]       = useState(() => readParams().get("query") || "");
  const [city, setCity]         = useState(() => readParams().get("city")  || "");
  const [saved, setSaved]       = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage]         = useState(1);
  const PER_PAGE = 6;

  const [minP, setMinP]           = useState(0);
  const [maxP, setMaxP]           = useState(2000000);
  const [types, setTypes]         = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy]       = useState("default");

  useEffect(() => {
    const next = readParams();
    setInputVal(next.get("query") || "");
    setQuery(next.get("query") || "");
    setCity(next.get("city") || "");
    setPage(1);
  }, [location, typeof window !== "undefined" ? window.location.search : ""]);

  const wishlist  = trpc.wishlist.toggle.useMutation();
  const raw = useMemo(()=>buildDemo(lang, catalogue),[lang, catalogue]);

  const filtered = useMemo(() => {
    let items = raw.filter(x => {
      const mQ = !query || `${x.title} ${x.city} ${x.region}`.toLowerCase().includes(query.toLowerCase());
      const mC = !city  || x.city === city;
      const mP = x.pricePerNight >= minP && (maxP === 0 || x.pricePerNight <= maxP);
      const mT = types.length === 0 || types.includes(x.homeType);
      const mA = amenities.length === 0 || amenities.every(a => x.amenities.includes(a));
      const mR = x.rating >= minRating;
      return mQ && mC && mP && mT && mA && mR;
    });
    if (sortBy === "price_asc")  items = [...items].sort((a,b) => a.pricePerNight - b.pricePerNight);
    if (sortBy === "price_desc") items = [...items].sort((a,b) => b.pricePerNight - a.pricePerNight);
    if (sortBy === "rating")     items = [...items].sort((a,b) => b.rating - a.rating);
    return items;
  }, [raw, query, city, minP, maxP, types, amenities, minRating, sortBy]);

  // Filtr o'zgarganda jami sahifalar sonini chegaralash.
  useEffect(() => {
    setPage(p => Math.min(p, Math.max(1, Math.ceil(filtered.length / PER_PAGE))));
  }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const activeFilters = types.length + amenities.length + (minP>0?1:0) + (maxP<2000000?1:0) + (minRating>0?1:0);

  const handleSave = (item:Stay) => {
    if (!isAuthenticated) { toast(t.toast_save_login); startLogin(); return; }
    wishlist.mutate({ listingId:item.id }, { onSuccess:r => { setSaved(v=>r.saved?[...v,item.id]:v.filter(x=>x!==item.id)); toast(r.saved?t.toast_saved:t.toast_unsaved); }});
  };

  // Chip qiymati — ichki shahar nomi (filtr ishlashi uchun), yorlig'i — tarjima.
  const CITIES = useMemo(() => {
    const cityNames = Array.from(new Set(catalogue.map((stay) => stay.city))).sort();
    return cityNames.map((name) => ({
      name,
      label:
        name === "Samarqand" ? t.city_samarkand :
        name === "Buxoro" ? t.city_bukhara :
        name === "Toshkent" ? t.city_tashkent :
        name === "Chimgan" ? t.city_chimgan :
        name === "Xiva" ? t.city_khiva :
        name === "Farg'ona" ? t.city_fergana : name,
    }));
  }, [catalogue, t]);

  const clearAll = () => { setQuery(""); setInputVal(""); setCity(""); setTypes([]); setAmenities([]); setMinRating(0); setMinP(0); setMaxP(2000000); setPage(1); };

  const SORT_OPTS = [
    { val:"default",    label:t.sr_sort_default },
    { val:"price_asc",  label:t.sr_sort_price_asc },
    { val:"price_desc", label:t.sr_sort_price_desc },
    { val:"rating",     label:t.sr_sort_rating },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Navbar/>
      {showFilter && (
        <FilterSidebar minP={minP} maxP={maxP} types={types} amenities={amenities} minRating={minRating}
          onMinP={setMinP} onMaxP={setMaxP} onTypes={setTypes} onAmenities={setAmenities} onMinRating={setMinRating}
          onClose={() => setShowFilter(false)} isMobile={true}/>
      )}

      {/* Search bar */}
      <div className="border-b border-[#f1e8e3] bg-[radial-gradient(circle_at_top,_rgba(232,23,93,0.08),transparent_30%),linear-gradient(180deg,#fffdfc_0%,#f7f3ee_100%)] py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/90 border border-[#f0e6e1] rounded-full px-4 py-2.5 focus-within:border-[#e8175d] focus-within:ring-2 focus-within:ring-[#e8175d]/15 transition-all shadow-[0_12px_30px_rgba(17,24,39,0.04)] backdrop-blur-sm">
            <Search size={16} className="text-gray-400 shrink-0"/>
            <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(setQuery(inputVal),setPage(1))}
              placeholder={t.search_city_placeholder} className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"/>
            {inputVal && <button onClick={()=>{setInputVal("");setQuery("");setPage(1);}}><X size={13} className="text-gray-400 hover:text-gray-600"/></button>}
          </div>
          <button onClick={()=>{setQuery(inputVal);setPage(1);}} className="h-11 px-6 rounded-full bg-[linear-gradient(135deg,#e8175d,#d81454)] text-white font-bold text-sm hover:brightness-105 transition-all shadow-[0_12px_18px_rgba(232,23,93,0.28)] flex items-center gap-2">
            <Search size={15}/> {t.search_btn}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-6">
        <button onClick={()=>navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#e8175d] mb-5 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform"/> {t.sr_back}
        </button>

        {/* City chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          <button onClick={()=>{setCity("");setPage(1);}} className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${!city?"bg-[#1f2937] text-white border-[#1f2937] shadow-[0_8px_18px_rgba(31,41,55,0.18)]":"border-[#e9e1dd] bg-white/75 text-gray-700 hover:border-gray-400"}`}>
            {t.search_all_cities}
          </button>
          {CITIES.map(c=>(
            <button key={c.name} onClick={()=>{setCity(city===c.name?"":c.name);setPage(1);}}
              className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${city===c.name?"bg-[#1f2937] text-white border-[#1f2937] shadow-[0_8px_18px_rgba(31,41,55,0.18)]":"border-[#e9e1dd] bg-white/75 text-gray-700 hover:border-gray-400"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-[84px] w-[240px] bg-white/85 border border-[#f0e5e0] rounded-[26px] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <h3 className="font-display font-bold text-base mb-5">
                {t.sr_filters} {activeFilters>0 && <span className="ml-2 bg-[#e8175d] text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeFilters}</span>}
              </h3>
              <FilterSidebar minP={minP} maxP={maxP} types={types} amenities={amenities} minRating={minRating}
                onMinP={setMinP} onMaxP={setMaxP} onTypes={setTypes} onAmenities={setAmenities} onMinRating={setMinRating}
                onClose={()=>{}} isMobile={false}/>
              {activeFilters > 0 && (
                <button onClick={()=>{setMinP(0);setMaxP(2000000);setTypes([]);setAmenities([]);setMinRating(0);}} className="mt-5 w-full text-sm text-[#e8175d] font-semibold hover:underline">
                  {t.sr_filter_clear}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="font-display font-bold text-xl text-gray-900">{CITIES.find(c=>c.name===city)?.label || query || t.sr_all_listings}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{filtered.length} {t.sr_results_count}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setPage(1);}} className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-[#e8175d] pr-7 cursor-pointer">
                    {SORT_OPTS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
                <button onClick={()=>setShowFilter(true)} className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white hover:border-gray-400 transition-colors">
                  <SlidersHorizontal size={15}/> {t.sr_filters} {activeFilters>0&&<span className="w-2 h-2 rounded-full bg-[#e8175d]"/>}
                </button>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={()=>setViewMode("grid")} className={`p-2 ${viewMode==="grid"?"bg-gray-900 text-white":"bg-white text-gray-500 hover:bg-gray-50"} transition-colors`}><Grid3X3 size={15}/></button>
                  <button onClick={()=>setViewMode("list")} className={`p-2 ${viewMode==="list"?"bg-gray-900 text-white":"bg-white text-gray-500 hover:bg-gray-50"} transition-colors`}><List size={15}/></button>
                </div>
              </div>
            </div>

            {/* Cards */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Search size={28} className="text-gray-300"/></div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{t.sr_empty_title}</h3>
                <p className="text-gray-500 text-sm max-w-xs mb-5">{t.sr_empty_desc}</p>
                <button onClick={clearAll} className="px-6 py-2.5 rounded-full border border-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors">{t.sr_empty_clear}</button>
              </div>
            ) : viewMode==="grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map(item=>(
                  <article key={item.id} className="group cursor-pointer bg-white/90 rounded-[28px] overflow-hidden border border-[#f0e5e0] hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition-all duration-300" onClick={()=>navigate(`/stay/${item.id}`)}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
                      <button onClick={e=>{e.stopPropagation();handleSave(item);}} className="absolute right-3 top-3 z-10 hover:scale-110 transition-transform active:scale-95">
                        <Heart size={22} className={saved.includes(item.id)?"fill-[#e8175d] text-[#e8175d]":"fill-black/20 stroke-white"} strokeWidth={2}/>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.city} · {item.homeType}</p>
                        {item.reviewCount > 0
                          ? <span className="flex items-center gap-0.5 text-sm font-medium shrink-0"><Star size={13} className="fill-[#e8175d] text-[#e8175d]"/>{item.rating.toFixed(2)}</span>
                          : <span className="text-[10px] font-bold text-[#e8175d] bg-[#fdf0f4] px-2 py-0.5 rounded-full shrink-0">{t.rate_new}</span>}
                      </div>
                      <h2 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 mb-2">{item.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        {item.hostAvatar && <img src={item.hostAvatar} alt="" className="w-5 h-5 rounded-full object-cover"/>}
                        <span>{item.hostName}</span><span>·</span><span>{item.guestCount} {t.sr_guest}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div><span className="font-bold text-[16px] text-gray-900">{money(item.pricePerNight)}</span><span className="text-gray-400 text-xs"> {t.card_per_night}</span></div>
                          {item.pricePerWeek && <p className="text-[11px] text-gray-400">{money(item.pricePerWeek)} {t.price_per_week}</p>}
                        </div>
                        <button onClick={()=>navigate(`/stay/${item.id}`)} className="px-4 py-2 bg-[#e8175d] text-white text-xs font-bold rounded-lg hover:bg-[#c0124d] transition-colors">{t.sr_see}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginated.map(item=>(
                  <article key={item.id} className="group cursor-pointer flex bg-white/90 rounded-[28px] overflow-hidden border border-[#f0e5e0] hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition-all duration-300" onClick={()=>navigate(`/stay/${item.id}`)}>
                    <div className="relative w-[220px] sm:w-[260px] shrink-0 overflow-hidden bg-gray-100">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
                      <button onClick={e=>{e.stopPropagation();handleSave(item);}} className="absolute right-3 top-3 z-10 hover:scale-110 transition-transform">
                        <Heart size={20} className={saved.includes(item.id)?"fill-[#e8175d] text-[#e8175d]":"fill-black/20 stroke-white"} strokeWidth={2}/>
                      </button>
                    </div>
                    <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{item.city} · {item.homeType}</p>
                          {item.reviewCount > 0
                            ? <span className="flex items-center gap-0.5 text-sm font-medium shrink-0"><Star size={13} className="fill-[#e8175d] text-[#e8175d]"/>{item.rating} <span className="text-gray-400 font-normal text-xs">({item.reviewCount})</span></span>
                            : <span className="text-[10px] font-bold text-[#e8175d] bg-[#fdf0f4] px-2 py-0.5 rounded-full shrink-0">{t.rate_new}</span>}
                        </div>
                        <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mb-2">{item.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {item.hostAvatar && <img src={item.hostAvatar} alt="" className="w-6 h-6 rounded-full object-cover"/>}
                          <span>{item.hostName}</span><span>·</span><span>{item.guestCount} {t.sr_guest}</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <div><span className="font-bold text-[17px] text-gray-900">{money(item.pricePerNight)}</span><span className="text-gray-400 text-sm"> {t.card_per_night}</span></div>
                          {item.pricePerWeek && <p className="text-xs text-gray-400">{money(item.pricePerWeek)} {t.price_per_week}</p>}
                        </div>
                        <button onClick={()=>navigate(`/stay/${item.id}`)} className="px-5 py-2.5 bg-[#e8175d] text-white text-sm font-bold rounded-xl hover:bg-[#c0124d] transition-colors">{t.sr_see}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white">{t.sr_prev}</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>setPage(p)} className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${p===page?"bg-[#e8175d] text-white":"bg-white border border-gray-200 text-gray-700 hover:border-gray-400"}`}>{p}</button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white">{t.sr_next}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
