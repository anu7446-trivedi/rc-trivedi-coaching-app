import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  Auth,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  // @ts-ignore — React Native build of firebase/auth exports this
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "../firebaseConfig";

export const isConfigured = !firebaseConfig.apiKey.startsWith("PASTE");

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function makeAuth(a: FirebaseApp, persist: boolean): Auth {
  try {
    if (Platform.OS === "web") return getAuth(a);
    return initializeAuth(a, {
      persistence: persist ? getReactNativePersistence(AsyncStorage) : inMemoryPersistence,
    });
  } catch {
    return getAuth(a);
  }
}

export const auth = makeAuth(app, true);
export const db = getFirestore(app);

// Secondary app: admin jab naya student account banata hai, to admin
// logout na ho isliye alag Firebase instance use hota hai.
let secondaryAuth: Auth | null = null;
export function getSecondaryAuth(): Auth {
  if (secondaryAuth) return secondaryAuth;
  const sec = getApps().find((x) => x.name === "secondary") ?? initializeApp(firebaseConfig, "secondary");
  secondaryAuth = makeAuth(sec, false);
  return secondaryAuth;
}
