import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { getItem, getItems, getTestKey, ItemType, Question, saveItem, uploadFile } from "../../lib/db";
import { Btn, Card, Chip, Input, Label, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

const blank = (): Question => ({ q: "", options: ["", "", "", ""], answer: 0 });
const TYPES: { k: ItemType; l: string }[] = [
  { k: "video", l: "🎬 Video" }, { k: "live", l: "🔴 Live" }, { k: "pdf", l: "📄 PDF" }, { k: "test", l: "📝 Test" }, { k: "link", l: "🔗 Link" },
];
const HELP: Record<ItemType, string> = {
  video: "YouTube par video 'Unlisted' upload karein → Share → link copy karke yahan daalein. Video app ke andar chalega.",
  live: "YouTube par Live shuru karein (Unlisted) → uska link yahan daalein. Class ke samay students yahin se dekhenge.",
  pdf: "Neeche button se phone ki PDF / photo seedha upload karein. (Ya Google Drive ka link bhi daal sakte hain.)",
  link: "Koi bhi website / Google Form ka link.",
  test: "",
};

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

export default function ItemEdit() {
  const p = useLocalSearchParams<{ cid: string; id?: string; type?: ItemType }>();
  const { cid, id } = p;
  const [ready, setReady] = useState(!id);
  const [type, setType] = useState<ItemType>(p.type ?? "video");
  const [prevType, setPrevType] = useState<ItemType | undefined>();
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [order, setOrder] = useState("10");
  const [duration, setDuration] = useState("30");
  const [qs, setQs] = useState<Question[]>([blank()]);
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getItems(cid).then((its) => setSections([...new Set(its.map((i) => i.section).filter(Boolean) as string[])]));
    if (!id) return;
    (async () => {
      const it = await getItem(cid, id);
      if (it) {
        setType(it.type); setPrevType(it.type); setTitle(it.title); setSection(it.section ?? ""); setUrl(it.url ?? "");
        setOrder(String(it.order ?? 10)); setDuration(String(it.durationMin ?? 30));
        if (it.type === "test") {
          const key = await getTestKey(cid, id);
          setQs((it.questions ?? []).map((q, i) => ({ ...q, answer: key?.[i] ?? 0 })));
        }
      }
      setReady(true);
    })();
  }, [cid, id]);
  if (!ready) return <Loading />;

  const upd = (i: number, f: (q: Question) => Question) => setQs((all) => all.map((q, k) => (k === i ? f(q) : q)));

  const save = async () => {
    if (!title.trim()) return notify("Title likhein");
    let questions: Question[] | undefined;
    if (type === "test") {
      questions = qs.filter((q) => q.q.trim());
      if (!questions.length) return notify("Kam se kam 1 prashn daalein");
      const bad = questions.findIndex((q) => q.options.filter((o) => o.trim()).length < 2 || !q.options[q.answer ?? 0]?.trim());
      if (bad >= 0) return notify(`Prashn ${bad + 1} check karein`, "Kam se kam 2 option aur sahi uttar wala option bhara ho.");
    } else if (!/^https?:\/\//.test(url.trim())) return notify("Sahi link daalein (https://…)");
    setBusy(true);
    try {
      await saveItem(cid, {
        title: title.trim(), type, section: section.trim() || "Anya", order: Number(order) || 10,
        ...(type === "test" ? { questions, durationMin: Number(duration) || 30 } : { url: url.trim() }),
      }, id, prevType);
      notify("Save ho gaya ✓");
      router.back();
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? "Content Edit" : "Content Jodein" }} />
      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {TYPES.map((t) => <Chip key={t.k} label={t.l} active={type === t.k} onPress={() => setType(t.k)} />)}
        </View>
        <Input label="Title *" value={title} onChangeText={setTitle} placeholder={type === "test" ? "jaise: Ganit Test 1 — Bhinn" : "jaise: Bhinn — Class 1"} />
        <Input label="Chapter / Section" value={section} onChangeText={setSection} placeholder="jaise: Bhinn (Fractions)" />
        {sections.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: -6 }}>
            {sections.map((sct) => <Chip key={sct} label={sct} active={section === sct} onPress={() => setSection(sct)} />)}
          </View>
        ) : null}
        {type !== "test" ? (
          <>
            <Sub>{HELP[type]}</Sub>
            {type === "pdf" ? (
              <Btn title={uploading ? "Upload ho raha hai…" : url ? "✓ File lagi hai — badalne ke liye dabayein" : "📎 Phone se PDF / Photo chunein"}
                icon="cloud-upload-outline" color={url ? C.green : C.blue} loading={uploading} onPress={async () => {
                  const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
                  if (r.canceled || !r.assets?.[0]) return;
                  const f = r.assets[0];
                  if ((f.size ?? 0) > 25 * 1024 * 1024) return notify("File bahut badi hai", "25 MB se chhoti file chunein.");
                  setUploading(true);
                  try {
                    setUrl(await uploadFile(f.uri, `materials/${cid}`, f.name || "notes.pdf", f.mimeType || "application/pdf"));
                    if (!title.trim()) setTitle((f.name || "").replace(/\.[a-z0-9]+$/i, ""));
                    notify("Upload ho gaya ✓", "Ab 'Save Karein' dabayein.");
                  } catch (e: any) { notify("Upload nahi hua", e?.message); }
                  finally { setUploading(false); }
                }} />
            ) : null}
            <Input label="Link *" autoCapitalize="none" keyboardType="url" value={url} onChangeText={setUrl} placeholder="https://…" />
          </>
        ) : (
          <Input label="Samay (minute)" keyboardType="numeric" value={duration} onChangeText={setDuration} />
        )}
        <Input label="Kram (chhota number pehle)" keyboardType="numeric" value={order} onChangeText={setOrder} />
      </Card>

      {type === "test" ? (
        <>
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
        </>
      ) : null}
      <Btn title="Save Karein" icon="save-outline" color={C.green} onPress={save} loading={busy} />
    </Screen>
  );
}
