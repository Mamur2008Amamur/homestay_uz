import { useLocation } from "wouter";
import { ArrowLeft, Home as HomeIcon, ChevronRight, ShieldCheck, Users, Star, HelpCircle, Mail, Heart, Globe, Award } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type PageType = "about" | "hosting" | "inspire" | "reviews" | "help";

const localizedPageContent: Record<string, Record<PageType, {
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  items: { icon: any; title: string; desc: string }[];
}>> = {
  uz: {
    about: {
      eyebrow: "UYJOY HAQIDA",
      title: "O'zbekistonda uydek sayohat",
      intro: "UyJoy mahalliy mezbonlar va haqiqiy sayohatni izlayotgan mehmonlarni bog'laydi. Biz oddiy ijaradan ko'ra ko'proq narsani taklif etamiz — bu haqiqiy madaniyat va insonlar bilan uchrashuv.",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "Haqiqiy uylar", desc: "Mahalliy mezbonlar bilan haqiqiy xonalar va samimiy suhbatlar." },
        { icon: Globe, title: "Barqaror sayohat", desc: "Sayohat xarajatlari mahalliy oilalar va jamoalarga qaytadi." },
        { icon: ShieldCheck, title: "Xavfsiz platforma", desc: "Har bir bron UyJoy kafolati bilan himoyalangan." },
      ],
    },
    hosting: {
      eyebrow: "MEZBON BO'LISH",
      title: "Uyingizdagi iliqlikni baham ko'ring",
      intro: "Ortiqcha xonangizni mahalliy sayohatchilar va talabalar uchun qulay uyga aylantiring. UyJoy jamoasi har bir qadamda yordam beradi.",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "Siz boshqarasiz", desc: "Narx va uy qoidalarini o'zingiz belgilang." },
        { icon: ShieldCheck, title: "Xavfsiz mehmonlar", desc: "Ishonchli mehmonlar va UyJoy kafolati." },
        { icon: Award, title: "Eng yaxshi mezbonlar", desc: "SuperMezbon nishoni bilan ko'proq mehmon jalb qiling." },
      ],
    },
    inspire: {
      eyebrow: "ILHOM BER",
      title: "Keyingi safaringizni toping",
      intro: "O'zbekistonning tarixiy shaharlari, togʻlari va mahalliy uylaridan ilhom oling. Har bir burchakda yangi hikoya sizni kutmoqda.",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Samarqand", desc: "Registon maydoni va ko'k gumbazlar shahri." },
        { icon: Heart, title: "Buxoro", desc: "Minoralar va karavonsaroylar shahri." },
        { icon: Globe, title: "Chimgan", desc: "Toshkent yaqinidagi togʻ va qor dunyosi." },
      ],
    },
    reviews: {
      eyebrow: "MEHMONLAR FIKRI",
      title: "Haqiqiy mehmonlar, haqiqiy hikoyalar",
      intro: "UyJoy'da qolgan mehmonlarning samimiy fikrlari. Ular oddiy turistlar emas — ular o'z hikoyalarini yaratgan sayohatchilar.",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, Fransiya", desc: "\"Mezbonlar juda samimiy va e'tiborli bo'lishdi. Uy toza, qulay va markazga yaqin edi.\"" },
        { icon: Star, title: "Toshie, Yaponiya", desc: "\"Samarqandni mahalliy odamlar bilan kashf etdim. Hayotimning eng yaxshi sayohati!\"" },
        { icon: Star, title: "Slavica, Serbiya", desc: "\"Toshkentdagi uy juda qulay, mezbon har kuni non pishirib berdi. Unutilmas!\"" },
      ],
    },
    help: {
      eyebrow: "YORDAM MARKAZI",
      title: "Sizga qanday yordam beramiz?",
      intro: "Uy topish, bron qilish yoki mezbon bo'lish bo'yicha tez-tez so'raladigan savollar va qo'llanmalar.",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "Uy qidirish", desc: "Shaharni tanlang va kerakli sanalarni kiriting, keyin qidiring." },
        { icon: ShieldCheck, title: "Bron qilish", desc: "Emailingizni tasdiqlang va bron so'rovini yuboring." },
        { icon: Users, title: "Mezbon bilan bog'lanish", desc: "Bron tasdiqlanganidan so'ng mezbon ma'lumotlari sizga yuboriladi." },
      ],
    },
  },
  ru: {
    about: {
      eyebrow: "О UYJOY",
      title: "Путешествие как дома в Узбекистане",
      intro: "UyJoy соединяет местных хозяев с гостями, которые хотят настоящего опыта, а не просто аренды. Мы предлагаем больше, чем просто проживание — это встреча с культурой и людьми.",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "Настоящие дома", desc: "Уютные комнаты и искренние разговоры с местными хозяевами." },
        { icon: Globe, title: "Устойчивый туризм", desc: "Туристические расходы возвращаются местным семьям и сообществам." },
        { icon: ShieldCheck, title: "Безопасная платформа", desc: "Каждая бронь защищена гарантией UyJoy." },
      ],
    },
    hosting: {
      eyebrow: "СТАТЬ ХОЗЯИНОМ",
      title: "Делитесь теплом своего дома",
      intro: "Преобразуйте свободную комнату в удобное место для местных путешественников и студентов. Команда UyJoy поможет на каждом этапе.",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "Вы управляете", desc: "Устанавливайте цены и правила жилья сами." },
        { icon: ShieldCheck, title: "Надёжные гости", desc: "Проверенные гости и гарантия UyJoy." },
        { icon: Award, title: "Лучшие хозяева", desc: "Используйте значок Superhost, чтобы привлекать больше гостей." },
      ],
    },
    inspire: {
      eyebrow: "ВОЗДЕЙСТВИЕ",
      title: "Откройте следующее путешествие",
      intro: "Найдите вдохновение в исторических городах, горах и домах Узбекистана. В каждом уголке ждёт своя история.",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Самарканд", desc: "Город голубых куполов и площади Регистан." },
        { icon: Heart, title: "Бухара", desc: "Город минаретов и караван-сараев." },
        { icon: Globe, title: "Чимган", desc: "Горы и снег рядом с Ташкентом." },
      ],
    },
    reviews: {
      eyebrow: "ОТЗЫВЫ ГОСТЕЙ",
      title: "Истории реальных людей",
      intro: "Подлинные отзывы гостей, которые остановились в UyJoy. Это не просто туристы — это люди, создающие свои истории.",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, Франция", desc: "\"Хозяева были очень добры и гостеприимны. Дом был чистым, удобным и рядом с центром.\"" },
        { icon: Star, title: "Toshie, Япония", desc: "\"Я открывал Самарканд вместе с местными жителями. Лучшее путешествие в моей жизни!\"" },
        { icon: Star, title: "Slavica, Сербия", desc: "\"Дом в Ташкенте был очень удобным, хозяин ежедневно готовил завтрак. Невозможно забыть!\"" },
      ],
    },
    help: {
      eyebrow: "ЦЕНТР ПОМОЩИ",
      title: "Как мы можем помочь?",
      intro: "Часто задаваемые вопросы и инструкции по поиску жилья, бронированию и приёму гостей.",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "Поиск жилья", desc: "Выберите город и даты, затем начните поиск." },
        { icon: ShieldCheck, title: "Бронирование", desc: "Подтвердите email и отправьте запрос на бронь." },
        { icon: Users, title: "Связь с хозяином", desc: "После подтверждения вы получите контакты хозяина." },
      ],
    },
  },
  en: {
    about: {
      eyebrow: "ABOUT UYJOY",
      title: "A home-like stay in Uzbekistan",
      intro: "UyJoy connects local hosts with guests seeking authentic experiences instead of a generic rental. We offer more than a place to sleep — a real cultural connection.",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "Real homes", desc: "Warm rooms and honest conversations with local hosts." },
        { icon: Globe, title: "Responsible travel", desc: "Travel spending goes back to local families and communities." },
        { icon: ShieldCheck, title: "Safe platform", desc: "Every booking is protected by the UyJoy guarantee." },
      ],
    },
    hosting: {
      eyebrow: "HOSTING",
      title: "Share the warmth of your home",
      intro: "Turn extra space into a comfortable stay for travellers and students. The UyJoy team supports you at every step.",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "You are in control", desc: "Set your own prices and house rules." },
        { icon: ShieldCheck, title: "Trusted guests", desc: "Reliable guests and the UyJoy guarantee." },
        { icon: Award, title: "Top hosts", desc: "Earn more bookings with the Superhost badge." },
      ],
    },
    inspire: {
      eyebrow: "INSPIRATION",
      title: "Find your next journey",
      intro: "Get inspired by Uzbekistan's historic cities, mountains and local homes. Every corner holds a new story.",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Samarkand", desc: "The city of blue domes and Registan Square." },
        { icon: Heart, title: "Bukhara", desc: "The city of minarets and caravanserais." },
        { icon: Globe, title: "Chimgan", desc: "Mountain escapes close to Tashkent." },
      ],
    },
    reviews: {
      eyebrow: "GUEST REVIEWS",
      title: "Real guests, real stories",
      intro: "Authentic feedback from guests who stayed with UyJoy. They are not just tourists — they create memorable travel stories.",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, France", desc: "\"The hosts were warm and attentive. The home was clean, comfortable and close to the center.\"" },
        { icon: Star, title: "Toshie, Japan", desc: "\"I explored Samarkand with locals. The best trip of my life!\"" },
        { icon: Star, title: "Slavica, Serbia", desc: "\"The flat in Tashkent was very comfortable, and the host prepared breakfast daily. Unforgettable!\"" },
      ],
    },
    help: {
      eyebrow: "HELP CENTER",
      title: "How can we help?",
      intro: "Frequently asked questions and guides for booking, finding a stay, and hosting.",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "Find a stay", desc: "Choose a city and dates, then search." },
        { icon: ShieldCheck, title: "Booking", desc: "Confirm your email and submit a reservation request." },
        { icon: Users, title: "Contact host", desc: "After confirmation, the host details are sent to you." },
      ],
    },
  },
  ar: {
    about: {
      eyebrow: "حول UYJOY",
      title: "إقامة منزلية في أوزبكستان",
      intro: "يربط UyJoy بين المضيفين المحليين والضيوف الباحثين عن تجارب أصيلة بدل الإيجار المعتاد. نحن نقدم أكثر من مجرد مكان للنوم — اتصال ثقافي حقيقي.",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "منازل حقيقية", desc: "غرف دافئة ومحادثات صادقة مع المضيفين المحليين." },
        { icon: Globe, title: "سفر مسؤول", desc: "تعود نفقات السفر إلى العائلات والمجتمعات المحلية." },
        { icon: ShieldCheck, title: "منصة آمنة", desc: "كل حجز محمي بضمان UyJoy." },
      ],
    },
    hosting: {
      eyebrow: "الاستضافة",
      title: "شارك دفء منزلك",
      intro: "حول المساحة الإضافية إلى إقامة مريحة للسياح والطلاب. يدعمك فريق UyJoy في كل خطوة.",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "أنت المتحكم", desc: "حدد أسعارك وقواعد منزلك بنفسك." },
        { icon: ShieldCheck, title: "ضيوف موثوقون", desc: "ضيوف موثوقون وضمان UyJoy." },
        { icon: Award, title: "مضيفون مميزون", desc: "احصل على المزيد من الحجوزات بشارة Superhost." },
      ],
    },
    inspire: {
      eyebrow: "إلهام",
      title: "ابحث عن رحلتك التالية",
      intro: "احصل على إلهام من مدن أوزبكستان التاريخية وجبالها ومنازلها المحلية. كل زاوية تحمل قصة جديدة.",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "سمرقند", desc: "مدينة القباب الزرقاء وساحة الريجستان." },
        { icon: Heart, title: "بخارى", desc: "مدينة المآذن والقلاع." },
        { icon: Globe, title: "تشيمغان", desc: "مناظر جبلية قريبة من طشقند." },
      ],
    },
    reviews: {
      eyebrow: "آراء الضيوف",
      title: "ضيوف حقيقيون، قصص حقيقية",
      intro: "ملاحظات أصلية من الضيوف الذين أقاموا في UyJoy. إنهم ليسوا مجرد سياح — بل يخلقون قصص سفر لا تُنسى.",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, France", desc: "\"كانت المضيفة دافئة ومت attentive. كان المنزل نظيفًا مريحًا وقريبًا من المركز.\"" },
        { icon: Star, title: "Toshie, Japan", desc: "\"استكشفت سمرقند مع السكان المحليين. أفضل رحلة في حياتي!\"" },
        { icon: Star, title: "Slavica, Serbia", desc: "\"كانت الشقة في طشقند مريحة جدًا، وكانت المضيفة تعد الإفطار يوميًا. لا تُنسى!\"" },
      ],
    },
    help: {
      eyebrow: "مركز المساعدة",
      title: "كيف يمكننا مساعدتك؟",
      intro: "أسئلة شائعة وأدلة عن الحجز والعثور على الإقامة والاستضافة.",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "ابحث عن إقامة", desc: "اختر المدينة والتواريخ ثم ابحث." },
        { icon: ShieldCheck, title: "الحجز", desc: "أكد بريدك الإلكتروني وأرسل طلب الحجز." },
        { icon: Users, title: "تواصل مع المضيف", desc: "بعد التأكيد، سيُرسل لك تفاصيل المضيف." },
      ],
    },
  },
  tr: {
    about: {
      eyebrow: "UYJOY HAKKINDA",
      title: "Özbekistan'da ev tipi konaklama",
      intro: "UyJoy, yerel ev sahiplerini gerçek deneyim arayan misafirlerle birleştirir. Sadece konaklama değil, gerçek kültürel bağ sunarız.",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "Gerçek evler", desc: "Yerel ev sahipleriyle sıcak odalar ve samimi sohbetler." },
        { icon: Globe, title: "Sorumlu seyahat", desc: "Seyahat harcamaları yerel ailelere ve topluluklara geri döner." },
        { icon: ShieldCheck, title: "Güvenli platform", desc: "Her rezervasyon UyJoy garantisiyle korunur." },
      ],
    },
    hosting: {
      eyebrow: "EV SAHİPLİĞİ",
      title: "Evinizin sıcaklığını paylaşın",
      intro: "Ekstra alanınızı gezginler ve öğrenciler için konforlu bir konaklama alanına dönüştürün. UyJoy ekibi her adımda yanınızda olur.",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "Kontrol sizde", desc: "Kendi fiyatlarınızı ve ev kurallarınızı belirleyin." },
        { icon: ShieldCheck, title: "Güvenilir misafirler", desc: "Güvenilir misafirler ve UyJoy garantisi." },
        { icon: Award, title: "Üst ev sahipleri", desc: "Superhost rozetiyle daha fazla rezervasyon alın." },
      ],
    },
    inspire: {
      eyebrow: "İLHAM",
      title: "Sonraki seyahatinizi bulun",
      intro: "Özbekistan'ın tarihi şehirlerinden, dağlarından ve yerel evlerinden ilham alın. Her köşe yeni bir hikâye saklar.",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Semerkand", desc: "Mavi kubbeler ve Registan Meydanı şehri." },
        { icon: Heart, title: "Buhara", desc: "Minareler ve kervansaraylar şehri." },
        { icon: Globe, title: "Çimgan", desc: "Taşkent'e yakın dağ kaçışları." },
      ],
    },
    reviews: {
      eyebrow: "MISAFIR YORUMLARI",
      title: "Gerçek misafirler, gerçek hikâyeler",
      intro: "UyJoy'da kalan misafirlerden gelen özgün geri bildirimler. Onlar sadece turist değil, anı biriktiren gezginler.",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, Fransa", desc: "\"Ev sahipleri çok sıcak ve düşünceliydi. Ev temiz, konforlu ve merkeze yakındı.\"" },
        { icon: Star, title: "Toshie, Japonya", desc: "\"Semerkand'ı yerellerle keşfettim. Hayatımın en iyi gezisi!\"" },
        { icon: Star, title: "Slavica, Sırbistan", desc: "\"Taşkent'teki daire çok konforluydu, ev sahibi her gün kahvaltı hazırladı. Unutulmaz!\"" },
      ],
    },
    help: {
      eyebrow: "YARDIM MERKEZİ",
      title: "Nasıl yardımcı olabiliriz?",
      intro: "Konaklama bulma, rezervasyon ve ev sahipliği için sık sorulan sorular ve rehberler.",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "Konaklama bul", desc: "Şehir ve tarihleri seç, ardından ara." },
        { icon: ShieldCheck, title: "Rezervasyon", desc: "E-postanı onayla ve rezervasyon isteği gönder." },
        { icon: Users, title: "Ev sahibine ulaş", desc: "Onaylandıktan sonra ev sahibi bilgileri gönderilir." },
      ],
    },
  },
  zh: {
    about: {
      eyebrow: "关于 UYJOY",
      title: "乌兹别克斯坦的家庭式住宿",
      intro: "UyJoy 将当地房东与寻求真实体验的游客连接起来，而不是普通租房。我们提供的不只是睡觉的地方——而是真实的文化连接。",
      heroImage: "https://images.unsplash.com/photo-1612785660226-e19c5cc9ee16?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Heart, title: "真实住所", desc: "与当地房东的温暖房间和真诚交流。" },
        { icon: Globe, title: "负责任旅行", desc: "旅行支出回流到当地家庭和社区。" },
        { icon: ShieldCheck, title: "安全平台", desc: "每笔预订都由 UyJoy 保障。" },
      ],
    },
    hosting: {
      eyebrow: "房东服务",
      title: "分享你家的温暖",
      intro: "将空余空间转变为适合游客和学生的舒适住宿。UyJoy 团队会在每一步帮助你。",
      heroImage: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Users, title: "由你掌控", desc: "自行设定价格和房屋规则。" },
        { icon: ShieldCheck, title: "值得信赖的客人", desc: "可靠客人和 UyJoy 保证。" },
        { icon: Award, title: "顶级房东", desc: "用 Superhost 徽章吸引更多预订。" },
      ],
    },
    inspire: {
      eyebrow: "灵感",
      title: "找到下一段旅程",
      intro: "从乌兹别克斯坦的历史城市、山脉和本地民居中获得灵感。每个角落都藏着新故事。",
      heroImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "撒马尔罕", desc: "蓝顶与雷吉斯坦广场之城。" },
        { icon: Heart, title: "布哈拉", desc: "塔楼与驿站之城。" },
        { icon: Globe, title: "奇姆干", desc: "靠近塔什干的山地度假地。" },
      ],
    },
    reviews: {
      eyebrow: "旅客评价",
      title: "真实旅客，真实故事",
      intro: "来自住过 UyJoy 的真实旅客反馈。他们不只是游客，而是创造旅行故事的人。",
      heroImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: Star, title: "Émilie, France", desc: "\"房东非常热情亲切，房子干净舒适，且靠近市中心。\"" },
        { icon: Star, title: "Toshie, Japan", desc: "\"我和当地人一起探索了撒马尔罕，这是我一生中最好的旅行！\"" },
        { icon: Star, title: "Slavica, Serbia", desc: "\"塔什干的公寓很舒适，房东每天都会准备早餐。难忘！\"" },
      ],
    },
    help: {
      eyebrow: "帮助中心",
      title: "我们如何帮助您？",
      intro: "关于查找住宿、预订和房东服务的常见问题与指南。",
      heroImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
      items: [
        { icon: HelpCircle, title: "查找住宿", desc: "选择城市和日期，然后搜索。" },
        { icon: ShieldCheck, title: "预订", desc: "确认邮箱并提交预订申请。" },
        { icon: Users, title: "联系房东", desc: "确认后，房东信息会发送给您。" },
      ],
    },
  },
};

export default function InfoPage({ type }: { type: PageType }) {
  const { t, lang } = useLanguage();
  const [, navigate] = useLocation();
  const page = localizedPageContent[lang]?.[type] ?? localizedPageContent.uz[type];

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 h-[70px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#FF385C] flex items-center justify-center">
              <HomeIcon size={15} className="text-white" />
            </div>
            <span className="font-display font-bold text-[20px] text-[#FF385C] hidden sm:block">uyjoy</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/search" className="text-sm font-semibold hover:bg-gray-100 px-4 py-2.5 rounded-full transition-colors">{t.info_find}</a>
            <a href="/hosting" className="text-sm font-semibold bg-[#FF385C] text-white px-4 py-2.5 rounded-full hover:bg-[#D50027] transition-colors">{t.nav_hosting}</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[320px] sm:h-[420px] overflow-hidden">
        <img src={page.heroImage} alt={page.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 sm:px-12 pb-10">
          <div className="max-w-[720px] animate-rise">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#FF385C] mb-2">{page.eyebrow}</p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-white leading-tight">{page.title}</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1120px] px-5 sm:px-8 py-12">

        {/* Back */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> {t.info_back}
        </button>

        {/* Intro */}
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-12 animate-rise-delay">{page.intro}</p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14 animate-rise-delay2">
          {page.items.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-300 bg-white">
              <div className="w-11 h-11 rounded-2xl bg-[#fff0f0] flex items-center justify-center mb-5 group-hover:bg-[#FF385C] transition-colors duration-300">
                <Icon size={20} className="text-[#FF385C] group-hover:text-white transition-colors duration-300" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">0{i + 1}</span>
              <h3 className="font-display font-semibold text-[17px] text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA section */}
        {type === "hosting" && (
          <div className="bg-[#f7f7f7] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-display font-semibold text-2xl text-gray-900 mb-2">Bugun boshlang</h2>
              <p className="text-gray-500 text-sm max-w-md">Xonangizni joylang va birinchi mehmoningizni kutib oling. Jarayon 5 daqiqa oladi.</p>
            </div>
            <button
              onClick={() => navigate("/post")}
              className="flex items-center gap-2 bg-[#FF385C] text-white px-8 py-4 rounded-2xl font-semibold text-sm hover:bg-[#D50027] transition-colors shrink-0"
            >
              {t.info_start_hosting} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {type === "help" && (
          <div className="bg-[#f7f7f7] rounded-3xl p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Mail size={20} className="text-[#FF385C]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{t.info_no_answer}</h3>
              <p className="text-sm text-gray-500 mb-4">Bizning jamoamiz 24 soat ichida javob beradi.</p>
              <button
                onClick={() => toast(t.info_help_sent)}
                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                {t.info_contact_us} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {type === "inspire" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { city: "Samarqand", img: "/manus-storage/samarkand-traditional-house_85ca6880.jpeg", price: "420 000" },
              { city: "Buxoro", img: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80", price: "350 000" },
              { city: "Chimgan", img: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80", price: "680 000" },
            ].map(d => (
              <a key={d.city} href={`/search?query=${d.city}`} className="group relative rounded-2xl overflow-hidden aspect-[4/3] block">
                <img src={d.img} alt={d.city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-display font-semibold text-lg">{d.city}</p>
                  <p className="text-sm opacity-80">Tuniga {d.price} so'mdan</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {type === "reviews" && (
          <div className="flex items-center gap-4 bg-[#f7f7f7] rounded-2xl p-6">
            <div className="text-center">
              <p className="font-display text-5xl font-bold text-gray-900">4.9</p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1,2,3,4,5].map(s => <Star key={s} size={14} className="fill-[#FF385C] text-[#FF385C]" />)}
              </div>
              <p className="text-xs text-gray-500 mt-1">O'rtacha baho</p>
            </div>
            <div className="w-px h-16 bg-gray-200 mx-2" />
            <div>
              <p className="font-semibold text-gray-900 text-lg">200+ sharh</p>
              <p className="text-sm text-gray-500">Haqiqiy mehmonlardan</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer strip */}
      <footer className="border-t border-gray-200 bg-[#f7f7f7] mt-12">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>{t.footer_copy}</p>
          <div className="flex gap-4">
            <a href="/help" className="hover:text-gray-900 transition-colors">{t.footer_privacy}</a>
            <span>·</span>
            <a href="/help" className="hover:text-gray-900 transition-colors">{t.footer_terms}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
