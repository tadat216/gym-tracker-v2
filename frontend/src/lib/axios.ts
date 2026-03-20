import Axios, { type AxiosRequestConfig } from "axios";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const api = <T>(config: AxiosRequestConfig): Promise<T> =>
  axios(config).then((response) => response.data);
