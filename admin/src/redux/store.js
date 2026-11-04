
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
//import storage from "redux-persist/lib/storage"; // localStorage for web
import userReducer from "./reducer/userReducer";


import storage from "redux-persist/lib/storage";

// 🔥 FIX (IMPORTANT)
const fixedStorage = storage?.default ? storage.default : storage;

// 🔥 ADD THIS LINE (IMPORTANT)
// const persistStorage = storage;
import { userApi } from "./api/userApi";

import { personnelApi } from "./api/personnelApi";
import { uploadApi } from "./api/uploadApi";
import { dashboardApi } from "./api/dashboardApi";




// ✅ Combine reducers
const rootReducer = combineReducers({
  
  
 
   user: userReducer,
  [userApi.reducerPath]: userApi.reducer,

 [uploadApi.reducerPath]: uploadApi.reducer,
  [personnelApi.reducerPath]: personnelApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
 
 
 
});

// ✅ Persist config (only persist user slice)
const persistConfig = {
  key: "root",
  storage: fixedStorage, // use the fixed storage
  whitelist: ["user"], // only user slice is persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required by redux-persist
    }).concat(
      
      userApi.middleware,
      
      uploadApi.middleware,
      personnelApi.middleware,
      dashboardApi.middleware
     
    ),
});

export const persistor = persistStore(store);
export default store;
