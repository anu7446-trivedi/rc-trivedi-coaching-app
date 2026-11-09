import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../lib/auth";
import { C } from "../../lib/theme";
import { Loading } from "../../components/ui";

export default function StudentLayout() {
  const { user, student, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || !student) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: C.navy }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "800" } }}>
      <Stack.Screen name="index" options={{ title: "Student Dashboard" }} />
      <Stack.Screen name="notices" options={{ title: "Notices" }} />
      <Stack.Screen name="material" options={{ title: "Notes & Videos" }} />
      <Stack.Screen name="tests" options={{ title: "Online Tests" }} />
      <Stack.Screen name="test/[id]" options={{ title: "Test" }} />
      <Stack.Screen name="results" options={{ title: "Mere Results" }} />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
      <Stack.Screen name="fees" options={{ title: "Fees" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
