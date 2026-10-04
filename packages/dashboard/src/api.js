// サーバーとのやり取り(読み取りだけ)と、変更通知(SSE)のフック。
import { useEffect, useRef, useState } from "react";

/** JSON を取ってくる */
export async function getJson(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let msg = `読み込みに失敗しました(${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* 本文なし */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * 変更通知を受け取る。組織フォルダが変わるたびに version が1増える。
 * @returns {{ version: number, connected: boolean }}
 */
export function useLiveUpdates() {
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (typeof EventSource === "undefined") return undefined;
    const es = new EventSource("/api/events");
    es.addEventListener("hello", () => setConnected(true));
    es.addEventListener("update", () => {
      setConnected(true);
      setVersion((v) => v + 1);
    });
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);
  return { version, connected };
}

/**
 * URL の JSON を読む。deps が変わるたびに読み直す(前のデータは読み直し中も残す)。
 * url が null のときは何もしない。
 */
export function useJson(url, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!url });
  const lastUrl = useRef(url);
  useEffect(() => {
    if (!url) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }
    const ctrl = new AbortController();
    const urlChanged = lastUrl.current !== url;
    lastUrl.current = url;
    setState((s) => ({ data: urlChanged ? null : s.data, error: null, loading: true }));
    getJson(url, ctrl.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState((s) => ({ data: urlChanged ? null : s.data, error: err, loading: false }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  return state;
}

/** 一定間隔で増える数(時間で変わる表示の読み直し用) */
export function useTick(ms) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}
