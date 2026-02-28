import { useMemo, useState, useEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useClasses } from '../hooks/useClasses';
import type { ClassFilters, ClassRecord, ColumnVisibility, ColumnKey } from '../types';
import VideoPreview from '../components/VideoPreview';
import { fetchColumnVisibility } from '../api/settings';
import {
  buildColumnLabels,
  defaultColumnVisibility,
  orderedColumns,
} from '../constants/columns';
import { getCategoryLabel } from '../constants/categories';
import useTranslate from '../hooks/useTranslate';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getApiBaseUrl, joinBaseUrl } from '../api/baseUrl';

const API_BASE_URL = getApiBaseUrl();

const resolveVideoSrc = (value?: string | null) => {
  if (!value) {
    return null;
  }
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }
  return joinBaseUrl(API_BASE_URL, value);
};

type ViewMode = 'table' | 'cards';

const getInitialViewMode = (): ViewMode => {
  if (typeof window === 'undefined') {
    return 'table';
  }
  // Mobil cihazlar için card görünümü, masaüstü için table görünümü
  return window.innerWidth <= 768 ? 'cards' : 'table';
};

const CartIconGlyph = () => (
  <svg
    className="cart-icon-trigger__icon"
      width="24"
      height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M3 4h2l2.4 9.2a2 2 0 001.94 1.5h8.27a2 2 0 001.94-1.5L21 6H6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="19" r="1.4" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="18" cy="19" r="1.4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg
    className="favorite-toggle__icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
      className={active ? 'favorite-toggle__path favorite-toggle__path--active' : 'favorite-toggle__path'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const isBrowser = typeof window !== 'undefined';

const UserPanel = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClassFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [userHasSelected, setUserHasSelected] = useState(false);
  const [expandedControls, setExpandedControls] = useState<Record<number, boolean>>({});
  const [isMobileView, setIsMobileView] = useState<boolean>(() => (isBrowser ? window.innerWidth <= 600 : false));
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const { data: allClasses = [] } = useClasses();
  const { data: classes = [], isLoading, error } = useClasses(filters);
  const { language, t } = useTranslate();
  const {
    addItem,
    items: cartItems,
    removeItem,
    updateQuantity,
  } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const visibleClasses = useMemo(
    () => (showOnlyFavorites ? classes.filter((item) => isFavorite(item.id)) : classes),
    [classes, showOnlyFavorites, isFavorite],
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  // Ekran boyutu değiştiğinde mobil durumunu ve varsayılan görünümü güncelle
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 600;
      setIsMobileView(isMobile);

      if (!userHasSelected) {
        const newViewMode: ViewMode = window.innerWidth <= 768 ? 'cards' : 'table';
        setViewMode(newViewMode);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userHasSelected]);

  const formatNumber = (value: number | null | undefined, suffix = '') => {
    if (value === null || value === undefined) {
      return '—';
    }
    const formatted = Number.isInteger(value)
      ? value.toFixed(0)
      : value.toFixed(2).replace(/\.?0+$/, '');
    return suffix ? `${formatted} ${suffix}` : formatted;
  };

  const columnLabels = useMemo(
    () => buildColumnLabels(language),
    [language],
  );

  const getCartQuantity = (classId: number) => {
    const match = cartItems.find((cartItem) => cartItem.record.id === classId);
    return match ? match.quantity : 0;
  };

  const openControlFor = (classId: number) => {
    setExpandedControls((prev) => ({
      ...prev,
      [classId]: true,
    }));
  };

  const collapseControlIfEmpty = (classId: number, nextQty: number) => {
    if (nextQty > 0) {
      return;
    }
    setExpandedControls((prev) => {
      if (!prev[classId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[classId];
      return next;
    });
  };

  const handleIncrease = async (record: ClassRecord) => {
    await addItem(record);
    openControlFor(record.id);
  };

  const handleDecrease = async (record: ClassRecord) => {
    const currentQty = getCartQuantity(record.id);
    if (currentQty <= 0) {
      return;
    }
    if (currentQty === 1) {
      await removeItem(record.id);
      collapseControlIfEmpty(record.id, 0);
      return;
    }
    const nextQty = currentQty - 1;
    await updateQuantity(record.id, nextQty);
    collapseControlIfEmpty(record.id, nextQty);
  };

  const groups = useMemo<string[]>(() => {
    const set = new Set<string>();
    allClasses.forEach((item) => {
      if (item.quality) {
        set.add(item.quality);
      }
    });
    return Array.from(set).sort();
  }, [allClasses]);

  const mainCategories = useMemo<string[]>(() => {
    const set = new Set<string>();
    allClasses.forEach((item) => {
      if (item.mainCategory) {
        set.add(item.mainCategory);
      }
    });
    return Array.from(set).sort();
  }, [allClasses]);

  const columnVisibilityQuery = useQuery({
    queryKey: ['columnVisibility'],
    queryFn: fetchColumnVisibility,
    initialData: defaultColumnVisibility,
  });
  const columnVisibility: ColumnVisibility = columnVisibilityQuery.data ?? defaultColumnVisibility;
  const visibleColumnKeys = useMemo(
    () => orderedColumns.filter((key) => columnVisibility[key]),
    [columnVisibility],
  );

  // Cart sütununu specialId'den sonra eklemek için sütunları yeniden düzenle
  const tableColumns = useMemo<(ColumnKey | 'cart')[]>(() => {
    const specialIdIndex = visibleColumnKeys.indexOf('specialId');
    if (specialIdIndex >= 0) {
      // specialId'den sonra cart'ı ekle
      const beforeCart = visibleColumnKeys.slice(0, specialIdIndex + 1);
      const afterCart = visibleColumnKeys.slice(specialIdIndex + 1);
      return [...beforeCart, 'cart', ...afterCart];
    }
    // specialId görünür değilse, cart'ı başa ekle
    return ['cart', ...visibleColumnKeys];
  }, [visibleColumnKeys]);

  const renderCell = (item: ClassRecord, key: ColumnKey): ReactNode => {
    switch (key) {
      case 'specialId':
        return item.specialId;
      case 'mainCategory':
        return getCategoryLabel(item.mainCategory, language);
      case 'quality':
        return item.quality;
      case 'className':
        if (language === 'ar' && item.classNameArabic) {
          return item.classNameArabic;
        }
        if (language === 'en' && item.classNameEnglish) {
          return item.classNameEnglish;
        }
        return item.className;
      case 'classNameArabic':
        return item.classNameArabic || '—';
      case 'classNameEnglish':
        return item.classNameEnglish || '—';
      case 'classFeatures':
        return item.classFeatures || t('No features provided yet.', 'لم يتم إضافة المزايا بعد.', 'Aún no se han añadido características.');
      case 'classWeight':
        return formatNumber(item.classWeight, 'kg');
      case 'classQuantity':
        return item.classQuantity !== null && item.classQuantity !== undefined
          ? String(item.classQuantity)
          : '—';
      case 'classPrice':
        if (item.classPrice !== null && item.classPrice !== undefined) {
          return `$${formatNumber(item.classPrice)}`;
        }
        return '';
      case 'classVideo':
        return (
          <VideoPreview
            src={resolveVideoSrc(item.classVideo)}
            title={(() => {
              if (language === 'ar' && item.classNameArabic) return item.classNameArabic;
              if (language === 'en' && item.classNameEnglish) return item.classNameEnglish;
              return item.className;
            })()}
            variant="icon"
          />
        );
      default:
        return '—';
    }
  };

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev: ClassFilters) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.classNameSearch) count++;
    if (filters.codeSearch) count++;
    if (filters.category) count++;
    if (filters.quality) count++;
    return count;
  }, [filters]);

  // Auto-expand filters on mobile if there are active filters
  useEffect(() => {
    if (isMobileView && activeFilterCount > 0 && !filtersExpanded) {
      setFiltersExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileView, activeFilterCount]);

  return (
    <section className="panel catalog-panel">
      <div className={`card catalog-filters ${filtersExpanded || !isMobileView ? 'catalog-filters--expanded' : ''}`}>
        <div className="catalog-filters__header">
          <div className="catalog-filters__header-content">
            <div>
              <h2>{t('Search & Filters', 'البحث والتصفية', 'Búsqueda y Filtros', 'Arama ve Filtreler')}</h2>
              <p>{t(
                'Use flexible filters to focus on the categories and groups that fit the brief.',
                'استخدم خيارات التصفية للتركيز على الفئات المناسبة.',
                'Utiliza filtros flexibles para enfocarte en las categorías y grupos adecuados.',
                'İhtiyacınıza uygun kategori ve gruplara odaklanmak için esnek filtreleri kullanın.',
              )}
              </p>
            </div>
            {isMobileView && (
              <button
                type="button"
                className="catalog-filters__toggle"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                aria-expanded={filtersExpanded}
                aria-label={filtersExpanded ? t('Hide filters', 'إخفاء الفلاتر', 'Ocultar filtros') : t('Show filters', 'إظهار الفلاتر', 'Mostrar filtros')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className={`catalog-filters__content ${filtersExpanded || !isMobileView ? 'catalog-filters__content--visible' : ''}`}>
          <div className="catalog-filters__grid">
            <label>
              {t('Item Name', 'اسم المنتج', 'Nombre del producto', 'Ürün Adı')}
              <span className="catalog-filters__input-with-icon">
                <input
                  type="search"
                  name="classNameSearch"
                  value={filters.classNameSearch ?? ''}
                  onChange={handleFilterChange}
                  placeholder={t('Search by class name', 'ابحث باسم الصنف', 'Buscar por nombre del producto', 'Ürün adına göre ara')}
                />
                <button
                  type="button"
                  className="catalog-filters__input-icon catalog-filters__input-icon--btn"
                  onClick={scrollToResults}
                  aria-label={t('Go to results', 'الانتقال إلى النتائج', 'Ir a resultados', 'Sonuçlara git')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </span>
            </label>

            <label>
              {t('Code', 'الرمز', 'Código', 'Kod')}
              <span className="catalog-filters__input-with-icon">
                <input
                  type="search"
                  name="codeSearch"
                  value={filters.codeSearch ?? ''}
                  onChange={handleFilterChange}
                  placeholder={t('Search by code', 'ابحث بالرمز', 'Buscar por código', 'Koda göre ara')}
                />
                <button
                  type="button"
                  className="catalog-filters__input-icon catalog-filters__input-icon--btn"
                  onClick={scrollToResults}
                  aria-label={t('Go to results', 'الانتقال إلى النتائج', 'Ir a resultados', 'Sonuçlara git')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </span>
            </label>

            <label>
              {t('Category', 'الفئة', 'Categoría', 'Kategori')}
              <select
                name="category"
                value={filters.category ?? ''}
                onChange={handleFilterChange}
              >
                <option value="">{t('All', 'الكل', 'Todos', 'Tümü')}</option>
                {mainCategories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category, language)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t('Group', 'المجموعة', 'Grupo', 'Grup')}
              <select
                name="quality"
                value={filters.quality ?? ''}
                onChange={handleFilterChange}
              >
                <option value="">{t('All', 'الكل', 'Todos', 'Tümü')}</option>
                {groups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="catalog-filters__actions">
            {activeFilterCount > 0 && (
              <button type="button" className="secondary catalog-filters__clear" onClick={handleClearFilters}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {t('Clear Filters', 'إزالة الفلترة', 'Limpiar filtros', 'Filtreleri Temizle')}
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>
            {t('Loading catalog...', 'جاري تحميل الكتالوج...', 'Cargando catálogo...', 'Katalog yükleniyor...')}
          </p>
        </div>
      )}
      {error && (
        <div className="card" style={{ background: '#fef2f2', border: '2px solid #fecaca', padding: '1.5rem' }}>
          <p style={{ color: '#dc2626', margin: 0, fontWeight: 600 }}>
            {t('Failed to load catalog.', 'تعذر تحميل الكتالوج.', 'No se pudo cargar el catálogo.', 'Katalog yüklenemedi.')}
          </p>
        </div>
      )}
      {!isLoading && !error && !visibleClasses.length && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>
            {showOnlyFavorites
              ? t('No favorites yet', 'لا توجد مفضلات بعد', 'No hay favoritos aún', 'Henüz favori yok')
              : t('No products found', 'لم يتم العثور على منتجات', 'No se encontraron productos', 'Ürün bulunamadı')}
          </h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            {showOnlyFavorites
              ? t(
                  'Add items from the catalog to your favorites.',
                  'أضف منتجات من الكتالوج إلى المفضلة.',
                  'Añade productos del catálogo a favoritos.',
                  'Katalogdan ürünleri favorilere ekleyebilirsiniz.',
                )
              : t(
                  'Try adjusting your filters to see more results.',
                  'جرب تعديل الفلاتر لرؤية المزيد من النتائج.',
                  'Intenta ajustar tus filtros para ver más resultados.',
                  'Daha fazla sonuç görmek için filtreleri değiştirmeyi deneyin.',
                )}
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            {showOnlyFavorites ? (
              <button
                type="button"
                className="secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setShowOnlyFavorites(false)}
              >
                {t('Back to catalog', 'العودة إلى الكتالوج', 'Volver al catálogo', 'Ana menüye dön')}
              </button>
            ) : (
              <button
                type="button"
                className="secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setFilters({})}
              >
                {t('Show all products', 'عرض كل المنتجات', 'Ver todos los productos', 'Tüm ürünleri göster')}
              </button>
            )}
          </div>
        </div>
      )}

      {!isLoading && visibleClasses.length > 0 && (
        <div className="card catalog-table" ref={resultsRef}>
          <div className="catalog-table__header">
            <div>
              <h2>
                {t('Available Items', 'المنتجات المتاحة', 'Productos disponibles', 'Mevcut Ürünler')}
                {' '}
                ({visibleClasses.length})
              </h2>
              <p>{t(
                'High-level overview of every item.',
                ' نظرة شاملة على جميع المنتجات .',
                'Resumen detallado de cada producto.',
                'Tüm ürünlere yüksek seviyede genel bir bakış.',
              )}
              </p>
            </div>
          </div>
          <div className="catalog-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === 'table' ? 'active' : ''}
              aria-pressed={viewMode === 'table'}
              onClick={() => {
                setViewMode('table');
                setUserHasSelected(true);
                setShowOnlyFavorites(false);
              }}
            >
              {t('Table', 'جدول', 'Tabla', 'Tablo')}
            </button>
            <button
              type="button"
              className={viewMode === 'cards' ? 'active' : ''}
              aria-pressed={viewMode === 'cards'}
              onClick={() => {
                setViewMode('cards');
                setUserHasSelected(true);
                setShowOnlyFavorites(false);
              }}
            >
              {t('Cards', 'بطاقات', 'Tarjetas', 'Kartlar')}
            </button>
            <button
              type="button"
              className={showOnlyFavorites ? 'active' : ''}
              aria-pressed={showOnlyFavorites}
              onClick={() => setShowOnlyFavorites((prev) => !prev)}
            >
              {t('Favorites', 'المفضلة', 'Favoritos', 'Favoriler')}
            </button>
          </div>
          {viewMode === 'table' ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {tableColumns.map((key) => {
                      if (key === 'cart') {
                        return (
                          <th key="cart" className="cart-column">
                            {t('Cart', 'السلة', 'Carrito', 'Sepet')}
                          </th>
                        );
                      }
                      return <th key={key}>{columnLabels[key]}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleClasses.map((item: ClassRecord) => (
                    <tr key={item.id}>
                      {tableColumns.map((key) => {
                        if (key === 'cart') {
                          return (
                            <td key="cart" className={`cart-column ${isMobileView ? 'cart-column--mobile' : ''}`}>
                              {(() => {
                                const quantity = getCartQuantity(item.id);
                                const isExpanded = quantity > 0 || expandedControls[item.id];
                                if (!isExpanded) {
                                  return (
                                    <button
                                      type="button"
                                      className="cart-icon-trigger"
                                      onClick={async () => {
                                        await handleIncrease(item);
                                      }}
                                      aria-label={t('Add to cart', 'أضف إلى السلة', 'Añadir al carrito', 'Sepete ekle')}
                                    >
                                      <CartIconGlyph />
                                    </button>
                                  );
                                }
                                return (
                                  <div className="table-cart-control">
                                    <button
                                      type="button"
                                      className="table-cart-btn table-cart-btn--minus"
                                      onClick={async () => { await handleDecrease(item); }}
                                      aria-label={t('Decrease quantity', 'تقليل الكمية', 'Disminuir cantidad', 'Miktarı azalt')}
                                      disabled={quantity === 0}
                                    >
                                      −
                                    </button>
                                    <span className="table-cart-value">
                                      {quantity === 0 ? t('Add', 'إضافة', 'Agregar', 'Ekle') : quantity}
                                    </span>
                                    <button
                                      type="button"
                                      className="table-cart-btn table-cart-btn--plus"
                                      onClick={async () => { await handleIncrease(item); }}
                                      aria-label={t('Increase quantity', 'زيادة الكمية', 'Aumentar cantidad', 'Miktarı artır')}
                                    >
                                      +
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                          );
                        }

                        if (key === 'specialId') {
                          return (
                            <td key={key}>
                              <div className="table-cell-with-favorite">
                                <button
                                  type="button"
                                  className={`favorite-toggle ${isFavorite(item.id) ? 'favorite-toggle--active' : ''}`}
                                  onClick={() => toggleFavorite(item.id)}
                                  aria-label={isFavorite(item.id)
                                    ? t('Remove from favorites', 'إزالة من المفضلة', 'Quitar de favoritos', 'Favorilerden kaldır')
                                    : t('Add to favorites', 'إضافة إلى المفضلة', 'Agregar a favoritos', 'Favorilere ekle')}
                                >
                                  <HeartIcon active={isFavorite(item.id)} />
                                </button>
                                <button
                                  type="button"
                                  className="share-qr-toggle"
                                  onClick={() => navigate(`/items/${encodeURIComponent(item.specialId)}?share=1`)}
                                  aria-label={t('Share / QR', 'مشاركة / رمز QR', 'Compartir / QR', 'Paylaş / QR')}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
                                    <rect x="14" y="14" width="2" height="2" rx="0.4" />
                                    <rect x="18" y="14" width="2" height="2" rx="0.4" />
                                    <rect x="14" y="18" width="2" height="2" rx="0.4" />
                                    <rect x="18" y="18" width="2" height="2" rx="0.4" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="table-link"
                                  onClick={() => navigate(`/items/${encodeURIComponent(item.specialId)}`)}
                                >
                                  {renderCell(item, key)}
                                </button>
                              </div>
                            </td>
                          );
                        }

                        return <td key={key}>{renderCell(item, key)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="catalog-card-grid">
              {visibleClasses.map((item) => (
                <article key={item.id} className="catalog-card">
                  <div className="catalog-card__header-row">
                    <header className="catalog-card__header">
                        <span className="catalog-card__id">
                          {renderCell(item, 'specialId')}
                        </span>
                        <h3>
                          <button
                            type="button"
                            className="catalog-card__title-link"
                            onClick={() => navigate(`/items/${encodeURIComponent(item.specialId)}`)}
                          >
                            {renderCell(item, 'className') as React.ReactNode}
                          </button>
                        </h3>
                      {columnVisibility.quality && (
                        <p>{renderCell(item, 'quality')}</p>
                      )}
                    </header>
                    {columnVisibility.classVideo && (
                      <div className="catalog-card__video-wrapper">
                        <VideoPreview
                          src={resolveVideoSrc(item.classVideo)}
                          title={(() => {
                            if (language === 'ar' && item.classNameArabic) return item.classNameArabic;
                            if (language === 'en' && item.classNameEnglish) return item.classNameEnglish;
                            return item.className;
                          })()}
                          variant="card"
                        />
                        {item.classVideo && item.classVideo.startsWith('/uploads/') && (
                          <a
                            href={resolveVideoSrc(item.classVideo) || undefined}
                            download
                            className="catalog-card__download-link"
                          >
                            {t('Download video', 'تحميل الفيديو', 'Descargar video')}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="catalog-card__content">
                    <dl>
                      {columnVisibility.mainCategory && (
                        <div>
                          <dt>{t('Main Category', 'الفئة الرئيسية', 'Categoría Principal', 'Ana Kategori')}</dt>
                          <dd>{renderCell(item, 'mainCategory')}</dd>
                        </div>
                      )}
                      {columnVisibility.classFeatures && (
                        <div>
                          <dt>{t('Features', 'المميزات', 'Características', 'Özellikler')}</dt>
                          <dd>{renderCell(item, 'classFeatures')}</dd>
                        </div>
                      )}
                      {columnVisibility.classWeight && (
                        <div>
                          <dt>{t('Weight', 'الوزن', 'Peso', 'Ağırlık')}</dt>
                          <dd>{formatNumber(item.classWeight, 'kg')}</dd>
                        </div>
                      )}
                      {columnVisibility.classQuantity && (
                        <div>
                          <dt>{t('Quantity', 'الكمية', 'Cantidad', 'Miktar')}</dt>
                          <dd>{item.classQuantity !== null && item.classQuantity !== undefined ? String(item.classQuantity) : '—'}</dd>
                        </div>
                      )}
                      {columnVisibility.classPrice && (
                        <div>
                          <dt>{t('Price', 'السعر', 'Precio', 'Fiyat')}</dt>
                          <dd>
                            {item.classPrice !== null && item.classPrice !== undefined
                              ? `$${formatNumber(item.classPrice)}`
                              : t('Price on request', 'السعر عند الطلب', 'Precio a solicitud', 'Fiyat için iletişime geçin')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <div className="catalog-card__actions">
                    {(() => {
                      const quantity = getCartQuantity(item.id);
                      const isExpanded = quantity > 0 || expandedControls[item.id];

                      return (
                        <div className="card-actions-with-favorite">
                          <button
                            type="button"
                            className={`favorite-toggle favorite-toggle--inline ${isFavorite(item.id) ? 'favorite-toggle--active' : ''}`}
                            onClick={() => toggleFavorite(item.id)}
                            aria-label={isFavorite(item.id)
                              ? t('Remove from favorites', 'إزالة من المفضلة', 'Quitar de favoritos', 'Favorilerden kaldır')
                              : t('Add to favorites', 'إضافة إلى المفضلة', 'Agregar a favoritos', 'Favorilere ekle')}
                          >
                            <HeartIcon active={isFavorite(item.id)} />
                          </button>
                          <button
                            type="button"
                            className="share-qr-toggle share-qr-toggle--inline"
                            onClick={() => navigate(`/items/${encodeURIComponent(item.specialId)}?share=1`)}
                            aria-label={t('Share / QR', 'مشاركة / رمز QR', 'Compartir / QR', 'Paylaş / QR')}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
                              <rect x="14" y="14" width="2" height="2" rx="0.4" />
                              <rect x="18" y="14" width="2" height="2" rx="0.4" />
                              <rect x="14" y="18" width="2" height="2" rx="0.4" />
                              <rect x="18" y="18" width="2" height="2" rx="0.4" />
                            </svg>
                          </button>
                          {!isExpanded ? (
                            <button
                              type="button"
                              className="cart-icon-trigger cart-icon-trigger--card"
                              onClick={async () => {
                                await handleIncrease(item);
                              }}
                              aria-label={t('Add to cart', 'أضف إلى السلة', 'Añadir al carrito', 'Sepete ekle')}
                            >
                              <CartIconGlyph />
                            </button>
                          ) : (
                            <div className="card-cart-control">
                              <button
                                type="button"
                                className="card-cart-btn card-cart-btn--minus"
                                onClick={async () => { await handleDecrease(item); }}
                            aria-label={t('Decrease quantity', 'تقليل الكمية', 'Disminuir cantidad', 'Miktarı azalt')}
                                disabled={quantity === 0}
                              >
                                −
                              </button>
                              <span className="card-cart-value">
                                {quantity === 0
                                  ? isMobileView
                                    ? t('Add to cart', 'أضف إلى السلة', 'Añadir al carrito', 'Sepete ekle')
                                    : '0'
                                  : quantity}
                              </span>
                              <button
                                type="button"
                                className="card-cart-btn card-cart-btn--plus"
                                onClick={async () => { await handleIncrease(item); }}
                                aria-label={t('Increase quantity', 'زيادة الكمية', 'Aumentar cantidad', 'Miktarı artır')}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default UserPanel;

