import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Home as HomeIcon, Check, Star, MapPin, Users, Wallet,
  ImageIcon, Info, Trash2, Plus, Phone, Send, Wifi, Car, Utensils,
  Tv, Wind, ShieldCheck, Sparkles, Eye, LogIn, ExternalLink, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/money";
import { addUserStay, DEFAULT_STAY_IMAGE, nightlyFromWeekly } from "@/data/stays";
import { useStays } from "@/data/useStays";

const CITIES = [
  "Samarqand",
  "Toshkent",
  "Buxoro",
  "Chimgan",
  "Xiva",
  "Farg'ona",
  "Shahrisabz",
  "Nukus",
];

const PHOTO_PRESETS = [
  {
    name: "🏡 Samarqand: Milliy hovli",
    images: [
      "/listings/bogishamol-exterior-1.png",
      "/listings/bogishamol-96-front.png",
      "/listings/bogishamol-96-living-room.png",
    ],
  },
  {
    name: "🏰 Buxoro: Tarixiy mehmon uyi",
    images: [
      "/listings/bogishamol-second-1.jpg",
      "/listings/bogishamol-second-2.jpg",
      "/listings/bogishamol-second-3.jpg",
    ],
  },
  {
    name: "🏢 Toshkent: Zamonaviy xonadon",
    images: [
      "/listings/bogishamol-exterior-2.png",
      "/listings/bogishamol-exterior-3.png",
      "/listings/bogishamol-96-living-room.png",
    ],
  },
];

const ALL_AMENITIES = [
  { key: "wifi", label: "Wi-Fi internet", icon: Wifi },
  { key: "parking", label: "Avtoturargoh", icon: Car },
  { key: "kitchen", label: "Oshxona", icon: Utensils },
  { key: "ac", label: "Konditsioner", icon: Wind },
  { key: "tv", label: "Televizor", icon: Tv },
  { key: "shield", label: "Xavfsizlik tizimi", icon: ShieldCheck },
];

/** Client-side image compressor using canvas to keep payload super light */
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Rasm yuklashda xatolik"));
    };
    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik"));
  });
}

export default function PostRoom() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const stays = useStays();

  const [title, setTitle]             = useState("");
  const [city, setCity]               = useState("Samarqand");
  const [address, setAddress]         = useState("");
  const [homeType, setHomeType]       = useState("Kvartira");
  const [guests, setGuests]           = useState(2);
  const [weekly, setWeekly]           = useState(300000);
  const [desc, setDesc]               = useState("");
  const [phone, setPhone]             = useState("");
  const [telegram, setTelegram]       = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["wifi", "kitchen"]);
  const [imageList, setImageList]     = useState<string[]>([]);
  const [customUrl, setCustomUrl]     = useState("");
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [error, setError]             = useState("");
  const [createdStayId, setCreatedStayId] = useState<number | null>(null);

  const [hostNameInput, setHostNameInput] = useState("");
  const [hostAvatar, setHostAvatar] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("uyjoy_user_avatar") || "/listings/host-avatar.svg";
    }
    return "/listings/host-avatar.svg";
  });

  const handleHostAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 240;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setHostAvatar(dataUrl);
          try { localStorage.setItem("uyjoy_user_avatar", dataUrl); } catch {}
          toast.success("Mezbon surati yuklandi!");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const create = trpc.listings.create.useMutation();
  const nightly = useMemo(() => nightlyFromWeekly(weekly || 0), [weekly]);
  const myListings = useMemo(() => stays.filter((s) => s.source === "user"), [stays]);

  const typeOptions = [t.type_apartment, t.type_house, t.type_room, t.type_guesthouse, t.type_cottage];

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setIsProcessingFiles(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setImageList((prev) => Array.from(new Set([...prev, ...compressed])));
      toast.success(`${compressed.length} ta rasm muvaffaqiyatli yuklandi.`);
    } catch {
      toast.error("Rasmlarni qayta ishlashda xatolik yuz berdi.");
    } finally {
      setIsProcessingFiles(false);
      e.target.value = "";
    }
  };

  const addCustomUrl = () => {
    if (!customUrl.trim()) return;
    const url = customUrl.trim();
    if (!imageList.includes(url)) {
      setImageList((prev) => [...prev, url]);
      setCustomUrl("");
      toast.success("Rasm havolasi qo'shildi.");
    }
  };

  const applyPreset = (presetImages: string[]) => {
    setImageList(presetImages);
    toast.success("Namunaviy rasmlar tanlandi!");
  };

  const removeImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    setImageList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success("Asosiy rasm o'zgartirildi!");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info(t.post_login, { description: "Avval profilingizga kiring yoki ro'yxatdan o'ting" });
      startLogin();
      return;
    }
    setError("");

    if (title.trim().length < 3) { setError(t.post_err_title); return; }
    if (!weekly || weekly <= 0) { setError(t.post_err_price); return; }
    if (address.trim().length < 3) { setError(t.post_err_address); return; }

    const finalImages = imageList.length ? imageList : [DEFAULT_STAY_IMAGE];
    const finalHostName = hostNameInput.trim() || user?.name?.trim() || "UyJoy mezboni";
    const finalHostAvatar = hostAvatar || "/listings/host-avatar.svg";

    const payload = {
      title: title.trim(),
      city,
      region: city === "Toshkent" ? "Toshkent shahri" : `${city} tumani`,
      address: address.trim(),
      description: desc.trim() || `${city} shahrida joylashgan shinam uy.`,
      imageUrl: finalImages[0] || DEFAULT_STAY_IMAGE,
      images: finalImages,
      amenities: selectedAmenities,
      phone1: phone.trim() || undefined,
      telegram: telegram.trim() || undefined,
      pricePerWeek: weekly,
      guestCount: guests,
      homeType,
      hostAvatar: finalHostAvatar,
    };

    // Save locally immediately so it instantly appears in catalogue
    const localStay = addUserStay({
      titleUz: payload.title,
      city: payload.city,
      region: payload.region,
      homeTypeUz: payload.homeType,
      address: payload.address,
      description: payload.description,
      images: finalImages,
      amenities: selectedAmenities,
      phone1: payload.phone1,
      telegram: payload.telegram,
      pricePerWeek: payload.pricePerWeek,
      guestCount: payload.guestCount,
      hostName: finalHostName,
      hostAvatar: finalHostAvatar,
    });

    setCreatedStayId(localStay.id);

    // Also persist to backend
    try {
      await create.mutateAsync(payload);
    } catch (err: any) {
      console.warn("Backend sync notice:", err);
    }

    toast.success(t.post_success, {
      description: "Uyingiz katalogga qo'shildi va barcha foydalanuvchilarga ko'rinadi!",
    });

    // Reset form
    setTitle("");
    setAddress("");
    setDesc("");
    setPhone("");
    setTelegram("");
    setImageList([]);
  };

  const field = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e8175d] focus:ring-1 focus:ring-[#e8175d] bg-white transition-all";

  return (
    <div className="min-h-screen bg-[#fcfbfa]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto max-w-[1140px] px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center">
              <HomeIcon size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-xl text-[#e8175d] hidden sm:block">uyjoy.uz</span>
          </a>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16}/> {t.info_back}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-5 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">{t.post_title}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t.post_subtitle}</p>
          </div>

          {!isAuthenticated ? (
            <button
              onClick={startLogin}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8175d]/10 text-[#e8175d] font-semibold text-xs hover:bg-[#e8175d]/20 transition-colors self-start sm:self-auto"
            >
              <LogIn size={15}/> Tizimga kirish / Ro'yxatdan o'tish
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              Mezbon: {user?.name || "Foydalanuvchi"}
            </div>
          )}
        </div>

        {createdStayId && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-bold text-sm text-green-900">E'lon muvaffaqiyatli joylashtirildi!</p>
                <p className="text-xs text-green-700">Uyingiz saytda jonli efirda ko'rinmoqda.</p>
              </div>
            </div>
            <a
              href={`/stay/${createdStayId}`}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              E'lonni ko'rish <ExternalLink size={14}/>
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            {/* 1. Asosiy ma'lumotlar */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-2 text-gray-900">
                <Info size={18} className="text-[#e8175d]"/> {t.post_step_info}
              </h2>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  {t.post_field_title} <span className="text-[#e8175d]">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.post_field_title_ph}
                  required
                  className={field}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t.post_field_city}</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={field}>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t.post_field_type}</label>
                  <select value={homeType} onChange={(e) => setHomeType(e.target.value)} className={field}>
                    {typeOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  {t.post_field_address} <span className="text-[#e8175d]">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e8175d]"/>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t.post_field_address_ph}
                    required
                    className={`${field} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t.post_field_guests}</label>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#e8175d] shrink-0 ml-1"/>
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={field}>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((n) => (
                      <option key={n} value={n}>{n} ta mehmon</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t.post_field_desc}</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  placeholder={t.post_field_desc_ph}
                  className={`${field} resize-y`}
                />
              </div>
            </section>

            {/* 2. Mezbon ma'lumotlari va Bog'lanish */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 text-gray-900">
                <Users size={18} className="text-[#e8175d]"/> Mezbon ma'lumotlari (Sizning profilingiz)
              </h2>

              {/* Host avatar & personal name */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#faf8f6] border border-gray-200">
                <div className="relative shrink-0">
                  <img
                    src={hostAvatar}
                    alt="Mezbon surati"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-white"
                  />
                  <label className="absolute -bottom-1 -right-1 bg-[#e8175d] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#c0124d] transition-colors shadow">
                    <Camera size={13} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHostAvatarChange}
                    />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Mezbon ismi</label>
                  <input
                    value={hostNameInput}
                    onChange={(e) => setHostNameInput(e.target.value)}
                    placeholder={user?.name || "Ismingizni kiriting"}
                    className={field}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Uyingiz e'lonida aynan mana shu suratingiz va ismingiz ko'rsatiladi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Telefon raqam</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className={`${field} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Telegram username</label>
                  <div className="relative">
                    <Send size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#24A1DE]"/>
                    <input
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="@username"
                      className={`${field} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Qulayliklar (Amenities) */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-3">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 text-gray-900">
                <Sparkles size={18} className="text-[#e8175d]"/> Qulayliklar va sharoitlar
              </h2>
              <p className="text-xs text-gray-500 mb-2">Mehmonlar uchun mavjud bo'lgan qulayliklarni tanlang:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ALL_AMENITIES.map((item) => {
                  const Icon = item.icon;
                  const active = selectedAmenities.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleAmenity(item.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                        active
                          ? "border-[#e8175d] bg-[#fdf2f5] text-[#e8175d]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-[#e8175d]" : "text-gray-400"}/>
                      <span>{item.label}</span>
                      {active && <Check size={14} className="ml-auto text-[#e8175d]"/>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Narx */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 text-gray-900">
                <Wallet size={18} className="text-[#e8175d]"/> {t.post_step_price}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    {t.post_field_weekly} <span className="text-[#e8175d]">*</span>
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    value={weekly}
                    onChange={(e) => setWeekly(Number(e.target.value))}
                    className={field}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t.post_field_nightly}</label>
                  <input
                    value={`${money(nightly)} so'm`}
                    readOnly
                    className={`${field} bg-gray-50 text-gray-600 font-semibold`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-gray-500 self-center">Tezkor narxlar:</span>
                {[200000, 350000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setWeekly(val)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  >
                    {money(val)}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 bg-[#fdf8f8] border border-[#f6dbe4] rounded-xl px-4 py-3">
                {t.post_weekly_hint}
              </p>
            </section>

            {/* 5. Rasmlar */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg flex items-center gap-2 text-gray-900">
                    <ImageIcon size={18} className="text-[#e8175d]"/> {t.post_step_photos}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Uyingizning sifatli va chiroyli rasmlarini yuklang</p>
                </div>

                <label
                  htmlFor="image-file-input"
                  className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-[#e8175d] bg-[#e8175d] text-white px-4 py-2 text-xs font-bold hover:bg-[#c0124d] transition-colors shadow-xs"
                >
                  <Plus size={15}/> Rasm yuklash
                </label>
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessingFiles}
                />
              </div>

              {/* Presets */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Tayyor namunaviy rasmlardan tanlash:</p>
                <div className="flex flex-wrap gap-2">
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.images)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-[#e8175d] hover:text-[#e8175d] font-semibold transition-all shadow-2xs"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL qo'shish */}
              <div className="flex gap-2">
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Rasm havolasini (URL) kiriting..."
                  className={field}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomUrl(); } }}
                />
                <button
                  type="button"
                  onClick={addCustomUrl}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 shrink-0"
                >
                  Qo'shish
                </button>
              </div>

              {/* Image previews */}
              {imageList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Yuklangan rasmlar ({imageList.length} ta):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageList.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100"
                      >
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover"/>
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#e8175d] text-white text-[10px] font-bold shadow-xs">
                            Asosiy rasm
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => setAsMainImage(idx)}
                              className="px-2 py-1 rounded bg-white text-gray-800 text-[10px] font-bold hover:bg-gray-100"
                            >
                              Asosiy qilish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <button
              type="submit"
              disabled={create.isPending || isProcessingFiles}
              className="w-full py-4 rounded-xl bg-[#e8175d] text-white font-bold text-base hover:bg-[#c0124d] transition-all disabled:opacity-60 shadow-sm"
            >
              {create.isPending ? t.post_submitting : t.post_submit}
            </button>
          </form>

          {/* O'ng tomon: Jonli ko'rinish va mening uylarim */}
          <div className="space-y-6">
            {/* Jonli ko'rinish (Live preview) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
              <h3 className="font-display font-bold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
                <Eye size={15} className="text-[#e8175d]"/> E'lonning jonli ko'rinishi
              </h3>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-[#fbfaf9] space-y-3 pb-3">
                <div className="aspect-video relative bg-gray-200 overflow-hidden">
                  <img
                    src={imageList[0] || DEFAULT_STAY_IMAGE}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    {homeType}
                  </div>
                </div>
                <div className="px-3.5 space-y-1">
                  <p className="font-bold text-sm text-gray-900 line-clamp-1">
                    {title || "Sizning uyingiz nomi"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {city} · {address || "Manzil kiritilmagan"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#e8175d]">
                      {money(nightly)} so'm <span className="text-gray-400 font-normal">/ tun</span>
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {guests} mehmon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Narx xulosasi */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
              <h3 className="font-display font-bold text-sm text-gray-700 mb-3">{t.post_step_price}</h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">{t.price_week_label}</dt>
                  <dd className="font-bold text-gray-900">{money(weekly || 0)} so'm</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">{t.price_night_label}</dt>
                  <dd className="font-bold text-[#e8175d]">{money(nightly)} so'm</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <dt className="text-gray-500">Oylik taxminiy daromad</dt>
                  <dd className="font-bold text-green-700">{money((weekly || 0) * 4)} so'm</dd>
                </div>
              </dl>
            </div>

            {/* Mening e'lonlarim */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
              <h3 className="font-display font-bold text-sm text-gray-700 mb-3">{t.post_my_listings}</h3>
              {myListings.length === 0 ? (
                <p className="text-xs text-gray-400">{t.post_no_listings}</p>
              ) : (
                <div className="space-y-3">
                  {myListings.map((s) => (
                    <div key={s.id} className="flex gap-2.5 items-center">
                      <img
                        src={s.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-gray-900 line-clamp-1">{s.titleUz}</p>
                        <p className="text-[11px] text-gray-400">{s.city}</p>
                        <a
                          href={`/stay/${s.id}`}
                          className="text-[11px] font-semibold text-[#e8175d] hover:underline"
                        >
                          {t.post_view}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
