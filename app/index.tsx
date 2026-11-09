import React from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useAuth } from "../lib/auth";
import { isConfigured } from "../lib/firebase";
import { DEFAULT_SETTINGS, getSettings } from "../lib/db";
import { useLoad } from "../lib/useLoad";
import { C } from "../lib/theme";
import { Loading } from "../components/ui";

const logo = require("../assets/logo.png");
const colors = ["#1769aa", "#a51d2d", "#18834b", "#7a2cbf", "#d97706", "#0e7490"];

export default function Home() {
  const { user, isAdmin, student, loading } = useAuth();
  const { data } = useLoad(() => (isConfigured ? getSettings() : Promise.resolve(DEFAULT_SETTINGS)));
  const st = data ?? DEFAULT_SETTINGS;

  if (loading) return <Loading />;
  if (user && isAdmin) return <Redirect href="/admin" />;
  if (user && student) return <Redirect href="/student" />;

  const call = () => Linking.openURL(`tel:${st.phone}`);
  const wa = () => Linking.openURL(`https://wa.me/${st.whatsapp}`);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={{ backgroundColor: C.bg }}>
        <View style={s.hero}>
          <Image source={logo} style={s.logo} />
          <Text style={s.brand}>{st.name}</Text>
          <Text style={s.tag}>{st.tagline}</Text>
          <Text style={s.loc}>{st.address}</Text>
        </View>

        {!isConfigured ? (
          <View style={s.warn}>
            <Text style={s.warnT}>⚠️ Firebase abhi connect nahi hai. firebaseConfig.ts me apni keys daalein (README dekhein).</Text>
          </View>
        ) : null}

        <View style={s.quick}>
          <Q i="call-outline" t="Call" p={call} />
          <Q i="logo-whatsapp" t="WhatsApp" p={wa} />
          <Q i="create-outline" t="Admission" p={() => router.push("/enquiry")} />
          <Q i="log-in-outline" t="Login" p={() => router.push("/login")} />
        </View>

        <Text style={s.about}>{st.about}</Text>

        <Text style={s.title}>Hamare Courses</Text>
        <View style={s.grid}>
          {st.courses.map((c, i) => (
            <View key={c} style={s.card}>
              <View style={[s.icon, { backgroundColor: colors[i % colors.length] }]}>
                <Ionicons name="school-outline" size={24} color="#fff" />
              </View>
              <Text style={s.ct}>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={s.title}>Student Services</Text>
        <View style={s.box}>
          <F i="clipboard-outline" t="Online Tests" />
          <F i="document-text-outline" t="Notes & PDFs" />
          <F i="videocam-outline" t="Video Lectures" />
          <F i="analytics-outline" t="Result" />
          <F i="calendar-outline" t="Attendance" />
          <F i="wallet-outline" t="Fees Online" />
        </View>

        <Pressable style={s.login} onPress={() => router.push("/login")}>
          <Ionicons name="person-circle-outline" size={22} color="#fff" />
          <Text style={s.loginT}>Student / Admin Login</Text>
        </Pressable>

        <Pressable style={s.contact} onPress={call}>
          <Text style={s.cn}>Sampark Karein</Text>
          <Text style={s.cp}>{st.phone}</Text>
        </Pressable>
        <Text style={s.foot}>Education for Every Child • Your Success is Our Mission</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Q({ i, t, p }: { i: keyof typeof Ionicons.glyphMap; t: string; p: () => void }) {
  return (
    <Pressable style={s.q} onPress={p}>
      <Ionicons name={i} size={23} color="#fff" />
      <Text style={s.qt}>{t}</Text>
    </Pressable>
  );
}
function F({ i, t }: { i: keyof typeof Ionicons.glyphMap; t: string }) {
  return (
    <View style={s.f}>
      <Ionicons name={i} size={23} color={C.blue} />
      <Text style={s.ft}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  hero: { backgroundColor: C.navy, alignItems: "center", paddingBottom: 30, paddingHorizontal: 16 },
  logo: { width: 130, height: 130 },
  brand: { color: C.gold, fontSize: 24, fontWeight: "900", textAlign: "center" },
  tag: { color: "#f7df9a", fontWeight: "700", marginTop: 5 },
  loc: { color: "#d7e1ef", fontSize: 12, marginTop: 5 },
  warn: { backgroundColor: "#fff7dc", margin: 14, marginBottom: 0, padding: 12, borderRadius: 12 },
  warnT: { color: "#8a6500", fontSize: 12, fontWeight: "700" },
  quick: { flexDirection: "row", justifyContent: "space-around", backgroundColor: C.blue, margin: 14, borderRadius: 18, paddingVertical: 12 },
  q: { alignItems: "center", width: "24%" },
  qt: { color: "#fff", fontWeight: "700", fontSize: 12, marginTop: 4 },
  about: { backgroundColor: C.bg, color: C.text, paddingHorizontal: 16, fontSize: 14, lineHeight: 21 },
  title: { fontSize: 19, fontWeight: "900", color: C.navy, padding: 16, paddingBottom: 10, backgroundColor: C.bg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 14, backgroundColor: C.bg },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, minHeight: 120 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  ct: { fontWeight: "800", color: C.text, fontSize: 13 },
  box: { marginHorizontal: 14, backgroundColor: "#fff", borderRadius: 18, padding: 10, flexDirection: "row", flexWrap: "wrap" },
  f: { width: "50%", flexDirection: "row", alignItems: "center", padding: 10 },
  ft: { marginLeft: 8, color: "#25354c", fontWeight: "700", fontSize: 12 },
  login: { margin: 14, marginBottom: 0, backgroundColor: C.blue, borderRadius: 14, padding: 15, flexDirection: "row", justifyContent: "center", gap: 8 },
  loginT: { color: "#fff", fontWeight: "900", fontSize: 15 },
  contact: { margin: 14, backgroundColor: C.maroon, borderRadius: 18, alignItems: "center", paddingVertical: 16 },
  cn: { color: "#fff", fontSize: 16, fontWeight: "900" },
  cp: { color: "#f7d35e", fontSize: 24, fontWeight: "900" },
  foot: { textAlign: "center", color: "#64748b", fontSize: 11, padding: 22, backgroundColor: C.bg },
});
