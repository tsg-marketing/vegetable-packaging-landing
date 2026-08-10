import { useState } from "react";
import Icon from "@/components/ui/icon";

type Props = { embedId: string; title?: string };

export default function VideoCard({ embedId, title }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-video bg-black group">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://rutube.ru/play/embed/${embedId}/`}
            title={title || "Видео"}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 w-full h-full" aria-label="Смотреть видео">
            <img
              src={`https://rutube.ru/api/video/${embedId}/thumbnail/?redirect=1`}
              alt={title || "Видео"}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/30" />
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "var(--orange)" }}
            >
              <Icon name="Play" size={28} className="text-white ml-1" />
            </span>
          </button>
        )}
      </div>
      {title && <div className="px-5 py-4 font-semibold text-[#1A1A1A] text-[15px]">{title}</div>}
    </div>
  );
}
