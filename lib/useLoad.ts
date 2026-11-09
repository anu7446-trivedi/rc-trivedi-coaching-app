import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

// Data load karne ka chhota helper: screen par aate hi load + pull-to-refresh.
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await fn()); setError(null); }
    catch (e: any) { setError(e?.message ?? "Load nahi ho paya"); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { data, loading, error, reload, setData };
}
