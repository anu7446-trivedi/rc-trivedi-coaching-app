import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, Stack } from "expo-router";
import { useAuth } from "../lib/auth";
import StoreHome from "../components/StoreHome";
import { Loading } from "../components/ui";

export default function Index() {
  const { user, isAdmin, student, loading } = useAuth();
  if (loading) return <Loading />;
  if (user && isAdmin) return <Redirect href="/admin" />;
  if (user && !student) return <Redirect href="/register" />;
  if (user && student) return <Redirect href="/student" />;
  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <Pressable onPress={() => router.push("/login")} hitSlop={10}>
            <Ionicons name="log-in-outline" size={26} color="#fff" />
          </Pressable>
        ),
      }} />
      <StoreHome />
    </>
  );
}
