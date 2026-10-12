import { useMemo } from "react";
import { useRoute } from "wouter";
import { ChevronLeft, Home as HomeIcon, Star, Shield, Award, MessageCircle, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { money } from "@/lib/money";
import { stayTitle, stayWeekPrice } from "@/data/stays";
import { useStays } from "@/data/useStays";
import NotFound from "./NotFound";

const HOST_META: Record<string, { joined: string; responseRate: number; responseTime: string; about: string; languages: string[] }> = {
  "1": { joined:"2022", responseRate:100, responseTime:"1 soat", about:"Men Samarqandda tug'ilib o'sdim. Uyimizda mehmonlarga yuqori sifatli xizmat ko'rsatish mening sevimli ishim. Sizni iliq kutib olishga tayyorman!", languages:["O'zbek","Rus","Ingliz"] },
  "2": { joined:"2021", responseRate:98,  responseTime:"2 soat", about:"Chimgan tog'larida uyimiz bor. Tabiat yaqinida dam olishni yaxshi ko'rasizmi? Bizga keling!", languages:["O'zbek","Rus"] },
  "3": { joined:"2020", responseRate:95,  responseTime:"3 soat", about:"Buxorodagi tarixiy mehmon uyimizda 100 yillik an'analar saqlanib kelmoqda. Shahar tarixi va madaniyati bilan tanishtirishga doim tayyorman.", languages:["O'zbek","Rus","Arab"] },
  "4": { joined:"2023", responseRate:100, responseTime:"30 daqiqa", about:"Xivaning ko'hna shahrida joylashgan xonamdagi mehmonlarga tarixiy shaharni ko'rsatishdan xursandman.", languages:["O'zbek","Rus"] },
  "5": { joined:"2021", responseRate:97,  responseTime:"1 soat", about:"Toshkent markazida zamonaviy kvartiram bor. Biznes safari yoki sayohat uchun ideal joy.", languages:["O'zbek","Rus","Ingliz"] },
  "6": { joined:"2022", responseRate:96,  responseTime:"2 soat", about:"Farg'ona vodiysidagi hovlimizda mehmonlarni bog' va milliy taomlar bilan kutib olamiz.", languages:["O'zbek","Rus"] },
  "7": { joined:"2020", responseRate:94,  responseTime:"3 soat", about:"Shahrisabz — Amir Temur vatanida mehmon uyimiz. Shahar tarixini birga kashf etamiz.", languages:["O'zbek","Rus"] },
  "8": { joined:"2023", responseRate:99,  responseTime:"1 soat", about:"Nukusda Savitskiy muzeyi yaqinida qulay kvartira. Qoraqalpog'istonni ko'rsatishdan xursandman.", languages:["O'zbek","Qoraqalpoq","Rus"] },
  "9": { joined:"2026", responseRate:100, responseTime:"30 daqiqa", about:"Mirzo Ulug'bek ko'chasidagi kvartiramni sayohatchilarga taklif qilaman. Markazga yaqin, toza va shinam uy.", languages:["O'zbek","Rus"] },
};

const HOST_META_TEXT: Record<string, Record<string, { about: string; responseTime: string; languages: string[] }>> = {
  uz: {
    "1": { about:"Men Samarqandda tug'ilib o'sdim. Uyimizda mehmonlarga yuqori sifatli xizmat ko'rsatish mening sevimli ishim. Sizni iliq kutib olishga tayyorman!", responseTime:"1 soat", languages:["O'zbek","Rus","Ingliz"] },
    "2": { about:"Chimgan tog'larida uyimiz bor. Tabiat yaqinida dam olishni yaxshi ko'rasizmi? Bizga keling!", responseTime:"2 soat", languages:["O'zbek","Rus"] },
    "3": { about:"Buxorodagi tarixiy mehmon uyimizda 100 yillik an'analar saqlanib kelmoqda. Shahar tarixi va madaniyati bilan tanishtirishga doim tayyorman.", responseTime:"3 soat", languages:["O'zbek","Rus","Arab"] },
    "4": { about:"Xivaning ko'hna shahrida joylashgan xonamdagi mehmonlarga tarixiy shaharni ko'rsatishdan xursandman.", responseTime:"30 daqiqa", languages:["O'zbek","Rus"] },
    "5": { about:"Toshkent markazida zamonaviy kvartiram bor. Biznes safari yoki sayohat uchun ideal joy.", responseTime:"1 soat", languages:["O'zbek","Rus","Ingliz"] },
    "6": { about:"Farg'ona vodiysidagi hovlimizda mehmonlarni bog' va milliy taomlar bilan kutib olamiz.", responseTime:"2 soat", languages:["O'zbek","Rus"] },
    "7": { about:"Shahrisabz — Amir Temur vatanida mehmon uyimiz. Shahar tarixini birga kashf etamiz.", responseTime:"3 soat", languages:["O'zbek","Rus"] },
    "8": { about:"Nukusda Savitskiy muzeyi yaqinida qulay kvartira. Qoraqalpog'istonni ko'rsatishdan xursandman.", responseTime:"1 soat", languages:["O'zbek","Qoraqalpoq","Rus"] },
    "9": { about:"Mirzo Ulug'bek ko'chasidagi kvartiramni sayohatchilarga taklif qilaman. Markazga yaqin, toza va shinam uy.", responseTime:"30 daqiqa", languages:["O'zbek","Rus"] },
  },
  ru: {
    "1": { about:"Я родился в Самарканде. Для меня самое большое удовольствие — служить гостям с заботой и теплом. Я рад приветствовать вас в нашем доме!", responseTime:"1 час", languages:["Узбекский","Русский","Английский"] },
    "2": { about:"У нас есть дом рядом с горами Чимган. Любите отдых на природе? Приглашаем вас к нам!", responseTime:"2 часа", languages:["Узбекский","Русский"] },
    "3": { about:"В нашем историческом гостевом доме в Бухаре сохранились 100-летние традиции. Я всегда рад показать историю и культуру города.", responseTime:"3 часа", languages:["Узбекский","Русский","Арабский"] },
    "4": { about:"Я живу в старом Хиве и рад показать гостям исторический город и его атмосферу.", responseTime:"30 минут", languages:["Узбекский","Русский"] },
    "5": { about:"В центре Ташкента у меня современная квартира. Это идеальное место для деловых поездок и путешествий.", responseTime:"1 час", languages:["Узбекский","Русский","Английский"] },
    "6": { about:"В нашем доме в Ферганской долине мы встречаем гостей с сада и национальной кухней.", responseTime:"2 часа", languages:["Узбекский","Русский"] },
    "7": { about:"В Шахрисабзе у нас гостевой дом рядом с историей Амир Темура. Давайте откроем город вместе.", responseTime:"3 часа", languages:["Узбекский","Русский"] },
    "8": { about:"В Нукусе рядом с музеем Суворова у меня удобная квартира. Я рад показать гостям Каракалпакстан.", responseTime:"1 час", languages:["Узбекский","Каракалпакский","Русский"] },
    "9": { about:"Я предлагаю жильё рядом с улицей Мирзо Улугбека. Это чистый, удобный дом в центре города.", responseTime:"30 минут", languages:["Узбекский","Русский"] },
  },
  en: {
    "1": { about:"I was born in Samarkand. I love welcoming guests and giving them a warm, high-quality stay at our home.", responseTime:"1 hour", languages:["Uzbek","Russian","English"] },
    "2": { about:"We have a home near the Chimgan mountains. Love nature and quiet escapes? Come stay with us!", responseTime:"2 hours", languages:["Uzbek","Russian"] },
    "3": { about:"Our historic guest house in Bukhara preserves 100 years of traditions. I enjoy sharing the culture and history of the city.", responseTime:"3 hours", languages:["Uzbek","Russian","Arabic"] },
    "4": { about:"I live in the old city of Khiva and love showing guests the sights and atmosphere of this historic place.", responseTime:"30 minutes", languages:["Uzbek","Russian"] },
    "5": { about:"I have a modern apartment in central Tashkent. It is ideal for business trips and travel stays.", responseTime:"1 hour", languages:["Uzbek","Russian","English"] },
    "6": { about:"In our home in the Fergana Valley, we welcome guests with a garden and traditional dishes.", responseTime:"2 hours", languages:["Uzbek","Russian"] },
    "7": { about:"Our guest house in Shahrisabz is close to the legacy of Amir Timur. We explore the city together.", responseTime:"3 hours", languages:["Uzbek","Russian"] },
    "8": { about:"In Nukus, near the Savitsky Museum, I offer a comfortable apartment. I love sharing the beauty of Karakalpakstan.", responseTime:"1 hour", languages:["Uzbek","Karakalpak","Russian"] },
    "9": { about:"I invite travelers to my apartment near Mirzo Ulugbek Street. It is a clean, comfortable place in the city center.", responseTime:"30 minutes", languages:["Uzbek","Russian"] },
  },
  ar: {
    "1": { about:"وُلدت في سمرقند. أستمتع بترحيب الضيوف وتوفير إقامة دافئة وعالية الجودة في منزلنا.", responseTime:"1 ساعة", languages:["الأوزبكية","الروسية","الإنجليزية"] },
    "2": { about:"لدينا منزل قريب من جبال تشيمغان. هل تحب الطبيعة والهدوء؟ تعال واستمتع معنا!", responseTime:"ساعتان", languages:["الأوزبكية","الروسية"] },
    "3": { about:"يُحافظ منزلك الضيافي التاريخي في بخارى على 100 سنة من التقاليد. أستمتع بمشاركة ثقافة وتاريخ المدينة.", responseTime:"3 ساعات", languages:["الأوزبكية","الروسية","العربية"] },
    "4": { about:"أعيش في مدينة خيوا العتيقة وأحب إظهار المعالم والجو التاريخي للضيوف.", responseTime:"30 دقيقة", languages:["الأوزبكية","الروسية"] },
    "5": { about:"لدي شقة حديثة في وسط طشقند. وهي مثالية للرحلات التجارية والإقامات السياحية.", responseTime:"1 ساعة", languages:["الأوزبكية","الروسية","الإنجليزية"] },
    "6": { about:"في منزلنا في وادي فرغانة، نرحب بالضيوف مع حديقة وأطباق تقليدية.", responseTime:"ساعتان", languages:["الأوزبكية","الروسية"] },
    "7": { about:"منزلنا الضيافي في شاهرسبز قريب من إرث أمير تيمور. نستكشف المدينة معًا.", responseTime:"3 ساعات", languages:["الأوزبكية","الروسية"] },
    "8": { about:"في نوكوس، قرب متحف سافيتسكي، أقدم شقة مريحة. أحب مشاركة جمال قره قلشستان.", responseTime:"1 ساعة", languages:["الأوزبكية","الكركالپاقية","الروسية"] },
    "9": { about:"أدعو المسافرين إلى شقتي قرب شارع ميرزا أولغبيك. إنها مكان نظيف ومريح في مركز المدينة.", responseTime:"30 دقيقة", languages:["الأوزبكية","الروسية"] },
  },
  tr: {
    "1": { about:"Ben Samarkand'da doğdum. Misafirleri sıcak karşılamayı ve evimizde kaliteli bir konaklama sunmayı çok seviyorum.", responseTime:"1 saat", languages:["Özbekçe","Rusça","İngilizce"] },
    "2": { about:"Çimgan dağlarının yanında bir evimiz var. Doğayı ve sessiz kaçışları seviyor musunuz? Bize gelin!", responseTime:"2 saat", languages:["Özbekçe","Rusça"] },
    "3": { about:"Buhara'daki tarihi konak evimiz 100 yıllık gelenekleri taşıyor. Şehir tarihini ve kültürünü paylaşmaktan mutluluk duyarım.", responseTime:"3 saat", languages:["Özbekçe","Rusça","Arapça"] },
    "4": { about:"Hiva'nın eski şehrinde yaşıyorum ve misafirlere bu tarihi yerin atmosferini gösterme mutluluğu yaşıyorum.", responseTime:"30 dakika", languages:["Özbekçe","Rusça"] },
    "5": { about:"Merkez Taşkent'te modern bir dairem var. İş seyahatleri ve kısa konaklamalar için ideal.", responseTime:"1 saat", languages:["Özbekçe","Rusça","İngilizce"] },
    "6": { about:"Fergana Vadisi'ndeki evimizde bahçeli ve geleneksel yemeklerle misafirleri ağırlıyoruz.", responseTime:"2 saat", languages:["Özbekçe","Rusça"] },
    "7": { about:"Şahrisabz'daki konak evimiz Amir Timur mirasına yakın. Şehri birlikte keşfediyoruz.", responseTime:"3 saat", languages:["Özbekçe","Rusça"] },
    "8": { about:"Nukus'ta Savitsky Müzesi yakınında konforlu bir daire sunuyorum. Karakalpakstan güzelliğini paylaşmaktan mutluluk duyarım.", responseTime:"1 saat", languages:["Özbekçe","Karakalpakça","Rusça"] },
    "9": { about:"Mirzo Ulugbek Caddesi yakınındaki dairemde gezginleri ağırlıyorum. Şehir merkezinde temiz ve konforlu bir yer.", responseTime:"30 dakika", languages:["Özbekçe","Rusça"] },
  },
  zh: {
    "1": { about:"我出生在撒马尔罕。最喜欢欢迎客人，并给他们一个温暖、优质的居住体验。", responseTime:"1 小时", languages:["乌兹别克语","俄语","英语"] },
    "2": { about:"我们在奇姆干山附近有一处房子。喜欢自然和安静的放松吗？欢迎来住！", responseTime:"2 小时", languages:["乌兹别克语","俄语"] },
    "3": { about:"我们在布哈拉的历史客栈保留着100年的传统。我很乐意分享这座城市的文化和历史。", responseTime:"3 小时", languages:["乌兹别克语","俄语","阿拉伯语"] },
    "4": { about:"我住在希瓦老城，喜欢带客人欣赏这座历史城市的景色和氛围。", responseTime:"30 分钟", languages:["乌兹别克语","俄语"] },
    "5": { about:"我在塔什干市中心有一套现代公寓。非常适合商务出差和旅行住宿。", responseTime:"1 小时", languages:["乌兹别克语","俄语","英语"] },
    "6": { about:"在费尔干纳谷的家中，我们会用花园和传统菜肴欢迎客人。", responseTime:"2 小时", languages:["乌兹别克语","俄语"] },
    "7": { about:"我们在沙赫里萨布兹的客栈靠近阿米尔·帖木儿的遗产。我们一起探索这座城市。", responseTime:"3 小时", languages:["乌兹别克语","俄语"] },
    "8": { about:"在努库斯，靠近萨维茨基博物馆，我提供一套舒适公寓。我喜欢分享卡拉卡尔帕克斯坦的美。", responseTime:"1 小时", languages:["乌兹别克语","卡拉卡尔帕克语","俄语"] },
    "9": { about:"我邀请旅行者入住我在米尔佐·乌鲁格别克大街附近的公寓。这里在市中心，干净舒适。", responseTime:"30 分钟", languages:["乌兹别克语","俄语"] },
  },
};

const REVIEWS_DATA = [
  { name:"Émilie D.",  avatar:"/listings/user-avatar.svg", date:"Avg 2025",  text:"Juda iliq mezbon, har kuni choy va non taklif qildi.", rating:5 },
  { name:"Toshie K.",  avatar:"/listings/user-avatar.svg", date:"Iyul 2025", text:"Shaharning yashirin joylarini ko'rsatdi. Tavsiya!", rating:5 },
  { name:"Ahmed S.",   avatar:"/listings/user-avatar.svg", date:"May 2025",  text:"Uy toza, qulay va markazga yaqin.", rating:4 },
];

const localizedReviews: Record<string, Array<{ name: string; avatar: string; date: string; text: string; rating: number }>> = {
  uz: REVIEWS_DATA,
  ru: [
    { name:"Émilie D.", avatar:"/listings/user-avatar.svg", date:"Авг 2025", text:"Очень тёплый хозяин, каждый день предлагал чай и свежую выпечку.", rating:5 },
    { name:"Toshie K.", avatar:"/listings/user-avatar.svg", date:"Июль 2025", text:"Показал скрытые уголки города. Очень рекомендую!", rating:5 },
    { name:"Ahmed S.", avatar:"/listings/user-avatar.svg", date:"Май 2025", text:"Дом чистый, удобный и рядом с центром.", rating:4 },
  ],
  en: [
    { name:"Émilie D.", avatar:"/listings/user-avatar.svg", date:"Aug 2025", text:"The host was incredibly warm and served tea and bread every day.", rating:5 },
    { name:"Toshie K.", avatar:"/listings/user-avatar.svg", date:"July 2025", text:"He showed me the hidden spots of the city. Highly recommended!", rating:5 },
    { name:"Ahmed S.", avatar:"/listings/user-avatar.svg", date:"May 2025", text:"The house was clean, comfortable and close to the center.", rating:4 },
  ],
  ar: [
    { name:"Émilie D.", avatar:"/listings/user-avatar.svg", date:"أغسطس 2025", text:"كان المضيف دافئًا جدًا وقدم الشاي والخبز كل يوم.", rating:5 },
    { name:"Toshie K.", avatar:"/listings/user-avatar.svg", date:"يوليو 2025", text:"أراني الأماكن المخفية في المدينة. أنصح به بشدة!", rating:5 },
    { name:"Ahmed S.", avatar:"/listings/user-avatar.svg", date:"مايو 2025", text:"المنزل كان نظيفًا ومريحًا وقريبًا من المركز.", rating:4 },
  ],
  tr: [
    { name:"Émilie D.", avatar:"/listings/user-avatar.svg", date:"Ağu 2025", text:"Ev sahibi çok sıcak ve her gün çay ile ekmek ikram etti.", rating:5 },
    { name:"Toshie K.", avatar:"/listings/user-avatar.svg", date:"Temmuz 2025", text:"Şehrin gizli yerlerini gösterdi. Kesinlikle tavsiye ederim!", rating:5 },
    { name:"Ahmed S.", avatar:"/listings/user-avatar.svg", date:"Mayıs 2025", text:"Ev temiz, konforlu ve merkeze yakındı.", rating:4 },
  ],
  zh: [
    { name:"Émilie D.", avatar:"/listings/user-avatar.svg", date:"2025年8月", text:"房东非常热情，每天都给我泡茶并提供面包。", rating:5 },
    { name:"Toshie K.", avatar:"/listings/user-avatar.svg", date:"2025年7月", text:"他向我展示了城里隐藏的角落。强烈推荐！", rating:5 },
    { name:"Ahmed S.", avatar:"/listings/user-avatar.svg", date:"2025年5月", text:"房子干净舒适，而且靠近市中心。", rating:4 },
  ],
};

export default function HostProfile() {
  const { t, lang } = useLanguage();
  const [,params] = useRoute("/host/:id");
  const catalogue = useStays();
  const id = params?.id || "1";
  const stay = useMemo(()=>catalogue.find(s=>String(s.id)===id), [catalogue, id]);
  if (!stay) return <NotFound/>;
  const baseMeta = HOST_META[String(stay.id)] ?? HOST_META["1"];
  const localizedMeta = HOST_META_TEXT[lang]?.[String(stay.id)] ?? HOST_META_TEXT.uz[String(stay.id)] ?? { about: baseMeta.about, responseTime: baseMeta.responseTime, languages: baseMeta.languages };
  const meta = { ...baseMeta, ...localizedMeta };
  const reviewSet = localizedReviews[lang] ?? localizedReviews.uz;
  const hostListings = catalogue.filter(s => s.hostName === stay.hostName).slice(0, 4);
  const hasReviews = stay.reviewCount > 0;

  const BADGES = [
    { icon:Shield,       label:t.hp_verified },
    { icon:Award,        label:t.hp_superhost },
    { icon:MessageCircle,label:`${t.hp_response_time} ${meta.responseTime}` },
    { icon:Calendar,     label:`${meta.joined} ${t.hp_on_uyjoy}` },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center"><HomeIcon size={15} className="text-white"/></div>
            <span className="font-display font-bold text-xl text-[#e8175d] hidden sm:block">uyjoy.uz</span>
          </a>
          <button onClick={()=>window.history.back()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ChevronLeft size={16}/> {t.hp_back}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-[84px]">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <img src={stay.hostAvatar} alt={stay.hostName} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"/>
                  <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#e8175d] rounded-full flex items-center justify-center border-2 border-white">
                    <Award size={13} className="text-white"/>
                  </div>
                </div>
                <h1 className="font-display font-bold text-2xl text-gray-900">{stay.hostName}</h1>
                <p className="text-gray-500 text-sm mt-1">{stay.city}, {t.hp_city}</p>
                <p className="text-gray-400 text-xs mt-0.5">{meta.joined} {t.hp_from}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[{n:`${stay.reviewCount}`,l:t.hp_reviews},{n:hasReviews?`${stay.rating}★`:t.rate_new,l:t.hp_rating},{n:`${meta.responseRate}%`,l:t.hp_response}].map(s=>(
                  <div key={s.l} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-bold text-base text-gray-900">{s.n}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                {BADGES.map(b=>(
                  <div key={b.label} className="flex items-center gap-3 text-sm text-gray-700">
                    <b.icon size={16} className="text-[#e8175d] shrink-0"/> {b.label}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.hp_languages}</p>
                <div className="flex flex-wrap gap-2">
                  {meta.languages.map(l=>(
                    <span key={l} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{l}</span>
                  ))}
                </div>
              </div>

              <button className="w-full py-3 rounded-xl border-2 border-[#e8175d] text-[#e8175d] font-bold text-sm hover:bg-[#e8175d] hover:text-white transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={16}/> {t.hp_contact}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-3">{t.hp_about}</h2>
              <p className="text-gray-600 text-[15px] leading-7">{meta.about}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-5">{stay.hostName}{t.hp_listings}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hostListings.map(l=>(
                  <a key={l.id} href={`/stay/${l.id}`} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-2">
                      <img src={l.images[0]} alt={stayTitle(l, lang)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2">{stayTitle(l, lang)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-bold">{money(l.pricePerNight)}</span> <span className="text-gray-400">{t.hp_per_night}</span>
                        {l.pricePerWeek ? <> <span className="text-gray-400 text-xs">· {money(stayWeekPrice(l))} {t.price_per_week}</span></> : null}
                      </p>
                      {l.reviewCount > 0
                        ? <span className="flex items-center gap-0.5 text-sm"><Star size={12} className="fill-[#e8175d] text-[#e8175d]"/> {l.rating}</span>
                        : <span className="text-[10px] font-bold text-[#e8175d] bg-[#fdf0f4] px-2 py-0.5 rounded-full">{t.rate_new}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {hasReviews ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <Star size={20} className="fill-[#e8175d] text-[#e8175d]"/>
                    <span className="font-bold text-lg">{stay.rating} · {stay.reviewCount} {t.hp_reviews_title}</span>
                  </div>
                  <div className="space-y-5">
                    {reviewSet.map(r=>(
                      <div key={r.name} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover"/>
                          <div><p className="font-semibold text-sm">{r.name}</p><p className="text-xs text-gray-400">{r.date}</p></div>
                          <div className="ml-auto flex gap-0.5">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={12} className="fill-[#e8175d] text-[#e8175d]"/>)}</div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Star size={26} className="mx-auto mb-3 text-gray-300"/>
                  <p className="font-semibold text-gray-900 mb-1">{t.rate_new}</p>
                  <p className="text-sm text-gray-500">{t.rate_no_reviews}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
