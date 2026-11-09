import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Batch, createStudent, deleteStudent, getBatches, getStudent, relinkStudent, today, updateStudent,
} from "../../lib/db";
import { authErrorHi } from "../../lib/auth";
import BatchPicker from "../../components/BatchPicker";
import { Btn, Card, Chip, Input, Label, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function StudentForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const [ready, setReady] = useState(!editing);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [f, setF] = useState({
    name: "", mobile: "", fatherName: "", className: "", address: "",
    batchId: "", monthlyFee: "", joinDate: today(), active: true,
  });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: any) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    (async () => {
      const bs = await getBatches();
      setBatches(bs);
      if (id) {
        const s = await getStudent(id);
        if (s) setF({
          name: s.name, mobile: s.mobile, fatherName: s.fatherName ?? "", className: s.className ?? "",
          address: s.address ?? "", batchId: s.batchId, monthlyFee: String(s.monthlyFee ?? ""),
          joinDate: s.joinDate ?? today(), active: s.active,
        });
        setReady(true);
      } else if (bs[0]) setF((x) => ({ ...x, batchId: bs[0].id }));
    })();
  }, [id]);

  if (!ready) return <Loading />;

  const save = async () => {
    const mobile = f.mobile.replace(/\D/g, "");
    if (!f.name.trim() || mobile.length !== 10) return notify("Naam aur 10 digit mobile number zaroori hai");
    if (!f.batchId) return notify("Pehle Batch banayein aur chunein");
    const data = { ...f, name: f.name.trim(), mobile, monthlyFee: Number(f.monthlyFee) || 0 };
    setBusy(true);
    try {
      if (editing) {
        const { mobile: _m, ...rest } = data; // mobile = login ID, badla nahi ja sakta
        await updateStudent(id!, rest);
        notify("Save ho gaya ✓");
      } else {
        if (password.length < 6) { setBusy(false); return notify("Password kam se kam 6 akshar ka rakhein"); }
        await createStudent(data, password);
        notify("Student jud gaya ✓", `Login: ${mobile}\nPassword: ${password}\n\nYe student ko bata dein.`);
      }
      router.back();
    } catch (e) { notify("Error", authErrorHi(e)); }
    finally { setBusy(false); }
  };

  const resetPw = async () => {
    if (password.length < 6) return notify("Naya password (6+ akshar) upar daalein");
    setBusy(true);
    try {
      await relinkStudent(id!, password);
      notify("Naya password set ✓", `Login: ${f.mobile}\nPassword: ${password}`);
      router.back();
    } catch (e) { notify("Nahi hua", authErrorHi(e) + "\n\nPehle Firebase Console > Authentication me is mobile ka purana user delete karein."); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? "Student Edit" : "Naya Student" }} />
      <Card>
        <Input label="Student ka Naam *" value={f.name} onChangeText={set("name")} />
        <Input label="Mobile Number * (yahi Login ID hoga)" keyboardType="phone-pad" maxLength={10} value={f.mobile} onChangeText={set("mobile")} editable={!editing} />
        {!editing ? <Input label="Password * (student ko batayein)" value={password} onChangeText={setPassword} autoCapitalize="none" /> : null}
        <Input label="Pita ka Naam" value={f.fatherName} onChangeText={set("fatherName")} />
        <Input label="Class / Course" value={f.className} onChangeText={set("className")} placeholder="jaise: Class 5 — JNV" />
        <Input label="Pata" value={f.address} onChangeText={set("address")} />
        <Input label="Mahine ki Fees (₹)" keyboardType="numeric" value={f.monthlyFee} onChangeText={set("monthlyFee")} />
        <Input label="Joining Date (YYYY-MM-DD)" value={f.joinDate} onChangeText={set("joinDate")} />
        {batches.length ? (
          <BatchPicker batches={batches} value={f.batchId} onChange={set("batchId")} allowAll={false} />
        ) : (
          <Text style={{ color: C.red, marginBottom: 8 }}>⚠️ Pehle "Batches" me jaakar ek batch banayein.</Text>
        )}
        <Label>Status</Label>
        <View style={{ flexDirection: "row" }}>
          <Chip label="✅ Active" active={f.active} onPress={() => set("active")(true)} />
          <Chip label="⛔ Band (login nahi hoga)" active={!f.active} onPress={() => set("active")(false)} />
        </View>
        <Btn title="Save Karein" icon="save-outline" onPress={save} loading={busy} />
      </Card>

      {editing ? (
        <>
          <Card>
            <Label>🔑 Student ka password bhool gaya?</Label>
            <Sub>1) Firebase Console → Authentication → Users me "{f.mobile}@…" wala user delete karein.{"\n"}2) Yahan naya password daal kar button dabayein. Student ka sara data surakshit rahega.</Sub>
            <Input placeholder="Naya password" value={password} onChangeText={setPassword} autoCapitalize="none" />
            <Btn title="Naya Password Set Karein" outline onPress={resetPw} loading={busy} />
          </Card>
          <Btn
            title="Student Delete Karein"
            icon="trash-outline"
            outline
            color={C.red}
            onPress={() => confirm("Delete karein?", `${f.name} ka record hat jayega. (Behtar hai "Band" kar dein.)`, async () => {
              await deleteStudent(id!);
              router.back();
            })}
          />
        </>
      ) : null}
    </Screen>
  );
}
