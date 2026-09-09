import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { PalletProduct, loadPalletCatalog } from "@/lib/palletCatalog";

type Props = {
  fallbackImg: string;
  onVideo: (url: string) => void;
  onDetails: (p: PalletProduct) => void;
  onInquiry: (productName: string) => void;
};

/** Короткое имя модели для подписи на превью: TS3000MR-H, ROBO-MS, ECOPLAT PLUS FRD. */
function shortModel(name: string): string {
  const direct = name.match(/\b(TS\d+[A-Z0-9-]*|ROBO-[A-Z]+|HL-[\dA-Za-z-]+)/);
  if (direct) return direct[1].replace(/[.,;]$/, "");

  const words = name.split(/\s+/).filter(Boolean);
  const latin: string[] = [];
  for (const w of words) {
    const clean = w.replace(/[«»(),.;]/g, "");
    if (/^[A-Z0-9][A-Z0-9-]*$/.test(clean) && clean.length > 1) latin.push(clean);
    else if (latin.length) break;
  }
  if (latin.length) return latin.join(" ");
  return words.slice(-2).join(" ");
}

function kindLabel(p: PalletProduct): string {
  if (p.mobility === "mobile") return "Мобильный обмотчик";
  if (p.kind === "palletizer") return "Робот-паллетайзер";
  return "Паллетоупаковщик";
}

export default function PalletVideos({ fallbackImg, onVideo, onDetails, onInquiry }: Props) {
  const [items, setItems] = useState<PalletProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadPalletCatalog()
      .then(({ products }) => {
        if (cancelled) return;
        const withVideo = products.filter(p => p.video);
        withVideo.sort((a, b) => (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER));
        setItems(withVideo);
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(p => (
        <div key={p.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white card-hover flex flex-col">
          <button
            onClick={() => onVideo(p.video)}
            className="relative aspect-video w-full overflow-hidden bg-[#1F2937] group"
            aria-label={`Смотреть видео: ${p.name}`}
          >
            <img
              src={p.pictures[0] || fallbackImg}
              alt={p.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 via-[#1F2937]/55 to-transparent" />

            <span className="absolute left-4 top-4 right-16 text-left">
              <span className="block text-white/75 text-[11px] font-semibold uppercase tracking-[0.12em] leading-tight">
                {kindLabel(p)}
              </span>
              <span className="block text-white font-bold text-[22px] leading-tight mt-0.5">
                {shortModel(p.name)}
              </span>
            </span>

            <span className="absolute left-4 bottom-3 text-white/45 text-[11px] font-semibold uppercase tracking-[0.2em]">
              ТЕХНОСИБ
            </span>

            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 bg-[#E02B20]">
              <Icon name="Play" size={24} className="text-white ml-1" />
            </span>
          </button>

          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-[#1A1A1A] text-[18px] text-center mb-3">{shortModel(p.name)}</h3>
            <div className="mt-auto space-y-2">
              <button
                onClick={() => onDetails(p)}
                className="w-full text-[14px] font-medium px-4 py-2.5 rounded-md border border-gray-200 text-[#444] hover:border-orange-300 transition-all inline-flex items-center justify-center gap-2"
              >
                <Icon name="FileText" size={15} className="text-[#888]" />
                Детальные характеристики
              </button>
              <button
                onClick={() => onInquiry(p.name)}
                className="w-full text-[15px] font-semibold px-4 py-2.5 rounded-md transition-all text-white"
                style={{ background: "var(--orange)" }}
              >
                Оставить заявку
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}