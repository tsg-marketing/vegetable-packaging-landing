import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import ProductGallery from "@/components/ProductGallery";
import {
  CatalogProduct,
  loadCatalog,
  SHRINK_CATALOG_ENDPOINT,
  visibleParams,
  getVideoUrl,
  formatPrice,
} from "@/lib/shrinkCatalog";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  fallbackImg: string;
  withSearch?: boolean;
  endpoint?: string;
  allTabLabel?: string;
  hideEmptyTabs?: boolean;
  onDetails: (p: CatalogProduct) => void;
  onLoaded?: (list: CatalogProduct[]) => void;
  onInquiry: (productName: string) => void;
  onVideo?: (url: string) => void;
  onImageClick?: (pictures: string[], idx: number) => void;
};

const ALL_ID = "__all__";

export default function ShrinkCatalog({
  categories,
  fallbackImg,
  withSearch = false,
  endpoint = SHRINK_CATALOG_ENDPOINT,
  allTabLabel,
  hideEmptyTabs = false,
  onDetails,
  onLoaded,
  onInquiry,
  onVideo,
  onImageClick,
}: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(allTabLabel ? ALL_ID : (categories[0]?.id || ""));
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(8);

  useEffect(() => {
    let cancelled = false;
    loadCatalog(endpoint)
      .then(list => { if (!cancelled) { setProducts(list); onLoadedRef.current?.(list); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);

  useEffect(() => { setShow(8); }, [active, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    map[ALL_ID] = products.length;
    return map;
  }, [products]);

  const tabs = useMemo(() => {
    const base = hideEmptyTabs ? categories.filter(c => (counts[c.id] || 0) > 0) : categories;
    return allTabLabel ? [{ id: ALL_ID, name: allTabLabel }, ...base] : base;
  }, [categories, counts, hideEmptyTabs, allTabLabel]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q) return p.name.toLowerCase().includes(q);
      if (active === ALL_ID) return true;
      return p.categoryId === active;
    });
  }, [products, active, search]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-gray-100" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-9 bg-gray-100 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <Icon name="AlertCircle" size={32} className="mx-auto mb-3" style={{ color: "var(--orange)" }} />
        <p className="text-[#1A1A1A] font-semibold mb-1">Не удалось загрузить каталог</p>
        <p className="text-sm text-[#666] mb-4">Оставьте заявку — пришлём актуальный прайс на e-mail</p>
        <button onClick={() => onInquiry("")} className="btn-orange">Запросить прайс</button>
      </div>
    );
  }

  return (
    <>
      {withSearch && (
        <div className="max-w-md mx-auto mb-6 relative">
          <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-orange-500 text-[14px]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Очистить">
              <Icon name="X" size={14} className="text-[#999]" />
            </button>
          )}
        </div>
      )}

      {tabs.length > 1 && !search && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map(c => {
            const isActive = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className="px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-all border"
                style={{
                  background: isActive ? "var(--orange)" : "#fff",
                  color: isActive ? "#fff" : "#444",
                  borderColor: isActive ? "var(--orange)" : "#e5e5e5",
                }}
              >
                {c.name}
                {counts[c.id] ? <span className={isActive ? "ml-1.5 opacity-80" : "ml-1.5 text-[#999]"}>{counts[c.id]}</span> : null}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Icon name="SearchX" size={32} className="mx-auto mb-3 text-[#888]" />
          <p className="text-[#1A1A1A] font-semibold mb-1">В этом разделе пока нет позиций</p>
          <p className="text-sm text-[#666] mb-4">Оставьте заявку — подберём оборудование под задачу</p>
          <button onClick={() => onInquiry("")} className="btn-outline-orange">Запросить подбор</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.slice(0, show).map(p => {
            const keyParams = visibleParams(p.params).slice(0, 4);
            const videoUrl = getVideoUrl(p.params);
            return (
              <div key={p.id} id={`product-${p.id}`} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col scroll-mt-24">
                <ProductGallery
                  images={p.pictures}
                  alt={p.name}
                  fallback={fallbackImg}
                  className="aspect-[16/10] bg-white flex items-center justify-center overflow-hidden"
                  imgClassName="w-full h-full object-contain p-4"
                  onImageClick={onImageClick}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-3 leading-snug min-h-[44px]">{p.name}</h3>
                  {keyParams.length > 0 && (
                    <ul className="mb-4 space-y-1.5">
                      {keyParams.map((pr, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                          <span className="text-[#888] mt-1">·</span>
                          <span className="text-[#444]">{pr.name}: <span className="text-[#1A1A1A]">{pr.value}</span></span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-3">
                    <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>{formatPrice(p.price)}</div>
                    <div className="space-y-2">
                      <button
                        onClick={() => onDetails(p)}
                        className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                        style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                      >
                        <Icon name="Eye" size={16} />
                        Узнать подробнее
                      </button>
                      {videoUrl && onVideo && (
                        <button
                          onClick={() => onVideo(videoUrl)}
                          className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all border border-gray-200 hover:border-orange-300 text-[#1A1A1A] inline-flex items-center justify-center gap-2"
                        >
                          <Icon name="Play" size={16} style={{ color: "var(--orange)" }} />
                          Смотреть видео
                        </button>
                      )}
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
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > show && (
        <div className="mt-8 text-center">
          <button onClick={() => setShow(s => s + 8)} className="btn-outline-orange">
            <Icon name="ChevronDown" size={18} className="mr-2" />
            Показать ещё ({filtered.length - show})
          </button>
        </div>
      )}
    </>
  );
}