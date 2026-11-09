import React from "react";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getResultsForStudent, getTests } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Empty, Loading, Row, Screen, Sub } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Tests() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const [tests, results] = await Promise.all([getTests(student!.batchId), getResultsForStudent(student!.id)]);
    const done = new Set(results.map((r) => r.testId));
    return tests.map((t) => ({ ...t, done: done.has(t.id) }));
  });
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Sub>Har test sirf ek baar diya ja sakta hai. Time khatam hote hi test apne aap submit ho jayega.</Sub>
      {data.length === 0 ? <Empty text="Abhi koi test nahi hai." /> : null}
      {data.map((t) => (
        <Row
          key={t.id}
          icon="clipboard-outline"
          title={t.title}
          subtitle={`${t.questions.length} prashn • ${t.durationMin} minute`}
          right={t.done ? <Badge label="Diya hua ✓" color={C.green} /> : <Badge label="Shuru karein" color={C.blue} />}
          onPress={() => router.push({ pathname: "/student/test/[id]", params: { id: t.id } })}
        />
      ))}
    </Screen>
  );
}
