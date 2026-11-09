import React, { useEffect, useState } from "react";
import { getSettings, saveSettings, Settings } from "../../lib/db";
import { Btn, Card, Input, Label, Loading, Screen, Sub, notify } from "../../components/ui";

export default function AppSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [courses, setCourses] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then((x) => { setS(x); setCourses(x.courses.join("\n")); }); }, []);
  if (!s) return <Loading />;
  const set = (k: keyof Settings) => (v: string) => setS({ ...s, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({ ...s, courses: courses.split("\n").map((c) => c.trim()).filter(Boolean) });
      notify("Settings save ho gayi ✓");
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };
  return (
    <Screen>
      <Sub>Yahan jo badlenge wo turant sabke app me dikhega — naya app banane ki zaroorat nahi.</Sub>
      <Card>
        <Label>Coaching ki jaankari</Label>
        <Input label="Coaching ka naam" value={s.name} onChangeText={set("name")} />
        <Input label="Tagline" value={s.tagline} onChangeText={set("tagline")} />
        <Input label="Pata" value={s.address} onChangeText={set("address")} />
        <Input label="Phone" keyboardType="phone-pad" value={s.phone} onChangeText={set("phone")} />
        <Input label="WhatsApp (91 ke saath, jaise 919005167446)" keyboardType="phone-pad" value={s.whatsapp} onChangeText={set("whatsapp")} />
        <Input label="About / Parichay" value={s.about} onChangeText={set("about")} multiline />
        <Input label="Courses (har line me ek course)" value={courses} onChangeText={setCourses} multiline />
      </Card>
      <Card>
        <Label>💳 Online Fees (UPI)</Label>
        <Sub>Aapki UPI ID (jaise 9005167446@ybl). Students isi par fees bhejenge — paisa seedha aapke bank me aayega. Tip: PhonePe Business / Paytm Business / GPay Business ki (free) merchant UPI ID daalenge to "UPI App kholein" button bhi bina rukawat chalega. Personal UPI ID par students ko "UPI ID Copy" wala tarika use karna hoga.</Sub>
        <Input label="UPI ID" autoCapitalize="none" value={s.upiId} onChangeText={set("upiId")} placeholder="name@okaxis" />
        <Input label="UPI par naam" value={s.upiName} onChangeText={set("upiName")} />
      </Card>
      <Btn title="Save Karein" icon="save-outline" onPress={save} loading={busy} />
    </Screen>
  );
}
