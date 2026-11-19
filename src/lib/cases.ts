"use client";
import type { BadgeSpec, Tone } from "@/components/ui";
import { DISPUTES, LAWS, STAGES } from "./data";
import { calcDeadline, dday } from "./analyze";
import { getDB, getFile, putFile, type Case, type DB, type Evidence, type Schedule } from "./store";
import { del, keys } from "idb-keyval";

export const CASE_STATUSES: { name: string; tone: Tone }[] = [
  { name: "진행 중", tone: "blue" },
  { name: "기한 확인 필요", tone: "amber" },
  { name: "검토 필요", tone: "red" },
  { name: "보류", tone: "gray" },
  { name: "종결", tone: "green" },
];
export const statusBadge = (s: string): BadgeSpec => ({ text: s, tone: CASE_STATUSES.find((x) => x.name === s)?.tone || "gray" });

export const MEMBER_ROLES = [
  { name: "사건 소유자", desc: "사건 전체 관리 및 권한 부여" },
  { name: "관리자", desc: "자료·일정·참여자 관리" },
  { name: "일반 참여자", desc: "허용된 자료 열람 및 작성" },
  { name: "열람자", desc: "열람만 가능" },
  { name: "외부 전문가", desc: "초대된 사건의 허용 범위만 접근" },
];
export const EVIDENCE_CATEGORIES = ["회의 자료", "행정 문서", "평가 자료", "계약서", "통지·내용증명", "사진·영상", "녹음", "기타"];
export const EVIDENCE_ACCESS = ["소유자·관리자만", "참여자 전체", "외부 전문가 포함"];
export const EVIDENCE_REVIEW: { name: string; tone: Tone }[] = [
  { name: "미검토", tone: "gray" }, { name: "검토 필요", tone: "amber" }, { name: "확인 완료", tone: "green" },
];
export const reviewBadge = (s?: string): BadgeSpec => ({ text: s || "미검토", tone: EVIDENCE_REVIEW.find((x) => x.name === s)?.tone || "gray" });
export const ACCEPT = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.mp3,.m4a,.mp4,.txt";
export const MAX_FILE = 50 * 1024 * 1024;

export function fileKind(name: string, type: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (type.startsWith("image/")) return "이미지";
  if (type === "application/pdf" || ext === "pdf") return "PDF";
  if (type.startsWith("audio/")) return "음성";
  if (type.startsWith("video/")) return "영상";
  if (ext === "docx") return "Word";
  if (ext === "xlsx") return "Excel";
  if (ext === "txt") return "텍스트";
  return ext.toUpperCase() || "파일";
}
export function guessCategory(name: string, type: string) {
  if (/회의록|총회|의사록|대의원/.test(name)) return "회의 자료";
  if (/고시|인가|공고|처분|결정/.test(name)) return "행정 문서";
  if (/감정|평가/.test(name)) return "평가 자료";
  if (/계약/.test(name)) return "계약서";
  if (/내용증명|통지|통보/.test(name)) return "통지·내용증명";
  if (type.startsWith("audio/")) return "녹음";
  if (type.startsWith("image/") || type.startsWith("video/")) return "사진·영상";
  return "기타";
}
/** 갑 제N호증 — 삭제된 자료 번호도 다시 쓰지 않음 */
export function nextEvidenceNo(c: Case) {
  const nums = c.evidence.map((e) => Number(e.number.match(/\d+/)?.[0] || 0));
  return `갑 제${(nums.length ? Math.max(...nums) : 0) + 1}호증`;
}

/** 사건 진행 4단계 (디자인 시스템 '사건 관리 UI 패턴') */
export function caseProgress(c: Case, docCount: number) {
  const s1 = !!(c.description.trim() && c.eventDate);
  const s2 = c.analyses.length > 0 || c.lawIds.length > 0 || getDB().conversations.some((x) => x.caseId === c.id);
  const s3 = docCount > 0;
  const s4 = c.schedules.length > 0;
  const st = (done: boolean, prevDone: boolean): BadgeSpec => done ? { text: "완료", tone: "green" } : prevDone ? { text: "진행 중", tone: "blue" } : { text: "대기", tone: "gray" };
  return [
    { title: "사실관계 정리", desc: "사건 당사자, 사업 단계, 주요 일자와 경위를 기록", badge: st(s1, true), tab: "overview" },
    { title: "법률정보 및 쟁점 분석", desc: "공식 법령·판례 근거와 사실관계의 연결을 검토", badge: st(s2, s1), tab: "analysis" },
    { title: "대응 전략 및 문서 초안", desc: "선택한 대응 방향에 따라 문서 초안을 생성", badge: st(s3, s2), tab: "docs" },
    { title: "제출 및 후속 일정 관리", desc: "제출 여부, 접수 증빙, 후속 기한을 기록", badge: st(s4, s3), tab: "schedule" },
  ];
}

export const deadlineLaws = () => LAWS.filter((l) => l.deadline);
export function lawDeadline(lawId: string, base: string) {
  const l = LAWS.find((x) => x.id === lawId);
  if (!l?.deadline || !base) return null;
  const r = calcDeadline(base, l.deadline.days);
  return { ...r, law: l, basis: `「${l.short}」 ${l.article} · ${l.deadline.label} (${l.deadline.from}부터 ${l.deadline.days}일, 초일 불산입${r.moved ? ", 주말이라 다음 월요일로" : ""})` };
}
export function ddayBadge(s: Schedule): BadgeSpec {
  if (s.done) return { text: "완료", tone: "green" };
  const d = dday(s.date);
  const n = d === "D-Day" ? 0 : d.startsWith("D-") ? Number(d.slice(2)) : -Number(d.slice(2));
  return { text: d, tone: n < 0 ? "gray" : n <= 7 ? "red" : n <= 30 ? "amber" : "blue" };
}

export const disputeOptions = [{ value: "", label: "선택 안 함" }, ...DISPUTES.map((d) => ({ value: d.id, label: d.name }))];
export const stageOptions = [{ value: "", label: "선택 안 함" }, ...STAGES.map((s) => ({ value: s, label: s }))];

/** 휴대폰 캘린더에 넣는 .ics (알림: 7일 전·1일 전) */
export function buildIcs(items: { s: Schedule; caseTitle: string }[]) {
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//redev-legal//KO", "CALSCALE:GREGORIAN"];
  for (const { s, caseTitle } of items) {
    const d = s.date.replace(/-/g, "");
    const n = new Date(s.date + "T00:00:00"); n.setDate(n.getDate() + 1);
    const end = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`;
    lines.push("BEGIN:VEVENT", `UID:${s.id}@redev-legal`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${esc(`[${s.kind}] ${s.title}`)}`, `DESCRIPTION:${esc(`사건: ${caseTitle}${s.basis ? `\n근거: ${s.basis}` : ""}${s.memo ? `\n메모: ${s.memo}` : ""}\n법정 기한은 공휴일·송달일을 전문가와 확인하세요.`)}`);
    if (s.kind === "기한") lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:기한 7일 전", "TRIGGER:-P7D", "END:VALARM");
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:하루 전", "TRIGGER:-P1D", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
}

export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ───── 백업·복원 (증거 원본 파일 포함) ───── */
type Backup = { app: "redev-legal"; version: 1; exportedAt: string; db: DB; files: Record<string, { type: string; data: string }> };

const toB64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(b); });
const fromB64 = (s: string, type: string) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type }); };

export async function exportBackup(withFiles: boolean) {
  const db = getDB();
  const files: Backup["files"] = {};
  let missing = 0;
  if (withFiles) {
    for (const c of db.cases) for (const e of c.evidence) {
      const b = await getFile(c.id, e.id);
      if (b) files[`${c.id}/${e.id}`] = { type: b.type || e.type, data: await toB64(b) }; else missing++;
    }
  }
  const data: Backup = { app: "redev-legal", version: 1, exportedAt: new Date().toISOString(), db, files };
  return { blob: new Blob([JSON.stringify(data)], { type: "application/json" }), fileCount: Object.keys(files).length, missing };
}

export async function readBackup(file: File) {
  const j = JSON.parse(await file.text()) as Backup;
  if (j.app !== "redev-legal" || !j.db) throw new Error("이 앱의 백업 파일이 아닙니다.");
  return j;
}
export async function restoreFiles(j: Backup) {
  for (const [k, v] of Object.entries(j.files || {})) { const [cid, eid] = k.split("/"); await putFile(cid, eid, fromB64(v.data, v.type)); }
}
export async function clearAllFiles() {
  for (const k of await keys()) if (String(k).startsWith("case:")) await del(k);
}
export async function usedStorage() {
  try { const e = await navigator.storage?.estimate?.(); return e ? { used: e.usage || 0, quota: e.quota || 0 } : null; } catch { return null; }
}
export type { Evidence };
export async function clearCaseFiles(c: Case) {
  const { delFile } = await import("./store");
  for (const e of c.evidence) await delFile(c.id, e.id);
}
