import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  addPayment, deletePayment, fmtDate, getPayments, getStudents, Payment, setPaymentStatus, thisMonth,
} from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Card, Chip, Empty, Input, Label, Loading, Screen, Sub, confirm, notify, statusUi } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminFees() {
  const { data, loading, reload } = useLoad(async () => {
    const [payments, students] = await Promise.all([getPayments(), getStudents()]);
    return { payments, students: students.filter((s) => s.active && !!s.batchId).sort((a, b) => a.name.localeCompare(b.name)) };
  });
  const [tab, setTab] = useState<"pending" | "all" | "due" | "cash">("pending");
  const [month, setMonth] = useState(thisMonth());
  const [sid, setSid] = useState("");
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;

  const act = async (p: Payment, status: Payment["status"]) => { await setPaymentStatus(p.id, status); reload(); };
  const paidIds = new Set(data.payments.filter((p) => p.month === month && p.status === "verified").map((p) => p.studentId));
  const due = data.students.filter((s) => !paidIds.has(s.id));
  const list = tab === "pending" ? data.payments.filter((p) => p.status === "pending") : data.payments;
  const total = data.payments.filter((p) => p.month === month && p.status === "verified").reduce((t, p) => t + p.amount, 0);

  const addCash = async () => {
    const s = data.students.find((x) => x.id === sid);
    if (!s || !Number(amount)) return notify("Student chunein aur amount bharein");
    setBusy(true);
    try {
      await addPayment({ studentId: s.id, studentName: s.name, amount: Number(amount), month, method: "cash", status: "verified" });
      setAmount(""); setSid(""); reload(); notify("Cash entry ho gayi ✓");
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card style={{ backgroundColor: C.navy }}>
        <Text style={{ color: "#c8d4e6" }}>{month} me jama</Text>
        <Text style={{ color: C.gold, fontSize: 30, fontWeight: "900" }}>₹{total}</Text>
        <Text style={{ color: "#fff" }}>Baaki students: {due.length}</Text>
      </Card>
      <Input label="Mahina (YYYY-MM)" value={month} onChangeText={setMonth} />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Chip label={`⏳ Verify karein (${data.payments.filter((p) => p.status === "pending").length})`} active={tab === "pending"} onPress={() => setTab("pending")} />
        <Chip label={`❗ Baaki (${due.length})`} active={tab === "due"} onPress={() => setTab("due")} />
        <Chip label="💵 Cash entry" active={tab === "cash"} onPress={() => setTab("cash")} />
        <Chip label="📜 Sab" active={tab === "all"} onPress={() => setTab("all")} />
      </View>

      {tab === "cash" ? (
        <Card>
          <Label>Cash / haath se mili fees darj karein</Label>
          <Input placeholder="🔍 Student khojein" value={q} onChangeText={setQ} />
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {data.students.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 15).map((s) => (
              <Chip key={s.id} label={s.name} active={sid === s.id} onPress={() => { setSid(s.id); setAmount(String(s.monthlyFee || "")); }} />
            ))}
          </View>
          <Input label="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Btn title={`${month} ki fees jama karein`} icon="cash-outline" color={C.green} onPress={addCash} loading={busy} />
        </Card>
      ) : tab === "due" ? (
        <>
          <Sub>{month} ki fees in students ki verify nahi hui hai:</Sub>
          {due.length === 0 ? <Empty text="Sabki fees jama hai 🎉" /> : null}
          {due.map((s) => (
            <View key={s.id} style={{ backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "800", color: C.text }}>{s.name} • {s.phone}</Text>
              <Text style={{ fontWeight: "900", color: C.red }}>₹{s.monthlyFee || 0}</Text>
            </View>
          ))}
        </>
      ) : (
        <>
          {list.length === 0 ? <Empty text="Koi payment nahi." /> : null}
          {list.map((p) => (
            <Card key={p.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "900", color: C.text, fontSize: 15, flex: 1 }}>{p.studentName}</Text>
                <Badge {...statusUi[p.status]} />
              </View>
              <Text style={{ color: C.text, marginTop: 4 }}>₹{p.amount} • {p.month} • {p.method.toUpperCase()}</Text>
              {p.utr ? <Text selectable style={{ color: C.blue, fontWeight: "700" }}>UTR: {p.utr}</Text> : null}
              <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{fmtDate(p.createdAt)}</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {p.status !== "verified" ? <Btn small title="Verify ✓" color={C.green} onPress={() => act(p, "verified")} /> : null}
                {p.status !== "rejected" ? <Btn small title="Reject" color={C.orange} onPress={() => act(p, "rejected")} /> : null}
                <Btn small outline color={C.red} title="Delete" onPress={() => confirm("Delete?", `${p.studentName} ₹${p.amount}`, async () => { await deletePayment(p.id); reload(); })} />
              </View>
            </Card>
          ))}
          {tab === "pending" && list.length ? <Sub>UTR number apne bank/UPI app me milakar hi Verify karein.</Sub> : null}
        </>
      )}
    </Screen>
  );
}
