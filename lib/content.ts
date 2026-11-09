import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Item } from "./db";
import { notify } from "../components/ui";

export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function openItem(it: Item) {
  if (it.type === "test") return router.push({ pathname: "/learn/test", params: { cid: it.courseId, iid: it.id } });
  if (!it.url) return notify("Link nahi hai");
  if ((it.type === "video" || it.type === "live") && youtubeId(it.url))
    return router.push({ pathname: "/learn/video", params: { url: it.url, title: it.title } });
  WebBrowser.openBrowserAsync(it.url);
}
