import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, isConfigured } from "./firebase";
import { ADMIN_EMAILS } from "../firebaseConfig";
import { getStudent, mobileToEmail, Student } from "./db";

type Ctx = {
  user: User | null;
  isAdmin: boolean;
  student: Student | null;
  loading: boolean;
  loginStudent: (mobile: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

const adminSet = new Set(ADMIN_EMAILS.map((e) => e.toLowerCase()));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  const isAdmin = !!user?.email && adminSet.has(user.email.toLowerCase());

  const loadStudent = async (u: User | null) => {
    if (!u || (u.email && adminSet.has(u.email.toLowerCase()))) return setStudent(null);
    try { setStudent(await getStudent(u.uid)); } catch { setStudent(null); }
  };

  useEffect(() => {
    if (!isConfigured) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await loadStudent(u);
      setLoading(false);
    });
  }, []);

  const value: Ctx = {
    user, isAdmin, student, loading,
    loginStudent: async (mobile, password) => {
      const cred = await signInWithEmailAndPassword(auth, mobileToEmail(mobile), password);
      const s = await getStudent(cred.user.uid);
      if (!s || !s.active) {
        await signOut(auth);
        throw new Error("Aapka account active nahi hai. Coaching se sampark karein.");
      }
      setStudent(s);
    },
    loginAdmin: async (email, password) => {
      if (!adminSet.has(email.trim().toLowerCase())) throw new Error("Ye email admin list me nahi hai (firebaseConfig.ts).");
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    logout: () => signOut(auth),
    refreshStudent: () => loadStudent(user),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function authErrorHi(e: any): string {
  const c: string = e?.code ?? "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found"))
    return "Mobile/Email ya Password galat hai.";
  if (c.includes("email-already-in-use")) return "Is mobile number ka account pehle se bana hua hai.";
  if (c.includes("weak-password")) return "Password kam se kam 6 akshar ka hona chahiye.";
  if (c.includes("too-many-requests")) return "Bahut baar galat try hua. Thodi der baad try karein.";
  if (c.includes("network")) return "Internet connection check karein.";
  if (c.includes("permission-denied")) return "Permission nahi hai (Firestore rules check karein).";
  return e?.message ?? "Kuch galat ho gaya.";
}
