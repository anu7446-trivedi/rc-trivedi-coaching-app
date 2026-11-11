import React from "react";
import { Linking, Share, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { authErrorHi, useAuth } from "../../lib/auth";
import { deleteMyAccount } from "../../lib/db";
import { getSettings } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Row, Screen, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

const PRIVACY = "https://rc-trivedi-coaching.web.app/privacy.html";

export default function More() {
  const { student, logout } = useAuth();
  const { data: st } = useLoad(getSettings);
  return (
    <Screen>
      <View style={s.head}>
        <View style={s.av}><Text style={s.avT}>{student!.name.charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{student!.name}</Text>
          <Text style={s.ph}>{student!.phone}</Text>
        </View>
      </View>
      <Row icon="create-outline" title="Profile Edit" onPress={() => router.push("/student/profile")} />
      <Row icon="megaphone-outline" title="Notices / Suchna" onPress={() => router.push("/student/notices")} />
      <Row icon="cart-outline" title="Sabhi Courses" onPress={() => router.push("/courses")} />
      {student!.batchId ? (
        <>
          <Row icon="calendar-outline" title="Attendance (Coaching)" onPress={() => router.push("/student/attendance")} />
          <Row icon="wallet-outline" title="Coaching ki Monthly Fees" onPress={() => router.push("/student/fees")} />
        </>
      ) : null}
      <Row icon="logo-whatsapp" color="#25D366" title="WhatsApp par baat karein" onPress={() => st && Linking.openURL(`https://wa.me/${st.whatsapp}`)} />
      <Row icon="call-outline" title="Call karein" onPress={() => st && Linking.openURL(`tel:${st.phone}`)} />
      <Row icon="share-social-outline" title="App share karein" onPress={() => Share.share({ message: `${st?.name ?? "RC Trivedi Coaching"} ka app — Class 6 entrance ki taiyari. Play Store par "RC Trivedi Coaching" khojein.` })} />
      <Row icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => WebBrowser.openBrowserAsync(st?.privacyUrl || PRIVACY)} />
      <Btn title="Logout" icon="log-out-outline" outline color={C.red} onPress={logout} />
      <Text style={{ textAlign: "center", color: C.red, marginTop: 18, textDecorationLine: "underline" }}
        onPress={() => confirm("Account hamesha ke liye delete karein?", "Aapka naam, profile aur login hat jayega. Khareede hue courses bhi wapas nahi milenge. Ye wapas nahi hoga.", async () => {
          try { await deleteMyAccount(); notify("Account delete ho gaya"); }
          catch (e: any) { notify("Delete nahi hua", (e?.code ?? "").includes("recent-login") ? "Suraksha ke liye pehle Logout karke dobara OTP se login karein, phir turant delete karein." : authErrorHi(e)); }
        })}>Account delete karein</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.navy, borderRadius: 16, padding: 16, marginBottom: 14 },
  av: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  avT: { fontSize: 22, fontWeight: "900", color: C.navy },
  name: { color: "#fff", fontWeight: "900", fontSize: 17 },
  ph: { color: "#c8d4e6", marginTop: 2 },
});
