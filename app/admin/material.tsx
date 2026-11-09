import React, { useState } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { addMaterial, deleteMaterial, getBatches, getMaterials, Material } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import BatchPicker from "../../components/BatchPicker";
import { Btn, Card, Chip, Empty, Input, Label, Loading, Row, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminMaterial() {
  const { data, loading, reload } = useLoad(async () => ({ items: await getMaterials(), batches: await getBatches() }));
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<Material["type"]>("pdf");
  const [batchId, setBatchId] = useState("all");
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;
  const add = async () => {
    if (!title.trim() || !/^https?:\/\//.test(url.trim())) return notify("Title aur sahi link (https://…) daalein");
    setBusy(true);
    try {
      await addMaterial({ title: title.trim(), subject: subject.trim(), url: url.trim(), type, batchId });
      setTitle(""); setUrl(""); reload(); notify("Jod diya ✓");
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card>
        <Label>📚 Naya Material</Label>
        <Sub>PDF ko Google Drive par upload karein → "Share → Anyone with the link" → link copy karke yahan daalein. Video ke liye YouTube (Unlisted) link daalein. Ye bilkul free hai.</Sub>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="📄 PDF / Notes" active={type === "pdf"} onPress={() => setType("pdf")} />
          <Chip label="🎬 Video" active={type === "video"} onPress={() => setType("video")} />
          <Chip label="🔗 Link" active={type === "link"} onPress={() => setType("link")} />
        </View>
        <Input placeholder="Title (jaise: Ganit — Bhinn Chapter)" value={title} onChangeText={setTitle} />
        <Input placeholder="Vishay (Maths / Hindi / Reasoning…)" value={subject} onChangeText={setSubject} />
        <Input placeholder="https://drive.google.com/…" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
        <BatchPicker batches={data.batches} value={batchId} onChange={setBatchId} label="Kis batch ke liye" />
        <Btn title="Jodein" icon="add" onPress={add} loading={busy} />
      </Card>
      {data.items.length === 0 ? <Empty text="Abhi koi material nahi." /> : null}
      {data.items.map((m) => (
        <Row key={m.id} icon={m.type === "video" ? "logo-youtube" : m.type === "pdf" ? "document-text" : "link"}
          title={m.title} subtitle={m.subject} onPress={() => WebBrowser.openBrowserAsync(m.url)}
          right={<Btn small outline color={C.red} title="Hatayein" onPress={() => confirm("Hatayein?", m.title, async () => { await deleteMaterial(m.id); reload(); })} />} />
      ))}
    </Screen>
  );
}
