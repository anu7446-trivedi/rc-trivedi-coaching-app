import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Batch, getBatches, getTest, getTestKey, Question, saveTest } from "../../lib/db";
import BatchPicker from "../../components/BatchPicker";
import { Btn, Card, Chip, Input, Label, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

const blank = (): Question => ({ q: "", options: ["", "", "", ""], answer: 0 });

// Bulk paste format:
// Q. Prashn
// A) ...  B) ...  C) ...  D) ...   (har option alag line me)
// Ans: B
function parseBulk(text: string): Question[] {
  const out: Question[] = [];
  let cur: Question | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const opt = line.match(/^\(?([A-Da-d])[\).:\-]\s*(.*)$/);
    const ans = line.match(/^(ans|answer|uttar|उत्तर)\s*[:\-.]?\s*\(?([A-Da-d])/i);
    if (ans && cur) { cur.answer = ans[2].toUpperCase().charCodeAt(0) - 65; continue; }
    if (opt && cur) { cur.options[opt[1].toUpperCase().charCodeAt(0) - 65] = opt[2]; continue; }
    const qm = line.match(/^(?:Q\s*\d*|\d+)\s*[\).:\-]\s*(.*)$/i);
    cur = { q: qm ? qm[1] : line, options: ["", "", "", ""], answer: 0 };
    out.push(cur);
  }
  return out.filter((q) => q.q && q.options.filter(Boolean).length >= 2);
}

export default function TestEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [ready, setReady] = useState(!id);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [batchId, setBatchId] = useState("all");
  const [published, setPublished] = useState(false);
  const [qs, setQs] = useState<Question[]>([blank()]);
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBatches().then(setBatches);
    if (!id) return;
    (async () => {
      const [t, key] = await Promise.all([getTest(id), getTestKey(id)]);
      if (t) {
        setTitle(t.title); setDuration(String(t.durationMin)); setBatchId(t.batchId); setPublished(t.published);
        setQs(t.questions.map((q, i) => ({ ...q, answer: key?.[i] ?? 0 })));
      }
      setReady(true);
    })();
  }, [id]);

  if (!ready) return <Loading />;

  const upd = (i: number, f: (q: Question) => Question) => setQs((all) => all.map((q, k) => (k === i ? f(q) : q)));

  const save = async () => {
    const clean = qs.filter((q) => q.q.trim());
    if (!title.trim() || clean.length === 0) return notify("Title aur kam se kam 1 prashn zaroori hai");
    const bad = clean.findIndex((q) => q.options.filter((o) => o.trim()).length < 2 || !q.options[q.answer ?? 0]?.trim());
    if (bad >= 0) return notify(`Prashn ${bad + 1} check karein`, "Kam se kam 2 option aur sahi uttar wala option bhara hona chahiye.");
    setBusy(true);
    try {
      await saveTest({ title: title.trim(), durationMin: Number(duration) || 30, batchId, published, questions: clean }, id);
      notify("Test save ho gaya ✓", published ? "Students ko dikh raha hai." : "Draft hai — 'Live karein' dabane par students ko dikhega.");
      router.back();
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? "Test Edit" : "Naya Test" }} />
      <Card>
        <Input label="Test ka naam" value={title} onChangeText={setTitle} placeholder="jaise: JNV Mock Test 1" />
        <Input label="Samay (minute)" keyboardType="numeric" value={duration} onChangeText={setDuration} />
        <BatchPicker batches={batches} value={batchId} onChange={setBatchId} label="Kis batch ke liye" />
        <View style={{ flexDirection: "row" }}>
          <Chip label="📝 Draft" active={!published} onPress={() => setPublished(false)} />
          <Chip label="🟢 Live (students ko dikhe)" active={published} onPress={() => setPublished(true)} />
        </View>
      </Card>

      <Btn title={showBulk ? "Bulk paste band karein" : "📋 Ek saath kai prashn paste karein"} outline onPress={() => setShowBulk(!showBulk)} />
      {showBulk ? (
        <Card>
          <Sub>Is format me likhein / paste karein:{"\n"}Q1. Bharat ki rajdhani kya hai?{"\n"}A) Mumbai{"\n"}B) Delhi{"\n"}C) Kolkata{"\n"}D) Chennai{"\n"}Ans: B</Sub>
          <Input value={bulk} onChangeText={setBulk} multiline placeholder="Yahan paste karein…" style={{ minHeight: 160 }} />
          <Btn title="Prashn Jodein" onPress={() => {
            const parsed = parseBulk(bulk);
            if (!parsed.length) return notify("Koi prashn samajh nahi aaya", "Format check karein.");
            setQs((all) => [...all.filter((q) => q.q.trim()), ...parsed]);
            setBulk(""); setShowBulk(false);
            notify(`${parsed.length} prashn jud gaye ✓`);
          }} />
        </Card>
      ) : null}

      {qs.map((q, i) => (
        <Card key={i}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label>Prashn {i + 1}</Label>
            <Pressable onPress={() => confirm("Prashn hatayein?", q.q || `Prashn ${i + 1}`, () => setQs((all) => all.filter((_, k) => k !== i)))}>
              <Text style={{ color: C.red, fontWeight: "800" }}>✕ Hatayein</Text>
            </Pressable>
          </View>
          <Input value={q.q} onChangeText={(v) => upd(i, (x) => ({ ...x, q: v }))} placeholder="Prashn likhein" multiline style={{ minHeight: 60 }} />
          {q.options.map((o, j) => (
            <View key={j} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable onPress={() => upd(i, (x) => ({ ...x, answer: j }))}
                style={{ width: 34, height: 34, borderRadius: 17, marginBottom: 12, alignItems: "center", justifyContent: "center", backgroundColor: q.answer === j ? C.green : "#e2e8f0" }}>
                <Text style={{ fontWeight: "900", color: q.answer === j ? "#fff" : C.text }}>{String.fromCharCode(65 + j)}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Input value={o} onChangeText={(v) => upd(i, (x) => ({ ...x, options: x.options.map((y, k) => (k === j ? v : y)) }))} placeholder={`Option ${String.fromCharCode(65 + j)}`} />
              </View>
            </View>
          ))}
          <Sub>Sahi uttar chunne ke liye A/B/C/D gola dabayein (hara = sahi).</Sub>
        </Card>
      ))}
      <Btn title="+ Ek aur Prashn" outline onPress={() => setQs((a) => [...a, blank()])} />
      <Btn title={`Test Save Karein (${qs.filter((q) => q.q.trim()).length} prashn)`} icon="save-outline" color={C.green} onPress={save} loading={busy} />
    </Screen>
  );
}
