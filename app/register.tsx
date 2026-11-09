import React, { useState } from "react";
import { router } from "expo-router";
import { createMyProfile } from "../lib/db";
import { useAuth } from "../lib/auth";
import { Btn, Card, H, Input, Screen, Sub, notify } from "../components/ui";
import { C } from "../lib/theme";

export default function Register() {
  const { user, refreshStudent, logout } = useAuth();
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [className, setClassName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const phone = (user?.phoneNumber ?? "").replace("+91", "");

  const save = async () => {
    if (!user) return router.replace("/login");
    if (name.trim().length < 2) return notify("Student ka naam likhein");
    setBusy(true);
    try {
      await createMyProfile(user.uid, {
        name: name.trim(), phone: user.phoneNumber ?? "", fatherName: fatherName.trim(),
        className: className.trim(), address: address.trim(),
      });
      await refreshStudent();
      router.replace("/student");
    } catch (e: any) { notify("Save nahi hua", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <H>Swagat hai! 🙏</H>
      <Sub>Mobile {phone} verify ho gaya. Bas thodi si jaankari bhar dijiye.</Sub>
      <Card>
        <Input label="Student ka Naam *" value={name} onChangeText={setName} />
        <Input label="Pita ka Naam" value={fatherName} onChangeText={setFatherName} />
        <Input label="Abhi kis class me hai?" value={className} onChangeText={setClassName} placeholder="jaise: Class 5" />
        <Input label="Gaon / Shahar, Zila" value={address} onChangeText={setAddress} />
        <Btn title="Aage Badhein" icon="arrow-forward" onPress={save} loading={busy} />
      </Card>
      <Btn title="Galat number? Logout" outline small color={C.red} onPress={logout} />
    </Screen>
  );
}
