import React, { useState } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../lib/auth";
import { getMaterials, fmtDate } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Chip, Empty, Loading, Row, Screen } from "../../components/ui";

const icons = { pdf: "document-text", video: "logo-youtube", link: "link" } as const;
const colors = { pdf: "#a51d2d", video: "#c4302b", link: "#1769aa" } as const;

export default function MaterialScreen() {
  const { student } = useAuth();
  const { data, loading, reload } = useLoad(() => getMaterials(student!.batchId));
  const [f, setF] = useState<"all" | "pdf" | "video" | "link">("all");
  if (!data) return <Loading />;
  const items = data.filter((m) => f === "all" || m.type === f);
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>
        <Chip label="Sab" active={f === "all"} onPress={() => setF("all")} />
        <Chip label="📄 PDF / Notes" active={f === "pdf"} onPress={() => setF("pdf")} />
        <Chip label="🎬 Video" active={f === "video"} onPress={() => setF("video")} />
        <Chip label="🔗 Link" active={f === "link"} onPress={() => setF("link")} />
      </View>
      {items.length === 0 ? <Empty text="Abhi koi material nahi hai." /> : null}
      {items.map((m) => (
        <Row
          key={m.id}
          icon={icons[m.type]}
          color={colors[m.type]}
          title={m.title}
          subtitle={[m.subject, fmtDate(m.createdAt)].filter(Boolean).join(" • ")}
          onPress={() => WebBrowser.openBrowserAsync(m.url)}
        />
      ))}
    </Screen>
  );
}
