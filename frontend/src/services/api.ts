import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const GALLERY_UPLOAD_PREFIX = '/uploads/gallery/';

/**
 * Public URL for landing-page/admin gallery images.
 * Sensitive operational documents are fetched through authenticated blob
 * requests instead of direct links.
 */
export function getFileUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const base = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedPath.startsWith('/gallery/files/')) {
    return `${base}${normalizedPath}`;
  }

  if (normalizedPath.startsWith(GALLERY_UPLOAD_PREFIX)) {
    const fileName = normalizedPath.slice(GALLERY_UPLOAD_PREFIX.length);
    return `${base}/gallery/files/${encodeURIComponent(fileName)}`;
  }

  return `${base}${normalizedPath}`;
}

/**
 * Fetch a protected file with the caller's JWT and open it in a new tab.
 * This keeps uploads private even though the auth token lives in localStorage
 * and cannot be attached to plain <a href> navigation.
 */
export async function openProtectedFile(path?: string | null): Promise<void> {
  if (!path) return;

  const pendingWindow = window.open('', '_blank');

  try {
    const blob = await api.get<Blob>('/files/view', {
      params: { path },
      responseType: 'blob',
    });

    const blobUrl = URL.createObjectURL(blob);

    if (pendingWindow) {
      pendingWindow.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    if (pendingWindow) {
      pendingWindow.close();
    }
    throw error;
  }
}

export const apiBaseUrl = API_BASE_URL;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
       if (
              error.response?.status === 401 &&
              !error.config?.url?.includes('/auth/change-password')
            ) {
              localStorage.removeItem('jwt_token');
              localStorage.removeItem('user');
              window.location.href = '/admin/login';
            }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.get<T>(url, config).then(res => res.data);
  }
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.api.post<T>(url, data, config).then(res => res.data);
  }
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.api.put<T>(url, data, config).then(res => res.data);
  }
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.delete<T>(url, config).then(res => res.data);
  }
}

export const api = new ApiService();
