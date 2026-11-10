import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { usePreventScreenCapture } from "expo-screen-capture";
import { Paths } from "expo-file-system";
import Pdf from "react-native-pdf";
import { ref, writeToFile } from "@react-native-firebase/storage";
import { storage } from "../../lib/firebase";
import { getItem, Item, storagePathOf } from "../../lib/db";
import { C } from "../../lib/theme";

// PDF / photo app ke andar hi dikhti hai: na browser, na download, na screenshot.
export default function DocViewer() {
  const { cid, iid } = useLocalSearchParams<{ cid: string; iid: string }>();
  usePreventScreenCapture();
  const [item, setItem] = useState<Item | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState({ cur: 1, total: 0 });

  useEffect(() => {
    (async () => {
      try {
        const it = await getItem(cid, iid);
        if (!it) throw new Error("🔒 Ye notes dekhne ke liye course khareedein.");
        setItem(it);
        const sp = storagePathOf(it.url);
        if (!sp) throw new Error("File nahi mili.");
        const ext = /\.(jpe?g|png|webp)$/i.test(sp) ? sp.split(".").pop() : "pdf";
        const dest = `${Paths.cache.uri.replace(/^file:\/\//, "").replace(/\/$/, "")}/doc_${iid}.${ext}`;
        await writeToFile(ref(storage, sp), dest); // login + course access ke bina file nahi milti (storage.rules)
        setLocal(`file://${dest}`);
      } catch (e: any) {
        const code = String(e?.code ?? "");
        setErr(code.includes("unauthorized") || code.includes("permission") ? "🔒 Ye notes dekhne ke liye course khareedein." : e?.message ?? "Khul nahi paya");
      }
    })();
  }, [cid, iid]);

  const isImg = !!local && !local.endsWith(".pdf");
  const { width, height } = Dimensions.get("window");
  return (
    <View style={{ flex: 1, backgroundColor: "#e9edf3" }}>
      <Stack.Screen options={{ title: item?.title ?? "Notes" }} />
      {err ? (
        <Text style={{ margin: 24, textAlign: "center", color: C.text, fontSize: 15 }}>{err}</Text>
      ) : !local ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={{ marginTop: 10, color: C.sub }}>Notes khul rahe hain…</Text>
        </View>
      ) : isImg ? (
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ alignItems: "center" }}>
          <Image source={{ uri: local }} style={{ width, height: height * 0.85 }} resizeMode="contain" />
        </ScrollView>
      ) : (
        <>
          <Pdf
            source={{ uri: local }}
            style={{ flex: 1, width, backgroundColor: "#e9edf3" }}
            trustAllCerts={false}
            enablePaging={false}
            onLoadComplete={(n) => setPage({ cur: 1, total: n })}
            onPageChanged={(p, n) => setPage({ cur: p, total: n })}
            onError={() => setErr("PDF khul nahi payi.")}
          />
          {page.total ? (
            <View style={{ position: "absolute", bottom: 16, alignSelf: "center", backgroundColor: "#071B3Acc", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>{page.cur} / {page.total}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
