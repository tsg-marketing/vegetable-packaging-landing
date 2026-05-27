import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Props = {
  images: string[];
  alt: string;
  fallback: string;
  className?: string;
  imgClassName?: string;
  enableLightbox?: boolean;
};

export default function ProductGallery({ images, alt, fallback, className, imgClassName, enableLightbox = true }: Props) {
  const list = images && images.length > 0 ? images : [fallback];
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => { setIdx(0); }, [images]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + list.length) % list.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % list.length); };
  const goTo = (i: number, e: React.MouseEvent) => { e.stopPropagation(); setIdx(i); };

  const openLightbox = (e: React.MouseEvent) => {
    if (!enableLightbox) return;
    e.stopPropagation();
    setLightboxOpen(true);
  };
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const lbPrev = useCallback(() => setIdx(i => (i - 1 + list.length) % list.length), [list.length]);
  const lbNext = useCallback(() => setIdx(i => (i + 1) % list.length), [list.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lbPrev();
      else if (e.key === "ArrowRight") lbNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, lbPrev, lbNext]);

  return (
    <div className={`relative group ${className || ""}`}>
      <picture>
        <source srcSet={list[idx]} />
        <img
          src={list[idx]}
          alt={alt}
          loading="lazy"
          onClick={openLightbox}
          className={(imgClassName || "w-full h-full object-contain p-4") + (enableLightbox ? " cursor-zoom-in" : "")}
        />
      </picture>

      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Предыдущее фото"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="ChevronLeft" size={18} className="text-[#1A1A1A]" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Следующее фото"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="ChevronRight" size={18} className="text-[#1A1A1A]" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => goTo(i, e)}
                aria-label={`Фото ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-[#3897FF]" : "w-1.5 bg-[#1A1A1A]/30"}`}
              />
            ))}
          </div>
        </>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <Icon name="X" size={24} />
          </button>

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); lbPrev(); }}
              aria-label="Предыдущее фото"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <Icon name="ChevronLeft" size={26} />
            </button>
          )}

          <img
            src={list[idx]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain select-none"
          />

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); lbNext(); }}
              aria-label="Следующее фото"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <Icon name="ChevronRight" size={26} />
            </button>
          )}

          {list.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
              {idx + 1} / {list.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
