import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ClassRecord } from '../types';
import { fetchClassByIdentifier, fetchClasses } from '../api/classes';
import useTranslate from '../hooks/useTranslate';
import { usePassword } from '../context/PasswordContext';
import VideoPreview from '../components/VideoPreview';
import { getCategoryLabel } from '../constants/categories';
import { getApiBaseUrl, joinBaseUrl } from '../api/baseUrl';
import ProductShareModal from '../components/ProductShareModal';

const API_BASE_URL = getApiBaseUrl();

const resolveVideoSrc = (value?: string | null) => {
  if (!value) return null;
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }
  return joinBaseUrl(API_BASE_URL, value);
};

const ItemDetail = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { role } = usePassword();
  const { language, t } = useTranslate();
  const [searchParams] = useSearchParams();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const isStandaloneUrl = searchParams.get('standalone') === '1';
  const shareMode = searchParams.get('mode');
  const isSharedView = role === 'none' || isStandaloneUrl;

  useEffect(() => {
    if (searchParams.get('share') === '1') {
      setShareModalOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery<ClassRecord>({
    queryKey: ['classDetail', identifier],
    enabled: Boolean(identifier),
    queryFn: () => fetchClassByIdentifier(identifier ?? ''),
  });

  const { data: similarClasses = [] } = useQuery<ClassRecord[]>({
    queryKey: ['classes', 'similar', data?.mainCategory],
    enabled: Boolean(data?.mainCategory),
    queryFn: () => fetchClasses({ category: data!.mainCategory }),
  });

  const similarWithVideo = useMemo(() => {
    if (!data || !similarClasses.length) return [];
    return similarClasses
      .filter((item) => item.specialId !== data.specialId && item.classVideo)
      .slice(0, 12);
  }, [data, similarClasses]);

  const shouldShowSimilar = !isStandaloneUrl || shareMode === 'item-with-similar';

  const similarScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const didDrag = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const handleSimilarPointerDown = useCallback((e: React.PointerEvent) => {
    const el = similarScrollRef.current;
    if (!el) return;
    pointerIdRef.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    didDrag.current = false;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
  }, []);

  const handleSimilarPointerMove = useCallback((e: React.PointerEvent) => {
    const el = similarScrollRef.current;
    if (!el || pointerIdRef.current === null) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 3) didDrag.current = true;
    el.scrollLeft = dragStart.current.scrollLeft - dx;
  }, []);

  const handleSimilarPointerUp = useCallback(() => {
    const el = similarScrollRef.current;
    if (el && pointerIdRef.current !== null) {
      try { el.releasePointerCapture(pointerIdRef.current); } catch {}
      pointerIdRef.current = null;
    }
    setIsDragging(false);
  }, []);

  const handleSimilarCardClick = useCallback((e: React.MouseEvent, item: ClassRecord) => {
    if (didDrag.current) {
      e.preventDefault();
      return;
    }
    navigate(`/items/${encodeURIComponent(item.specialId)}`);
  }, [navigate]);

  const scrollSimilarBy = useCallback((delta: number) => {
    const el = similarScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const title = useMemo(() => {
    if (!data) return '';
    if (language === 'ar' && data.classNameArabic) return data.classNameArabic;
    if (language === 'en' && data.classNameEnglish) return data.classNameEnglish;
    return data.className;
  }, [data, language]);

  if (isLoading) {
    return (
      <section className="panel">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>
            {t('Loading item details...', 'جاري تحميل تفاصيل المنتج...', 'Cargando detalles del producto...')}
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="panel">
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ color: '#dc2626', margin: 0, fontWeight: 600 }}>
            {t('Item not found.', 'لم يتم العثور على المنتج.', 'Producto no encontrado.')}
          </p>
        </div>
      </section>
    );
  }

  const baseShareUrl = typeof window !== 'undefined' && identifier
    ? `${window.location.origin}/items/${encodeURIComponent(identifier)}`
    : '';

  const itemOnlyUrl = baseShareUrl
    ? `${baseShareUrl}?standalone=1&mode=item`
    : '';

  const itemWithSimilarUrl = baseShareUrl
    ? `${baseShareUrl}?standalone=1&mode=item-with-similar`
    : '';

  return (
    <section className="panel item-detail">
      <div className="item-detail__header">
        {!isSharedView && (
          <button
            type="button"
            className="btn-link"
            onClick={() => navigate(-1)}
          >
            ←
            {' '}
            {t('Back to catalog', 'العودة إلى الكتالوج', 'Volver al catálogo')}
          </button>
        )}
        {baseShareUrl && (
          <button
            type="button"
            className="item-detail__share-btn"
            onClick={() => setShareModalOpen(true)}
            aria-label={t('Share product', 'مشاركة المنتج', 'Compartir producto', 'Ürünü paylaş')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            {t('Share / QR', 'مشاركة / رمز QR', 'Compartir / QR', 'Paylaş / QR')}
          </button>
        )}
      </div>

      <ProductShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        itemOnlyUrl={itemOnlyUrl}
        itemWithSimilarUrl={itemWithSimilarUrl}
        productName={title}
      />

      <div className="card item-detail__card">
        <header className="item-detail__card-header">
          <div>
            <span className="item-detail__id">
              {data.specialId}
            </span>
            <h1 className="item-detail__title">
              {title}
            </h1>
            {(data.classNameArabic || data.classNameEnglish) && (
              <p className="item-detail__title-alt">
                {data.classNameArabic || data.classNameEnglish}
              </p>
            )}
          </div>
          {data.classVideo && (
            <div className="item-detail__video">
              <VideoPreview
                src={resolveVideoSrc(data.classVideo)}
                title={title}
                variant="card"
              />
            </div>
          )}
        </header>

        <div className="item-detail__body">
          <dl className="item-detail__grid">
            <div>
              <dt>{t('Category', 'الفئة', 'Categoría')}</dt>
              <dd>{getCategoryLabel(data.mainCategory, language)}</dd>
            </div>
            <div>
              <dt>{t('Group', 'المجموعة', 'Grupo')}</dt>
              <dd>{data.quality}</dd>
            </div>
            <div>
              <dt>{t('Weight', 'الوزن', 'Peso')}</dt>
              <dd>{data.classWeight ? `${data.classWeight} kg` : '—'}</dd>
            </div>
            <div>
              <dt>{t('Price', 'السعر', 'Precio')}</dt>
              <dd>{data.classPrice != null ? `$${data.classPrice}` : t('Price on request', 'السعر عند الطلب', 'Precio a solicitud')}</dd>
            </div>
          </dl>

          {data.classFeatures && (
            <div className="item-detail__features">
              <h2>{t('Features', 'المميزات', 'Características')}</h2>
              <p>{data.classFeatures}</p>
            </div>
          )}

          {shouldShowSimilar && similarWithVideo.length > 0 && (
            <div className="item-detail__similar">
              <h2 className="item-detail__similar-heading">
                <span className="item-detail__similar-emoji">✨</span>
                {t('Similar items', 'عناصر مشابهة', 'Elementos similares', 'Benzer öğeler')}
              </h2>
              <div className="item-detail__similar-nav-wrap">
                <button
                  type="button"
                  className="item-detail__similar-arrow item-detail__similar-arrow--prev"
                  onClick={() => scrollSimilarBy(-220)}
                  aria-label={t('Scroll left', 'تمرير لليسار', 'Desplazar a la izquierda', 'Sola kaydır')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div
                  ref={similarScrollRef}
                  className={`item-detail__similar-scroll-wrap ${isDragging ? 'item-detail__similar-scroll-wrap--dragging' : ''}`}
                  onPointerDown={handleSimilarPointerDown}
                  onPointerMove={handleSimilarPointerMove}
                  onPointerUp={() => handleSimilarPointerUp()}
                  onPointerLeave={() => handleSimilarPointerUp()}
                >
                <div className="item-detail__similar-track">
                  {similarWithVideo.map((item) => {
                    const itemTitle = language === 'ar' && item.classNameArabic ? item.classNameArabic : (language === 'en' && item.classNameEnglish ? item.classNameEnglish : item.className);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="item-detail__similar-card"
                        onClick={(e) => handleSimilarCardClick(e, item)}
                      >
                        <div className="item-detail__similar-video">
                          <VideoPreview
                            src={resolveVideoSrc(item.classVideo)}
                            title={itemTitle}
                            variant="card"
                          />
                        </div>
                        <div className="item-detail__similar-meta">
                          <span className="item-detail__similar-code">{item.specialId}</span>
                          <span className="item-detail__similar-group">{item.quality || '—'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                </div>
                <button
                  type="button"
                  className="item-detail__similar-arrow item-detail__similar-arrow--next"
                  onClick={() => scrollSimilarBy(220)}
                  aria-label={t('Scroll right', 'تمرير لليمين', 'Desplazar a la derecha', 'Sağa kaydır')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ItemDetail;

