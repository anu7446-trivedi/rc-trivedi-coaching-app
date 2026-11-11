import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Course, getCourses, getSettings, saveSettings, Settings, uploadImage } from "../../lib/db";
import { Btn, Card, Chip, Input, Label, Loading, Screen, Sub, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function AppSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(setS); getCourses(true).then(setCourses); }, []);
  if (!s) return <Loading />;
  const set = (k: keyof Settings) => (v: string) => setS({ ...s, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await saveSettings(s);
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
        <Input label="Privacy Policy link (optional)" autoCapitalize="none" value={s.privacyUrl ?? ""} onChangeText={set("privacyUrl")} />
      </Card>
      <Card>
        <Label>🛒 App me "Buy Now" (online payment)</Label>
        <Sub>Band karne par students ko "Buy Now" ki jagah "Sampark Karein" (WhatsApp) dikhega. Kabhi Google Play aapatti kare to ise band kar dein — naya APK nahi chahiye.</Sub>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="✅ Chalu (Razorpay)" active={s.buyEnabled !== false} onPress={() => setS({ ...s, buyEnabled: true })} />
          <Chip label="⛔ Band (Sampark Karein)" active={s.buyEnabled === false} onPress={() => setS({ ...s, buyEnabled: false })} />
        </View>
        <Sub>Badlav ke baad neeche "Save Karein" dabayein.</Sub>
      </Card>
      <Card>
        <Label>🖼️ Home Page Banners</Label>
        <Sub>Banner photo chaudi (2:1, jaise 1200×600) rakhein. Har banner kisi course se jod sakte hain.</Sub>
        {s.banners.map((b, i) => (
          <View key={i} style={{ marginBottom: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 8 }}>
            <Image source={{ uri: b.imageUrl }} style={{ width: "100%", aspectRatio: 2, borderRadius: 8, backgroundColor: "#dde3ec" }} />
            <Sub>Tap karne par khulega:</Sub>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Chip label="Kuch nahi" active={!b.courseId} onPress={() => setS({ ...s, banners: s.banners.map((x, k) => (k === i ? { ...x, courseId: "" } : x)) })} />
              {courses.map((c) => (
                <Chip key={c.id} label={c.title.slice(0, 22)} active={b.courseId === c.id}
                  onPress={() => setS({ ...s, banners: s.banners.map((x, k) => (k === i ? { ...x, courseId: c.id } : x)) })} />
              ))}
            </View>
            <Btn small outline color={C.red} title="Banner hatayein" onPress={() => setS({ ...s, banners: s.banners.filter((_, k) => k !== i) })} />
          </View>
        ))}
        <Btn title="+ Naya Banner (Gallery se)" icon="image-outline" outline loading={uploading} onPress={async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [2, 1] });
          if (r.canceled) return;
          setUploading(true);
          try { const url = await uploadImage(r.assets[0].uri, "banners"); setS({ ...s, banners: [...s.banners, { imageUrl: url, courseId: "" }] }); notify("Banner jud gaya", "Neeche 'Save Karein' zaroor dabayein."); }
          catch (e: any) { notify("Upload nahi hua", e?.message); }
          finally { setUploading(false); }
        }} />
      </Card>
      <Card>
        <Label>💳 Coaching ki Monthly Fees (UPI)</Label>
        <Sub>Aapki UPI ID (jaise 9005167446@ybl). Students isi par fees bhejenge — paisa seedha aapke bank me aayega. Tip: PhonePe Business / Paytm Business / GPay Business ki (free) merchant UPI ID daalenge to "UPI App kholein" button bhi bina rukawat chalega. Personal UPI ID par students ko "UPI ID Copy" wala tarika use karna hoga.</Sub>
        <Input label="UPI ID" autoCapitalize="none" value={s.upiId} onChangeText={set("upiId")} placeholder="name@okaxis" />
        <Input label="UPI par naam" value={s.upiName} onChangeText={set("upiName")} />
      </Card>
      <Btn title="Save Karein" icon="save-outline" onPress={save} loading={busy} />
    </Screen>
  );
}
