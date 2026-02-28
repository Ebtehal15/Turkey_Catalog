export const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (raw) {
    return normalizeBaseUrl(raw);
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  // If someone deploys frontend+backend on same origin, fall back to current origin.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

export const joinBaseUrl = (base: string, path: string) => {
  const normalizedBase = normalizeBaseUrl(base);
  const normalizedPath = path.replace(/^\//, '');
  return `${normalizedBase}/${normalizedPath}`;
};

