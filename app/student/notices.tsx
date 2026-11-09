import React from "react";
import { Text } from "react-native";
import { useAuth } from "../../lib/auth";
import { fmtDate, getNotices } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Card, Empty, Loading, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Notices() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(() => getNotices(student!.batchId));
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      {data.length === 0 ? <Empty text="Koi notice nahi hai." /> : null}
      {data.map((n) => (
        <Card key={n.id}>
          <Text style={{ fontWeight: "900", fontSize: 16, color: C.text }}>{n.title}</Text>
          <Text style={{ marginTop: 6, color: "#3b4a5e", lineHeight: 21 }}>{n.body}</Text>
          <Text style={{ marginTop: 8, color: C.sub, fontSize: 11 }}>{fmtDate(n.createdAt)}</Text>
        </Card>
      ))}
    </Screen>
  );
}
