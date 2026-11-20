import { createClient } from "@supabase/supabase-js";
import * as webpush from "web-push";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIV = process.env.VAPID_PRIVATE_KEY || "";
const SECRET = process.env.NOTIFY_SECRET || "";

/** 사건 참여자에게 푸시 보내기 — 보내는 사람의 로그인 토큰으로 ‘작성 권한 참여자’인지 서버(DB)가 확인한다 */
export async function POST(req: Request) {
  if (!URL_ || !KEY_ || !PUB || !PRIV || !SECRET) return NextResponse.json({ ok: false, error: "알림 서버 설정이 아직 없습니다." }, { status: 503 });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
  if (!token) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  let b: { case_id?: string; title?: string; body?: string; path?: string; admins_only?: boolean };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 }); }
  const caseId = String(b.case_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(caseId)) return NextResponse.json({ ok: false, error: "사건 번호 오류" }, { status: 400 });
  const title = String(b.title || "새 소식").slice(0, 80);
  const body = String(b.body || "").slice(0, 140);
  const path = String(b.path || `/shared/${caseId}`);
  if (!path.startsWith("/shared/")) return NextResponse.json({ ok: false, error: "경로 오류" }, { status: 400 });

  const db = createClient(URL_, KEY_, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: u } = await db.auth.getUser(token);
  if (!u.user) return NextResponse.json({ ok: false, error: "로그인이 만료되었습니다." }, { status: 401 });
  const { data: targets, error } = await db.rpc("push_targets", { cid: caseId, secret: SECRET, admins_only: b.admins_only === true });
  if (error) return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });

  webpush.setVapidDetails("mailto:jeongjih@live.com", PUB, PRIV);
  const payload = JSON.stringify({ title, body, url: path, tag: `case-${caseId}` });
  let sent = 0, failed = 0;
  for (const t of (targets || []) as { endpoint: string; p256dh: string; auth: string; user_id: string }[]) {
    if (t.user_id === u.user.id) continue; // 보낸 본인 제외
    try { await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 86400 }); sent++; }
    catch (e) {
      failed++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.rpc("drop_push", { ep: t.endpoint, secret: SECRET });
    }
  }
  return NextResponse.json({ ok: true, sent, failed });
}
