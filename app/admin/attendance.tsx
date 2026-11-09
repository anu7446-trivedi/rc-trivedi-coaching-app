import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Batch, getAttendance, getBatches, getStudents, saveAttendance, Student, today } from "../../lib/db";
import BatchPicker from "../../components/BatchPicker";
import { Btn, Empty, Input, Loading, Screen, Sub, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AdminAttendance() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(today());
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([getBatches(), getStudents()]).then(([b, s]) => {
      setBatches(b);
      setStudents(s.filter((x) => x.active).sort((x, y) => x.name.localeCompare(y.name)));
      if (b[0]) setBatchId(b[0].id);
    });
  }, []);

  const inBatch = students.filter((s) => s.batchId === batchId);

  useEffect(() => {
    if (!batchId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    getAttendance(date, batchId).then((a) => {
      setSaved(!!a);
      // Naye din par default sab present
      setPresent(new Set(a ? a.present : students.filter((s) => s.batchId === batchId).map((s) => s.id)));
    });
  }, [batchId, date, students]);

  if (!batches) return <Loading />;

  const toggle = (id: string) => setPresent((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const save = async () => {
    setBusy(true);
    try {
      await saveAttendance({
        date, batchId,
        present: inBatch.filter((s) => present.has(s.id)).map((s) => s.id),
        absent: inBatch.filter((s) => !present.has(s.id)).map((s) => s.id),
      });
      setSaved(true);
      notify("Attendance save ✓");
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  const pc = inBatch.filter((s) => present.has(s.id)).length;
  return (
    <Screen>
      <Input label="Tareekh (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <BatchPicker batches={batches} value={batchId} onChange={setBatchId} allowAll={false} />
      <Sub>{saved ? "✅ Is din ki attendance pehle se save hai (badal sakte hain)." : "Naam par tap karke Present/Absent badlein."}  Present: {pc}/{inBatch.length}</Sub>
      {inBatch.length === 0 ? <Empty text="Is batch me koi student nahi." /> : null}
      {inBatch.map((s) => {
        const p = present.has(s.id);
        return (
          <Pressable key={s.id} onPress={() => toggle(s.id)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: p ? "#e3f6ea" : "#fdecea", borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <Text style={{ fontWeight: "800", color: C.text, flex: 1 }}>{s.name}</Text>
            <View style={{ backgroundColor: p ? C.green : C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>{p ? "P" : "A"}</Text>
            </View>
          </Pressable>
        );
      })}
      {inBatch.length ? <Btn title="Attendance Save Karein" icon="save-outline" onPress={save} loading={busy} /> : null}
    </Screen>
  );
}
