import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Href, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { getCourses, getEnquiries, getOrders, getStudents, rupee, thisMonth } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Row, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

const menu: { t: string; d: string; i: keyof typeof Ionicons.glyphMap; h: Href; c: string }[] = [
  { t: "Courses & Content", d: "Course, price, video, PDF, test", i: "library-outline", h: "/admin/courses", c: "#1d4ed8" },
  { t: "Sales / Kamai", d: "Kisne kya khareeda", i: "cash-outline", h: "/admin/orders", c: "#15803d" },
  { t: "Students", d: "Sabhi students, course dena", i: "people-outline", h: "/admin/students", c: "#7c3aed" },
  { t: "Notices", d: "Sabko suchna bhejein", i: "megaphone-outline", h: "/admin/notices", c: "#0d376b" },
  { t: "App Settings & Banners", d: "Banner, naam, phone, UPI", i: "settings-outline", h: "/admin/settings", c: "#475569" },
  { t: "Admission Enquiries", d: "Naye admission ke form", i: "mail-unread-outline", h: "/admin/enquiries", c: "#be185d" },
  { t: "Offline Batches", d: "Coaching ke batch", i: "albums-outline", h: "/admin/batches", c: "#0e7490" },
  { t: "Attendance", d: "Offline batch ki hazri", i: "calendar-outline", h: "/admin/attendance", c: "#9333ea" },
  { t: "Coaching Monthly Fees", d: "Offline fees, UPI verify", i: "wallet-outline", h: "/admin/fees", c: "#d97706" },
];

export default function AdminHome() {
  const { logout, user } = useAuth();
  const { data, reload, loading } = useLoad(async () => {
    const [st, orders, en, cs] = await Promise.all([getStudents(), getOrders(), getEnquiries(), getCourses(true)]);
    const m = thisMonth();
    const monthly = orders.filter((o) => o.paidAt && o.paidAt.toDate().toISOString().slice(0, 7) === m);
    return {
      students: st.length, courses: cs.length, enquiries: en.length,
      month: monthly.reduce((t, o) => t + o.amount, 0), total: orders.reduce((t, o) => t + o.amount, 0),
    };
  });
  const stats = [
    ["Is mahine ki kamai", data ? rupee(data.month) : "–"],
    ["Kul kamai", data ? rupee(data.total) : "–"],
    ["Students", data?.students ?? "–"],
    ["Courses", data?.courses ?? "–"],
  ] as const;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Text style={s.hi}>Namaste, Admin 🙏</Text>
      <Text style={s.email}>{user?.email}</Text>
      <View style={s.stats}>
        {stats.map(([k, v]) => (
          <View key={k} style={s.stat}><Text style={s.statV}>{v}</Text><Text style={s.statK}>{k}</Text></View>
        ))}
      </View>
      {menu.map((m) => <Row key={m.t} icon={m.i} color={m.c} title={m.t} subtitle={m.d} onPress={() => router.push(m.h)} />)}
      <Btn title="Logout" icon="log-out-outline" outline color={C.red} onPress={logout} />
    </Screen>
  );
}

const s = StyleSheet.create({
  hi: { fontSize: 22, fontWeight: "900", color: C.navy },
  email: { color: C.sub, marginBottom: 12 },
  stats: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  stat: { width: "48.5%", backgroundColor: C.navy, borderRadius: 14, padding: 14, marginBottom: 8 },
  statV: { color: C.gold, fontSize: 22, fontWeight: "900" },
  statK: { color: "#c8d4e6", fontSize: 12, fontWeight: "700" },
});
