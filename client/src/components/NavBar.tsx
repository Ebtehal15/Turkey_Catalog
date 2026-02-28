import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation, useSearchParams } from 'react-router-dom';
import logoUrl from '../assets/ajlogo.png';
import { useAdminAccess } from '../context/AdminAccessContext';
import { usePassword } from '../context/PasswordContext';
import useTranslate from '../hooks/useTranslate';
import type { SupportedLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import CartSummary from './CartSummary';

const isSharedItemPath = (pathname: string) => /^\/items\/[^/]+$/.test(pathname);

const NavBar = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { role } = usePassword();
  const { isAdmin } = useAdminAccess();
  const { language, t, setLanguage } = useTranslate();
  const { totalItems } = useCart();
  const isStandaloneUrl = searchParams.get('standalone') === '1';
  const isSharedView = isSharedItemPath(pathname) && (role === 'none' || isStandaloneUrl);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCartOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (!isLangDropdownOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLangDropdownOpen]);

  const labels = {
    brand: t('AJ International Group', 'AJ International Group', 'AJ International Group', 'AJ International Group'),
    catalog: t('Product Catalog', 'كتالوج المنتجات', 'Catálogo', 'Ürün Kataloğu'),
    admin: t('Admin', 'الإدارة', 'Administración', 'Yönetim'),
  };

  const languageOptions: Array<{ code: SupportedLanguage; label: string; aria: string }> = [
    { code: 'en', label: 'EN', aria: 'English' },
    { code: 'ar', label: 'AR', aria: 'العربية' },
    { code: 'tr', label: 'TR', aria: 'Türkçe' },
    { code: 'es', label: 'ES', aria: 'Español' },
  ];

  const renderLangSelector = () => (
    <div
      className={`nav__lang-group ${isSharedView ? 'nav__lang-group--beside-title' : ''}`}
      ref={langDropdownRef}
    >
      <button
        type="button"
        className="nav__lang-btn nav__lang-btn--dropdown-trigger"
        onClick={() => setLangDropdownOpen(!isLangDropdownOpen)}
        aria-label={t('Select language', 'اختر اللغة', 'Seleccionar idioma')}
        aria-expanded={isLangDropdownOpen}
      >
        {languageOptions.find((opt) => opt.code === language)?.label || 'EN'}
        <span className="nav__lang-dropdown-arrow" aria-hidden="true">
          {isLangDropdownOpen ? '▲' : '▼'}
        </span>
      </button>
      {isLangDropdownOpen && (
        <div className="nav__lang-dropdown">
          {languageOptions.map(({ code, label, aria }) => (
            <button
              key={code}
              type="button"
              className={`nav__lang-dropdown-item ${language === code ? 'nav__lang-dropdown-item--active' : ''}`}
              onClick={() => {
                setLanguage(code);
                setLangDropdownOpen(false);
              }}
              aria-label={aria}
            >
              {label}
              <span className="nav__lang-dropdown-label">{aria}</span>
            </button>
          ))}
        </div>
      )}
      <div className="nav__lang-group--desktop">
        {languageOptions.map(({ code, label, aria }) => (
          <button
            key={code}
            type="button"
            className={`nav__lang-btn ${language === code ? 'nav__lang-btn--active' : ''}`}
            onClick={() => setLanguage(code)}
            aria-label={aria}
            title={aria}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <header className="nav">
      <div className="nav__brand">
        {!isSharedView ? (
          <Link to="/catalog" className="nav__brand-link">
            <img src={logoUrl} alt="Product Catalog logo" />
            <span>{labels.brand}</span>
          </Link>
        ) : (
          <>
            <img src={logoUrl} alt="Product Catalog logo" />
            <span>{labels.brand}</span>
          </>
        )}
        {isSharedView && renderLangSelector()}
      </div>
      <nav className="nav__links">
        {!isSharedView && (
          <>
            <NavLink
              to="/catalog"
              className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
            >
              {labels.catalog}
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
              >
                {labels.admin}
              </NavLink>
            )}
          </>
        )}
        {!isSharedView && (
          <div className="nav__cart" ref={cartRef}>
            <button
              type="button"
              className="nav__cart-btn"
              onClick={() => setCartOpen((prev) => !prev)}
              aria-expanded={isCartOpen}
              aria-label={t('Cart', 'السلة', 'Carrito')}
            >
              <span className="nav__cart-icon" aria-hidden="true">
                🛒
              </span>
              <span className="nav__cart-count">{totalItems}</span>
            </button>
            {isCartOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <>
                  <div className="nav__cart-overlay" onClick={() => setCartOpen(false)} />
                  <div className="nav__cart-popover" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="nav__cart-close"
                      onClick={() => setCartOpen(false)}
                      aria-label={t('Close cart', 'إغلاق السلة', 'Cerrar carrito')}
                    >
                      ×
                    </button>
                    <CartSummary />
                  </div>
                </>,
                document.body,
              )}
          </div>
        )}
        {!isSharedView && renderLangSelector()}
      </nav>
    </header>
  );
};

export default NavBar;
