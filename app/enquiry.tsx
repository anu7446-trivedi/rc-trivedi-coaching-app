import React, { useState } from "react";
import { router } from "expo-router";
import { addEnquiry } from "../lib/db";
import { isConfigured } from "../lib/firebase";
import { Btn, Card, H, Input, Screen, Sub, notify } from "../components/ui";

export default function Enquiry() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [className, setClassName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isConfigured) return notify("Firebase setup baaki hai");
    if (!name.trim() || mobile.replace(/\D/g, "").length < 10) return notify("Naam aur sahi mobile number bharein");
    setBusy(true);
    try {
      await addEnquiry({ name: name.trim(), mobile: mobile.trim(), className: className.trim(), message: message.trim() });
      notify("Dhanyavaad! 🙏", "Aapki enquiry mil gayi hai. Hum jaldi sampark karenge.");
      router.back();
    } catch (e: any) {
      notify("Error", e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H>Admission Enquiry</H>
      <Sub>Form bharein, coaching aapse sampark karegi.</Sub>
      <Card>
        <Input label="Student ka Naam" value={name} onChangeText={setName} />
        <Input label="Mobile Number" keyboardType="phone-pad" maxLength={10} value={mobile} onChangeText={setMobile} />
        <Input label="Class / Course" value={className} onChangeText={setClassName} placeholder="jaise: Class 5 — JNV" />
        <Input label="Sandesh (optional)" value={message} onChangeText={setMessage} multiline />
        <Btn title="Submit" icon="send" onPress={submit} loading={busy} />
      </Card>
    </Screen>
  );
}
