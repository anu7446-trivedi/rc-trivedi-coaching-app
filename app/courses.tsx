import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { catInfo, Category, getCourses, getMyEnrollments, isActive } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useLoad } from "../lib/useLoad";
import { CourseCard } from "../components/store";
import { Empty, Loading, Screen } from "../components/ui";

export default function Courses() {
  const { category } = useLocalSearchParams<{ category?: Category }>();
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const [courses, enr] = await Promise.all([getCourses(), student ? getMyEnrollments(student.id) : Promise.resolve([])]);
    return { courses: courses.filter((c) => !category || c.category === category), owned: new Set(enr.filter(isActive).map((e) => e.courseId)) };
  }, [category, student?.id]);
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Stack.Screen options={{ title: category ? catInfo(category).short : "Sabhi Courses" }} />
      {data.courses.length === 0 ? <Empty text="Is vishay ke courses jaldi aa rahe hain." /> : null}
      {data.courses.map((c) => <CourseCard key={c.id} course={c} owned={data.owned.has(c.id)} />)}
    </Screen>
  );
}
