import React from "react";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { fmtDate, getResultsForStudent, getTestKey, score } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Empty, Loading, Row, Screen } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Results() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const rs = await getResultsForStudent(student!.id);
    return Promise.all(rs.map(async (r) => {
      const key = await getTestKey(r.testId);
      return { ...r, sc: key ? score(r.answers, key) : null };
    }));
  });
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      {data.length === 0 ? <Empty text="Aapne abhi koi test nahi diya." /> : null}
      {data.map((r) => {
        const pct = r.sc && r.sc.total ? Math.round((r.sc.right / r.sc.total) * 100) : 0;
        return (
          <Row
            key={r.id}
            icon="trophy-outline"
            color={C.green}
            title={r.testTitle}
            subtitle={fmtDate(r.submittedAt)}
            right={r.sc ? <Badge label={`${r.sc.right}/${r.sc.total} (${pct}%)`} color={pct >= 60 ? C.green : pct >= 35 ? C.orange : C.red} /> : undefined}
            onPress={() => router.push({ pathname: "/student/test/[id]", params: { id: r.testId } })}
          />
        );
      })}
    </Screen>
  );
}
