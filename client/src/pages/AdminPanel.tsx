import { useState } from "react";
import { ShieldCheck, Bell, Activity, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("Owner alert");
  const [content, setContent] = useState("A new booking request needs review.");

  const healthQuery = trpc.system.health.useQuery(
    { timestamp: Date.now() },
    { enabled: Boolean(user?.role === "admin") },
  );

  const notifyOwner = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      toast.success("Notification sent to the owner dashboard.");
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      toast.error(error.message || "Notification failed.");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-700">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          Loading admin panel…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <Lock className="mx-auto mb-3 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">Admin access required</h1>
          <p className="mt-2 text-slate-600">Please sign in with an administrator account to view this dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-3 text-red-600" />
          <h1 className="text-2xl font-bold text-slate-900">Forbidden</h1>
          <p className="mt-2 text-slate-600">This page is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Operations dashboard</h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <Activity className="h-4 w-4" />
              System online
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Session</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{user.email || "admin@uyjoy.uz"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{healthQuery.data?.ok ? "Healthy" : "Checking"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{user.role}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">Owner notification</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-slate-400"
                placeholder="Owner alert"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Destination</span>
              <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                Owner dashboard
              </div>
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm text-slate-700">
            <span>Message</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-slate-400"
              placeholder="A new booking request needs review."
            />
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => notifyOwner.mutate({ title: title.trim() || "Owner alert", content: content.trim() || "No content provided." })}
              disabled={notifyOwner.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send className="h-4 w-4" />
              {notifyOwner.isPending ? "Sending…" : "Send notification"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
