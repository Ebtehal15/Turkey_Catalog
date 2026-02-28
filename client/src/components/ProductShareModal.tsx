import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import useTranslate from '../hooks/useTranslate';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productUrl: string;
  productName?: string;
}

const ProductShareModal = ({ isOpen, onClose, productUrl, productName }: ProductShareModalProps) => {
  const { t } = useTranslate();
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

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

  const handleDownloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    const fileName = productName ? `qr-${productName.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40)}` : 'qr-product';
    a.download = `${fileName}.png`;
    a.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            <QRCodeCanvas ref={qrRef} value={productUrl} size={220} level="M" />
          </div>
          {productName && (
            <p className="share-modal__product">{productName}</p>
          )}
          <p className="share-modal__url" title={productUrl}>
            {productUrl}
          </p>
          <div className="share-modal__actions">
            <button
              type="button"
              className="share-modal__btn share-modal__btn--primary"
              onClick={handleDownloadQR}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('Download QR', 'تحميل QR', 'Descargar QR', 'QR İndir')}
            </button>
            <button
              type="button"
              className={`share-modal__btn share-modal__btn--secondary ${copied ? 'share-modal__btn--success' : ''}`}
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('Copied!', 'تم النسخ!', '¡Copiado!', 'Kopyalandı!')}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {t('Copy link', 'نسخ الرابط', 'Copiar enlace', 'Linki kopyala')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShareModal;
