import React from "react";
import { router } from "expo-router";
import { Course, fmtDate, getCourses, getMyEnrollments, isActive, isFree } from "../../lib/db";
import { useAuth } from "../../lib/auth";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Empty, Loading, Row, Screen, Sub } from "../../components/ui";
import { C } from "../../lib/theme";

export default function MyCourses() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const [courses, enr] = await Promise.all([getCourses(), getMyEnrollments(student!.id)]);
    const byId = new Map(courses.map((c) => [c.id, c]));
    const mine = enr.map((e) => ({ e, c: byId.get(e.courseId) })).filter((x): x is { e: typeof x.e; c: Course } => !!x.c);
    return { mine, free: courses.filter(isFree) };
  });
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      {data.mine.length === 0 ? (
        <>
          <Empty text="Aapne abhi koi course nahi khareeda." />
          <Btn title="Courses Dekhein" icon="cart" onPress={() => router.push("/courses")} />
        </>
      ) : null}
      {data.mine.map(({ e, c }) => (
        <Row key={e.id} icon="book" title={c.title}
          subtitle={isActive(e) ? `Validity: ${fmtDate(e.expiresAt)} tak` : `Khatam: ${fmtDate(e.expiresAt)}`}
          right={isActive(e) ? undefined : <Badge label="Expired" color={C.red} />}
          onPress={() => router.push(isActive(e) ? { pathname: "/learn/[cid]", params: { cid: c.id } } : { pathname: "/course/[id]", params: { id: c.id } })} />
      ))}
      {data.free.length ? <Sub>Free content</Sub> : null}
      {data.free.map((c) => (
        <Row key={c.id} icon="gift" color={C.orange} title={c.title} subtitle="FREE"
          onPress={() => router.push({ pathname: "/learn/[cid]", params: { cid: c.id } })} />
      ))}
    </Screen>
  );
}
