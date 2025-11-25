import axios from "axios";

export let storeRef = null;   // ← ADD THIS LINE
let logoutActionCreator = null;

export const injectStore = (store, { logoutAction } = {}) => {
  storeRef = store;
  logoutActionCreator = logoutAction ?? null;
};

// rest of your file same
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3300/api",
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = storeRef?.getState?.().auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 && storeRef) {
      if (logoutActionCreator) {
        storeRef.dispatch(logoutActionCreator());
      } else {
        storeRef.dispatch({ type: "auth/logout" });
      }
    }
    return Promise.reject(error);
  },
);

export default api;
