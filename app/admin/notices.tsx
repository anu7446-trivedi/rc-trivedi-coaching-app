import React, { useState } from "react";
import { Text } from "react-native";
import { addNotice, deleteNotice, fmtDate, getBatches, getNotices } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import BatchPicker from "../../components/BatchPicker";
import { Btn, Card, Empty, Input, Label, Loading, Screen, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminNotices() {
  const { data, loading, reload } = useLoad(async () => ({ notices: await getNotices(), batches: await getBatches() }));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [batchId, setBatchId] = useState("all");
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;
  const bName = (id: string) => (id === "all" ? "Sabhi" : data.batches.find((b) => b.id === id)?.name ?? "—");
  const add = async () => {
    if (!title.trim() || !body.trim()) return notify("Title aur suchna dono likhein");
    setBusy(true);
    try { await addNotice({ title: title.trim(), body: body.trim(), batchId }); setTitle(""); setBody(""); reload(); notify("Notice bhej diya ✓"); }
    catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card>
        <Label>📢 Naya Notice</Label>
        <Input placeholder="Title (jaise: Kal chhutti rahegi)" value={title} onChangeText={setTitle} />
        <Input placeholder="Puri suchna…" value={body} onChangeText={setBody} multiline />
        <BatchPicker batches={data.batches} value={batchId} onChange={setBatchId} label="Kisko bhejna hai" />
        <Btn title="Notice Bhejein" icon="send" onPress={add} loading={busy} />
      </Card>
      {data.notices.length === 0 ? <Empty text="Koi notice nahi." /> : null}
      {data.notices.map((n) => (
        <Card key={n.id}>
          <Text style={{ fontWeight: "900", color: C.text, fontSize: 15 }}>{n.title}</Text>
          <Text style={{ color: "#3b4a5e", marginTop: 4 }}>{n.body}</Text>
          <Text style={{ color: C.sub, fontSize: 11, marginVertical: 6 }}>{bName(n.batchId)} • {fmtDate(n.createdAt)}</Text>
          <Btn small outline color={C.red} title="Delete" onPress={() => confirm("Notice hatayein?", n.title, async () => { await deleteNotice(n.id); reload(); })} />
        </Card>
      ))}
    </Screen>
  );
}
