// Telegram notification service for UyJoy
// Uses Telegram Bot API to notify hosts and admin on bookings, new listings, and messages

export interface TelegramBookingPayload {
  bookingId: number | string;
  stayTitle: string;
  city: string;
  guestName: string;
  guestPhone?: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmountUzs: number;
  hostTelegram?: string;
}

export async function sendTelegramNotification(text: string, customChatId?: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const defaultChatId = process.env.TELEGRAM_CHAT_ID;
  const chatId = customChatId || defaultChatId;

  if (!botToken || !chatId) {
    console.log("[Telegram Notification (simulation)]", text);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.warn("[Telegram Notification error]", err);
    return false;
  }
}

export async function notifyNewBookingTelegram(payload: TelegramBookingPayload): Promise<boolean> {
  const money = (val: number) => new Intl.NumberFormat("uz-UZ").format(val) + " so'm";

  const message = `
🏠 <b>YANGI UY BRON QILINDI! #B${payload.bookingId}</b>
━━━━━━━━━━━━━━━━━━
🏡 <b>Uy:</b> ${payload.stayTitle} (${payload.city})
👤 <b>Mehmon:</b> ${payload.guestName}
📞 <b>Telefon:</b> ${payload.guestPhone || "Kiritilmagan"}
✉️ <b>Email:</b> ${payload.guestEmail}

📅 <b>Kelish:</b> ${payload.checkIn}
📅 <b>Ketish:</b> ${payload.checkOut}
🌙 <b>Muddati:</b> ${payload.nights} kecha
👥 <b>Mehmonlar:</b> ${payload.guests} kishi

💰 <b>Jami summa:</b> <b>${money(payload.totalAmountUzs)}</b>
━━━━━━━━━━━━━━━━━━
⚡️ <i>UyJoy.uz orqali qabul qilindi</i>
`.trim();

  return sendTelegramNotification(message);
}

export async function notifyNewListingTelegram(listing: {
  title: string;
  city: string;
  pricePerNight: number;
  hostName: string;
  phone?: string;
}): Promise<boolean> {
  const money = (val: number) => new Intl.NumberFormat("uz-UZ").format(val) + " so'm";
  const message = `
✨ <b>YANGI UY JOYLANDI!</b>
━━━━━━━━━━━━━━━━━━
🏡 <b>Nomi:</b> ${listing.title}
📍 <b>Shahar:</b> ${listing.city}
💵 <b>Narxi:</b> ${money(listing.pricePerNight)} / kecha
👤 <b>Mezbon:</b> ${listing.hostName}
📞 <b>Telefon:</b> ${listing.phone || "Kiritilmagan"}
━━━━━━━━━━━━━━━━━━
🌐 <i>UyJoy.uz boshqaruv paneli</i>
`.trim();

  return sendTelegramNotification(message);
}
