// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "../features/auth/authSlice";
import { injectStore } from "../lib/http";
import { appApi } from "../features/api/appApi";      // normal /api
import { retellApi } from "../features/api/retellApi"; // new /retellRoutes

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [appApi.reducerPath]: appApi.reducer,
    [retellApi.reducerPath]: retellApi.reducer,
  },
  middleware: (gdm) =>
    gdm({ serializableCheck: false })
      .concat(appApi.middleware)
      .concat(retellApi.middleware),
});

injectStore(store, { logoutAction: logout });
export default store;
