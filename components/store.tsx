import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Banner, catInfo, CATEGORIES, Course, isFree, rupee } from "../lib/db";
import { C } from "../lib/theme";

const W = Dimensions.get("window").width;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const ref = useRef<ScrollView>(null);
  const [i, setI] = useState(0);
  const w = W - 32;
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((x) => {
      const n = (x + 1) % banners.length;
      ref.current?.scrollTo({ x: n * (w + 10), animated: true });
      return n;
    }), 4000);
    return () => clearInterval(t);
  }, [banners.length, w]);
  if (!banners.length) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <ScrollView
        ref={ref} horizontal pagingEnabled={false} snapToInterval={w + 10} decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / (w + 10)))}
      >
        {banners.map((b, k) => (
          <Pressable key={k} onPress={() => b.courseId && router.push({ pathname: "/course/[id]", params: { id: b.courseId } })}>
            <Image source={{ uri: b.imageUrl }} style={{ width: w, height: w * 0.5, borderRadius: 14, marginRight: 10, backgroundColor: "#dde3ec" }} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 5 }}>
        {banners.map((_, k) => <View key={k} style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? C.blue : "#c3cddb" }} />)}
      </View>
    </View>
  );
}

export function CategoryGrid() {
  return (
    <View style={s.grid}>
      {CATEGORIES.map((c) => (
        <Pressable key={c.key} style={[s.cat, { backgroundColor: c.color }]}
          onPress={() => router.push({ pathname: "/courses", params: { category: c.key } })}>
          <Text style={s.catT}>{c.short}</Text>
          <View style={s.catRow}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
            <Ionicons name={c.icon as any} size={34} color="#ffffffcc" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function Tags({ course }: { course: Course }) {
  const c = course.counts ?? {};
  const tags = [
    (c.live ?? 0) > 0 && "LIVE CLASS",
    (c.video ?? 0) > 0 && `${c.video} VIDEO`,
    (c.pdf ?? 0) > 0 && `${c.pdf} PDF`,
    (c.test ?? 0) > 0 && `${c.test} TEST`,
    isFree(course) && "FREE",
    (course.includes?.length ?? 0) > 0 && `${course.includes.length} COURSE`,
  ].filter(Boolean) as string[];
  if (!tags.length) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
      {tags.map((t) => <Text key={t} style={s.tag}>{t}</Text>)}
    </View>
  );
}

export function PriceLine({ course, big }: { course: Course; big?: boolean }) {
  if (isFree(course)) return <Text style={[s.price, big && { fontSize: 22 }, { color: C.green }]}>FREE</Text>;
  const off = course.mrp && course.mrp > course.price ? Math.round(((course.mrp - course.price) / course.mrp) * 100) : 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={[s.price, big && { fontSize: 22 }]}>{rupee(course.price)}</Text>
      {off ? <Text style={s.mrp}>{rupee(course.mrp!)}</Text> : null}
      {off ? <Text style={s.off}>{off}% OFF</Text> : null}
    </View>
  );
}

export function CourseImage({ course, height }: { course: Course; height: number }) {
  const ci = catInfo(course.category);
  if (course.imageUrl) return <Image source={{ uri: course.imageUrl }} style={{ width: "100%", height, backgroundColor: "#dde3ec" }} resizeMode="cover" />;
  return (
    <View style={{ width: "100%", height, backgroundColor: ci.color, alignItems: "center", justifyContent: "center", padding: 12 }}>
      <Ionicons name={ci.icon as any} size={height / 3} color="#ffffffcc" />
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15, textAlign: "center", marginTop: 6 }} numberOfLines={2}>{course.title}</Text>
    </View>
  );
}

export function CourseCard({ course, owned, wide }: { course: Course; owned?: boolean; wide?: boolean }) {
  const open = () => router.push({ pathname: "/course/[id]", params: { id: course.id } });
  return (
    <Pressable onPress={open} style={[s.card, wide ? { width: W * 0.78, marginRight: 12 } : { width: "100%" }]}>
      <CourseImage course={course} height={wide ? W * 0.38 : W * 0.45} />
      <View style={{ padding: 12 }}>
        <Tags course={course} />
        <Text style={s.title} numberOfLines={2}>{course.title}</Text>
        {course.subtitle ? <Text style={s.sub} numberOfLines={1}>{course.subtitle}</Text> : null}
        <View style={{ height: 8 }} />
        {owned ? <Text style={[s.price, { color: C.green }]}>✓ Aapka course</Text> : <PriceLine course={course} />}
        <View style={s.btn}><Text style={s.btnT}>{owned || isFree(course) ? "Course kholein" : "Abhi khareedein"}</Text></View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cat: { width: "48.5%", height: 110, borderRadius: 16, padding: 14, marginBottom: 10, justifyContent: "space-between" },
  catT: { color: "#fff", fontWeight: "900", fontSize: 16 },
  catRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 14, borderWidth: 1, borderColor: C.border },
  tag: { backgroundColor: "#eef2f7", color: "#334155", fontSize: 10, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  title: { fontWeight: "900", fontSize: 16, color: C.text },
  sub: { color: C.sub, fontSize: 12, marginTop: 2 },
  price: { fontWeight: "900", fontSize: 18, color: C.text },
  mrp: { color: C.sub, textDecorationLine: "line-through", fontSize: 13 },
  off: { color: C.green, fontWeight: "900", fontSize: 12 },
  btn: { backgroundColor: C.blue, borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 10 },
  btnT: { color: "#fff", fontWeight: "900" },
});
