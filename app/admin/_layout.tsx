import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../lib/auth";
import { C } from "../../lib/theme";
import { Loading } from "../../components/ui";

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || !isAdmin) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: C.maroon }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "800" } }}>
      <Stack.Screen name="index" options={{ title: "Admin Panel" }} />
      <Stack.Screen name="courses" options={{ title: "Courses" }} />
      <Stack.Screen name="course-edit" options={{ title: "Course" }} />
      <Stack.Screen name="course-content" options={{ title: "Course Content" }} />
      <Stack.Screen name="item-edit" options={{ title: "Content Jodein" }} />
      <Stack.Screen name="test-results" options={{ title: "Test Results" }} />
      <Stack.Screen name="students" options={{ title: "Students" }} />
      <Stack.Screen name="student-edit" options={{ title: "Student" }} />
      <Stack.Screen name="orders" options={{ title: "Sales / Kamai" }} />
      <Stack.Screen name="batches" options={{ title: "Batches" }} />
      <Stack.Screen name="notices" options={{ title: "Notices" }} />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
      <Stack.Screen name="fees" options={{ title: "Coaching Fees" }} />
      <Stack.Screen name="enquiries" options={{ title: "Admission Enquiries" }} />
      <Stack.Screen name="settings" options={{ title: "App Settings" }} />
    </Stack>
  );
}
