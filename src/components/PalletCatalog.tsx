import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import ProductGallery from "@/components/ProductGallery";
import { formatPrice } from "@/lib/shrinkCatalog";
import {
  PalletProduct,
  loadPalletCatalog,
  keyParamsFor,
  KIND_TABS,
} from "@/lib/palletCatalog";

type Props = {
  fallbackImg: string;
  onDetails: (p: PalletProduct) => void;
  onLoaded?: (list: PalletProduct[]) => void;
  onInquiry: (productName: string) => void;
  onVideo?: (url: string) => void;
  onImageClick?: (pictures: string[], idx: number) => void;
};

const ALL = "__all__";

export default function PalletCatalog({ fallbackImg, onDetails, onLoaded, onInquiry, onVideo, onImageClick }: Props) {
  const [products, setProducts] = useState<PalletProduct[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [brand, setBrand] = useState(ALL);
  const [kind, setKind] = useState("wrapper");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(8);

  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let cancelled = false;
    loadPalletCatalog()
      .then(({ products: list, brands: br }) => {
        if (cancelled) return;
        setProducts(list);
        setBrands(br);
        onLoadedRef.current?.(list);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setShow(8); }, [brand, kind, search]);

  const kindCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) m[p.kind] = (m[p.kind] || 0) + 1;
    return m;
  }, [products]);

  const brandCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) {
      if (p.kind !== kind) continue;
      m[p.brand] = (m[p.brand] || 0) + 1;
    }
    m[ALL] = products.filter(p => p.kind === kind).length;
    return m;
  }, [products, kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(p => {
      if (q) return p.name.toLowerCase().includes(q);
      if (p.kind !== kind) return false;
      if (brand !== ALL && p.brand !== brand) return false;
      return true;
    });
    return list.sort(
      (a, b) => (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER),
    );
  }, [products, brand, kind, search]);

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

  const kindTabs = KIND_TABS.filter(t => (kindCounts[t.id] || 0) > 0);
  const brandTabs = [{ id: ALL, name: "Все бренды" }, ...brands.filter(b => (brandCounts[b] || 0) > 0).map(b => ({ id: b, name: b }))];

  return (
    <>
      <div className="max-w-md mx-auto mb-6 relative">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
        <input
          type="text"
          placeholder="Поиск по названию модели..."
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

      {!search && kindTabs.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {kindTabs.map(t => {
            const isActive = t.id === kind;
            return (
              <button
                key={t.id}
                onClick={() => { setKind(t.id); setBrand(ALL); }}
                className="px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-all border"
                style={{
                  background: isActive ? "var(--orange)" : "#fff",
                  color: isActive ? "#fff" : "#444",
                  borderColor: isActive ? "var(--orange)" : "#e5e5e5",
                }}
              >
                {t.name}
                <span className={isActive ? "ml-1.5 opacity-80" : "ml-1.5 text-[#999]"}>{kindCounts[t.id]}</span>
              </button>
            );
          })}
        </div>
      )}

      {!search && brandTabs.length > 2 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {brandTabs.map(b => {
            const isActive = b.id === brand;
            return (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all border"
                style={{
                  background: isActive ? "#1A1A1A" : "#fff",
                  color: isActive ? "#fff" : "#555",
                  borderColor: isActive ? "#1A1A1A" : "#e5e5e5",
                }}
              >
                {b.name}
                <span className={isActive ? "ml-1.5 opacity-70" : "ml-1.5 text-[#999]"}>{brandCounts[b.id]}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Icon name="SearchX" size={32} className="mx-auto mb-3 text-[#888]" />
          <p className="text-[#1A1A1A] font-semibold mb-1">Ничего не найдено</p>
          <p className="text-sm text-[#666] mb-4">Оставьте заявку — подберём оборудование под вашу задачу</p>
          <button onClick={() => onInquiry("")} className="btn-outline-orange">Запросить подбор</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.slice(0, show).map(p => {
            const params = keyParamsFor(p);
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#999] mb-1.5">{p.brand}</p>
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-3 leading-snug min-h-[44px]">{p.name}</h3>
                  {params.length > 0 && (
                    <ul className="mb-4 space-y-1.5">
                      {params.map((pr, k) => (
                        <li key={k} className="flex items-start gap-2 text-[13px] leading-snug">
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
                        Детальные характеристики
                      </button>
                      {p.video && onVideo && (
                        <button
                          onClick={() => onVideo(p.video)}
                          className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all border border-gray-200 hover:border-orange-300 text-[#1A1A1A] inline-flex items-center justify-center gap-2"
                        >
                          <Icon name="Play" size={16} style={{ color: "var(--orange)" }} />
                          Посмотреть видео
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