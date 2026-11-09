import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Href } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getNotices, fmtDate } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Card, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

const tiles: { t: string; i: keyof typeof Ionicons.glyphMap; h: Href; c: string }[] = [
  { t: "Online Test", i: "clipboard-outline", h: "/student/tests", c: "#1769aa" },
  { t: "Notes & Videos", i: "book-outline", h: "/student/material", c: "#a51d2d" },
  { t: "Mere Results", i: "trophy-outline", h: "/student/results", c: "#18834b" },
  { t: "Attendance", i: "calendar-outline", h: "/student/attendance", c: "#7a2cbf" },
  { t: "Fees / Payment", i: "wallet-outline", h: "/student/fees", c: "#d97706" },
  { t: "Notices", i: "megaphone-outline", h: "/student/notices", c: "#0e7490" },
];

export default function StudentHome() {
  const { student, logout } = useAuth();
  const { data: notices, reload, loading } = useLoad(() => getNotices(student!.batchId), [student?.batchId]);

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Pressable style={s.hello} onPress={() => router.push("/student/profile")}>
        <View style={s.avatar}><Text style={s.avatarT}>{student!.name.charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.hi}>Namaste, {student!.name} 👋</Text>
          <Text style={s.hiSub}>{student!.className || "Student"} • Profile dekhein</Text>
        </View>
      </Pressable>

      <View style={s.grid}>
        {tiles.map((t) => (
          <Pressable key={t.t} style={s.tile} onPress={() => router.push(t.h)}>
            <View style={[s.ic, { backgroundColor: t.c }]}><Ionicons name={t.i} size={24} color="#fff" /></View>
            <Text style={s.tt}>{t.t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.sec}>📢 Latest Notices</Text>
      {(notices ?? []).slice(0, 3).map((n) => (
        <Card key={n.id}>
          <Text style={s.nt}>{n.title}</Text>
          <Text style={s.nb} numberOfLines={3}>{n.body}</Text>
          <Text style={s.nd}>{fmtDate(n.createdAt)}</Text>
        </Card>
      ))}
      {notices && notices.length === 0 ? <Text style={s.nb}>Abhi koi notice nahi hai.</Text> : null}

      <View style={{ height: 16 }} />
      <Btn title="Logout" icon="log-out-outline" outline color={C.red} onPress={logout} />
    </Screen>
  );
}

const s = StyleSheet.create({
  hello: { flexDirection: "row", alignItems: "center", backgroundColor: C.navy, borderRadius: 18, padding: 16, marginBottom: 16, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  avatarT: { fontSize: 22, fontWeight: "900", color: C.navy },
  hi: { color: "#fff", fontWeight: "900", fontSize: 17 },
  hiSub: { color: "#c8d4e6", fontSize: 12, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { width: "31.5%", backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: C.border },
  ic: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tt: { fontWeight: "800", color: C.text, fontSize: 12, textAlign: "center" },
  sec: { fontSize: 17, fontWeight: "900", color: C.navy, marginTop: 10, marginBottom: 10 },
  nt: { fontWeight: "900", color: C.text, fontSize: 15 },
  nb: { color: "#3b4a5e", marginTop: 4, lineHeight: 20 },
  nd: { color: C.sub, fontSize: 11, marginTop: 6 },
});
