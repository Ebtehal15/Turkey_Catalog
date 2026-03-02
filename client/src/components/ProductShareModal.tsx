import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import useTranslate from '../hooks/useTranslate';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemOnlyUrl: string;
  itemWithSimilarUrl: string;
  productName?: string;
}

const ProductShareModal = ({
  isOpen,
  onClose,
  itemOnlyUrl,
  itemWithSimilarUrl,
  productName,
}: ProductShareModalProps) => {
  const { t } = useTranslate();
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'item' | 'item-with-similar'>('item');

  const currentUrl = mode === 'item' ? itemOnlyUrl : itemWithSimilarUrl;

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
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
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

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = `https://wa.me/?text=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
          <div className="share-modal__mode-toggle">
            <button
              type="button"
              className={`share-modal__mode-btn ${mode === 'item' ? 'share-modal__mode-btn--active' : ''}`}
              onClick={() => setMode('item')}
            >
              {t('Only this item', 'فقط هذا المنتج', 'Solo este producto', 'Sadece bu ürün')}
            </button>
            <button
              type="button"
              className={`share-modal__mode-btn ${mode === 'item-with-similar' ? 'share-modal__mode-btn--active' : ''}`}
              onClick={() => setMode('item-with-similar')}
            >
              {t('Item + similar items', 'المنتج + العناصر المشابهة', 'Producto + similares', 'Ürün + benzer ürünler')}
            </button>
          </div>
          <div className="share-modal__qr-wrap">
            <QRCodeCanvas ref={qrRef} value={currentUrl} size={200} level="M" />
          </div>
          {productName && (
            <p className="share-modal__product">{productName}</p>
          )}
          <p className="share-modal__url" title={currentUrl}>
            {currentUrl}
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
              className="share-modal__btn share-modal__btn--icon share-modal__btn--whatsapp"
              onClick={handleShareWhatsApp}
              aria-label={t('Share on WhatsApp', 'مشاركة عبر واتساب', 'Compartir por WhatsApp', 'WhatsApp ile paylaş')}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 12.2c0 5.2-4.2 9.3-9.3 9.3-1.6 0-3.1-.4-4.4-1.1L3 21.5l1.2-4.7C3.5 15.4 3.1 14 3.1 12.5 3.2 7.4 7.3 3.3 12.4 3.3h0.1c5.1 0 9.3 4.2 9.3 8.9z" />
                <path d="M9.5 8.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.4 1.9.8 2.3.7 2.7.6.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.2-.2-.2-.6-.4-.3-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.2-.7.7-.8.8-.2.1-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.8-1.4-1.8-1.6-2.1-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.4.1-.1.2-.2.2-.3.1-.1.1-.2.1-.3 0-.1-.1-.5-.3-.9z" fill="currentColor" stroke="none" />
              </svg>
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
