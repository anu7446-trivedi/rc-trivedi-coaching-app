import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Href, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { getEnquiries, getPayments, getStudents, getTests } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Row, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

const menu: { t: string; d: string; i: keyof typeof Ionicons.glyphMap; h: Href; c: string }[] = [
  { t: "Students", d: "Naya student jodein, edit / band karein", i: "people-outline", h: "/admin/students", c: "#1769aa" },
  { t: "Batches", d: "Batch / class banayein", i: "albums-outline", h: "/admin/batches", c: "#0e7490" },
  { t: "Attendance", d: "Roz ki hazri lagayein", i: "calendar-outline", h: "/admin/attendance", c: "#7a2cbf" },
  { t: "Online Tests", d: "MCQ test banayein, result dekhein", i: "clipboard-outline", h: "/admin/tests", c: "#a51d2d" },
  { t: "Notes & Videos", d: "PDF / YouTube link daalein", i: "book-outline", h: "/admin/material", c: "#18834b" },
  { t: "Fees", d: "Payment verify / cash entry", i: "wallet-outline", h: "/admin/fees", c: "#d97706" },
  { t: "Notices", d: "Students ko suchna bhejein", i: "megaphone-outline", h: "/admin/notices", c: "#0d376b" },
  { t: "Admission Enquiries", d: "Naye admission ke form", i: "mail-unread-outline", h: "/admin/enquiries", c: "#be185d" },
  { t: "App Settings", d: "Naam, phone, UPI ID, courses", i: "settings-outline", h: "/admin/settings", c: "#475569" },
];

export default function AdminHome() {
  const { logout, user } = useAuth();
  const { data, reload, loading } = useLoad(async () => {
    const [st, py, en, ts] = await Promise.all([getStudents(), getPayments(), getEnquiries(), getTests()]);
    return {
      students: st.filter((s) => s.active).length,
      pending: py.filter((p) => p.status === "pending").length,
      enquiries: en.length,
      tests: ts.length,
    };
  });
  const stats = [
    ["Active Students", data?.students],
    ["Pending Fees", data?.pending],
    ["Enquiries", data?.enquiries],
    ["Tests", data?.tests],
  ] as const;

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Text style={s.hi}>Namaste, Admin 🙏</Text>
      <Text style={s.email}>{user?.email}</Text>
      <View style={s.stats}>
        {stats.map(([k, v]) => (
          <View key={k} style={s.stat}>
            <Text style={s.statV}>{v ?? "–"}</Text>
            <Text style={s.statK}>{k}</Text>
          </View>
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
  statV: { color: C.gold, fontSize: 26, fontWeight: "900" },
  statK: { color: "#c8d4e6", fontSize: 12, fontWeight: "700" },
});
