import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../lib/auth";
import { addPayment, fmtDate, getMyPayments, getSettings, thisMonth, upiLink } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Badge, Btn, Card, Input, Label, Loading, Screen, Sub, notify, statusUi } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Fees() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(async () => {
    const [settings, payments] = await Promise.all([getSettings(), getMyPayments(student!.id)]);
    return { settings, payments };
  });
  const [amount, setAmount] = useState(String(student!.monthlyFee || ""));
  const [month, setMonth] = useState(thisMonth());
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!data) return <Loading />;
  const { settings, payments } = data;
  const paid = payments.filter((p) => p.status === "verified").reduce((t, p) => t + p.amount, 0);

  const payUpi = async () => {
    const amt = Number(amount);
    if (!settings.upiId) return notify("UPI abhi set nahi hai", "Coaching se sampark karein ya cash jama karein.");
    if (!amt) return notify("Amount bharein");
    try { await Linking.openURL(upiLink(settings, amt, `Fee ${month} ${student!.name}`)); }
    catch { notify("UPI app nahi mila", `Is UPI ID par pay karein: ${settings.upiId}`); }
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || utr.trim().length < 6) return notify("Amount aur UTR / Transaction ID bharein");
    setBusy(true);
    try {
      await addPayment({ studentId: student!.id, studentName: student!.name, amount: amt, month, method: "upi", utr: utr.trim(), status: "pending" });
      setUtr("");
      notify("Bhej diya ✓", "Admin payment check karke confirm karenge.");
      reload();
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card style={{ backgroundColor: C.navy }}>
        <Text style={{ color: "#c8d4e6" }}>Mahine ki fees</Text>
        <Text style={{ color: C.gold, fontSize: 32, fontWeight: "900" }}>₹{student!.monthlyFee || 0}</Text>
        <Text style={{ color: "#fff" }}>Ab tak jama: ₹{paid}</Text>
      </Card>

      <Card>
        <Label>💳 Online Fees Jama Karein (UPI)</Label>
        <Input label="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <Input label="Kis mahine ki fees (YYYY-MM)" value={month} onChangeText={setMonth} />
        {settings.upiId ? (
          <View style={{ backgroundColor: C.light, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontWeight: "900", color: C.navy, marginBottom: 4 }}>Tarika 1 (sabse pakka):</Text>
            <Text style={{ color: C.text, lineHeight: 20 }}>
              1) Neeche "UPI ID Copy" dabayein{"\n"}2) PhonePe / GPay / Paytm kholein → "Pay to UPI ID" / "To UPI ID"{"\n"}3) UPI ID paste karke ₹{amount || "…"} bhejein{"\n"}4) Wapas aakar UTR number daal kar Submit karein
            </Text>
            <Text selectable style={{ fontWeight: "900", fontSize: 16, color: C.blue, marginVertical: 8, textAlign: "center" }}>{settings.upiId}</Text>
            <Btn title="UPI ID Copy Karein" icon="copy-outline" onPress={async () => { await Clipboard.setStringAsync(settings.upiId); notify("Copy ho gaya ✓", "Ab UPI app me 'Pay to UPI ID' me paste karein."); }} />
            <Text style={{ fontWeight: "900", color: C.navy, marginTop: 8 }}>Tarika 2:</Text>
            <Btn title="Seedha UPI App kholein" icon="phone-portrait-outline" color={C.green} outline onPress={payUpi} />
            <Text style={{ color: C.sub, fontSize: 11, textAlign: "center" }}>Agar UPI app "declined for security reasons" bole, to Tarika 1 use karein.</Text>
          </View>
        ) : (
          <Sub>Online payment abhi chalu nahi hai. Coaching par cash jama karein.</Sub>
        )}
        <Input label="UTR / Transaction ID" value={utr} onChangeText={setUtr} placeholder="12 digit UTR number" />
        <Btn title="Payment Submit Karein" icon="send" onPress={submit} loading={busy} />
      </Card>

      <Label>Payment History</Label>
      {payments.length === 0 ? <Sub>Abhi koi payment nahi.</Sub> : null}
      {payments.map((p) => (
        <View key={p.id} style={{ backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "900", color: C.text }}>₹{p.amount} • {p.month}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{p.method.toUpperCase()} {p.utr ? `• ${p.utr}` : ""} • {fmtDate(p.createdAt)}</Text>
          </View>
          <Badge {...statusUi[p.status]} />
        </View>
      ))}
    </Screen>
  );
}
