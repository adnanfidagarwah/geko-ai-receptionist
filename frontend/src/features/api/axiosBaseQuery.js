import api from "../../lib/http";

export const axiosBaseQuery =
  () =>
  async ({ url, method = "GET", data, params }) => {
    try {
      const res = await api({ url, method, data, params });
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
