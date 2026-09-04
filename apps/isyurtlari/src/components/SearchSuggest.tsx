'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconProductOrigin } from '@/components/Icons';

interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: {
    name: string;
    slug: string;
  };
}

export default function SearchSuggest() {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!canSearch) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return () => controller.abort();
    }

    setLoading(true);
    setOpen(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!controller.signal.aborted) {
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setActiveIndex(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, trimmedQuery]);

  const goToProduct = (product: ProductSuggestion) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    router.push(`/urun/${product.slug}`);
  };

  const submitSearch = () => {
    if (!trimmedQuery) return;

    setOpen(false);
    setActiveIndex(-1);
    router.push(`/ara?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToProduct(suggestions[activeIndex]);
      return;
    }

    submitSearch();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex]);
        return;
      }

      submitSearch();
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    }
  };

  const showPanel = open && canSearch;

  // Formdaki min-w-0 sart: input'un varsayilan icsel genisligi (~186px) formun
  // min-content olcusunu belirliyor. Form, basliktaki satirin flex ogesi ve
  // min-width varsayilani auto oldugu icin bu olcunun altina inemiyordu. Dar
  // ekranlarda satir tasiyor ve sepet ikonunu ekranin disina itiyordu.
  return (
    <form
      ref={rootRef}
      action="/ara"
      method="GET"
      onSubmit={handleSubmit}
      className="relative flex min-w-0 flex-1"
      role="search"
    >
      <input
        name="q"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (canSearch) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ürün, kategori veya marka ara..."
        autoComplete="off"
        className="flex-1 min-w-0 rounded-l-xl border-0 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-white/30"
      />
      <button
        type="submit"
        aria-label="Ürün ara"
        className="flex items-center justify-center rounded-r-xl bg-[#CC4E00] px-5 py-3 text-white transition-colors hover:bg-[#B34400] focus:outline-none focus:ring-4 focus:ring-white/30"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl shadow-orange-950/20">
          <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Anlık ürün önerileri
          </div>

          {loading ? (
            <div className="px-4 py-4 text-sm font-medium text-gray-500">Ürünler aranıyor...</div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-[24rem] overflow-y-auto py-1">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToProduct(product)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeIndex === index ? 'bg-orange-50' : 'hover:bg-orange-50'
                  }`}
                >
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FFF3E7]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <IconProductOrigin className="h-10 w-10 object-contain" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-gray-900">{product.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-gray-500">
                      {product.category?.name ?? 'Ürün'}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-right">
                    <span className="block text-sm font-extrabold text-[#BA4700]">
                      {product.price > 0 ? `₺${product.price.toFixed(2)}` : 'Fiyat bekleniyor'}
                    </span>
                    {product.quantity === 0 && (
                      <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        Tükendi
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm font-medium text-gray-500">Bu arama için ürün bulunamadı.</div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#BA4700]"
          >
            <span>"{trimmedQuery}" için tüm sonuçları gör</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </form>
  );
}
