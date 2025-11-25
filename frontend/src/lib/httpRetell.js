import axios from "axios";
import { storeRef } from "./http";  // now it exists 🎯

const apiRetell = axios.create({
  baseURL: import.meta.env.VITE_RETELL_API_URL ?? "http://localhost:3300/retell",
  timeout: 15000,
});

apiRetell.interceptors.request.use(
  (config) => {
    const token = storeRef?.getState?.().auth?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiRetell.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && storeRef) {
      storeRef.dispatch({ type: "auth/logout" });
    }
    return Promise.reject(error);
  }
);

export default apiRetell;
