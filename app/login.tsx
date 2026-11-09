import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { authErrorHi, useAuth } from "../lib/auth";
import { Btn, Card, Chip, H, Input, Screen, Sub, notify } from "../components/ui";
import { C } from "../lib/theme";

export default function Login() {
  const { sendOtp, confirmOtp, loginAdmin, user, isAdmin, student } = useAuth();
  const [mode, setMode] = useState<"student" | "admin">("student");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  // Login hote hi (Android kabhi OTP apne aap padh leta hai) aage badho
  useEffect(() => {
    if (!user) return;
    if (isAdmin) router.replace("/admin");
    else if (student) router.replace("/student");
    else router.replace("/register");
  }, [user, isAdmin, student]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async () => {
    const m = mobile.replace(/\D/g, "").slice(-10);
    if (m.length !== 10) return notify("10 digit mobile number daalein");
    setBusy(true);
    try { await sendOtp(m); setSent(true); setWait(30); notify("OTP bhej diya ✓", `+91 ${m} par SMS aayega.`); }
    catch (e) { notify("OTP nahi gaya", authErrorHi(e)); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    if (otp.length < 6) return notify("6 ank ka OTP daalein");
    setBusy(true);
    try { await confirmOtp(otp); }
    catch (e) { notify("Login nahi hua", authErrorHi(e)); }
    finally { setBusy(false); }
  };
  const admin = async () => {
    if (!email || !pw) return notify("Email aur password bharein");
    setBusy(true);
    try { await loginAdmin(email, pw); }
    catch (e) { notify("Login nahi hua", authErrorHi(e)); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <H>Login</H>
      <Sub>Apne mobile number par aaye OTP se login karein. Naye student ka account apne aap ban jayega.</Sub>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        <Chip label="👨‍🎓 Student" active={mode === "student"} onPress={() => setMode("student")} />
        <Chip label="🛡️ Admin" active={mode === "admin"} onPress={() => setMode("admin")} />
      </View>
      {mode === "student" ? (
        <Card>
          <Input label="Mobile Number" keyboardType="phone-pad" maxLength={10} value={mobile}
            onChangeText={(v) => { setMobile(v); setSent(false); setOtp(""); }} placeholder="10 digit mobile" />
          {!sent ? (
            <Btn title="OTP Bhejein" icon="send" onPress={send} loading={busy} />
          ) : (
            <>
              <Input label="OTP (6 ank)" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} placeholder="● ● ● ● ● ●" />
              <Btn title="Verify & Login" icon="checkmark-circle" onPress={verify} loading={busy} color={C.green} />
              <Btn title={wait > 0 ? `Dobara OTP (${wait}s)` : "Dobara OTP bhejein"} outline small disabled={wait > 0 || busy} onPress={send} />
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Input label="Admin Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Input label="Password" secureTextEntry value={pw} onChangeText={setPw} />
          <Btn title="Admin LOGIN" onPress={admin} loading={busy} color={C.maroon} />
        </Card>
      )}
      <Text style={{ color: C.sub, fontSize: 11, textAlign: "center", marginTop: 8 }}>
        Login karke aap hamari Privacy Policy se sahmat hain.
      </Text>
    </Screen>
  );
}
