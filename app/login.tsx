import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { authErrorHi, useAuth } from "../lib/auth";
import { isConfigured } from "../lib/firebase";
import { Btn, Card, Chip, H, Input, Screen, Sub, notify } from "../components/ui";
import { C } from "../lib/theme";

export default function Login() {
  const { loginStudent, loginAdmin } = useAuth();
  const [mode, setMode] = useState<"student" | "admin">("student");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isConfigured) return notify("Firebase setup baaki hai", "firebaseConfig.ts me keys daalein.");
    if (!id || !pw) return notify("Sabhi jaankari bharein");
    setBusy(true);
    try {
      if (mode === "student") {
        await loginStudent(id, pw);
        router.replace("/student");
      } else {
        await loginAdmin(id, pw);
        router.replace("/admin");
      }
    } catch (e) {
      notify("Login nahi hua", authErrorHi(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H>Login</H>
      <Sub>Student apne mobile number aur password se login karein. Password coaching se milega.</Sub>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        <Chip label="👨‍🎓 Student" active={mode === "student"} onPress={() => setMode("student")} />
        <Chip label="🛡️ Admin" active={mode === "admin"} onPress={() => setMode("admin")} />
      </View>
      <Card>
        {mode === "student" ? (
          <Input label="Mobile Number" keyboardType="phone-pad" maxLength={10} value={id} onChangeText={setId} placeholder="10 digit mobile" />
        ) : (
          <Input label="Admin Email" keyboardType="email-address" autoCapitalize="none" value={id} onChangeText={setId} placeholder="admin@gmail.com" />
        )}
        <Input label="Password" secureTextEntry value={pw} onChangeText={setPw} placeholder="Password" />
        <Btn title="LOGIN" onPress={submit} loading={busy} color={mode === "admin" ? C.maroon : C.blue} />
      </Card>
    </Screen>
  );
}
