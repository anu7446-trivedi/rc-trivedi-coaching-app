import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { getMyResult, getTest, getTestKey, Result, score, submitResult, Test } from "../../../lib/db";
import { Btn, Card, Loading, Screen, confirm, notify } from "../../../components/ui";
import { C } from "../../../lib/theme";

export default function TakeTest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { student } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [key, setKey] = useState<number[] | null>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const submitted = useRef(false);

  const loadResult = async () => {
    const r = await getMyResult(id, student!.id);
    setResult(r);
    if (r) setKey(await getTestKey(id));
  };

  useEffect(() => {
    (async () => {
      const t = await getTest(id);
      setTest(t);
      if (t) setAnswers(t.questions.map(() => null));
      await loadResult();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (started && left === 0 && !submitted.current) doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, started]);

  const doSubmit = async () => {
    if (!test || submitted.current) return;
    submitted.current = true;
    setBusy(true);
    try {
      await submitResult({ testId: test.id, testTitle: test.title, studentId: student!.id, studentName: student!.name, answers });
      setStarted(false);
      await loadResult();
    } catch (e: any) {
      submitted.current = false;
      notify("Submit nahi hua", e?.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <Loading />;
  if (!test) return <Screen><Text>Test nahi mila.</Text></Screen>;

  // ---- Result view ----
  if (result) {
    const sc = key ? score(result.answers, key) : null;
    return (
      <Screen>
        <Stack.Screen options={{ title: test.title }} />
        <Card style={{ backgroundColor: C.navy, alignItems: "center" }}>
          <Text style={{ color: "#c8d4e6" }}>Aapka Score</Text>
          <Text style={{ color: C.gold, fontSize: 44, fontWeight: "900" }}>{sc ? `${sc.right}/${sc.total}` : "—"}</Text>
          {sc ? <Text style={{ color: "#fff" }}>✅ Sahi {sc.right}   ❌ Galat {sc.wrong}   ⏭ Chhoda {sc.skipped}</Text> : null}
        </Card>
        {test.questions.map((q, i) => {
          const mine = result.answers[i];
          const right = key?.[i];
          return (
            <Card key={i}>
              <Text style={s.q}>Q{i + 1}. {q.q}</Text>
              {q.options.map((o, j) => {
                const isRight = j === right, isMine = j === mine;
                return (
                  <View key={j} style={[s.opt, isRight && s.optRight, isMine && !isRight && s.optWrong]}>
                    <Text style={s.optT}>{String.fromCharCode(65 + j)}. {o} {isRight ? "✅" : isMine ? "❌" : ""}</Text>
                  </View>
                );
              })}
            </Card>
          );
        })}
      </Screen>
    );
  }

  // ---- Instructions ----
  if (!started) {
    return (
      <Screen>
        <Stack.Screen options={{ title: test.title }} />
        <Card>
          <Text style={s.title}>{test.title}</Text>
          <Text style={s.info}>📝 Kul prashn: {test.questions.length}</Text>
          <Text style={s.info}>⏱ Samay: {test.durationMin} minute</Text>
          <Text style={s.info}>⚠️ Test sirf ek baar diya ja sakta hai.</Text>
          <Text style={s.info}>⚠️ Time khatam hone par apne aap submit hoga.</Text>
        </Card>
        <Btn title="Test Shuru Karein" icon="play" onPress={() => { setLeft(test.durationMin * 60); setStarted(true); }} />
      </Screen>
    );
  }

  // ---- Taking test ----
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const attempted = answers.filter((a) => a != null).length;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `⏱ ${mm}:${ss}`, headerBackVisible: false, gestureEnabled: false }} />
      <View style={s.bar}>
        <Text style={s.barT}>Attempted: {attempted}/{test.questions.length}</Text>
        <Text style={[s.barT, left < 60 && { color: "#ffb4b4" }]}>⏱ {mm}:{ss}</Text>
      </View>
      <Screen>
        {test.questions.map((q, i) => (
          <Card key={i}>
            <Text style={s.q}>Q{i + 1}. {q.q}</Text>
            {q.options.map((o, j) => (
              <Pressable
                key={j}
                style={[s.opt, answers[i] === j && s.optSel]}
                onPress={() => setAnswers((a) => a.map((v, k) => (k === i ? (v === j ? null : j) : v)))}
              >
                <Text style={[s.optT, answers[i] === j && { color: "#fff" }]}>{String.fromCharCode(65 + j)}. {o}</Text>
              </Pressable>
            ))}
          </Card>
        ))}
        <Btn
          title="Submit Test"
          icon="checkmark-done"
          color={C.green}
          loading={busy}
          onPress={() => confirm("Submit karein?", `${attempted}/${test.questions.length} prashn attempt kiye hain.`, doSubmit)}
        />
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900", color: C.navy, marginBottom: 10 },
  info: { fontSize: 15, color: C.text, marginBottom: 6 },
  q: { fontWeight: "800", fontSize: 15, color: C.text, marginBottom: 10, lineHeight: 22 },
  opt: { borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  optSel: { backgroundColor: C.blue, borderColor: C.blue },
  optRight: { backgroundColor: "#e3f6ea", borderColor: C.green },
  optWrong: { backgroundColor: "#fdecea", borderColor: C.red },
  optT: { color: C.text, fontSize: 14 },
  bar: { flexDirection: "row", justifyContent: "space-between", backgroundColor: C.blue, padding: 12 },
  barT: { color: "#fff", fontWeight: "900" },
});
