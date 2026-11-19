"use client";
/* 공유·커뮤니티·동의서 — Supabase(무료) 연결
   이 파일만 서버와 이야기한다. 화면은 여기 함수만 부른다. */
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BUSINESS_TYPES, disputeById, lawById, templateById } from "./data";
import type { Case, DB } from "./store";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export const cloudReady = !!(URL_ && KEY_);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!cloudReady) throw new Error("공유 서버가 아직 연결되지 않았습니다.");
  if (!client) client = createClient(URL_, KEY_, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit", storageKey: "redev-auth" } });
  return client;
}

/* ───── 로그인 상태 ───── */
let session: Session | null | undefined = undefined; // undefined = 확인 중
const subs = new Set<() => void>();
let started = false;
function startAuth() {
  if (started || !cloudReady || typeof window === "undefined") return;
  started = true;
  sb().auth.getSession().then(({ data }) => { session = data.session; subs.forEach((f) => f()); });
  sb().auth.onAuthStateChange((_e, s) => { session = s; subs.forEach((f) => f()); });
}
export function useSession() {
  return useSyncExternalStore((f) => { startAuth(); subs.add(f); return () => { subs.delete(f); }; }, () => session, () => undefined);
}

/** 이메일로 로그인 링크·6자리 코드 보내기 */
export async function sendLogin(email: string, next: string) {
  const redirect = `${location.origin}/auth?next=${encodeURIComponent(next)}`;
  const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
  if (error) throw new Error(kErr(error.message));
}
export async function verifyCode(email: string, code: string) {
  const { error } = await sb().auth.verifyOtp({ email, token: code.trim(), type: "email" });
  if (error) throw new Error(kErr(error.message));
}
export async function signOut() { await sb().auth.signOut(); }

export function kErr(m: string) {
  if (/rate limit|too many/i.test(m)) return "메일을 너무 자주 요청했습니다. 1분쯤 뒤에 다시 시도해 주세요.";
  if (/expired|invalid.*(otp|token)|Token has expired/i.test(m)) return "코드가 틀렸거나 시간이 지났습니다. 새 메일을 받아 다시 시도해 주세요.";
  if (/invalid.*email|unable to validate email/i.test(m)) return "이메일 주소를 확인해 주세요.";
  if (/not authorized/i.test(m)) return "메일 발송 설정이 아직 끝나지 않았습니다. 관리자에게 알려 주세요.";
  if (/row-level security|permission denied|violates row-level/i.test(m)) return "권한이 없습니다. 사건 주인에게 권한을 요청하세요.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "인터넷 연결을 확인해 주세요.";
  return m;
}

/* ───── 형식 ───── */
export type SharePart = "overview" | "description" | "schedule" | "evidence" | "laws";
export const SHARE_PARTS: { id: SharePart; title: string; desc: string }[] = [
  { id: "overview", title: "사건 개요·진행 상태", desc: "사건명·사업명·사업 유형·지역·단계·분쟁 유형·진행 상태" },
  { id: "description", title: "사건 설명(사실관계)", desc: "직접 적은 경위. 개인 사정이 들어 있으면 끄세요" },
  { id: "schedule", title: "일정·기한", desc: "총회·법정 기한과 D-day" },
  { id: "evidence", title: "증거 목록 (파일 제외)", desc: "번호·자료명·분류·작성일만. 원본 파일은 올리지 않습니다" },
  { id: "laws", title: "근거 법령·서류", desc: "연결한 조문과 이 사건으로 만든 서류 내용" },
];
export type Snapshot = {
  overview?: { title: string; projectName: string; businessType: string; region: string; stage: string; dispute: string; status: string; eventDate: string; role: string };
  description?: string;
  schedules?: { title: string; date: string; kind: string; basis?: string; done?: boolean }[];
  evidence?: { number: string; name: string; category: string; docDate?: string; review?: string; createdAt: string }[];
  laws?: { short: string; article: string; title: string; summary: string; url?: string }[];
  docs?: { title: string; version: number; category: string; body: string; updatedAt: string }[];
  publishedAt: string;
};
export type SharedCase = { id: string; owner_id: string; owner_name: string; local_case_id: string; title: string; snapshot: Snapshot; share_parts: SharePart[]; invite_code: string; invite_role: "editor" | "viewer"; invite_open: boolean; updated_at: string; created_at: string };
export type Member = { case_id: string; user_id: string; email: string | null; display_name: string; role: "owner" | "editor" | "viewer"; joined_at: string };
export type Post = { id: string; case_id: string; parent_id: string | null; author_id: string; author_name: string; title: string | null; body: string; edited: boolean; created_at: string; updated_at: string };
export type ConsentForm = { id: string; case_id: string; author_id: string; author_name: string; title: string; body: string; body_hash: string; deadline: string | null; closed: boolean; created_at: string };
export type Signature = { form_id: string; user_id: string; case_id: string; signer_name: string; decision: "agree" | "disagree"; signature: string; body_hash: string; signed_at: string };

export const ROLE_LABEL: Record<Member["role"], string> = { owner: "사건 주인", editor: "작성 가능", viewer: "열람만" };

export function buildSnapshot(c: Case, parts: SharePart[], db: DB): Snapshot {
  const s: Snapshot = { publishedAt: new Date().toISOString() };
  const has = (p: SharePart) => parts.includes(p);
  if (has("overview")) s.overview = {
    title: c.title, projectName: c.projectName, businessType: BUSINESS_TYPES.find((b) => b.id === c.businessType || b.name === c.businessType)?.name || c.businessType,
    region: c.region, stage: c.stage, dispute: disputeById(c.disputeType)?.name || "", status: c.status, eventDate: c.eventDate, role: c.role,
  };
  if (has("description")) s.description = c.description;
  if (has("schedule")) s.schedules = [...c.schedules].sort((a, b) => a.date.localeCompare(b.date)).map((x) => ({ title: x.title, date: x.date, kind: x.kind, basis: x.basis, done: x.done }));
  if (has("evidence")) s.evidence = c.evidence.filter((e) => !e.deletedAt).map((e) => ({ number: e.number, name: e.name, category: e.category, docDate: e.docDate, review: e.review, createdAt: e.createdAt }));
  if (has("laws")) {
    s.laws = c.lawIds.map(lawById).filter(Boolean).map((l) => ({ short: l!.short, article: l!.article, title: l!.title, summary: l!.summary }));
    s.docs = db.docs.filter((d) => d.caseId === c.id).map((d) => ({ title: d.title, version: d.version, category: templateById(d.templateId)?.category || "서류", body: d.body, updatedAt: d.updatedAt }));
  }
  return s;
}

/* ───── 공유 사건 ───── */
export async function myShare(localId: string, uid: string) {
  const { data, error } = await sb().from("shared_cases").select("*").eq("owner_id", uid).eq("local_case_id", localId).maybeSingle();
  if (error) throw new Error(kErr(error.message));
  return data as SharedCase | null;
}
export async function publish(c: Case, parts: SharePart[], db: DB, ownerName: string, existing: SharedCase | null) {
  const snapshot = buildSnapshot(c, parts, db);
  if (existing) {
    const { data, error } = await sb().from("shared_cases").update({ title: c.title, snapshot, share_parts: parts }).eq("id", existing.id).select().single();
    if (error) throw new Error(kErr(error.message));
    return data as SharedCase;
  }
  const { data, error } = await sb().from("shared_cases").insert({ owner_name: ownerName, local_case_id: c.id, title: c.title, snapshot, share_parts: parts }).select().single();
  if (error) throw new Error(kErr(error.message));
  return data as SharedCase;
}
export async function updateShare(id: string, patch: Partial<Pick<SharedCase, "invite_role" | "invite_open" | "invite_code">>) {
  const { data, error } = await sb().from("shared_cases").update(patch).eq("id", id).select().single();
  if (error) throw new Error(kErr(error.message));
  return data as SharedCase;
}
export async function stopShare(id: string) {
  const { error } = await sb().from("shared_cases").delete().eq("id", id);
  if (error) throw new Error(kErr(error.message));
}
export function newInviteCode() {
  const a = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...a)).replace(/\//g, "_").replace(/\+/g, "-");
}
export const inviteUrl = (code: string) => `${location.origin}/join?code=${encodeURIComponent(code)}`;

export async function joinCase(code: string, name: string) {
  const { data, error } = await sb().rpc("join_case", { code, name });
  if (error) throw new Error(kErr(error.message));
  return data as string;
}
export async function mySharedCases(uid: string) {
  const { data, error } = await sb().from("case_members").select("role, joined_at, shared_cases(id, title, owner_name, updated_at, owner_id)").eq("user_id", uid).order("joined_at", { ascending: false });
  if (error) throw new Error(kErr(error.message));
  return (data || []) as unknown as { role: Member["role"]; joined_at: string; shared_cases: Pick<SharedCase, "id" | "title" | "owner_name" | "updated_at" | "owner_id"> }[];
}
export async function getShared(id: string) {
  const { data, error } = await sb().from("shared_cases").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(kErr(error.message));
  return data as SharedCase | null;
}
export async function getMembers(id: string) {
  const { data, error } = await sb().from("case_members").select("*").eq("case_id", id).order("joined_at");
  if (error) throw new Error(kErr(error.message));
  return (data || []) as Member[];
}
export async function setRole(caseId: string, userId: string, role: "editor" | "viewer") {
  const { error } = await sb().from("case_members").update({ role }).eq("case_id", caseId).eq("user_id", userId);
  if (error) throw new Error(kErr(error.message));
}
export async function removeMember(caseId: string, userId: string) {
  const { error } = await sb().from("case_members").delete().eq("case_id", caseId).eq("user_id", userId);
  if (error) throw new Error(kErr(error.message));
}

/* ───── 커뮤니티(쓰레드) ───── */
export async function getPosts(caseId: string) {
  const { data, error } = await sb().from("posts").select("*").eq("case_id", caseId).order("created_at", { ascending: true }).limit(1000);
  if (error) throw new Error(kErr(error.message));
  return (data || []) as Post[];
}
export async function addPost(p: { case_id: string; parent_id?: string | null; author_name: string; title?: string | null; body: string }) {
  const { data, error } = await sb().from("posts").insert({ ...p, parent_id: p.parent_id || null, title: p.title?.trim() || null, body: p.body.trim() }).select().single();
  if (error) throw new Error(kErr(error.message));
  return data as Post;
}
export async function editPost(id: string, patch: { title?: string | null; body: string }) {
  const { data, error } = await sb().from("posts").update({ ...patch, body: patch.body.trim() }).eq("id", id).select();
  if (error) throw new Error(kErr(error.message));
  if (!data?.length) throw new Error("본인이 쓴 글만 고칠 수 있습니다.");
  return data[0] as Post;
}
export async function deletePost(id: string) {
  const { data, error } = await sb().from("posts").delete().eq("id", id).select("id");
  if (error) throw new Error(kErr(error.message));
  if (!data?.length) throw new Error("지울 권한이 없습니다.");
}

/* ───── 동의서 ───── */
export async function getConsents(caseId: string) {
  const [f, s] = await Promise.all([
    sb().from("consent_forms").select("*").eq("case_id", caseId).order("created_at", { ascending: false }),
    sb().from("consent_signatures").select("*").eq("case_id", caseId).order("signed_at"),
  ]);
  if (f.error) throw new Error(kErr(f.error.message));
  if (s.error) throw new Error(kErr(s.error.message));
  return { forms: (f.data || []) as ConsentForm[], sigs: (s.data || []) as Signature[] };
}
export async function addConsent(p: { case_id: string; author_name: string; title: string; body: string; deadline: string | null }) {
  const { data, error } = await sb().from("consent_forms").insert({ ...p, title: p.title.trim(), body: p.body.trim() }).select().single();
  if (error) throw new Error(kErr(error.message));
  return data as ConsentForm;
}
export async function closeConsent(id: string, closed: boolean) {
  const { error } = await sb().from("consent_forms").update({ closed }).eq("id", id);
  if (error) throw new Error(kErr(error.message));
}
export async function sign(p: { form_id: string; case_id: string; signer_name: string; decision: "agree" | "disagree"; signature: string; body_hash: string }) {
  const { error } = await sb().from("consent_signatures").insert({ ...p, user_agent: navigator.userAgent.slice(0, 200) });
  if (error) {
    if (/duplicate key/i.test(error.message)) throw new Error("이미 서명했습니다. 서명은 바꿀 수 없습니다.");
    throw new Error(kErr(error.message));
  }
}
export async function sha256Text(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** 표(테이블)가 바뀌면 다시 불러오기 — 실시간 */
export function useLive(caseId: string | null, tables: string[], reload: () => void) {
  useEffect(() => {
    if (!caseId || !cloudReady) return;
    const ch = sb().channel(`case-${caseId}-${tables.join("-")}`);
    tables.forEach((t) => ch.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `case_id=eq.${caseId}` }, () => reload()));
    ch.subscribe();
    return () => { sb().removeChannel(ch); };
  }, [caseId, tables.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** 불러오기 상태 묶음 */
export function useLoad<T>(fn: (() => Promise<T>) | null, deps: unknown[]) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!fn) { set({ loading: false }); return; }
    let live = true;
    set((s) => ({ ...s, loading: true }));
    fn().then((data) => live && set({ data, loading: false })).catch((e) => live && set({ error: e instanceof Error ? e.message : String(e), loading: false }));
    return () => { live = false; };
  }, [...deps, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: () => setTick((x) => x + 1) };
}
