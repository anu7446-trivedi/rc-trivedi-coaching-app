import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc,
  updateDoc, where, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, getSecondaryAuth } from "./firebase";
import { STUDENT_EMAIL_DOMAIN } from "../firebaseConfig";

// ---------- Types ----------
export type Settings = {
  name: string; tagline: string; address: string; phone: string; whatsapp: string;
  upiId: string; upiName: string; about: string; courses: string[];
};
export type Student = {
  id: string; name: string; mobile: string; fatherName?: string; className?: string;
  batchId: string; address?: string; monthlyFee: number; active: boolean; joinDate: string;
};
export type Batch = { id: string; name: string; timing?: string; description?: string };
export type Notice = { id: string; title: string; body: string; batchId: string; createdAt?: Timestamp };
export type Material = {
  id: string; title: string; subject?: string; type: "pdf" | "video" | "link";
  url: string; batchId: string; createdAt?: Timestamp;
};
export type Question = { q: string; options: string[]; answer?: number };
export type Test = {
  id: string; title: string; batchId: string; durationMin: number; published: boolean;
  questions: Question[]; createdAt?: Timestamp;
};
export type Result = {
  id: string; testId: string; testTitle: string; studentId: string; studentName: string;
  answers: (number | null)[]; submittedAt?: Timestamp;
};
export type Attendance = { id: string; date: string; batchId: string; present: string[]; absent: string[] };
export type Payment = {
  id: string; studentId: string; studentName: string; amount: number; month: string;
  method: "cash" | "upi" | "other"; utr?: string; status: "pending" | "verified" | "rejected";
  note?: string; createdAt?: Timestamp;
};
export type Enquiry = { id: string; name: string; mobile: string; className?: string; message?: string; createdAt?: Timestamp };

export const DEFAULT_SETTINGS: Settings = {
  name: "RC Trivedi Coaching Center",
  tagline: "For a Brighter Future",
  address: "Raghavpur, Barabanki, Uttar Pradesh",
  phone: "9005167446",
  whatsapp: "919005167446",
  upiId: "",
  upiName: "RC Trivedi Coaching",
  about: "Class 6 entrance exams ki behtareen taiyari — JNV, Vidyagyan, Sainik School, Sarvodaya Vidyalaya.",
  courses: [
    "Jawahar Navodaya Vidyalaya — Class 6 Entrance",
    "Vidyagyan School — Class 6 Entrance",
    "Sainik School — Class 6 Entrance",
    "Sarvodaya Vidyalaya — Class 6 Preparation",
  ],
};

// ---------- Helpers ----------
const list = async <T,>(col: string, ...conds: ReturnType<typeof where>[]): Promise<T[]> => {
  const snap = await getDocs(conds.length ? query(collection(db, col), ...conds) : collection(db, col));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
};
const ms = (t?: Timestamp) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);
export const newestFirst = <T extends { createdAt?: Timestamp }>(a: T[]) =>
  [...a].sort((x, y) => ms(y.createdAt) - ms(x.createdAt));
export const fmtDate = (t?: Timestamp) =>
  t && typeof t.toDate === "function" ? t.toDate().toLocaleDateString("en-IN") : "";
export const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const thisMonth = () => today().slice(0, 7);
export const mobileToEmail = (m: string) => `${m.replace(/\D/g, "")}@${STUDENT_EMAIL_DOMAIN}`;

// ---------- Settings ----------
export async function getSettings(): Promise<Settings> {
  try {
    const s = await getDoc(doc(db, "settings", "app"));
    return { ...DEFAULT_SETTINGS, ...(s.exists() ? (s.data() as Partial<Settings>) : {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export const saveSettings = (s: Settings) => setDoc(doc(db, "settings", "app"), s);

// ---------- Students ----------
export const getStudents = () => list<Student>("students");
export async function getStudent(id: string) {
  const s = await getDoc(doc(db, "students", id));
  return s.exists() ? ({ id: s.id, ...s.data() } as Student) : null;
}
export async function createStudent(data: Omit<Student, "id">, password: string) {
  const secAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secAuth, mobileToEmail(data.mobile), password);
  await signOut(secAuth);
  await setDoc(doc(db, "students", cred.user.uid), { ...data, createdAt: serverTimestamp() });
  return cred.user.uid;
}
export const updateStudent = (id: string, data: Partial<Student>) => updateDoc(doc(db, "students", id), data);
export const deleteStudent = (id: string) => deleteDoc(doc(db, "students", id));

// ---------- Batches ----------
export const getBatches = () => list<Batch>("batches");
export const addBatch = (b: Omit<Batch, "id">) => addDoc(collection(db, "batches"), b);
export const deleteBatch = (id: string) => deleteDoc(doc(db, "batches", id));

// ---------- Notices ----------
export async function getNotices(batchId?: string) {
  const all = batchId
    ? await list<Notice>("notices", where("batchId", "in", ["all", batchId]))
    : await list<Notice>("notices");
  return newestFirst(all);
}
export const addNotice = (n: Omit<Notice, "id" | "createdAt">) =>
  addDoc(collection(db, "notices"), { ...n, createdAt: serverTimestamp() });
export const deleteNotice = (id: string) => deleteDoc(doc(db, "notices", id));

// ---------- Study material ----------
export async function getMaterials(batchId?: string) {
  const all = batchId
    ? await list<Material>("materials", where("batchId", "in", ["all", batchId]))
    : await list<Material>("materials");
  return newestFirst(all);
}
export const addMaterial = (m: Omit<Material, "id" | "createdAt">) =>
  addDoc(collection(db, "materials"), { ...m, createdAt: serverTimestamp() });
export const deleteMaterial = (id: string) => deleteDoc(doc(db, "materials", id));

// ---------- Tests ----------
// Sahi answers "testKeys" collection me alag rakhe jaate hain, taki student
// test dene se pehle answers na dekh sake (firestore.rules dekhein).
export async function getTests(forStudentBatch?: string) {
  const all = forStudentBatch
    ? await list<Test>("tests", where("published", "==", true))
    : await list<Test>("tests");
  return newestFirst(all.filter((t) => !forStudentBatch || t.batchId === "all" || t.batchId === forStudentBatch));
}
export async function getTest(id: string) {
  const s = await getDoc(doc(db, "tests", id));
  return s.exists() ? ({ id: s.id, ...s.data() } as Test) : null;
}
export async function getTestKey(id: string): Promise<number[] | null> {
  try {
    const s = await getDoc(doc(db, "testKeys", id));
    return s.exists() ? (s.data().answers as number[]) : null;
  } catch {
    return null;
  }
}
export async function saveTest(t: Omit<Test, "id" | "createdAt">, id?: string) {
  const questions = t.questions.map((q) => ({ q: q.q, options: q.options }));
  const answers = t.questions.map((q) => q.answer ?? 0);
  const ref = id ? doc(db, "tests", id) : doc(collection(db, "tests"));
  await setDoc(ref, { ...t, questions, createdAt: serverTimestamp() }, { merge: true });
  await setDoc(doc(db, "testKeys", ref.id), { answers });
  return ref.id;
}
export async function deleteTest(id: string) {
  await deleteDoc(doc(db, "tests", id));
  await deleteDoc(doc(db, "testKeys", id));
}

// ---------- Results ----------
export const resultId = (testId: string, uid: string) => `${testId}_${uid}`;
export async function submitResult(r: Omit<Result, "id" | "submittedAt">) {
  await setDoc(doc(db, "results", resultId(r.testId, r.studentId)), { ...r, submittedAt: serverTimestamp() });
}
export async function getMyResult(testId: string, uid: string) {
  try {
    const s = await getDoc(doc(db, "results", resultId(testId, uid)));
    return s.exists() ? ({ id: s.id, ...s.data() } as Result) : null;
  } catch {
    return null;
  }
}
export const getResultsForStudent = (uid: string) => list<Result>("results", where("studentId", "==", uid));
export const getResultsForTest = (testId: string) => list<Result>("results", where("testId", "==", testId));
export const deleteResult = (id: string) => deleteDoc(doc(db, "results", id));
export function score(answers: (number | null)[], key: number[]) {
  let right = 0, wrong = 0;
  key.forEach((k, i) => {
    if (answers[i] == null) return;
    if (answers[i] === k) right++; else wrong++;
  });
  return { right, wrong, skipped: key.length - right - wrong, total: key.length };
}

// ---------- Attendance ----------
export const attendanceId = (date: string, batchId: string) => `${date}_${batchId}`;
export async function getAttendance(date: string, batchId: string) {
  const s = await getDoc(doc(db, "attendance", attendanceId(date, batchId)));
  return s.exists() ? ({ id: s.id, ...s.data() } as Attendance) : null;
}
export const saveAttendance = (a: Omit<Attendance, "id">) =>
  setDoc(doc(db, "attendance", attendanceId(a.date, a.batchId)), a);
export const getAttendanceForBatch = (batchId: string) => list<Attendance>("attendance", where("batchId", "==", batchId));

// ---------- Fees / payments ----------
export const getPayments = async () => newestFirst(await list<Payment>("payments"));
export const getMyPayments = async (uid: string) => newestFirst(await list<Payment>("payments", where("studentId", "==", uid)));
export const addPayment = (p: Omit<Payment, "id" | "createdAt">) =>
  addDoc(collection(db, "payments"), { ...p, createdAt: serverTimestamp() });
export const setPaymentStatus = (id: string, status: Payment["status"]) => updateDoc(doc(db, "payments", id), { status });
export const deletePayment = (id: string) => deleteDoc(doc(db, "payments", id));
export function upiLink(s: Settings, amount: number, note: string) {
  const p = new URLSearchParams({ pa: s.upiId, pn: s.upiName || s.name, am: String(amount), cu: "INR", tn: note });
  return `upi://pay?${p.toString()}`;
}

// ---------- Enquiries (admission form) ----------
export const getEnquiries = async () => newestFirst(await list<Enquiry>("enquiries"));
export const addEnquiry = (e: Omit<Enquiry, "id" | "createdAt">) =>
  addDoc(collection(db, "enquiries"), { ...e, createdAt: serverTimestamp() });
export const deleteEnquiry = (id: string) => deleteDoc(doc(db, "enquiries", id));

// ---------- Student password reset ----------
// Firebase me bina server ke kisi aur ka password nahi badla ja sakta.
// Isliye: Admin pehle Firebase Console > Authentication se us student ka
// purana login delete kare, fir app me naya password de. Ye function naya
// login bana kar student ka sara data (fees, result, attendance) naye
// account par shift kar deta hai.
export async function relinkStudent(oldId: string, newPassword: string) {
  const old = await getStudent(oldId);
  if (!old) throw new Error("Student nahi mila");
  const { id: _omit, ...data } = old;
  const secAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secAuth, mobileToEmail(old.mobile), newPassword);
  await signOut(secAuth);
  const newId = cred.user.uid;
  await setDoc(doc(db, "students", newId), { ...data, createdAt: serverTimestamp() });

  const pays = await list<Payment>("payments", where("studentId", "==", oldId));
  await Promise.all(pays.map((p) => updateDoc(doc(db, "payments", p.id), { studentId: newId })));

  const res = await getResultsForStudent(oldId);
  await Promise.all(res.map(async ({ id, ...r }) => {
    await setDoc(doc(db, "results", resultId(r.testId, newId)), { ...r, studentId: newId });
    await deleteDoc(doc(db, "results", id));
  }));

  const att = await getAttendanceForBatch(old.batchId);
  await Promise.all(att
    .filter((a) => a.present.includes(oldId) || a.absent.includes(oldId))
    .map((a) => updateDoc(doc(db, "attendance", a.id), {
      present: a.present.map((x) => (x === oldId ? newId : x)),
      absent: a.absent.map((x) => (x === oldId ? newId : x)),
    })));

  await deleteDoc(doc(db, "students", oldId));
  return newId;
}
