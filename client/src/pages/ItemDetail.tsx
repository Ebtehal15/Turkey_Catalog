import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ClassRecord } from '../types';
import { fetchClassByIdentifier } from '../api/classes';
import useTranslate from '../hooks/useTranslate';
import VideoPreview from '../components/VideoPreview';
import { getCategoryLabel } from '../constants/categories';
import { getApiBaseUrl, joinBaseUrl } from '../api/baseUrl';

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
  const { language, t } = useTranslate();

  const { data, isLoading, error } = useQuery<ClassRecord>({
    queryKey: ['classDetail', identifier],
    enabled: Boolean(identifier),
    queryFn: () => fetchClassByIdentifier(identifier ?? ''),
  });

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

  return (
    <section className="panel item-detail">
      <div className="item-detail__header">
        <button
          type="button"
          className="btn-link"
          onClick={() => navigate(-1)}
        >
          ←
          {' '}
          {t('Back to catalog', 'العودة إلى الكتالوج', 'Volver al catálogo')}
        </button>
      </div>

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
        </div>
      </div>
    </section>
  );
};

export default ItemDetail;

