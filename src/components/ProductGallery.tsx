import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Props = {
  images: string[];
  alt: string;
  fallback: string;
  className?: string;
  imgClassName?: string;
};

export default function ProductGallery({ images, alt, fallback, className, imgClassName }: Props) {
  const list = images && images.length > 0 ? images : [fallback];
  const [idx, setIdx] = useState(0);

  useEffect(() => { setIdx(0); }, [images]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + list.length) % list.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % list.length); };
  const goTo = (i: number, e: React.MouseEvent) => { e.stopPropagation(); setIdx(i); };

  return (
    <div className={`relative group ${className || ""}`}>
      <picture>
        <source srcSet={list[idx]} />
        <img src={list[idx]} alt={alt} loading="lazy" className={imgClassName || "w-full h-full object-contain p-4"} />
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
    </div>
  );
}
