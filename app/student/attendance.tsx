import React from "react";
import { Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { getAttendanceForBatch } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Card, Empty, Loading, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AttendanceScreen() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    if (!student!.batchId) return [];
    const all = await getAttendanceForBatch(student!.batchId);
    return all
      .filter((a) => a.present.includes(student!.id) || a.absent.includes(student!.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  if (!data) return <Loading />;
  const present = data.filter((a) => a.present.includes(student!.id)).length;
  const pct = data.length ? Math.round((present / data.length) * 100) : 0;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card style={{ backgroundColor: C.navy, alignItems: "center" }}>
        <Text style={{ color: "#c8d4e6" }}>Kul Attendance</Text>
        <Text style={{ color: C.gold, fontSize: 40, fontWeight: "900" }}>{pct}%</Text>
        <Text style={{ color: "#fff" }}>Present {present} / {data.length} din</Text>
      </Card>
      {data.length === 0 ? <Empty text="Abhi attendance record nahi hai." /> : null}
      {data.map((a) => {
        const p = a.present.includes(student!.id);
        return (
          <View key={a.id} style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8 }}>
            <Text style={{ fontWeight: "700", color: C.text }}>{a.date.split("-").reverse().join("/")}</Text>
            <Badge label={p ? "Present" : "Absent"} color={p ? C.green : C.red} />
          </View>
        );
      })}
    </Screen>
  );
}
