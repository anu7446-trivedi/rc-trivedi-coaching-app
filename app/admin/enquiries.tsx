import React from "react";
import { Linking, Text, View } from "react-native";
import { deleteEnquiry, fmtDate, getEnquiries } from "../../lib/db";
import { useLoad } from "../../lib/useLoad";
import { Btn, Card, Empty, Loading, Screen, confirm } from "../../components/ui";
import { C } from "../../lib/theme";

export default function Enquiries() {
  const { data, loading, reload } = useLoad(getEnquiries);
  if (!data) return <Loading />;
  return (
    <Screen onRefresh={reload} refreshing={loading}>
      {data.length === 0 ? <Empty text="Koi enquiry nahi aayi." /> : null}
      {data.map((e) => (
        <Card key={e.id}>
          <Text style={{ fontWeight: "900", fontSize: 16, color: C.text }}>{e.name}</Text>
          <Text style={{ color: C.text }}>📞 {e.mobile}  {e.className ? `• ${e.className}` : ""}</Text>
          {e.message ? <Text style={{ color: "#3b4a5e", marginTop: 4 }}>{e.message}</Text> : null}
          <Text style={{ color: C.sub, fontSize: 11, marginVertical: 6 }}>{fmtDate(e.createdAt)}</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Btn small title="Call" icon="call" color={C.green} onPress={() => Linking.openURL(`tel:${e.mobile}`)} />
            <Btn small title="WhatsApp" icon="logo-whatsapp" color="#25D366" onPress={() => Linking.openURL(`https://wa.me/91${e.mobile.replace(/\D/g, "").slice(-10)}`)} />
            <Btn small outline color={C.red} title="Delete" onPress={() => confirm("Hatayein?", e.name, async () => { await deleteEnquiry(e.id); reload(); })} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
