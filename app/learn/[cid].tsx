import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Course, getCourse, getCourses, getItems, getMyResult, Item } from "../../lib/db";
import { useAuth } from "../../lib/auth";
import { useLoad } from "../../lib/useLoad";
import { Badge, Chip, Empty, Loading, Row, Screen } from "../../components/ui";
import { openItem } from "../../lib/content";
import { C } from "../../lib/theme";

const ICON = { video: "play-circle", live: "radio", pdf: "document-text", link: "link", test: "clipboard" } as const;
const COLOR = { video: "#c4302b", live: "#dc2626", pdf: "#a51d2d", link: "#1769aa", test: "#0e7490" } as const;
const FILTERS: { k: "all" | Item["type"]; l: string }[] = [
  { k: "all", l: "Sab" }, { k: "video", l: "🎬 Video" }, { k: "live", l: "🔴 Live" }, { k: "pdf", l: "📄 PDF" }, { k: "test", l: "📝 Test" },
];

export default function Learn() {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { student } = useAuth();
  const [f, setF] = useState<(typeof FILTERS)[number]["k"]>("all");
  const { data, loading, reload, error } = useLoad(async () => {
    const course = await getCourse(cid);
    const items = await getItems(cid);
    const subs: Course[] = course?.includes?.length ? (await getCourses()).filter((c) => course.includes.includes(c.id)) : [];
    const done = new Set<string>();
    if (student) await Promise.all(items.filter((i) => i.type === "test").map(async (i) => { if (await getMyResult(i.id, student.id)) done.add(i.id); }));
    return { course, items, subs, done };
  }, [cid, student?.id]);

  if (error) return <Screen><Empty text="🔒 Ye content dekhne ke liye course khareedein (ya validity khatam ho gayi hai)." /></Screen>;
  if (!data) return <Loading />;
  const items = data.items.filter((i) => f === "all" || i.type === f);
  const sections = [...new Set(items.map((i) => i.section || "Anya"))];

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Stack.Screen options={{ title: data.course?.title ?? "Content" }} />
      {data.subs.length ? (
        <>
          <Text style={{ fontWeight: "900", fontSize: 16, color: C.navy, marginBottom: 8 }}>Is pack ke courses</Text>
          {data.subs.map((c) => (
            <Row key={c.id} icon="folder-open" title={c.title} subtitle={c.subtitle}
              onPress={() => router.push({ pathname: "/learn/[cid]", params: { cid: c.id } })} />
          ))}
        </>
      ) : null}
      {data.items.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
          {FILTERS.map((x) => <Chip key={x.k} label={x.l} active={f === x.k} onPress={() => setF(x.k)} />)}
        </View>
      ) : null}
      {!data.items.length && !data.subs.length ? <Empty text="Content jald hi joda jayega." /> : null}
      {sections.map((sec) => (
        <View key={sec}>
          <Text style={{ fontWeight: "900", color: C.sub, marginTop: 10, marginBottom: 6 }}>{sec.toUpperCase()}</Text>
          {items.filter((i) => (i.section || "Anya") === sec).map((it) => (
            <Row key={it.id} icon={ICON[it.type]} color={COLOR[it.type]} title={it.title}
              subtitle={it.type === "test" ? `${it.questions?.length ?? 0} prashn • ${it.durationMin ?? 0} min` : it.type === "live" ? "Live class" : undefined}
              right={it.type === "test" && data.done.has(it.id) ? <Badge label="Diya ✓" color={C.green} /> : undefined}
              onPress={() => openItem(it)} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
