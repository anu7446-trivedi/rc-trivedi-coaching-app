import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  getBatches, getCourses, getEnrollmentsForStudent, getStudent, grantCourse, fmtDate, isActive, isFree,
  revokeEnrollment, updateStudent,
} from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Card, Chip, Input, Label, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function StudentEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, reload } = useLoad(async () => {
    const [s, batches, courses, enr] = await Promise.all([getStudent(id), getBatches(), getCourses(true), getEnrollmentsForStudent(id)]);
    return { s, batches, courses, enr };
  }, [id]);
  const [fee, setFee] = useState<string | null>(null);
  if (!data) return <Loading />;
  const { s, batches, courses, enr } = data;
  if (!s) return <Screen><Text>Student nahi mila.</Text></Screen>;
  const title = (cid: string) => courses.find((c) => c.id === cid)?.title ?? cid;
  const ownedIds = new Set(enr.filter(isActive).map((e) => e.courseId));
  const upd = async (d: any) => { await updateStudent(id, d); reload(); };
  const phone = s.phone.replace("+91", "");

  return (
    <Screen>
      <Stack.Screen options={{ title: s.name }} />
      <Card>
        <Text style={{ fontWeight: "900", fontSize: 18, color: C.text }}>{s.name}</Text>
        <Text style={{ color: C.sub }}>📞 {phone} • {s.className || "—"} • Pita: {s.fatherName || "—"}</Text>
        <Text style={{ color: C.sub }}>📍 {s.address || "—"} • Juda: {fmtDate(s.createdAt)}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Btn small title="Call" icon="call" color={C.green} onPress={() => Linking.openURL(`tel:${phone}`)} />
          <Btn small title="WhatsApp" icon="logo-whatsapp" color="#25D366" onPress={() => Linking.openURL(`https://wa.me/91${phone}`)} />
        </View>
      </Card>

      <Card>
        <Label>📚 Course access</Label>
        {enr.length === 0 ? <Sub>Koi course nahi.</Sub> : null}
        {enr.map((e) => (
          <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: C.text }}>{title(e.courseId)}</Text>
              <Text style={{ color: C.sub, fontSize: 11 }}>{e.source === "razorpay" ? "Online payment" : "Admin ne diya"} • {fmtDate(e.expiresAt)} tak</Text>
            </View>
            <Badge label={isActive(e) ? "Active" : "Expired"} color={isActive(e) ? C.green : C.red} />
            <Btn small outline color={C.red} title="Hatayein" onPress={() => confirm("Access hatayein?", title(e.courseId), async () => { await revokeEnrollment(e.id); reload(); })} />
          </View>
        ))}
        <Sub>Cash / offline payment par course dene ke liye chunein:</Sub>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {courses.filter((c) => !isFree(c) && !ownedIds.has(c.id)).map((c) => (
            <Chip key={c.id} label={`+ ${c.title.slice(0, 26)}`} onPress={() => confirm("Course dein?", `${c.title}\n${c.validityDays} din ke liye`, async () => {
              try { await grantCourse(id, c); reload(); notify("Course de diya ✓"); } catch (e: any) { notify("Error", e?.message); }
            })} />
          ))}
        </View>
      </Card>

      <Card>
        <Label>🏫 Offline coaching batch (attendance / monthly fees ke liye)</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="Koi nahi (sirf online)" active={!s.batchId} onPress={() => upd({ batchId: "" })} />
          {batches.map((b) => <Chip key={b.id} label={b.name} active={s.batchId === b.id} onPress={() => upd({ batchId: b.id })} />)}
        </View>
        {s.batchId ? (
          <>
            <Input label="Mahine ki fees ₹" keyboardType="numeric" value={fee ?? String(s.monthlyFee ?? "")} onChangeText={setFee} />
            <Btn small title="Fees save" onPress={async () => { await upd({ monthlyFee: Number(fee) || 0 }); notify("Save ✓"); }} />
          </>
        ) : null}
      </Card>

      <Card>
        <Label>Status</Label>
        <View style={{ flexDirection: "row" }}>
          <Chip label="✅ Active" active={s.active} onPress={() => upd({ active: true })} />
          <Chip label="⛔ Block (app band)" active={!s.active} onPress={() => confirm("Block karein?", "Ye student app ka content nahi dekh payega.", () => upd({ active: false }))} />
        </View>
      </Card>
    </Screen>
  );
}
