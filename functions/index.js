// =====================================================================
//  RC Trivedi Coaching — Payment server (Firebase Cloud Functions)
//  1) createOrder   : app "Buy Now" dabane par Razorpay order banata hai
//  2) verifyPayment : payment ke baad signature jaanch kar course kholta hai
//  3) razorpayWebhook: agar app band ho jaye to bhi Razorpay se seedha
//                      khabar aane par course khol deta hai (backup)
//  Price hamesha server par database se liya jata hai — app se nahi.
// =====================================================================
const crypto = require("crypto");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

const RAZORPAY_KEY_ID = defineString("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

const rzp = () => new Razorpay({ key_id: RAZORPAY_KEY_ID.value(), key_secret: RAZORPAY_KEY_SECRET.value() });
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Course (aur bundle ke andar ke sab course) student ke liye khol do. Dobara chalne par bhi safe. */
async function grant(orderId, paymentId) {
  const orderRef = db.collection("orders").doc(orderId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new Error("order not found: " + orderId);
    const o = snap.data();
    if (o.status === "paid") return;
    const course = (await tx.get(db.collection("courses").doc(o.courseId))).data() || {};
    const days = Number(course.validityDays) || 365;
    const ids = [o.courseId, ...(course.includes || [])];
    const refs = ids.map((cid) => db.collection("enrollments").doc(`${o.uid}_${cid}`));
    const existing = await Promise.all(refs.map((r) => tx.get(r)));
    const now = Date.now();
    refs.forEach((r, i) => {
      // Pehle se active ho to validity aage badhao
      const cur = existing[i].exists ? existing[i].data().expiresAt.toMillis() : 0;
      const base = Math.max(now, cur);
      tx.set(r, {
        uid: o.uid, courseId: ids[i], source: "razorpay", amount: o.amount, paymentId, orderId,
        expiresAt: admin.firestore.Timestamp.fromMillis(base + days * 86400000),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    tx.update(orderRef, { status: "paid", paymentId, paidAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}

exports.createOrder = onCall({ secrets: [RAZORPAY_KEY_SECRET] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Pehle login karein.");
  const courseId = String(req.data?.courseId || "");
  const cSnap = await db.collection("courses").doc(courseId).get();
  const c = cSnap.data();
  if (!cSnap.exists || !c.published) throw new HttpsError("not-found", "Course nahi mila.");
  const price = Number(c.price) || 0;
  if (price < 1) throw new HttpsError("failed-precondition", "Ye course free hai.");
  const st = (await db.collection("students").doc(uid).get()).data();
  if (!st || st.active === false) throw new HttpsError("permission-denied", "Pehle apni profile bharein.");

  const amount = Math.round(price * 100); // paise me
  const order = await rzp().orders.create({
    amount, currency: "INR", receipt: `${courseId.slice(0, 12)}_${Date.now()}`,
    notes: { uid, courseId },
  });
  await db.collection("orders").doc(order.id).set({
    uid, courseId, courseTitle: c.title, amount: price, status: "created",
    studentName: st.name || "", phone: st.phone || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { orderId: order.id, amount, keyId: RAZORPAY_KEY_ID.value(), courseTitle: c.title };
});

exports.verifyPayment = onCall({ secrets: [RAZORPAY_KEY_SECRET] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Pehle login karein.");
  const { orderId, paymentId, signature } = req.data || {};
  if (!orderId || !paymentId || !signature) throw new HttpsError("invalid-argument", "Payment details adhoori hain.");
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET.value()).update(`${orderId}|${paymentId}`).digest("hex");
  if (!safeEqual(expected, signature)) throw new HttpsError("permission-denied", "Payment verify nahi hua.");
  const o = (await db.collection("orders").doc(orderId).get()).data();
  if (!o || o.uid !== uid) throw new HttpsError("permission-denied", "Ye order aapka nahi hai.");
  await grant(orderId, paymentId);
  return { ok: true };
});

// Razorpay Dashboard > Settings > Webhooks me is function ka URL daalein,
// events: payment.captured, order.paid
exports.razorpayWebhook = onRequest({ secrets: [RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
  const sig = req.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET.value()).update(req.rawBody).digest("hex");
  if (!safeEqual(expected, sig)) { res.status(400).send("bad signature"); return; }
  const ev = req.body || {};
  const pay = ev.payload?.payment?.entity;
  const orderId = pay?.order_id || ev.payload?.order?.entity?.id;
  if ((ev.event === "payment.captured" || ev.event === "order.paid") && orderId) {
    try { await grant(orderId, pay?.id || ""); }
    catch (e) { console.error("webhook grant failed", orderId, e); }
  }
  res.status(200).send("ok");
});
