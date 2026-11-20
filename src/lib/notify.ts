"use client";
/* 알림 3종: ① 푸시(폰 알림창) ② 앱 안 ‘새 소식’ 표시 ③ 카톡 공유 */
import { useEffect, useState } from "react";
import { cloudReady, sb } from "./cloud";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/* ───── ① 푸시 ───── */
export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!VAPID;
export const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

function key(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export async function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}
export async function pushOn(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const s = await reg.pushManager.getSubscription();
  return !!s;
}
export async function enablePush(uid: string) {
  if (!pushSupported()) throw new Error(isIOS() && !isStandalone() ? "아이폰은 사파리의 ‘공유 → 홈 화면에 추가’로 앱을 설치한 뒤 그 앱에서 켜야 합니다." : "이 기기·브라우저는 푸시 알림을 지원하지 않습니다.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("알림 권한이 꺼져 있습니다. 브라우저·휴대폰 설정에서 알림을 허용해 주세요.");
  await registerSW();
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(VAPID) });
  const j = sub.toJSON();
  const { error } = await sb().from("push_subscriptions").upsert({ endpoint: sub.endpoint, user_id: uid, p256dh: j.keys?.p256dh, auth: j.keys?.auth, user_agent: navigator.userAgent.slice(0, 200) });
  if (error) throw new Error("알림 등록을 저장하지 못했습니다.");
}
export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await sb().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}
/** 새 글·동의서를 참여자에게 푸시로 알린다 (실패해도 글 저장에는 영향 없음) */
export async function notifyCase(caseId: string, title: string, body: string, tab: "community" | "consent" | "members", adminsOnly = false) {
  try {
    const { data } = await sb().auth.getSession();
    const t = data.session?.access_token;
    if (!t) return;
    await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: JSON.stringify({ case_id: caseId, title, body, path: `/shared/${caseId}?tab=${tab}`, admins_only: adminsOnly }) });
  } catch { /* 알림 실패는 조용히 넘김 */ }
}

/* ───── ② 앱 안 새 소식 ───── */
const seenKey = (id: string) => `redev-seen-${id}`;
export function markSeen(caseId: string) { try { localStorage.setItem(seenKey(caseId), new Date().toISOString()); } catch { /* */ } }
/** 사건별 ‘내가 마지막으로 본 뒤 올라온 글·동의서’ 수 (내 글 제외) */
export function useNews(caseIds: string[], uid: string | undefined) {
  const [n, setN] = useState<Record<string, number>>({});
  const k = caseIds.join(",");
  useEffect(() => {
    if (!cloudReady || !uid || !caseIds.length) return;
    let live = true;
    (async () => {
      const out: Record<string, number> = {};
      for (const id of caseIds) {
        const since = localStorage.getItem(seenKey(id)) || "1970-01-01T00:00:00Z";
        const [p, f] = await Promise.all([
          sb().from("posts").select("id", { count: "exact", head: true }).eq("case_id", id).neq("author_id", uid).gt("created_at", since),
          sb().from("consent_forms").select("id", { count: "exact", head: true }).eq("case_id", id).neq("author_id", uid).gt("created_at", since),
        ]);
        out[id] = (p.count || 0) + (f.count || 0);
      }
      if (live) setN(out);
    })().catch(() => {});
    return () => { live = false; };
  }, [k, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  return n;
}

/* ───── ③ 카톡 공유 (공유창 → 카카오톡 선택) ───── */
export async function shareKakao(text: string, url: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title: "재개발 분쟁 도우미", text, url }); return "shared"; }
  } catch (e) { if ((e as Error).name === "AbortError") return "shared"; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); return "copied"; } catch { return "failed"; }
}
