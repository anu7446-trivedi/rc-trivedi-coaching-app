import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { catInfo, getCourses, isFree, rupee, seedCourses } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Card, Empty, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminCourses() {
  const { data, loading, reload } = useLoad(() => getCourses(true));
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Btn title="Naya Course Banayein" icon="add-circle-outline" onPress={() => router.push("/admin/course-edit")} />
      {data.length === 0 ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: "900", color: C.text, marginBottom: 6 }}>Shuruaat aasaan banayein</Text>
          <Sub>Ek button se ye courses ban jayenge: Maths, Reasoning, Hindi, EVS, Test Series, Free Material, aur Sampoorn Course (sab ek saath). Baad me naam/price badal sakte hain. Ye "Draft" rahenge jab tak aap Live na karein.</Sub>
          <Btn title="Taiyar Courses Banayein" icon="flash-outline" color={C.green} loading={busy}
            onPress={() => confirm("Courses banayein?", "7 courses ban jayenge.", async () => {
              setBusy(true);
              try { await seedCourses(); reload(); } catch (e: any) { notify("Error", e?.message); } finally { setBusy(false); }
            })} />
        </Card>
      ) : null}
      <View style={{ height: 8 }} />
      {data.length === 0 ? <Empty text="Abhi koi course nahi." /> : null}
      {data.map((c) => {
        const n = c.counts ?? {};
        return (
          <Card key={c.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <Text style={{ fontWeight: "900", fontSize: 15, color: C.text, flex: 1 }}>{c.title}</Text>
              <Badge label={c.published ? "Live" : "Draft"} color={c.published ? C.green : C.sub} />
            </View>
            <Text style={{ color: C.sub, fontSize: 12, marginVertical: 6 }}>
              {catInfo(c.category).short} • {isFree(c) ? "FREE" : rupee(c.price)} • {c.validityDays} din{"\n"}
              🎬 {n.video ?? 0}  🔴 {n.live ?? 0}  📄 {n.pdf ?? 0}  📝 {n.test ?? 0}{c.includes?.length ? `  • ${c.includes.length} course shamil` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <Btn small title="Content" icon="folder-open-outline" onPress={() => router.push({ pathname: "/admin/course-content", params: { cid: c.id } })} />
              <Btn small outline title="Edit / Price" onPress={() => router.push({ pathname: "/admin/course-edit", params: { id: c.id } })} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
