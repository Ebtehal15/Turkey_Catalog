import type { SupportedLanguage } from '../context/LanguageContext';

interface CategoryDefinition {
  key: string;
  ar: string;
  tr: string;
  en: string;
  aliases?: string[];
}

const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'shoes',
    ar: 'أحذية',
    tr: 'Ayakkabı',
    en: 'Shoes',
  },
  {
    key: 'underwear',
    ar: 'ألبسة داخلية',
    tr: 'İç Giyim',
    en: 'Underwear',
  },
  {
    key: 'toys',
    ar: 'ألعاب',
    tr: 'Oyuncak',
    en: 'Toys',
  },
  {
    key: 'trousers',
    ar: 'بنطلون',
    tr: 'Pantolon',
    en: 'Trousers / Pants',
    aliases: ['Trousers', 'Pants'],
  },
  {
    key: 'winterPolo',
    ar: 'بولو شتوي',
    tr: 'Kışlık Polo (Uzun Kollu)',
    en: 'Winter Polo Shirt',
  },
  {
    key: 'summerTshirt',
    ar: 'تي شيرت صيفي',
    tr: 'Yazlık Tişört',
    en: 'Summer T-shirt',
    aliases: ['Summer T-shirt', 'Summer T-shirt', 'Summer Tshirt'],
  },
  {
    key: 'jacket',
    ar: 'جاكيت',
    tr: 'Ceket / Mont',
    en: 'Jacket',
  },
  {
    key: 'bagsBelts',
    ar: 'حقائب + كمر',
    tr: 'Çanta + Kemer',
    en: 'Bags + Belts',
  },
  {
    key: 'sportswear',
    ar: 'رياضة',
    tr: 'Spor Giyim',
    en: 'Sportswear',
  },
  {
    key: 'homeFurniture',
    ar: 'عفش منزلي',
    tr: 'Ev Mobilyası',
    en: 'Home Furniture',
    aliases: ['House Hold', 'Household'],
  },
  {
    key: 'dressSkirt',
    ar: 'فستان + تنورة',
    tr: 'Elbise + Etek',
    en: 'Dress + Skirt',
  },
  {
    key: 'shirt',
    ar: 'قميص',
    tr: 'Gömlek',
    en: 'Shirt',
  },
  {
    key: 'sweater',
    ar: 'كنزة صوف',
    tr: 'Kazak (Yünlü)',
    en: 'Sweater / Jumper',
    aliases: ['Sweater', 'Jumper'],
  },
  {
    key: 'babywear',
    ar: 'بيبي (ملابس أطفال)',
    tr: 'Bebek Giyim',
    en: 'Babywear',
    aliases: ['Baby', 'Baby Clothes', 'Baby wear'],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

export const getCategoryLabel = (
  raw: string | null | undefined,
  language: SupportedLanguage,
): string => {
  if (!raw) {
    return '—';
  }

  const norm = normalize(raw);

  const match = CATEGORIES.find((cat) => {
    const variants = [
      cat.ar,
      cat.tr,
      cat.en,
      ...(cat.aliases ?? []),
    ];
    return variants.some((v) => normalize(v) === norm);
  });

  if (!match) {
    return raw;
  }

  if (language === 'ar') {
    return match.ar;
  }

  if (language === 'tr') {
    return match.tr;
  }

  // For English, Spanish ve diğer diller için şimdilik İngilizce kullan
  return match.en;
};

