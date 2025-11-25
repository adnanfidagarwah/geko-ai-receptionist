// src/features/api/axiosBaseQueryRetell.js
import apiRetell from "../../lib/httpRetell";

export const axiosBaseQueryRetell =
  () =>
  async ({ url, method = "GET", data, params, responseType }) => {
    try {
      const res = await apiRetell({
        url,
        method,
        data,
        params,
        // 👇 forward responseType to Axios
        responseType: responseType || "json",
      });

      return { data: res.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status ?? 500,
          data: err.response?.data ?? err.message ?? "Request failed",
        },
      };
    }
  };
