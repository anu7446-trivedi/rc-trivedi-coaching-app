import React, { useState } from "react";
import { Text, View } from "react-native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { authErrorHi, useAuth } from "../../lib/auth";
import { Btn, Card, Input, Label, Screen, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Profile() {
  const { student, user, logout } = useAuth();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (newPw.length < 6) return notify("Naya password kam se kam 6 akshar ka ho");
    setBusy(true);
    try {
      await reauthenticateWithCredential(user!, EmailAuthProvider.credential(user!.email!, oldPw));
      await updatePassword(user!, newPw);
      setOldPw(""); setNewPw("");
      notify("Password badal gaya ✓");
    } catch (e) { notify("Error", authErrorHi(e)); }
    finally { setBusy(false); }
  };

  const rows: [string, string | undefined][] = [
    ["Naam", student!.name], ["Mobile", student!.mobile], ["Pita ka naam", student!.fatherName],
    ["Class / Course", student!.className], ["Pata", student!.address], ["Joining", student!.joinDate],
    ["Mahine ki fees", `₹${student!.monthlyFee || 0}`],
  ];
  return (
    <Screen>
      <Card>
        {rows.map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: C.border }}>
            <Text style={{ width: 120, color: C.sub }}>{k}</Text>
            <Text style={{ flex: 1, fontWeight: "700", color: C.text }}>{v || "—"}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Label>🔑 Password Badlein</Label>
        <Input placeholder="Purana password" secureTextEntry value={oldPw} onChangeText={setOldPw} />
        <Input placeholder="Naya password" secureTextEntry value={newPw} onChangeText={setNewPw} />
        <Btn title="Password Badlein" onPress={change} loading={busy} />
      </Card>
      <Btn title="Logout" icon="log-out-outline" outline color={C.red} onPress={logout} />
    </Screen>
  );
}
