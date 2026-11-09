import React, { useState } from "react";
import { addBatch, deleteBatch, getBatches } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Card, Empty, Input, Label, Loading, Row, Screen, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Batches() {
  const { data, loading, reload } = useLoad(getBatches);
  const [name, setName] = useState("");
  const [timing, setTiming] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;
  const add = async () => {
    if (!name.trim()) return notify("Batch ka naam likhein");
    setBusy(true);
    try { await addBatch({ name: name.trim(), timing: timing.trim() }); setName(""); setTiming(""); reload(); }
    catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <Card>
        <Label>Naya Batch</Label>
        <Input placeholder="Naam (jaise: JNV Morning 2027)" value={name} onChangeText={setName} />
        <Input placeholder="Samay (jaise: 7–9 AM)" value={timing} onChangeText={setTiming} />
        <Btn title="Batch Jodein" icon="add" onPress={add} loading={busy} />
      </Card>
      {data.length === 0 ? <Empty text="Abhi koi batch nahi." /> : null}
      {data.map((b) => (
        <Row key={b.id} icon="albums-outline" title={b.name} subtitle={b.timing}
          right={<Btn small outline color={C.red} title="Hatayein" onPress={() => confirm("Batch hatayein?", b.name, async () => { await deleteBatch(b.id); reload(); })} />} />
      ))}
    </Screen>
  );
}
