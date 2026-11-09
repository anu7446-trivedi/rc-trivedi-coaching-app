import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getCourses, getMyEnrollments, getNotices, getSettings, isActive } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useLoad } from "../lib/useLoad";
import { BannerCarousel, CategoryGrid, CourseCard } from "./store";
import { Screen } from "./ui";
import { C } from "../lib/theme";

export default function StoreHome() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const [settings, courses, enr, notices] = await Promise.all([
      getSettings(),
      getCourses().catch(() => []),
      student ? getMyEnrollments(student.id).catch(() => []) : Promise.resolve([]),
      student ? getNotices(student.batchId).catch(() => []) : Promise.resolve([]),
    ]);
    const owned = new Set(enr.filter(isActive).map((e) => e.courseId));
    return { settings, courses, owned, notices };
  }, [student?.id]);

  const st = data?.settings;
  const featured = (data?.courses ?? []).filter((c) => c.featured);
  const latest = data?.notices?.[0];

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      {student ? (
        <Text style={s.hi}>Namaste, {student.name.split(" ")[0]} 👋</Text>
      ) : (
        <Pressable style={s.loginBar} onPress={() => router.push("/login")}>
          <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
          <Text style={s.loginT}>Mobile number + OTP se Login karein</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </Pressable>
      )}

      {latest ? (
        <Pressable style={s.notice} onPress={() => router.push("/student/notices")}>
          <Text style={s.noticeT} numberOfLines={2}>📢 {latest.title}</Text>
        </Pressable>
      ) : null}

      <BannerCarousel banners={st?.banners ?? []} />

      <Text style={s.h}>Kya padhna hai?</Text>
      <CategoryGrid />

      {featured.length ? (
        <>
          <Text style={s.h}>⭐ Featured Courses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
            {featured.map((c) => <CourseCard key={c.id} course={c} owned={data?.owned.has(c.id)} wide />)}
            <View style={{ width: 20 }} />
          </ScrollView>
        </>
      ) : null}

      <Text style={s.h}>Sabhi Courses</Text>
      {(data?.courses ?? []).filter((c) => !c.featured).map((c) => <CourseCard key={c.id} course={c} owned={data?.owned.has(c.id)} />)}
      {data && data.courses.length === 0 ? <Text style={{ color: C.sub }}>Courses jaldi aa rahe hain…</Text> : null}

      {st ? (
        <View style={s.contact}>
          <Text style={s.cn}>{st.name}</Text>
          <Text style={s.ca}>{st.address}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable style={s.cb} onPress={() => Linking.openURL(`tel:${st.phone}`)}><Ionicons name="call" size={18} color="#fff" /><Text style={s.cbT}>Call</Text></Pressable>
            <Pressable style={[s.cb, { backgroundColor: "#25D366" }]} onPress={() => Linking.openURL(`https://wa.me/${st.whatsapp}`)}><Ionicons name="logo-whatsapp" size={18} color="#fff" /><Text style={s.cbT}>WhatsApp</Text></Pressable>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  hi: { fontSize: 20, fontWeight: "900", color: C.navy, marginBottom: 12 },
  loginBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.blue, padding: 14, borderRadius: 14, marginBottom: 14 },
  loginT: { color: "#fff", fontWeight: "800", flex: 1 },
  notice: { backgroundColor: "#fff7dc", borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeT: { color: "#7a5600", fontWeight: "800" },
  h: { fontSize: 19, fontWeight: "900", color: C.navy, marginTop: 8, marginBottom: 10 },
  contact: { backgroundColor: C.navy, borderRadius: 16, padding: 16, marginTop: 10 },
  cn: { color: C.gold, fontWeight: "900", fontSize: 17 },
  ca: { color: "#c8d4e6", fontSize: 12, marginTop: 2 },
  cb: { flexDirection: "row", gap: 6, backgroundColor: C.maroon, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignItems: "center" },
  cbT: { color: "#fff", fontWeight: "800" },
});
