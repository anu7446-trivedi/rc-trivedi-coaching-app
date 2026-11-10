import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth";
import { C } from "../lib/theme";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerStyle: { backgroundColor: C.navy }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "800" } }}>
          <Stack.Screen name="index" options={{ title: "RC Trivedi Coaching" }} />
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="register" options={{ title: "Apni Jaankari", headerBackVisible: false }} />
          <Stack.Screen name="enquiry" options={{ title: "Admission Enquiry" }} />
          <Stack.Screen name="courses" options={{ title: "Courses" }} />
          <Stack.Screen name="course/[id]" options={{ title: "Course" }} />
          <Stack.Screen name="learn/[cid]" options={{ title: "Course Content" }} />
          <Stack.Screen name="learn/video" options={{ title: "Video" }} />
          <Stack.Screen name="learn/doc" options={{ title: "Notes" }} />
          <Stack.Screen name="learn/test" options={{ title: "Test" }} />
          <Stack.Screen name="student" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
