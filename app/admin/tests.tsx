import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { deleteTest, fmtDate, getBatches, getTests, saveTest, getTestKey, Test } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Card, Empty, Loading, Screen, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminTests() {
  const { data, loading, reload } = useLoad(async () => ({ tests: await getTests(), batches: await getBatches() }));
  if (!data) return <Loading />;
  const bName = (id: string) => (id === "all" ? "Sabhi batch" : data.batches.find((b) => b.id === id)?.name ?? "—");

  const togglePublish = async (t: Test) => {
    try {
      const key = (await getTestKey(t.id)) ?? [];
      const { id, createdAt, ...rest } = t;
      await saveTest({ ...rest, published: !t.published, questions: t.questions.map((q, i) => ({ ...q, answer: key[i] ?? 0 })) }, id);
      reload();
    } catch (e: any) { notify("Error", e?.message); }
  };

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Btn title="Naya Test Banayein" icon="add-circle-outline" onPress={() => router.push("/admin/test-edit")} />
      <View style={{ height: 8 }} />
      {data.tests.length === 0 ? <Empty text="Abhi koi test nahi." /> : null}
      {data.tests.map((t) => (
        <Card key={t.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: "900", fontSize: 16, color: C.text, flex: 1 }}>{t.title}</Text>
            <Badge label={t.published ? "Live" : "Draft"} color={t.published ? C.green : C.sub} />
          </View>
          <Text style={{ color: C.sub, marginVertical: 6, fontSize: 12 }}>
            {t.questions.length} prashn • {t.durationMin} min • {bName(t.batchId)} • {fmtDate(t.createdAt)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Btn small title={t.published ? "Band karein" : "Live karein"} color={t.published ? C.orange : C.green} onPress={() => togglePublish(t)} />
            <Btn small title="Results" color={C.blue} onPress={() => router.push({ pathname: "/admin/test-results", params: { id: t.id } })} />
            <Btn small outline title="Edit" onPress={() => router.push({ pathname: "/admin/test-edit", params: { id: t.id } })} />
            <Btn small outline color={C.red} title="Delete" onPress={() => confirm("Test delete karein?", t.title, async () => { await deleteTest(t.id); reload(); })} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
