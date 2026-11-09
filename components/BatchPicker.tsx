import React from "react";
import { View } from "react-native";
import { Chip, Label } from "./ui";
import { Batch } from "../lib/db";

export default function BatchPicker({ batches, value, onChange, allowAll = true, label = "Batch" }: {
  batches: Batch[]; value: string; onChange: (id: string) => void; allowAll?: boolean; label?: string;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {allowAll ? <Chip label="Sabhi (All)" active={value === "all"} onPress={() => onChange("all")} /> : null}
        {batches.map((b) => <Chip key={b.id} label={b.name} active={value === b.id} onPress={() => onChange(b.id)} />)}
      </View>
    </View>
  );
}
