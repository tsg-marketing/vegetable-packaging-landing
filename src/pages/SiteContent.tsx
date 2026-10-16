import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { SITE_CONTENT_FILES, SITE_CONTENT_DATE, ContentFile } from "@/data/siteContentFiles";

const BASE = "/site-content/";

const formatSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`);

function FileRow({ f }: { f: ContentFile }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
      <Icon name="FileText" size={20} className="text-[#999] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#1A1A1A] truncate">{f.title}</div>
        <div className="text-[12px] text-[#888]">{f.file} · {formatSize(f.size)}{f.count !== undefined ? ` · ${f.count} товаров` : ""}</div>
      </div>
      <a href={BASE + f.file} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-[#444] hover:border-gray-300 hidden sm:inline-flex">
        Открыть
      </a>
      <a href={BASE + f.file} download className="text-[13px] font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ color: "var(--orange)", background: "rgba(255,102,0,0.08)" }}>
        <Icon name="Download" size={14} />
        Скачать
      </a>
    </div>
  );
}

export default function SiteContent() {
  useEffect(() => {
    document.title = "Контент сайта | Техно-Сиб";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  const { pages, all, zip } = SITE_CONTENT_FILES;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#444] hover:text-[#1A1A1A]">
            <Icon name="ArrowLeft" size={18} />
            На главную
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Контент сайта в TXT</h1>
        <p className="text-[#666] mt-1 mb-6">Тексты страниц и полные карточки оборудования: характеристики и описания из фида. Выгрузка от {SITE_CONTENT_DATE}.</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <a href={BASE + zip.file} download className="btn-orange px-5 py-3 inline-flex items-center gap-2">
            <Icon name="Archive" size={18} />
            Скачать всё архивом · {formatSize(zip.size)}
          </a>
          <a href={BASE + all.file} download className="px-5 py-3 rounded-lg border border-gray-200 bg-white font-semibold text-[#444] hover:border-gray-300 inline-flex items-center gap-2">
            <Icon name="FileDown" size={18} />
            Одним TXT-файлом · {formatSize(all.size)}
          </a>
        </div>

        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">Страницы сайта</h2>
        <div className="bg-white rounded-xl border border-gray-100">
          {pages.map(f => <FileRow key={f.file} f={f} />)}
        </div>
      </main>
    </div>
  );
}
