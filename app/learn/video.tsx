import React, { useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import YoutubePlayer from "react-native-youtube-iframe";
import { Btn, Screen } from "../../components/ui";
import { C } from "../../lib/theme";
import { youtubeId } from "../../lib/content";

export default function Video() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [playing, setPlaying] = useState(true);
  const id = youtubeId(url);
  const w = Dimensions.get("window").width;
  return (
    <Screen>
      <Stack.Screen options={{ title: title ?? "Video" }} />
      {id ? (
        <View style={{ marginHorizontal: -16, backgroundColor: "#000" }}>
          <YoutubePlayer height={(w * 9) / 16} width={w} videoId={id} play={playing}
            onChangeState={(s: string) => s === "ended" && setPlaying(false)}
            initialPlayerParams={{ modestbranding: true, rel: false }} />
        </View>
      ) : (
        <Text style={{ color: C.sub, marginBottom: 10 }}>Ye video bahar ke player me khulega.</Text>
      )}
      <Text style={{ fontSize: 18, fontWeight: "900", color: C.text, marginVertical: 12 }}>{title}</Text>
      <Btn title="Bahar (YouTube) me kholein" icon="open-outline" outline onPress={() => WebBrowser.openBrowserAsync(url)} />
    </Screen>
  );
}
