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
      <Stack.Screen name="students" options={{ title: "Students" }} />
      <Stack.Screen name="student-form" options={{ title: "Student" }} />
      <Stack.Screen name="batches" options={{ title: "Batches" }} />
      <Stack.Screen name="notices" options={{ title: "Notices" }} />
      <Stack.Screen name="material" options={{ title: "Notes & Videos" }} />
      <Stack.Screen name="tests" options={{ title: "Tests" }} />
      <Stack.Screen name="test-edit" options={{ title: "Test Banayein" }} />
      <Stack.Screen name="test-results" options={{ title: "Test Results" }} />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
      <Stack.Screen name="fees" options={{ title: "Fees" }} />
      <Stack.Screen name="enquiries" options={{ title: "Admission Enquiries" }} />
      <Stack.Screen name="settings" options={{ title: "App Settings" }} />
    </Stack>
  );
}
