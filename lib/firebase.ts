import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { getFunctions } from "@react-native-firebase/functions";
import { getStorage } from "@react-native-firebase/storage";
import { FUNCTIONS_REGION } from "../firebaseConfig";

export const auth = getAuth();
export const db = getFirestore();
export const functions = getFunctions(getApp(), FUNCTIONS_REGION);
export const storage = getStorage();
