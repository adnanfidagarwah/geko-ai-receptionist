import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../lib/http";

const storageAvailable = typeof window !== "undefined" && window.localStorage;
const TOKEN_KEY = "ra.auth.token";
const USER_KEY = "ra.auth.user";

const readStoredAuth = () => {
  if (!storageAvailable) {
    return { token: null, user: null };
  }

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const userRaw = window.localStorage.getItem(USER_KEY);
    return {
      token,
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const writeStoredAuth = ({ token, user }) => {
  if (!storageAvailable) return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Silently ignore storage exceptions (quota, privacy mode, etc.)
  }
};

const { token: storedToken, user: storedUser } = readStoredAuth();

const initialState = {
  token: storedToken,
  user: storedUser,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      if (!data) {
        throw new Error("Empty response from server");
      }
      return data;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unable to sign in. Please try again.";
      return rejectWithValue(message);
    }
  },
);

export const registerOwner = createAsyncThunk(
  "auth/registerOwner",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register-owner", payload);
      if (!data) {
        throw new Error("Empty response from server");
      }
      return data;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unable to sign up. Please try again.";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      return true;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unable to sign out. Please try again.";
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      writeStoredAuth({ token: null, user: null });
    },
    setCredentials: (state, action) => {
      state.token = action.payload?.token ?? null;
      state.user = action.payload?.user ?? null;
      writeStoredAuth({ token: state.token, user: state.user });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        const token = action.payload?.token ?? null;
        const user = action.payload?.user ?? null;
        state.token = token;
        state.user = user;
        writeStoredAuth({ token, user });
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Authentication failed";
        state.token = null;
        state.user = null;
        writeStoredAuth({ token: null, user: null });
      });
    builder
      .addCase(registerOwner.pending, (state) => {
        state.status = "registering";
        state.error = null;
      })
      .addCase(registerOwner.fulfilled, (state, action) => {
        state.status = "succeeded";
        const token = action.payload?.token ?? null;
        const user = action.payload?.user ?? null;
        state.token = token;
        state.user = user;
        writeStoredAuth({ token, user });
      })
      .addCase(registerOwner.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Sign up failed";
        state.token = null;
        state.user = null;
        writeStoredAuth({ token: null, user: null });
      });
    builder
      .addCase(logoutUser.pending, (state) => {
        state.status = "loggingOut";
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "idle";
        state.token = null;
        state.user = null;
        state.error = null;
        writeStoredAuth({ token: null, user: null });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "idle";
        state.error = null;
        state.token = null;
        state.user = null;
        writeStoredAuth({ token: null, user: null });
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectAuthStatus = (state) => state.auth.status;

export default authSlice.reducer;
