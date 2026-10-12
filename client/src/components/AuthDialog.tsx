import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { AUTH_MODAL_EVENT, startManusLogin } from "@/const";

type AuthMode = "login" | "register" | "forgot" | "verify";

type FormState = {
  name: string;
  email: string;
  password: string;
  code: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  code: "",
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
    onSuccess: async () => {
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <User size={13} className="text-[#e8175d]"/> {t.auth_name}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                placeholder={t.auth_name_placeholder}
                required
                className="h-11 rounded-xl border-gray-200 bg-[#fbfaf8] focus:bg-white text-sm"
              />
            </div>
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
                  <p className="font-semibold text-gray-700">Parol talablari:</p>
                  <p className="flex items-center gap-1">
                    <span className={form.password.length >= 8 ? "text-green-600 font-bold" : "text-gray-400"}>✓</span> Kamida 8 ta belgi
                  </p>
                  <p className="flex items-center gap-1">
                    <span className={/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? "text-green-600 font-bold" : "text-gray-400"}>✓</span> Katta va kichik harf
                  </p>
                  <p className="flex items-center gap-1">
                    <span className={/\d/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? "text-green-600 font-bold" : "text-gray-400"}>✓</span> Raqam va maxsus belgi (namuna: <strong className="text-gray-700">Uyjoy2026!</strong>)
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

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div>
              <div className="relative flex justify-center text-[11px]"><span className="bg-white px-2 text-gray-400">yoki</span></div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={startManusLogin}
              className="h-10 w-full rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t.auth_continue_manus}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
