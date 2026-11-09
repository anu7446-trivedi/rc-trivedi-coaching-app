import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { C } from "../../lib/theme";
import { Loading } from "../../components/ui";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) =>
  <Ionicons name={name} color={color} size={size} />;

export default function StudentLayout() {
  const { user, student, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!student) return <Redirect href="/register" />;
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: C.navy }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "800" },
      tabBarActiveTintColor: C.blue, tabBarLabelStyle: { fontWeight: "700" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", headerTitle: "RC Trivedi Coaching", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="my-courses" options={{ title: "Mere Course", tabBarIcon: icon("library") }} />
      <Tabs.Screen name="results" options={{ title: "Results", tabBarIcon: icon("trophy") }} />
      <Tabs.Screen name="more" options={{ title: "Profile", tabBarIcon: icon("person-circle") }} />
      <Tabs.Screen name="notices" options={{ href: null, title: "Notices" }} />
      <Tabs.Screen name="attendance" options={{ href: null, title: "Attendance" }} />
      <Tabs.Screen name="fees" options={{ href: null, title: "Coaching Fees" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "Profile Edit" }} />
    </Tabs>
  );
}
