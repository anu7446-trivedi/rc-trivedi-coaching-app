import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
  serverTimestamp, increment, Timestamp,
} from "@react-native-firebase/firestore";
import { httpsCallable } from "@react-native-firebase/functions";
import { deleteObject, getDownloadURL, ref, putFile } from "@react-native-firebase/storage";
import { db, functions, storage } from "./firebase";

type TS = { toMillis(): number; toDate(): Date };

// ---------- Types ----------
export type Banner = { imageUrl: string; courseId?: string };
export type Settings = {
  name: string; tagline: string; address: string; phone: string; whatsapp: string;
  upiId: string; upiName: string; about: string; courses: string[]; banners: Banner[];
  privacyUrl?: string;
};
export type Student = {
  id: string; name: string; phone: string; fatherName?: string; className?: string;
  address?: string; batchId?: string; monthlyFee?: number; active: boolean; createdAt?: TS;
};
export type Category = "maths" | "reasoning" | "hindi" | "evs" | "full" | "tests" | "free" | "other";
export type Course = {
  id: string; title: string; subtitle?: string; description?: string; imageUrl?: string;
  price: number; mrp?: number; validityDays: number; category: Category; includes: string[];
  published: boolean; featured: boolean; order: number;
  counts?: Partial<Record<ItemType, number>>; createdAt?: TS;
};
export type ItemType = "video" | "live" | "pdf" | "link" | "test";
export type Question = { q: string; options: string[]; answer?: number };
export type Item = {
  id: string; courseId: string; title: string; type: ItemType; url?: string; section?: string;
  order: number; durationMin?: number; questions?: Question[]; createdAt?: TS;
};
export type Enrollment = {
  id: string; uid: string; courseId: string; expiresAt: TS; source: "razorpay" | "admin";
  amount?: number; paymentId?: string; createdAt?: TS;
};
export type Order = {
  id: string; uid: string; courseId: string; courseTitle: string; amount: number;
  status: "created" | "paid"; paymentId?: string; studentName?: string; phone?: string; createdAt?: TS; paidAt?: TS;
};
export type Result = {
  id: string; courseId: string; itemId: string; testTitle: string; studentId: string; studentName: string;
  answers: (number | null)[]; submittedAt?: TS;
};
export type Batch = { id: string; name: string; timing?: string };
export type Notice = { id: string; title: string; body: string; batchId: string; createdAt?: TS };
export type Attendance = { id: string; date: string; batchId: string; present: string[]; absent: string[] };
export type Payment = {
  id: string; studentId: string; studentName: string; amount: number; month: string;
  method: "cash" | "upi" | "other"; utr?: string; status: "pending" | "verified" | "rejected"; createdAt?: TS;
};
export type Enquiry = { id: string; name: string; mobile: string; className?: string; message?: string; createdAt?: TS };

export const CATEGORIES: { key: Category; label: string; short: string; color: string; icon: string }[] = [
  { key: "full", label: "Sampoorn Course (Sab Vishay)", short: "Sampoorn Course", color: "#b91c1c", icon: "trophy" },
  { key: "maths", label: "Ganit (Maths)", short: "Ganit / Maths", color: "#1d4ed8", icon: "calculator" },
  { key: "reasoning", label: "Reasoning (Mansik Yogyata)", short: "Reasoning", color: "#7c3aed", icon: "extension-puzzle" },
  { key: "hindi", label: "Hindi (Bhasha)", short: "Hindi", color: "#c2410c", icon: "language" },
  { key: "evs", label: "EVS / Paryavaran", short: "EVS", color: "#15803d", icon: "leaf" },
  { key: "tests", label: "Test Series", short: "Test Series", color: "#0e7490", icon: "clipboard" },
  { key: "free", label: "Free Mock Test & Notes", short: "Free Material", color: "#ca8a04", icon: "gift" },
];
export const catInfo = (c: Category) => CATEGORIES.find((x) => x.key === c) ?? { key: c, label: "Anya", short: "Anya", color: "#475569", icon: "book" };

export const DEFAULT_SETTINGS: Settings = {
  name: "RC Trivedi Coaching Center",
  tagline: "For a Brighter Future",
  address: "Raghavpur, Barabanki, Uttar Pradesh",
  phone: "9005167446",
  whatsapp: "919005167446",
  upiId: "",
  upiName: "RC Trivedi Coaching",
  about: "Class 6 entrance exams ki behtareen taiyari — JNV, Vidyagyan, Sainik School, Sarvodaya Vidyalaya.",
  courses: [],
  banners: [],
};

// ---------- Helpers ----------
type Cond = ReturnType<typeof where>;
async function list<T>(path: string, ...conds: Cond[]): Promise<T[]> {
  const c = collection(db, path);
  const snap = await getDocs(conds.length ? query(c, ...(conds as any[])) : c);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as T);
}
async function one<T>(path: string, id: string): Promise<T | null> {
  const s = await getDoc(doc(db, path, id));
  return s.exists() ? ({ id: s.id, ...s.data() } as T) : null;
}
const ms = (t?: TS) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);
export const newestFirst = <T extends { createdAt?: TS }>(a: T[]) => [...a].sort((x, y) => ms(y.createdAt) - ms(x.createdAt));
export const fmtDate = (t?: TS) => (t && typeof t.toDate === "function" ? t.toDate().toLocaleDateString("en-IN") : "");
export const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const thisMonth = () => today().slice(0, 7);
export const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

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

// ---------- Image upload (Firebase Storage) ----------
/** PDF / photo jaisi file Firebase Storage me upload karke uska link deta hai. */
export async function uploadFile(localUri: string, folder: string, fileName: string, contentType: string) {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-60) || "file";
  const path = `files/${folder}/${Date.now()}_${safe}`;
  await putFile(ref(storage, path), localUri, { contentType });
  // Public download link nahi banate — file sirf app ke andar, login ke saath khulti hai.
  return `storage://${path}`;
}
/** Item ke url se Firebase Storage ka path nikalta hai (nahi to null). */
export function storagePathOf(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("storage://")) return url.slice("storage://".length);
  const m = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
export async function uploadImage(localUri: string, folder: string) {
  const r = ref(storage, `images/${folder}/${Date.now()}.jpg`);
  await putFile(r, localUri);
  return getDownloadURL(r);
}

// ---------- Students ----------
// Purane (password wale) students me "mobile" field tha — dono ko sambhalo
const normStudent = (s: any): Student => ({ ...s, phone: s.phone ?? (s.mobile ? `+91${s.mobile}` : ""), name: s.name ?? "" });
export const getStudents = async () => (await list<any>("students")).map(normStudent);
export const getStudent = async (id: string) => { const s = await one<any>("students", id); return s ? normStudent(s) : null; };
export const createMyProfile = (uid: string, p: Omit<Student, "id" | "active" | "createdAt">) =>
  setDoc(doc(db, "students", uid), { ...p, active: true, createdAt: serverTimestamp() });
export const updateStudent = (id: string, data: Partial<Student>) => updateDoc(doc(db, "students", id), data as any);
export const updateMyProfile = (id: string, data: Pick<Student, "name" | "fatherName" | "className" | "address">) =>
  updateDoc(doc(db, "students", id), data as any);

// ---------- Courses ----------
export async function getCourses(includeDrafts = false) {
  const all = includeDrafts ? await list<Course>("courses") : await list<Course>("courses", where("published", "==", true));
  return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export const getCourse = (id: string) => one<Course>("courses", id);
export async function saveCourse(c: Omit<Course, "id" | "createdAt" | "counts">, id?: string) {
  if (id) { await updateDoc(doc(db, "courses", id), c as any); return id; }
  const r = await addDoc(collection(db, "courses"), { ...c, counts: {}, createdAt: serverTimestamp() });
  return r.id;
}
export const deleteCourse = (id: string) => deleteDoc(doc(db, "courses", id));
export const isFree = (c: Course) => !c.price || c.price <= 0;

/** Pehli baar ke liye taiyar courses (admin baad me price/naam badal sakta hai). */
export async function seedCourses() {
  const base = { description: "", imageUrl: "", validityDays: 365, published: false, featured: false, includes: [] as string[] };
  const ids: Record<string, string> = {};
  const mk = async (category: Category, title: string, subtitle: string, price: number, mrp: number, order: number, extra: Partial<Course> = {}) => {
    ids[category] = await saveCourse({ ...base, category, title, subtitle, price, mrp, order, ...extra });
  };
  await mk("maths", "Ganit (Maths) Course — Class 6 Entrance", "JNV / Sainik / Vidyagyan ke liye", 599, 999, 2);
  await mk("reasoning", "Reasoning (Mansik Yogyata) Course", "Mental Ability — chapterwise", 299, 499, 3);
  await mk("hindi", "Hindi (Bhasha) Course", "Gadyansh, vyakaran, shabd gyan", 299, 499, 4);
  await mk("evs", "EVS / Paryavaran Adhyayan Course", "Vigyan + Samajik Adhyayan", 299, 499, 5);
  await mk("tests", "Topic-wise Test Series — Sabhi Vishay", "Har topic ke alag test", 399, 665, 6);
  const topicTests = ids.tests;
  await mk("tests", "50 Model Test Paper", "Poore pariksha pattern par 50 model paper", 499, 832, 7);
  const modelPapers = ids.tests;
  await mk("free", "Free Mock Test & Notes", "Muft abhyas", 0, 0, 8, { published: true });
  await mk("full", "Sampoorn Course — Video Classes ke saath (Sab Vishay)", "Maths + Reasoning + Hindi + EVS + Topic Tests + 50 Model Paper", 2399, 3999, 1, {
    includes: [ids.maths, ids.reasoning, ids.hindi, ids.evs, topicTests, modelPapers], featured: true,
    description: "🎯 Sab kuch ek saath — alag-alag khareedne se sasta!\n📚 Maths, Reasoning, Hindi, EVS — video classes + PDF notes\n📝 Topic-wise Test Series\n📄 50 Model Test Paper\n⏰ 365 din ki validity",
  });
}

// ---------- Course items (video / pdf / test ...) ----------
export async function getItems(courseId: string) {
  const all = await list<Item>(`courses/${courseId}/items`);
  return all.map((i) => ({ ...i, courseId })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || ms(a.createdAt) - ms(b.createdAt));
}
export async function getItem(courseId: string, id: string) {
  const i = await one<Item>(`courses/${courseId}/items`, id);
  return i ? { ...i, courseId } : null;
}
export async function getTestKey(courseId: string, itemId: string): Promise<number[] | null> {
  try {
    const s = await getDoc(doc(db, `courses/${courseId}/keys`, itemId));
    return s.exists() ? ((s.data() as any).answers as number[]) : null;
  } catch {
    return null;
  }
}
/** Item save karta hai. Test ke sahi uttar alag "keys" me jaate hain. */
export async function saveItem(courseId: string, it: Omit<Item, "id" | "courseId" | "createdAt">, id?: string, prevType?: ItemType) {
  const data: any = { ...it };
  let answers: number[] | null = null;
  if (it.type === "test" && it.questions) {
    answers = it.questions.map((q) => q.answer ?? 0);
    data.questions = it.questions.map((q) => ({ q: q.q, options: q.options }));
  }
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const r = id ? doc(db, `courses/${courseId}/items`, id) : doc(collection(db, `courses/${courseId}/items`));
  await setDoc(r, id ? data : { ...data, createdAt: serverTimestamp() }, { merge: true });
  if (answers) await setDoc(doc(db, `courses/${courseId}/keys`, r.id), { answers });
  if (!id) await updateDoc(doc(db, "courses", courseId), { [`counts.${it.type}`]: increment(1) });
  else if (prevType && prevType !== it.type)
    await updateDoc(doc(db, "courses", courseId), { [`counts.${prevType}`]: increment(-1), [`counts.${it.type}`]: increment(1) });
  return r.id;
}
export async function deleteItem(courseId: string, it: Item) {
  await deleteDoc(doc(db, `courses/${courseId}/items`, it.id));
  const sp = storagePathOf(it.url);
  if (sp) await deleteObject(ref(storage, sp)).catch(() => {});
  if (it.type === "test") await deleteDoc(doc(db, `courses/${courseId}/keys`, it.id)).catch(() => {});
  await updateDoc(doc(db, "courses", courseId), { [`counts.${it.type}`]: increment(-1) });
}

// ---------- Enrollments (kharide hue course) ----------
export const enrollmentId = (uid: string, courseId: string) => `${uid}_${courseId}`;
export const isActive = (e?: Enrollment | null) => !!e && ms(e.expiresAt) > Date.now();
export const getMyEnrollments = (uid: string) => list<Enrollment>("enrollments", where("uid", "==", uid));
export async function getEnrollment(uid: string, courseId: string) {
  try { return await one<Enrollment>("enrollments", enrollmentId(uid, courseId)); } catch { return null; }
}
/** Admin haath se course de sakta hai (jaise cash payment par). Bundle ke sab course bhi khul jaate hain. */
export async function grantCourse(uid: string, course: Course, days = course.validityDays || 365) {
  const expiresAt = Timestamp.fromMillis(Date.now() + days * 86400000);
  for (const cid of [course.id, ...(course.includes ?? [])]) {
    await setDoc(doc(db, "enrollments", enrollmentId(uid, cid)), {
      uid, courseId: cid, expiresAt, source: "admin", createdAt: serverTimestamp(),
    });
  }
}
export const revokeEnrollment = (id: string) => deleteDoc(doc(db, "enrollments", id));
export const getEnrollmentsForStudent = getMyEnrollments;

// ---------- Payment (Razorpay via Cloud Functions) ----------
export type OrderInfo = { orderId: string; amount: number; keyId: string; courseTitle: string };
export async function createOrder(courseId: string): Promise<OrderInfo> {
  const res = await httpsCallable<{ courseId: string }, OrderInfo>(functions, "createOrder")({ courseId });
  return res.data;
}
export async function verifyPayment(p: { orderId: string; paymentId: string; signature: string }) {
  const res = await httpsCallable<typeof p, { ok: boolean }>(functions, "verifyPayment")(p);
  return res.data;
}
export const getOrders = async () => newestFirst(await list<Order>("orders", where("status", "==", "paid")));

// ---------- Results ----------
export const resultId = (itemId: string, uid: string) => `${itemId}_${uid}`;
export const submitResult = (r: Omit<Result, "id" | "submittedAt">) =>
  setDoc(doc(db, "results", resultId(r.itemId, r.studentId)), { ...r, submittedAt: serverTimestamp() });
export async function getMyResult(itemId: string, uid: string) {
  try { return await one<Result>("results", resultId(itemId, uid)); } catch { return null; }
}
export const getResultsForStudent = (uid: string) => list<Result>("results", where("studentId", "==", uid));
export const getResultsForTest = (itemId: string) => list<Result>("results", where("itemId", "==", itemId));
export const deleteResult = (id: string) => deleteDoc(doc(db, "results", id));
export function score(answers: (number | null)[], key: number[]) {
  let right = 0, wrong = 0;
  key.forEach((k, i) => {
    if (answers[i] == null) return;
    if (answers[i] === k) right++; else wrong++;
  });
  return { right, wrong, skipped: key.length - right - wrong, total: key.length };
}

// ---------- Batches / notices / attendance / offline fees ----------
export const getBatches = () => list<Batch>("batches");
export const addBatch = (b: Omit<Batch, "id">) => addDoc(collection(db, "batches"), b);
export const deleteBatch = (id: string) => deleteDoc(doc(db, "batches", id));

export async function getNotices(batchId?: string) {
  const all = await list<Notice>("notices", where("batchId", "in", batchId ? ["all", batchId] : ["all"]));
  return newestFirst(all);
}
export const getAllNotices = async () => newestFirst(await list<Notice>("notices"));
export const addNotice = (n: Omit<Notice, "id" | "createdAt">) => addDoc(collection(db, "notices"), { ...n, createdAt: serverTimestamp() });
export const deleteNotice = (id: string) => deleteDoc(doc(db, "notices", id));

export const attendanceId = (date: string, batchId: string) => `${date}_${batchId}`;
export const getAttendance = (date: string, batchId: string) => one<Attendance>("attendance", attendanceId(date, batchId));
export const saveAttendance = (a: Omit<Attendance, "id">) => setDoc(doc(db, "attendance", attendanceId(a.date, a.batchId)), a);
export const getAttendanceForBatch = (batchId: string) => list<Attendance>("attendance", where("batchId", "==", batchId));

export const getPayments = async () => newestFirst(await list<Payment>("payments"));
export const getMyPayments = async (uid: string) => newestFirst(await list<Payment>("payments", where("studentId", "==", uid)));
export const addPayment = (p: Omit<Payment, "id" | "createdAt">) => addDoc(collection(db, "payments"), { ...p, createdAt: serverTimestamp() });
export const setPaymentStatus = (id: string, status: Payment["status"]) => updateDoc(doc(db, "payments", id), { status });
export const deletePayment = (id: string) => deleteDoc(doc(db, "payments", id));

export function upiLink(s: Settings, amount: number, note: string) {
  const q = `pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.upiName || s.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  return `upi://pay?${q}`;
}

// ---------- Enquiries ----------
export const getEnquiries = async () => newestFirst(await list<Enquiry>("enquiries"));
export const addEnquiry = (e: Omit<Enquiry, "id" | "createdAt">) => addDoc(collection(db, "enquiries"), { ...e, createdAt: serverTimestamp() });
export const deleteEnquiry = (id: string) => deleteDoc(doc(db, "enquiries", id));
