import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useTranslate from '../hooks/useTranslate';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productUrl: string;
  productName?: string;
}

const ProductShareModal = ({ isOpen, onClose, productUrl, productName }: ProductShareModalProps) => {
  const { t } = useTranslate();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="share-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Share product', 'مشاركة المنتج', 'Compartir producto', 'Ürünü paylaş')}
    >
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <h2>{t('Share product with QR code', 'شارك المنتج عبر رمز QR', 'Compartir producto con código QR', 'Ürünü QR kod ile paylaş')}</h2>
          <button
            type="button"
            className="share-modal__close"
            onClick={onClose}
            aria-label={t('Close', 'إغلاق', 'Cerrar', 'Kapat')}
          >
            ×
          </button>
        </div>
        <div className="share-modal__body">
          <p className="share-modal__hint">
            {t(
              'Scan the QR code to open this product on your phone.',
              'امسح الرمز لفتح هذا المنتج على هاتفك.',
              'Escanea el código QR para abrir este producto en tu móvil.',
              'Bu ürünü telefonunuzda açmak için QR kodu tarayın.',
            )}
          </p>
          <div className="share-modal__qr-wrap">
            <QRCodeSVG value={productUrl} size={220} level="M" />
          </div>
          {productName && (
            <p className="share-modal__product">{productName}</p>
          )}
          <p className="share-modal__url" title={productUrl}>
            {productUrl}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductShareModal;
