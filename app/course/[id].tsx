import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";
import {
  Course, createOrder, fmtDate, getCourse, getCourses, getEnrollment, getSettings, isActive, isFree, verifyPayment,
} from "../../lib/db";
import { useAuth } from "../../lib/auth";
import { useLoad } from "../../lib/useLoad";
import { CourseImage, PriceLine, Tags } from "../../components/store";
import { Card, Loading, Screen, notify } from "../../components/ui";
import { C } from "../../lib/theme";

const typeLabel: Record<string, [string, keyof typeof Ionicons.glyphMap]> = {
  live: ["Live Class", "radio"], video: ["Video Lectures", "play-circle"], pdf: ["PDF / Notes", "document-text"],
  test: ["Online Tests", "clipboard"], link: ["Anya Links", "link"],
};

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, student } = useAuth();
  const [tab, setTab] = useState<"overview" | "content">("overview");
  const [busy, setBusy] = useState(false);
  const { data, reload } = useLoad(async () => {
    const [course, settings] = await Promise.all([getCourse(id), getSettings()]);
    const enr = student ? await getEnrollment(student.id, id) : null;
    const included: Course[] = course?.includes?.length
      ? (await getCourses()).filter((c) => course.includes.includes(c.id)) : [];
    return { course, settings, enr, included };
  }, [id, student?.id]);

  if (!data) return <Loading />;
  const { course, enr, included, settings } = data;
  if (!course) return <Screen><Text>Course nahi mila.</Text></Screen>;
  const owned = isActive(enr);
  const canOpen = owned || isFree(course);

  // Payment ke baad course khula ya nahi — server (webhook) se pakki jaankari, kuch second tak dekhte hain.
  const waitForAccess = async (tries = 8) => {
    for (let i = 0; i < tries; i++) {
      if (isActive(await getEnrollment(student!.id, course.id))) return true;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
  };

  const buy = async () => {
    if (!user || !student) { router.push("/login"); return; }
    setBusy(true);
    let res: any = null, err: any = null;
    try {
      const o = await createOrder(course.id);
      try {
        res = await RazorpayCheckout.open({
          key: o.keyId, order_id: o.orderId, amount: o.amount, currency: "INR",
          name: settings.name, description: course.title,
          prefill: { name: student.name, contact: student.phone },
          theme: { color: C.blue },
        });
      } catch (e) { err = e; }
      if (res?.razorpay_payment_id && res?.razorpay_signature) {
        await verifyPayment({ orderId: res.razorpay_order_id ?? o.orderId, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature }).catch(() => {});
      }
      // Razorpay kabhi payment ke baad bhi error dikha deta hai — isliye server se confirm karo
      const ok = await waitForAccess(res ? 8 : 4);
      if (ok) {
        notify("Payment safal ✓", "Course aapke liye khul gaya hai. Padhai shuru karein!");
        reload();
        return;
      }
      const msg = err?.description || err?.error?.description || err?.message || "";
      if (err && (err?.code === 0 || /cancel/i.test(msg))) notify("Payment cancel hua", "Koi paisa nahi kata. Dobara try kar sakte hain.");
      else notify("Payment ki pushti nahi hui", "Agar paisa kat gaya ho to 5–10 minute me course apne aap khul jayega (app dobara kholein). Warna coaching se sampark karein.");
    } catch (e: any) {
      notify("Payment shuru nahi hua", e?.message ?? "Internet check karke dobara try karein.");
    } finally { setBusy(false); }
  };

  const counts = course.counts ?? {};
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen options={{ title: course.title }} />
      <Screen>
        <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12 }}><CourseImage course={course} height={190} /></View>
        <Tags course={course} />
        <Text style={s.title}>{course.title}</Text>
        {course.subtitle ? <Text style={s.sub}>{course.subtitle}</Text> : null}
        <View style={s.tabs}>
          {(["overview", "content"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
              <Text style={[s.tabT, tab === t && { color: "#fff" }]}>{t === "overview" ? "Overview" : "Content"}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "overview" ? (
          <>
            {course.description ? <Card><Text style={s.h}>Is course me</Text><Text style={s.desc}>{course.description}</Text></Card> : null}
            {included.length ? (
              <Card>
                <Text style={s.h}>Saath me milenge ye courses</Text>
                {included.map((c) => <Text key={c.id} style={s.li}>✅ {c.title}</Text>)}
              </Card>
            ) : null}
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="time-outline" size={22} color={C.sub} />
                <Text style={s.desc}>
                  {owned ? `Aapka access ${fmtDate(enr!.expiresAt)} tak hai` : isFree(course) ? "Free course" : `Validity: ${course.validityDays} din (khareedne ki tareekh se)`}
                </Text>
              </View>
            </Card>
            <Card>
              <Text style={s.h}>🔒 100% Surakshit Payment</Text>
              <Text style={s.desc}>Razorpay dwara — UPI (PhonePe, GPay, Paytm), Debit/Credit Card, Net Banking. Payment hote hi course turant khul jata hai.</Text>
            </Card>
          </>
        ) : (
          <Card>
            {Object.entries(typeLabel).filter(([k]) => (counts as any)[k] > 0).map(([k, [label, icon]]) => (
              <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
                <Ionicons name={icon} size={22} color={C.blue} />
                <Text style={[s.desc, { flex: 1 }]}>{label}</Text>
                <Text style={{ fontWeight: "900", color: C.text }}>{(counts as any)[k]}</Text>
              </View>
            ))}
            {Object.values(counts).every((n) => !n) ? <Text style={s.desc}>Content jald hi joda jayega.{included.length ? " (Upar diye gaye courses ka content milega.)" : ""}</Text> : null}
            {!canOpen ? <Text style={[s.desc, { marginTop: 8, color: C.orange }]}>🔒 Content khareedne ke baad khulega.</Text> : null}
          </Card>
        )}
        <View style={{ height: 80 }} />
      </Screen>

      <View style={s.bar}>
        <View style={{ flex: 1 }}>{owned ? <Text style={[s.title, { color: C.green, fontSize: 16 }]}>✓ Khareeda hua</Text> : <PriceLine course={course} big />}</View>
        <Pressable
          disabled={busy}
          onPress={() => (canOpen ? router.push({ pathname: "/learn/[cid]", params: { cid: course.id } }) : buy())}
          style={[s.buy, busy && { opacity: 0.6 }, canOpen && { backgroundColor: C.green }]}
        >
          <Text style={s.buyT}>{busy ? "Ruko…" : canOpen ? "Course Kholein" : "Buy Now"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900", color: C.text },
  sub: { color: C.sub, marginTop: 2 },
  tabs: { flexDirection: "row", gap: 8, marginVertical: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#e7edf5" },
  tabOn: { backgroundColor: C.blue },
  tabT: { fontWeight: "800", color: C.text },
  h: { fontWeight: "900", fontSize: 15, color: C.text, marginBottom: 6 },
  desc: { color: "#334155", lineHeight: 21 },
  li: { color: C.text, marginVertical: 3 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 22, borderTopWidth: 1, borderColor: C.border },
  buy: { backgroundColor: C.blue, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 12 },
  buyT: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
