// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout, logoutUser } from "../features/auth/authSlice";
import { injectStore } from "../lib/http";
import { appApi } from "../features/api/appApi"; // normal /api
import { retellApi } from "../features/api/retellApi"; // new /retellRoutes

const logoutActionTypes = new Set([
  logout.type,
  logoutUser.fulfilled.type,
  logoutUser.rejected.type,
]);

const resetApiOnLogoutMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  if (logoutActionTypes.has(action.type)) {
    storeAPI.dispatch(appApi.util.resetApiState());
    storeAPI.dispatch(retellApi.util.resetApiState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [appApi.reducerPath]: appApi.reducer,
    [retellApi.reducerPath]: retellApi.reducer,
  },
  middleware: (gdm) =>
    gdm({ serializableCheck: false })
      .concat(resetApiOnLogoutMiddleware)
      .concat(appApi.middleware)
      .concat(retellApi.middleware),
});

injectStore(store, { logoutAction: logout });
export default store;
