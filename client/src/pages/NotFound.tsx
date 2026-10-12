import { useLocation } from "wouter";
import { Home as HomeIcon, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-5 sm:px-8 h-[68px] flex items-center">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e8175d] flex items-center justify-center"><HomeIcon size={15} className="text-white"/></div>
          <span className="font-display font-bold text-xl text-[#e8175d]">uyjoy.uz</span>
        </a>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <div className="mb-8">
          <p className="font-display text-[120px] sm:text-[160px] font-bold text-gray-100 leading-none select-none">404</p>
          <div className="-mt-8 relative z-10">
            <div className="w-20 h-20 rounded-full bg-[#fdf8f8] border-2 border-[#f5e0e5] flex items-center justify-center mx-auto mb-5">
              <Search size={32} className="text-[#e8175d]" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Sahifa topilmadi</h1>
            <p className="text-gray-500 max-w-md mx-auto mb-8">Kechirasiz, siz izlayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-sm font-semibold hover:border-gray-500 transition-colors">
                <ArrowLeft size={16}/> Orqaga
              </button>
              <button onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-opacity"
                style={{background:"linear-gradient(to right,#E61E4D 0%,#D70466 100%)"}}>
                <HomeIcon size={16}/> Bosh sahifaga
              </button>
              <button onClick={() => navigate("/search")}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#e8175d] text-[#e8175d] text-sm font-semibold hover:bg-[#e8175d] hover:text-white transition-colors">
                <Search size={16}/> Uy qidirish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
