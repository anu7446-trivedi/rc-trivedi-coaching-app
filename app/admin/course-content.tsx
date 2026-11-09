import React from "react";
import { Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { deleteItem, getCourse, getItems } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { openItem } from "../../lib/content";
import { Btn, Card, Empty, Loading, Screen, Sub, confirm } from "../../components/ui";
import { C } from "../../lib/theme";

const EMOJI = { video: "🎬", live: "🔴", pdf: "📄", link: "🔗", test: "📝" } as const;

export default function CourseContent() {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { data, loading, reload } = useLoad(async () => ({ course: await getCourse(cid), items: await getItems(cid) }), [cid]);
  if (!data) return <Loading />;
  const add = (type: string) => router.push({ pathname: "/admin/item-edit", params: { cid, type } });
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Stack.Screen options={{ title: data.course?.title ?? "Content" }} />
      <Sub>Kya jodna hai?</Sub>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <Btn small title="🎬 Video" onPress={() => add("video")} />
        <Btn small title="🔴 Live Class" color={C.red} onPress={() => add("live")} />
        <Btn small title="📄 PDF / Notes" color={C.maroon} onPress={() => add("pdf")} />
        <Btn small title="📝 Test" color="#0e7490" onPress={() => add("test")} />
        <Btn small title="🔗 Link" color="#475569" onPress={() => add("link")} />
      </View>
      {data.items.length === 0 ? <Empty text="Abhi kuch nahi joda." /> : null}
      {data.items.map((it) => (
        <Card key={it.id}>
          <Text style={{ fontWeight: "900", color: C.text }}>{EMOJI[it.type]} {it.title}</Text>
          <Text style={{ color: C.sub, fontSize: 12, marginVertical: 4 }}>
            {it.section || "Anya"}{it.type === "test" ? ` • ${it.questions?.length ?? 0} prashn • ${it.durationMin} min` : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Btn small outline title="Kholein" onPress={() => openItem(it)} />
            <Btn small outline title="Edit" onPress={() => router.push({ pathname: "/admin/item-edit", params: { cid, id: it.id } })} />
            {it.type === "test" ? <Btn small title="Results" onPress={() => router.push({ pathname: "/admin/test-results", params: { cid, iid: it.id } })} /> : null}
            <Btn small outline color={C.red} title="Delete" onPress={() => confirm("Hatayein?", it.title, async () => { await deleteItem(cid, it); reload(); })} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
