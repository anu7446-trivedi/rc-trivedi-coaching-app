import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CATEGORIES, Category, Course, deleteCourse, getCourse, getCourses, saveCourse, uploadImage } from "../../lib/db";
import { Btn, Card, Chip, Input, Label, Loading, Screen, Sub, confirm, notify } from "../../components/ui";
import { C } from "../../lib/theme";

export default function CourseEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [ready, setReady] = useState(!id);
  const [all, setAll] = useState<Course[]>([]);
  const [f, setF] = useState({
    title: "", subtitle: "", description: "", imageUrl: "", price: "", mrp: "", validityDays: "365",
    category: "maths" as Category, includes: [] as string[], published: false, featured: false, order: "10",
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    getCourses(true).then((cs) => setAll(cs.filter((c) => c.id !== id)));
    if (!id) return;
    getCourse(id).then((c) => {
      if (c) setF({
        title: c.title, subtitle: c.subtitle ?? "", description: c.description ?? "", imageUrl: c.imageUrl ?? "",
        price: String(c.price ?? 0), mrp: String(c.mrp ?? ""), validityDays: String(c.validityDays ?? 365),
        category: c.category, includes: c.includes ?? [], published: !!c.published, featured: !!c.featured, order: String(c.order ?? 10),
      });
      setReady(true);
    });
  }, [id]);
  if (!ready) return <Loading />;

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    if (r.canceled) return;
    setUploading(true);
    try { set("imageUrl")(await uploadImage(r.assets[0].uri, "courses")); }
    catch (e: any) { notify("Upload nahi hua", e?.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!f.title.trim()) return notify("Course ka naam likhein");
    const price = Number(f.price) || 0;
    if (price > 0 && price < 1) return notify("Price kam se kam ₹1");
    setBusy(true);
    try {
      await saveCourse({
        title: f.title.trim(), subtitle: f.subtitle.trim(), description: f.description.trim(), imageUrl: f.imageUrl,
        price, mrp: Number(f.mrp) || 0, validityDays: Number(f.validityDays) || 365, category: f.category,
        includes: f.includes, published: f.published, featured: f.featured, order: Number(f.order) || 10,
      }, id);
      notify("Save ho gaya ✓");
      router.back();
    } catch (e: any) { notify("Error", e?.message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? "Course Edit" : "Naya Course" }} />
      <Card>
        <Label>Course ki photo (16:9)</Label>
        {f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 10, marginBottom: 8 }} /> : null}
        <Btn title={f.imageUrl ? "Photo badlein" : "Gallery se photo chunein"} icon="image-outline" outline loading={uploading} onPress={pick} />
        <Input label="Course ka naam *" value={f.title} onChangeText={set("title")} />
        <Input label="Chhota parichay" value={f.subtitle} onChangeText={set("subtitle")} placeholder="jaise: JNV 2027 — Hindi medium" />
        <Input label="Poori jaankari (kya-kya milega)" value={f.description} onChangeText={set("description")} multiline style={{ minHeight: 120 }}
          placeholder={"🔥 Class shuru: 1 June\n📚 120 video class\n📝 Weekly test\n⏰ Samay: shaam 7–8:30"} />
        <Label>Vishay / Category</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => <Chip key={c.key} label={c.short} active={f.category === c.key} onPress={() => set("category")(c.key)} />)}
        </View>
      </Card>
      <Card>
        <Input label="Price ₹ (0 = FREE)" keyboardType="numeric" value={f.price} onChangeText={set("price")} />
        <Input label="MRP ₹ (kata hua daam, optional)" keyboardType="numeric" value={f.mrp} onChangeText={set("mrp")} />
        <Input label="Validity (kitne din)" keyboardType="numeric" value={f.validityDays} onChangeText={set("validityDays")} />
        <Input label="Kram (chhota number pehle dikhega)" keyboardType="numeric" value={f.order} onChangeText={set("order")} />
      </Card>
      <Card>
        <Label>Is course ke saath ye courses bhi khulein (Sampoorn pack ke liye)</Label>
        <Sub>Jaise "Sampoorn Course" me Maths, Reasoning, Hindi, EVS aur Test Series chunein.</Sub>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {all.map((c) => (
            <Chip key={c.id} label={c.title.slice(0, 28)} active={f.includes.includes(c.id)}
              onPress={() => set("includes")(f.includes.includes(c.id) ? f.includes.filter((x) => x !== c.id) : [...f.includes, c.id])} />
          ))}
        </View>
      </Card>
      <Card>
        <Label>Dikhana</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="📝 Draft (chhupa)" active={!f.published} onPress={() => set("published")(false)} />
          <Chip label="🟢 Live (sabko dikhe)" active={f.published} onPress={() => set("published")(true)} />
          <Chip label={f.featured ? "⭐ Featured ✓" : "☆ Featured banayein"} active={f.featured} onPress={() => set("featured")(!f.featured)} />
        </View>
      </Card>
      <Btn title="Save Karein" icon="save-outline" color={C.green} onPress={save} loading={busy} />
      {id ? (
        <Btn title="Course Delete" icon="trash-outline" outline color={C.red}
          onPress={() => confirm("Course delete karein?", "Jinhone khareeda hai unka access bhi band ho jayega. Behtar hai 'Draft' kar dein.", async () => { await deleteCourse(id); router.back(); })} />
      ) : null}
    </Screen>
  );
}
