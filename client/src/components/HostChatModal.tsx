import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, User, Check, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

interface ChatProps {
  stayId: number;
  hostName: string;
  hostAvatar?: string;
  stayTitle: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "host";
  text: string;
  time: string;
}

export function HostChatModal({ stayId, hostName, hostAvatar, stayTitle }: ChatProps) {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `uyjoy_chat_${stayId}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "msg_welcome",
        sender: "host",
        text: `Assalomu alaykum! Men ${hostName}. "${stayTitle}" bo'yicha qanday savollaringiz bor? Yordam berishdan xursandman!`,
        time: "Hozirgina",
      },
    ];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {}
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, storageKey]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!input.trim()) return;

    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Realistic host auto-response after 1.5 seconds
    setTimeout(() => {
      const replies = [
        `Rahmat! Xabaringizni qabul qildim. Uyni xohlagan vaqtingizda ko'rishingiz mumkin yoki bemalol bron qilsangiz, kutib olamiz.`,
        `Assalomu alaykum! Ha, albatta. Uydagi barcha qulayliklar tayyor va toza. Qo'shimcha savolingiz bo'lsa bemalol yozing!`,
        `Katta rahmat! Telefon orqali ham bog'lanishingiz mumkin. Sizni mehmondorchilikda kutamiz!`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: "host_reply_" + Date.now(),
          sender: "host",
          text: randomReply,
          time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            startLogin();
            return;
          }
          setIsOpen(true);
        }}
        className="w-full mt-2.5 py-3 rounded-xl border-2 border-[#e8175d] text-[#e8175d] font-bold text-sm hover:bg-[#fdf0f4] transition-all flex items-center justify-center gap-2"
      >
        <MessageCircle size={17} /> Mezbon bilan yozishish (Jonli chat)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md h-[550px] max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-[#e8175d] text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={hostAvatar || "/listings/host-avatar.svg"}
                    alt={hostName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/50 bg-white"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#e8175d] rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{hostName}</h3>
                  <p className="text-white/80 text-[11px] flex items-center gap-1">
                    <Clock size={11} /> Odatda 5 daqiqada javob beradi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notice */}
            <div className="bg-[#faf8f6] px-4 py-2 border-b border-gray-100 text-[11px] text-gray-500 line-clamp-1">
              🏡 {stayTitle}
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfdfc]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-[#e8175d] text-white rounded-br-xs shadow-xs"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Xabaringizni yozing..."
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-[#fbfaf8] focus:bg-white text-sm outline-none focus:border-[#e8175d] transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-11 w-11 rounded-xl bg-[#e8175d] text-white flex items-center justify-center hover:bg-[#c0124d] disabled:opacity-50 transition-colors shadow-xs shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
