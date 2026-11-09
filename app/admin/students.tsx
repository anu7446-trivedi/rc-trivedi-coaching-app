import React, { useState } from "react";
import { router } from "expo-router";
import { fmtDate, getStudents, newestFirst } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Empty, Input, Loading, Row, Screen, Sub } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Students() {
  const { data, loading, reload } = useLoad(async () => newestFirst(await getStudents()));
  const [q, setQ] = useState("");
  if (!data) return <Loading />;
  const items = data.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q));
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Sub>Student khud OTP se login karke judte hain. Kul: {data.length}</Sub>
      <Input placeholder="🔍 Naam ya mobile se khojein" value={q} onChangeText={setQ} />
      {items.length === 0 ? <Empty text="Koi student nahi mila." /> : null}
      {items.map((s) => (
        <Row key={s.id} icon="person-circle-outline" title={s.name}
          subtitle={`${s.phone.replace("+91", "")} • ${s.className || "—"} • ${fmtDate(s.createdAt)}`}
          right={s.active ? undefined : <Badge label="Band" color={C.red} />}
          onPress={() => router.push({ pathname: "/admin/student-edit", params: { id: s.id } })} />
      ))}
    </Screen>
  );
}
