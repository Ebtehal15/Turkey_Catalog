import type { ColumnKey, ColumnVisibility } from '../types';
import type { SupportedLanguage } from '../context/LanguageContext';

const columnLabelMap: Record<ColumnKey, Record<SupportedLanguage, string>> = {
  specialId: {
    en: 'Special ID',
    ar: 'كود الصنف',
    es: 'ID Especial',
    tr: 'Özel ID',
  },
  mainCategory: {
    en: 'Category',
    ar: 'الفئة',
    es: 'Categoría',
    tr: 'Kategori',
  },
  quality: {
    en: 'Group',
    ar: 'المجموعة',
    es: 'Grupo',
    tr: 'Grup',
  },
  className: {
    en: 'Item Name',
    ar: 'اسم المنتج',
    es: 'Nombre del producto',
    tr: 'Ürün Adı',
  },
  classNameArabic: {
    en: 'Class Name (Arabic)',
    ar: 'اسم الصنف (عربي)',
    es: 'Nombre (Árabe)',
    tr: 'Sınıf Adı (Arapça)',
  },
  classNameEnglish: {
    en: 'Class Name (English)',
    ar: 'اسم الصنف (إنجليزي)',
    es: 'Nombre (Inglés)',
    tr: 'Sınıf Adı (İngilizce)',
  },
  classFeatures: {
    en: 'Features',
    ar: 'المميزات',
    es: 'Características',
    tr: 'Özellikler',
  },
  classWeight: {
    en: 'Weight (kg)',
    ar: 'الوزن (كجم)',
    es: 'Peso (kg)',
    tr: 'Ağırlık (kg)',
  },
  classQuantity: {
    en: 'Quantity',
    ar: 'الكمية',
    es: 'Cantidad',
    tr: 'Miktar',
  },
  classPrice: {
    en: 'Price',
    ar: 'السعر',
    es: 'Precio',
    tr: 'Fiyat',
  },
  classVideo: {
    en: 'Video',
    ar: 'فيديو',
    es: 'Video',
    tr: 'Video',
  },
};

export const getColumnLabel = (key: ColumnKey, language: SupportedLanguage = 'en'): string => (
  columnLabelMap[key]?.[language] ?? columnLabelMap[key]?.en ?? key
);

export const buildColumnLabels = (
  language: SupportedLanguage = 'en',
): Record<ColumnKey, string> => (
  orderedColumns.reduce((acc, key) => {
    acc[key] = getColumnLabel(key, language);
    return acc;
  }, {} as Record<ColumnKey, string>)
);

export const orderedColumns: ColumnKey[] = [
  'specialId',
  'mainCategory',
  'quality',
  'className',
  'classNameArabic',
  'classNameEnglish',
  'classFeatures',
  'classWeight',
  'classQuantity',
  'classPrice',
  'classVideo',
];

export const columnOptions = orderedColumns.map((key) => ({ key }));

export const defaultColumnVisibility: ColumnVisibility = orderedColumns.reduce((acc, key) => {
  acc[key] = key !== 'classNameArabic' && key !== 'classNameEnglish';
  return acc;
}, {} as ColumnVisibility);

export const normalizeColumnVisibility = (visibility?: Partial<ColumnVisibility> | null): ColumnVisibility => {
  const normalized: ColumnVisibility = { ...defaultColumnVisibility };
  if (visibility && typeof visibility === 'object') {
    orderedColumns.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(visibility, key)) {
        normalized[key] = Boolean(visibility[key]);
      }
    });
  }
  if (!orderedColumns.some((key) => normalized[key])) {
    return { ...defaultColumnVisibility };
  }
  return normalized;
};
