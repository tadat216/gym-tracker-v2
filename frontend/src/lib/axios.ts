import Axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: attach auth token
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: clear auth on 401/403
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401 || status === 403) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/**
 * Orval custom mutator — translates fetch-style (url, init) to axios.
 * Orval generates: api<T>(url, { method, headers, body, signal })
 *
 * Returns { data, status, headers } to match Orval's generated response
 * wrapper types (e.g. loginResponse200 = { data: TokenResponse, status: 200 }).
 */
export const api = <T>(url: string, init?: RequestInit): Promise<T> =>
  axios
    .request({
      url,
      method: init?.method,
      headers: init?.headers as Record<string, string>,
      data: init?.body,
      signal: init?.signal ?? undefined,
    })
    .then(
      (response) =>
        ({
          data: response.data,
          status: response.status,
          headers: response.headers,
        }) as T,
    );
