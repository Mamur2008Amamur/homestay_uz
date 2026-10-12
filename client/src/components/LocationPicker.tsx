import { useState, useEffect } from "react";
import { MapPin, Navigation, Crosshair } from "lucide-react";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  city?: string;
  onLocationSelect: (lat: number, lng: number, addressText?: string) => void;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  Samarqand: [39.6542, 66.9597],
  Toshkent: [41.2995, 69.2401],
  Buxoro: [39.7747, 64.4286],
  Xiva: [41.3783, 60.3639],
  Shahrisabz: [39.0569, 66.8294],
  Zomin: [39.9606, 68.3956],
  Fargona: [40.3842, 71.7843],
  Namangan: [40.9983, 71.6726],
  Andijon: [40.7821, 72.3442],
  Nukus: [42.4602, 59.6166],
};

export function LocationPicker({
  initialLat = 39.6542,
  initialLng = 66.9597,
  city = "Samarqand",
  onLocationSelect,
}: LocationPickerProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (city && CITY_COORDINATES[city] && (!initialLat || initialLat === 39.6542)) {
      const [cLat, cLng] = CITY_COORDINATES[city];
      setLat(cLat);
      setLng(cLng);
      onLocationSelect(cLat, cLng);
    }
  }, [city]);

  const handleCoordinateChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    onLocationSelect(newLat, newLng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokatsiya qurilmangizda qo'llab-quvvatlanmaydi.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        handleCoordinateChange(userLat, userLng);
      },
      (err) => {
        setIsLocating(false);
        console.warn("[Geolocation error]", err);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // OpenStreetMap embed coordinates
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.01}%2C${lng + 0.015}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-[#fbfaf8] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#e8175d]" />
          <div>
            <p className="text-xs font-bold text-gray-900">Uyingizning xaritadagi aniq o&apos;rni</p>
            <p className="text-[11px] text-gray-500">
              Koordinatalar: {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-[#e8175d] transition-all disabled:opacity-50"
        >
          <Crosshair size={13} className={isLocating ? "animate-spin text-[#e8175d]" : "text-[#e8175d]"} />
          {isLocating ? "Aniqlanmoqda..." : "Mening manzilimni aniqlash"}
        </button>
      </div>

      {/* Interactive Map Preview */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-gray-300 shadow-inner bg-gray-100">
        <iframe
          title="OpenStreetMap Location"
          src={mapSrc}
          className="h-full w-full border-0 pointer-events-auto"
          loading="lazy"
        />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-gray-700 shadow-xs backdrop-blur-xs">
          📍 Tanlangan nuqta: {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      </div>

      {/* Manual Coordinate Fine-Tuning */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[11px] font-semibold text-gray-600 block mb-1">Kenglik (Latitude)</label>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => handleCoordinateChange(parseFloat(e.target.value) || lat, lng)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-mono text-gray-800 outline-none focus:border-[#e8175d]"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-600 block mb-1">Uzunlik (Longitude)</label>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => handleCoordinateChange(lat, parseFloat(e.target.value) || lng)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-mono text-gray-800 outline-none focus:border-[#e8175d]"
          />
        </div>
      </div>
    </div>
  );
}
