import React, { useState } from "react";
import { router } from "expo-router";
import { getBatches, getStudents } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import BatchPicker from "../../components/BatchPicker";
import { Badge, Btn, Empty, Input, Loading, Row, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Students() {
  const { data, loading, reload } = useLoad(async () => {
    const [students, batches] = await Promise.all([getStudents(), getBatches()]);
    return { students: students.sort((a, b) => a.name.localeCompare(b.name)), batches };
  });
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState("all");
  if (!data) return <Loading />;
  const bName = (id: string) => data.batches.find((b) => b.id === id)?.name ?? "—";
  const items = data.students.filter(
    (s) => (batch === "all" || s.batchId === batch) &&
      (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.mobile.includes(q)),
  );
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Btn title="Naya Student Jodein" icon="person-add" onPress={() => router.push("/admin/student-form")} />
      <Input placeholder="🔍 Naam ya mobile se khojein" value={q} onChangeText={setQ} style={{ marginTop: 8 }} />
      <BatchPicker batches={data.batches} value={batch} onChange={setBatch} label="Batch filter" />
      {items.length === 0 ? <Empty text="Koi student nahi mila." /> : null}
      {items.map((s) => (
        <Row
          key={s.id}
          icon="person-circle-outline"
          title={s.name}
          subtitle={`${s.mobile} • ${bName(s.batchId)} • ₹${s.monthlyFee || 0}/mahina`}
          right={s.active ? undefined : <Badge label="Band" color={C.red} />}
          onPress={() => router.push({ pathname: "/admin/student-form", params: { id: s.id } })}
        />
      ))}
    </Screen>
  );
}
