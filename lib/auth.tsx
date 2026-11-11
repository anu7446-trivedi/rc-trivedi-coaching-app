import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  FirebaseAuthTypes, onAuthStateChanged, signInWithEmailAndPassword, signInWithPhoneNumber, signOut,
} from "@react-native-firebase/auth";
import { auth } from "./firebase";
import { ADMIN_EMAILS } from "../firebaseConfig";
import { getStudent, Student } from "./db";

type User = FirebaseAuthTypes.User;
type Ctx = {
  user: User | null;
  isAdmin: boolean;
  student: Student | null;
  loading: boolean;
  sendOtp: (mobile10: string) => Promise<void>;
  confirmOtp: (code: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);
const adminSet = new Set(ADMIN_EMAILS.map((e) => e.toLowerCase()));
const isAdminUser = (u: User | null) => !!u?.email && adminSet.has(u.email.toLowerCase());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmation = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const loadStudent = async (u: User | null) => {
    if (!u || isAdminUser(u)) return setStudent(null);
    try { setStudent(await getStudent(u.uid)); } catch { setStudent(null); }
  };

  // Pehle student profile load karo, phir user set karo — warna app galti se
  // "Apni Jaankari" (register) page khol deta tha jabki profile pehle se hai.
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setLoading(true);
    await loadStudent(u);
    setUser(u);
    setLoading(false);
  }), []);

  const value: Ctx = {
    user, isAdmin: isAdminUser(user), student, loading,
    sendOtp: async (mobile10) => {
      confirmation.current = await signInWithPhoneNumber(auth, `+91${mobile10}`);
    },
    confirmOtp: async (code) => {
      if (!confirmation.current) throw new Error("Pehle OTP mangwaiye.");
      await confirmation.current.confirm(code);
    },
    loginAdmin: async (email, password) => {
      if (!adminSet.has(email.trim().toLowerCase())) throw new Error("Ye email admin list me nahi hai.");
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    logout: () => signOut(auth),
    refreshStudent: () => loadStudent(auth.currentUser),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function authErrorHi(e: any): string {
  const c: string = e?.code ?? "";
  if (c.includes("invalid-verification-code")) return "OTP galat hai. Dobara dekh kar daalein.";
  if (c.includes("session-expired") || c.includes("code-expired")) return "OTP ka samay khatam ho gaya. Naya OTP mangwaiye.";
  if (c.includes("invalid-phone-number")) return "Mobile number sahi nahi hai.";
  if (c.includes("quota-exceeded")) return "Aaj ke OTP ki seema khatam ho gayi. Coaching se sampark karein.";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found"))
    return "Email ya Password galat hai.";
  if (c.includes("too-many-requests")) return "Bahut baar try hua. Thodi der baad try karein.";
  if (c.includes("network")) return "Internet connection check karein.";
  if (c.includes("permission-denied")) return "Permission nahi hai.";
  if (c.includes("app-not-authorized") || c.includes("missing-client-identifier"))
    return "OTP setup adhoora hai (Firebase me SHA key). Coaching se sampark karein.";
  return e?.message ?? "Kuch galat ho gaya.";
}
