"use client";
import type { ConsentForm, Signature } from "./cloud";

const esc = (s: string) => s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!));

/** 동의서 + 서명 현황을 인쇄 창으로 연다 (PDF로 저장 가능). 팝업이 막히면 false */
export function printConsent({ f, sigs, caseTitle, unsignedCount, when }: { f: ConsentForm; sigs: Signature[]; caseTitle: string; unsignedCount: number; when: (t: string) => string }) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const agree = sigs.filter((s) => s.decision === "agree").length;
  const rows = sigs.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.signer_name)}</td><td>${s.decision === "agree" ? "동의" : "반대"}</td><td><img src="${s.signature}" style="height:48px"></td><td>${esc(when(s.signed_at))}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(f.title)} 동의 현황</title><style>body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;padding:28px;color:#111}h1{font-size:20px}pre{white-space:pre-wrap;font-family:inherit;border:1px solid #ccc;padding:14px;line-height:1.7}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}td,th{border:1px solid #999;padding:6px;text-align:center}small{color:#555}</style></head><body>
<h1>${esc(f.title)}</h1><small>사건: ${esc(caseTitle)} · 작성: ${esc(f.author_name)} ${esc(when(f.created_at))}${f.deadline ? ` · 기한 ${f.deadline}` : ""}</small>
<pre>${esc(f.body)}</pre><small>본문 확인값(SHA-256): ${f.body_hash}</small>
<h2 style="font-size:16px;margin-top:22px">서명 현황 — 동의 ${agree}명 · 반대 ${sigs.length - agree}명 · 미서명 ${unsignedCount}명</h2>
<table><thead><tr><th>번호</th><th>이름</th><th>의사</th><th>서명</th><th>서명 일시</th></tr></thead><tbody>${rows || '<tr><td colspan="5">서명 없음</td></tr>'}</tbody></table>
<p><small>이 문서는 재개발 분쟁 도우미에서 출력했습니다. 각 서명은 로그인한 계정으로 남겼고, 서명 당시 본문 확인값이 위 값과 같을 때만 저장되었습니다.</small></p>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
  return true;
}
