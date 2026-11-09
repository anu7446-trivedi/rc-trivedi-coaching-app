import React from "react";
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../lib/theme";
import type { Payment } from "../lib/db";

export const statusUi: Record<Payment["status"], { label: string; color: string }> = {
  pending: { label: "Jaanch baaki", color: C.orange },
  verified: { label: "Jama ✓", color: C.green },
  rejected: { label: "Reject", color: C.red },
};

export function Screen({ children, onRefresh, refreshing = false }: {
  children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export const H = ({ children }: { children: React.ReactNode }) => <Text style={s.h}>{children}</Text>;
export const Sub = ({ children }: { children: React.ReactNode }) => <Text style={s.sub}>{children}</Text>;
export const Label = ({ children }: { children: React.ReactNode }) => <Text style={s.label}>{children}</Text>;

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Input(p: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {p.label ? <Label>{p.label}</Label> : null}
      <TextInput placeholderTextColor="#9aa7b8" {...p} style={[s.input, p.multiline && { minHeight: 90, textAlignVertical: "top" }, p.style]} />
    </View>
  );
}

export function Btn({ title, onPress, color = C.blue, outline, small, icon, disabled, loading }: {
  title: string; onPress: () => void; color?: string; outline?: boolean; small?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall,
        outline ? { borderWidth: 1.5, borderColor: color, backgroundColor: "transparent" } : { backgroundColor: color },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      {loading ? <ActivityIndicator color={outline ? color : "#fff"} /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={outline ? color : "#fff"} /> : null}
          <Text style={[s.btnT, small && { fontSize: 13 }, { color: outline ? color : "#fff" }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Row({ icon, title, subtitle, onPress, right, color = C.blue }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void;
  right?: React.ReactNode; color?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      {icon ? (
        <View style={[s.rowIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.rowT}>{title}</Text>
        {subtitle ? <Text style={s.rowS}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color="#9aa7b8" /> : null)}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.blue, borderColor: C.blue }]}>
      <Text style={[s.chipT, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color, fontWeight: "800", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

export const Empty = ({ text }: { text: string }) => <Text style={s.empty}>{text}</Text>;
export const Loading = () => <ActivityIndicator size="large" color={C.blue} style={{ marginTop: 40 }} />;

export function notify(title: string, msg?: string) {
  if (Platform.OS === "web") window.alert(msg ? `${title}\n${msg}` : title);
  else Alert.alert(title, msg);
}

export function confirm(title: string, msg: string, onYes: () => void) {
  if (Platform.OS === "web") { if (window.confirm(`${title}\n${msg}`)) onYes(); return; }
  Alert.alert(title, msg, [{ text: "Nahi", style: "cancel" }, { text: "Haan", style: "destructive", onPress: onYes }]);
}

const s = StyleSheet.create({
  h: { fontSize: 24, fontWeight: "900", color: C.navy, marginBottom: 4 },
  sub: { color: C.sub, marginBottom: 16, fontSize: 13 },
  label: { fontWeight: "700", color: C.text, marginBottom: 6, fontSize: 13 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, fontSize: 15, color: C.text },
  btn: { flexDirection: "row", gap: 8, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, alignItems: "center", justifyContent: "center", marginVertical: 4 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnT: { fontWeight: "800", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: C.border },
  rowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowT: { fontWeight: "800", color: C.text, fontSize: 15 },
  rowS: { color: C.sub, fontSize: 12, marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: "#fff", marginRight: 8, marginBottom: 8 },
  chipT: { fontWeight: "700", color: C.text, fontSize: 12 },
  empty: { textAlign: "center", color: C.sub, marginTop: 30, fontSize: 14 },
});
