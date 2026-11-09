import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { getOrders, rupee } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Card, Empty, Loading, Screen, Sub } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Orders() {
  const { data, loading, reload } = useLoad(getOrders);
  if (!data) return <Loading />;
  const total = data.reduce((t, o) => t + o.amount, 0);
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card style={{ backgroundColor: C.navy }}>
        <Text style={{ color: "#c8d4e6" }}>Kul online kamai ({data.length} order)</Text>
        <Text style={{ color: C.gold, fontSize: 30, fontWeight: "900" }}>{rupee(total)}</Text>
        <Text style={{ color: "#c8d4e6", fontSize: 11 }}>Razorpay apna ~2% kaat kar baaki paisa aapke bank me bhejta hai (aam taur par 2–3 din me).</Text>
      </Card>
      <Sub>Poora hisaab Razorpay Dashboard me bhi milega.</Sub>
      {data.length === 0 ? <Empty text="Abhi koi online sale nahi." /> : null}
      {data.map((o) => (
        <View key={o.id} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "900", color: C.text, flex: 1 }} onPress={() => router.push({ pathname: "/admin/student-edit", params: { id: o.uid } })}>
              {o.studentName || "Student"} {o.phone ? `• ${o.phone.replace("+91", "")}` : ""}
            </Text>
            <Text style={{ fontWeight: "900", color: C.green }}>{rupee(o.amount)}</Text>
          </View>
          <Text style={{ color: C.sub, fontSize: 12 }}>{o.courseTitle}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{o.paidAt?.toDate().toLocaleString("en-IN")} • {o.paymentId}</Text>
        </View>
      ))}
    </Screen>
  );
}
