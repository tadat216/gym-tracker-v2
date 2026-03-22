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

// Response interceptor: clear auth on 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (Axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/**
 * Orval custom mutator — translates fetch-style (url, init) to axios.
 * Orval generates: api<T>(url, { method, headers, body, signal })
 */
export const api = <T>(url: string, init?: RequestInit): Promise<T> =>
  axios
    .request<T>({
      url,
      method: init?.method,
      headers: init?.headers as Record<string, string>,
      data: init?.body,
      signal: init?.signal ?? undefined,
    })
    .then((response) => response.data as T);
