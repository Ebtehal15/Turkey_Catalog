import axios from 'axios';
import { getApiBaseUrl } from './baseUrl';

const baseURL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Session cookie'leri için gerekli
});

// Request interceptor - giden istekleri logla
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, config.data);
      console.log('🔧 Request config:', {
        withCredentials: config.withCredentials,
        baseURL: config.baseURL,
      });
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - gelen cevapları logla
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.status, response.config.url, response.data);
      console.log('🔧 Response headers:', {
        'set-cookie': response.headers['set-cookie'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;


















