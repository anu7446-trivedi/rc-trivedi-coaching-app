import React from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { deleteResult, fmtDate, getItem, getResultsForTest, getTestKey, score } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Card, Empty, Loading, Screen, Sub, confirm } from "../../components/ui";
import { C } from "../../lib/theme";

export default function TestResults() {
  const { cid, iid } = useLocalSearchParams<{ cid: string; iid: string }>();
  const { data, loading, reload } = useLoad(async () => {
    const [test, key, results] = await Promise.all([getItem(cid, iid), getTestKey(cid, iid), getResultsForTest(iid)]);
    const rows = results
      .map((r) => ({ ...r, sc: score(r.answers, key ?? []) }))
      .sort((a, b) => b.sc.right - a.sc.right);
    return { test, rows };
  }, [cid, iid]);
  if (!data) return <Loading />;
  const avg = data.rows.length ? (data.rows.reduce((t, r) => t + r.sc.right, 0) / data.rows.length).toFixed(1) : "–";
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Stack.Screen options={{ title: data.test?.title ?? "Results" }} />
      <Card style={{ backgroundColor: C.navy }}>
        <Text style={{ color: "#c8d4e6" }}>{data.rows.length} students ne test diya</Text>
        <Text style={{ color: C.gold, fontSize: 24, fontWeight: "900" }}>Average: {avg} / {data.test?.questions?.length ?? 0}</Text>
      </Card>
      <Sub>Merit list (sabse zyada number upar). "Dobara" dabane se student fir se test de payega.</Sub>
      {data.rows.length === 0 ? <Empty text="Abhi kisi ne test nahi diya." /> : null}
      {data.rows.map((r, i) => (
        <View key={r.id} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontWeight: "900", color: i < 3 ? C.orange : C.sub, width: 30 }}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", color: C.text }}>{r.studentName}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>✅{r.sc.right} ❌{r.sc.wrong} ⏭{r.sc.skipped} • {fmtDate(r.submittedAt)}</Text>
          </View>
          <Text style={{ fontWeight: "900", fontSize: 18, color: C.green }}>{r.sc.right}/{r.sc.total}</Text>
          <Btn small outline color={C.red} title="Dobara" onPress={() => confirm("Dobara test dene dein?", `${r.studentName} ka result hat jayega.`, async () => { await deleteResult(r.id); reload(); })} />
        </View>
      ))}
    </Screen>
  );
}
