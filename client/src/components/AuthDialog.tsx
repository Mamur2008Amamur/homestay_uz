import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { AUTH_MODAL_EVENT } from "@/const";

type AuthMode = "login" | "register" | "forgot" | "verify";

type FormState = {
  name: string;
  email: string;
  password: string;
  code: string;
  avatar: string;
  phone: string;
  city: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  code: "",
  avatar: "",
  phone: "",
  city: "Toshkent",
};

export function AuthDialog() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: AuthMode }>).detail;
      setMode(detail?.mode ?? "login");
      setForm(EMPTY_FORM);
      setNotice("");
      setShowPassword(false);
      setOpen(true);
    };

    window.addEventListener(AUTH_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, onOpen);
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      try {
        if (data?.user?.name) {
          localStorage.setItem("uyjoy_user_name", data.user.name);
        }
      } catch {}
      await utils.auth.me.invalidate();
      setOpen(false);
      toast.success(t.auth_login + " muvaffaqiyatli!", {
        description: "Xush kelibsiz!",
      });
    },
    onError: (error) => {
      setNotice(error.message || t.auth_error_generic);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      try {
        if (form.avatar) localStorage.setItem("uyjoy_user_avatar", form.avatar);
        if (form.phone) localStorage.setItem("uyjoy_user_phone", form.phone.trim());
        if (form.city) localStorage.setItem("uyjoy_user_city", form.city.trim());
        localStorage.setItem("uyjoy_user_name", form.name.trim());
      } catch {}
      await utils.auth.me.invalidate();
      setOpen(false);
      toast.success("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!", {
        description: "Akkountingiz tayyor, tizimga kirdingiz.",
      });
    },
    onError: (error) => {
      setNotice(error.message || t.auth_error_generic);
    },
  });

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setOpen(false);
      toast.success("Email muvaffaqiyatli tasdiqlandi!");
    },
    onError: (error) => {
      setNotice(error.message || t.auth_error_generic);
    },
  });

  const requestVerificationMutation = trpc.auth.requestVerification.useMutation({
    onSuccess: () => setNotice(t.auth_check_email),
    onError: (error) => setNotice(error.message || t.auth_error_generic),
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setMode("verify");
      setNotice(t.auth_reset_sent);
      toast.info(t.auth_reset_sent);
    },
    onError: (error) => setNotice(error.message || t.auth_error_generic),
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setOpen(false);
      toast.success("Parol muvaffaqiyatli yangilandi!");
    },
    onError: (error) => setNotice(error.message || t.auth_error_generic),
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setForm((curr) => ({ ...curr, avatar: dataUrl }));
          try { localStorage.setItem("uyjoy_user_avatar", dataUrl); } catch {}
          toast.success("Suratingiz tanlandi!");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");

    if (mode === "login") {
      if (!form.email || !form.password) {
        setNotice(t.auth_missing_fields);
        return;
      }
      loginMutation.mutate({
        email: form.email,
        password: form.password,
      });
      return;
    }

    if (mode === "register") {
      if (!form.name.trim() || !form.email || !form.password) {
        setNotice(t.auth_missing_fields);
        return;
      }
      if (form.password.length < 8) {
        setNotice("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
        return;
      }
      registerMutation.mutate({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      return;
    }

    if (mode === "verify") {
      if (!form.email || !form.code) {
        setNotice(t.auth_missing_fields);
        return;
      }
      verifyMutation.mutate({
        email: form.email.trim(),
        code: form.code.trim(),
      });
      return;
    }

    if (mode === "forgot") {
      if (!form.email) {
        setNotice("Email manzilingizni kiriting.");
        return;
      }
      if (!form.code || !form.password) {
        forgotPasswordMutation.mutate({ email: form.email.trim() });
        return;
      }
      resetPasswordMutation.mutate({
        email: form.email.trim(),
        code: form.code.trim(),
        password: form.password,
      });
    }
  };

  const isBusy =
    loginMutation.isPending ||
    registerMutation.isPending ||
    verifyMutation.isPending ||
    requestVerificationMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(94vw,430px)] rounded-3xl border border-gray-100 bg-white p-0 shadow-[0_25px_70px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Top tabs for quick switching */}
        <div className="bg-[#faf8f6] p-4 border-b border-gray-100">
          <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-gray-200 shadow-xs mb-3">
            <button
              type="button"
              onClick={() => { setMode("login"); setNotice(""); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-[#e8175d] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.auth_login}
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setNotice(""); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === "register"
                  ? "bg-[#e8175d] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.auth_register}
            </button>
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-left text-xl font-bold tracking-tight text-gray-900">
              {mode === "login" && t.auth_title_login}
              {mode === "register" && t.auth_title_register}
              {mode === "verify" && t.auth_title_verify}
              {mode === "forgot" && t.auth_title_forgot}
            </DialogTitle>
            <DialogDescription className="text-left text-xs text-gray-500">
              {mode === "login" && t.auth_subtitle_login}
              {mode === "register" && t.auth_subtitle_register}
              {mode === "verify" && t.auth_subtitle_verify}
              {mode === "forgot" && t.auth_subtitle_forgot}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          {mode === "register" && (
            <>
              {/* Profile Photo Upload - Prominent & Essential */}
              <div className="p-3.5 rounded-2xl bg-[#faf8f6] border-2 border-dashed border-[#e8175d]/30 hover:border-[#e8175d] transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={form.avatar || "/listings/host-avatar.svg"}
                      alt="Profil rasmi"
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-white"
                    />
                    <label className="absolute -bottom-1 -right-1 bg-[#e8175d] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#c0124d] transition-colors shadow">
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        Shaxsiy suratingiz <span className="text-[#e8175d]">*</span>
                      </p>
                      {form.avatar && (
                        <button
                          type="button"
                          onClick={() => setForm((c) => ({ ...c, avatar: "" }))}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          O'chirish
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Saytda va uylaringizda begona odamlar rasmi emas, aynan sizning haqiqiy suratingiz chiqadi
                    </p>
                    <label className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-[#e8175d] cursor-pointer hover:bg-gray-50 shadow-xs">
                      <Camera size={12}/> Rasmni tanlash
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Ism va Familiya */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <User size={13} className="text-[#e8175d]"/> Ism va Familiyangiz <span className="text-[#e8175d]">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                  placeholder="Masalan: Dilshod Rahimov"
                  required
                  className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] focus:bg-white text-sm"
                />
              </div>

              {/* Telefon raqam & Shahar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Telefon raqamingiz</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((curr) => ({ ...curr, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] focus:bg-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Yashash shahringiz</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm((curr) => ({ ...curr, city: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#fbfaf8] focus:bg-white px-3 text-sm text-gray-800"
                  >
                    <option value="Toshkent">Toshkent</option>
                    <option value="Samarqand">Samarqand</option>
                    <option value="Buxoro">Buxoro</option>
                    <option value="Xiva">Xiva</option>
                    <option value="Farg'ona">Farg'ona</option>
                    <option value="Nukus">Nukus</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Mail size={13} className="text-[#e8175d]"/> {t.auth_email}
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((curr) => ({ ...curr, email: e.target.value }))}
              placeholder={t.auth_email_placeholder}
              required
              className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] focus:bg-white text-sm"
            />
          </div>

          {(mode === "login" || mode === "register") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-[#e8175d]"/> {t.auth_password}
                </span>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-[#e8175d] hover:underline"
                    onClick={() => { setMode("forgot"); setNotice(""); }}
                  >
                    {t.auth_forgot}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((curr) => ({ ...curr, password: e.target.value }))}
                  placeholder={mode === "register" ? "Masalan: Uyjoy2026!" : t.auth_password_placeholder}
                  required
                  className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] focus:bg-white pr-10 text-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              {mode === "register" && (
                <div className="bg-[#f9f7f5] rounded-xl p-2.5 text-[11px] text-gray-500 space-y-1">
                  <p className="flex items-center gap-1">
                    <span className={form.password.length >= 6 ? "text-green-600 font-bold" : "text-gray-400"}>✓</span> Kamida 6 ta belgi (harflar yoki raqamlar)
                  </p>
                </div>
              )}
            </div>
          )}

          {(mode === "verify" || mode === "forgot") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">{t.auth_code}</label>
              <Input
                value={form.code}
                inputMode="numeric"
                maxLength={6}
                onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder={t.auth_code_placeholder}
                className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] text-sm tracking-widest font-mono text-center text-lg"
              />
            </div>
          )}

          {mode === "forgot" && form.code && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">{t.auth_new_password}</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((curr) => ({ ...curr, password: e.target.value }))}
                placeholder={t.auth_new_password_placeholder}
                className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] text-sm"
              />
            </div>
          )}

          {notice && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600"/>
              <span>{notice}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={isBusy}
              className="h-12 w-full rounded-xl bg-[#e8175d] text-sm font-bold text-white hover:bg-[#c0124d] disabled:opacity-60 transition-all shadow-sm"
            >
              {isBusy ? (
                t.auth_loading
              ) : mode === "login" ? (
                t.auth_login
              ) : mode === "register" ? (
                t.auth_register
              ) : mode === "verify" ? (
                t.auth_verify
              ) : form.code ? (
                t.auth_reset
              ) : (
                "Kodni yuborish"
              )}
            </Button>

            {mode === "verify" && (
              <Button
                type="button"
                variant="outline"
                disabled={requestVerificationMutation.isPending}
                onClick={() => requestVerificationMutation.mutate({ email: form.email })}
                className="h-10 w-full rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {requestVerificationMutation.isPending ? t.auth_loading : t.auth_send_new_code}
              </Button>
            )}

            {mode !== "login" && mode !== "register" && (
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-[#e8175d] hover:underline"
                onClick={() => { setMode("login"); setNotice(""); }}
              >
                {t.auth_back_to_login}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
