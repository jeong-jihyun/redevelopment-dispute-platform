"use client";
import { useSyncExternalStore } from "react";
import { del, get, set } from "idb-keyval";
import type { Analysis, Facts } from "./analyze";

export type Member = { id: string; name: string; email: string; role: string; invitedAt: string; accepted: boolean };
export type Schedule = { id: string; title: string; date: string; kind: "기한" | "일정"; basis?: string; memo?: string; done?: boolean };
export type Evidence = {
  id: string; name: string; type: string; size: number; category: string; number: string;
  hash: string; createdAt: string; updatedAt: string; createdBy: string; retentionUntil?: string;
  deletedAt?: string; legalHold?: boolean; access: string; memo?: string; review?: string; docDate?: string; versions: { at: string; hash: string; note: string }[];
};
export type GenDoc = { id: string; templateId: string; title: string; values: Record<string, string>; lawIds?: string[]; body: string; edited?: boolean; caseId?: string; createdAt: string; updatedAt: string; version: number };
export type Log = { at: string; who: string; action: string };
export type Case = {
  id: string; title: string; businessType: string; region: string; projectName: string; stage: string; role: string;
  disputeType: string; eventDate: string; description: string; status: string; createdAt: string; updatedAt: string;
  members: Member[]; schedules: Schedule[]; evidence: Evidence[]; lawIds: string[]; analyses: { id: string; at: string; question: string; analysis: Analysis }[];
  activity: Log[];
};
export type Msg = { role: "user" | "ai"; text: string; at: string; analysis?: Analysis; note?: string; followUp?: { key: keyof Facts; question: string; options: string[] } };
export type Conversation = {
  id: string; title: string; caseId?: string; topic?: string; facts: Facts; messages: Msg[];
  pendingQuestion?: string; skipped?: (keyof Facts)[]; createdAt: string; updatedAt: string;
};
export type Profile = { name: string; email: string; role: string; region: string; notify: boolean; joinedAt?: string };

export type DB = { profile: Profile | null; cases: Case[]; conversations: Conversation[]; docs: GenDoc[]; access: Log[] };

const KEY = "redev-legal-v1";
const empty: DB = { profile: null, cases: [], conversations: [], docs: [], access: [] };
let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...empty, ...JSON.parse(raw) } : { ...empty };
  } catch {
    cache = { ...empty };
  }
  return cache!;
}

export function getDB() {
  return load();
}

export function update(fn: (db: DB) => void) {
  const next: DB = structuredClone(load());
  fn(next);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    alert("기기 저장 공간이 부족합니다. 오래된 자료를 정리해 주세요.");
    throw e;
  }
  listeners.forEach((l) => l());
}

export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
    },
    () => load(),
    () => empty,
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const now = () => new Date().toISOString();
export const me = () => getDB().profile?.name || "나";

export function logCase(c: Case, action: string) {
  c.activity.unshift({ at: now(), who: me(), action });
  c.updatedAt = now();
}
export function logAccess(db: DB, action: string) {
  db.access.unshift({ at: now(), who: db.profile?.name || "나", action });
  db.access = db.access.slice(0, 300);
}

// 증거 파일 원본은 IndexedDB(기기 내부)에 사건별 키로 보관
export const fileKey = (caseId: string, evId: string) => `case:${caseId}:ev:${evId}`;
export const putFile = (caseId: string, evId: string, blob: Blob) => set(fileKey(caseId, evId), blob);
export const getFile = (caseId: string, evId: string) => get<Blob>(fileKey(caseId, evId));
export const delFile = (caseId: string, evId: string) => del(fileKey(caseId, evId));

export async function sha256(blob: Blob) {
  const buf = await blob.arrayBuffer();
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
export function fmtSize(n: number) {
  return n > 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB";
}

/** 첫 화면 그리기(서버·기기 공통)가 끝났는지 — 기기 저장소를 읽기 전 '없음' 안내가 깜빡이지 않게 */
export function useMounted() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
