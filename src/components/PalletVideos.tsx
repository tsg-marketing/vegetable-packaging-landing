import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { formatPrice } from "@/lib/shrinkCatalog";
import { PalletProduct, loadPalletCatalog } from "@/lib/palletCatalog";

type Props = {
  fallbackImg: string;
  onVideo: (url: string) => void;
  onDetails: (p: PalletProduct) => void;
  onInquiry: (productName: string) => void;
};

const INITIAL = 3;

export default function PalletVideos({ fallbackImg, onVideo, onDetails, onInquiry }: Props) {
  const [items, setItems] = useState<PalletProduct[]>([]);
  const [show, setShow] = useState(INITIAL);

  useEffect(() => {
    let cancelled = false;
    loadPalletCatalog()
      .then(({ products }) => {
        if (cancelled) return;
        setItems(products.filter(p => p.video));
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.slice(0, show).map(p => (
          <div key={p.id} className="rounded-2xl overflow-hidden border border-gray-100 bg-white card-hover flex flex-col">
            <button
              onClick={() => onVideo(p.video)}
              className="relative aspect-video bg-[#111] group w-full"
              aria-label={`Смотреть видео: ${p.name}`}
            >
              <img
                src={p.pictures[0] || fallbackImg}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-contain p-3 opacity-70 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/25" />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                style={{ background: "var(--orange)" }}
              >
                <Icon name="Play" size={28} className="text-white ml-1" />
              </span>
              <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/90 text-[#444]">
                {p.brand}
              </span>
            </button>

            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-[#1A1A1A] text-[15px] leading-snug mb-2 min-h-[44px]">{p.name}</h3>
              <div className="font-bold text-[18px] mb-4" style={{ color: "var(--orange)" }}>{formatPrice(p.price)}</div>
              <div className="mt-auto space-y-2">
                <button
                  onClick={() => onDetails(p)}
                  className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                >
                  <Icon name="Eye" size={16} />
                  Детальные характеристики
                </button>
                <button
                  onClick={() => onInquiry(p.name)}
                  className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all text-white inline-flex items-center justify-center gap-2"
                  style={{ background: "var(--orange)" }}
                >
                  <Icon name="MessageSquare" size={16} />
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > show && (
        <div className="mt-8 text-center">
          <button onClick={() => setShow(s => s + 3)} className="btn-outline-orange">
            <Icon name="ChevronDown" size={18} className="mr-2" />
            Показать ещё видео ({items.length - show})
          </button>
        </div>
      )}
    </>
  );
}
