import React, { useState } from "react";
import { router } from "expo-router";
import { updateMyProfile } from "../../lib/db";
import { useAuth } from "../../lib/auth";
import { Btn, Card, Input, Screen, Sub, notify } from "../../components/ui";

export default function Profile() {
  const { student, refreshStudent } = useAuth();
  const [name, setName] = useState(student!.name);
  const [fatherName, setFatherName] = useState(student!.fatherName ?? "");
  const [className, setClassName] = useState(student!.className ?? "");
  const [address, setAddress] = useState(student!.address ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (name.trim().length < 2) return notify("Naam likhein");
    setBusy(true);
    try {
      await updateMyProfile(student!.id, { name: name.trim(), fatherName: fatherName.trim(), className: className.trim(), address: address.trim() });
      await refreshStudent();
      notify("Save ho gaya ✓");
      router.back();
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };
  return (
    <Screen>
      <Sub>Mobile: {student!.phone} (badla nahi ja sakta)</Sub>
      <Card>
        <Input label="Naam" value={name} onChangeText={setName} />
        <Input label="Pita ka Naam" value={fatherName} onChangeText={setFatherName} />
        <Input label="Class" value={className} onChangeText={setClassName} />
        <Input label="Pata" value={address} onChangeText={setAddress} />
        <Btn title="Save Karein" icon="save-outline" onPress={save} loading={busy} />
      </Card>
    </Screen>
  );
}
