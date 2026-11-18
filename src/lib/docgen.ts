import { lawById, type DocTemplate } from "./data";
import { maskSensitive } from "./analyze";

export function missingFields(t: DocTemplate, v: Record<string, string>) {
  return t.fields.filter((f) => f.required && !v[f.key]?.trim()).map((f) => f.label);
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

export function buildBody(t: DocTemplate, raw: Record<string, string>, lawIds: string[]) {
  const v = Object.fromEntries(Object.entries(raw).map(([k, val]) => [k, maskSensitive(val || "")]));
  const laws = lawIds.map(lawById).filter(Boolean);
  const lines: string[] = [];
  lines.push(t.title);
  lines.push("");
  lines.push(`수 신 : ${v.recipient || "(수신자)"}`);
  lines.push(`발 신 : ${v.author || "(작성자)"}  (주소: ${v.authorAddress || "-"}${v.authorContact ? ", 연락처: " + v.authorContact : ""})`);
  lines.push(`사 업 : ${v.projectName || "-"}`);
  if (v.eventDate) lines.push(`사건 발생일 : ${v.eventDate}`);
  lines.push("");
  lines.push("1. 사건 개요");
  lines.push(t.intro(v));
  lines.push("");
  lines.push("2. 사실관계");
  (v.facts || "").split(/\n+/).filter(Boolean).forEach((s, i) => lines.push(`  ${i + 1}) ${s.trim()}`));
  if (v.materials) {
    lines.push("");
    lines.push("3. 요청 자료");
    v.materials.split(/\n+/).filter(Boolean).forEach((s, i) => lines.push(`  ${i + 1}) ${s.trim()}`));
    if (v.usePurpose) lines.push(`  - 사용 목적: ${v.usePurpose}`);
    if (v.method) lines.push(`  - 공개 방법: ${v.method}`);
  }
  if (v.claimItems) {
    lines.push("");
    lines.push("3. 청구 항목");
    v.claimItems.split(/\n+/).filter(Boolean).forEach((s, i) => lines.push(`  ${i + 1}) ${s.trim()}`));
  }
  if (v.questions) {
    lines.push("");
    lines.push("3. 전문가 검토 질문");
    v.questions.split(/\n+/).filter(Boolean).forEach((s, i) => lines.push(`  Q${i + 1}. ${s.trim()}`));
  }
  lines.push("");
  lines.push(`${lines.some((l) => l.startsWith("3.")) ? "4" : "3"}. 법률적 근거`);
  if (laws.length) laws.forEach((l) => lines.push(`  - 「${l!.law}」 ${l!.article}(${l!.title}): ${l!.summary}`));
  else lines.push("  - (선택한 법률 근거 없음 — 필요 시 추가하세요)");
  lines.push("");
  const n = lines.filter((l) => /^\d\. /.test(l)).length + 1;
  lines.push(`${n}. ${t.requestHeading}`);
  (v.requests || "").split(/\n+/).filter(Boolean).forEach((s, i) => lines.push(`  ${i + 1}) ${s.trim()}`));
  lines.push("");
  lines.push(`${n + 1}. 첨부자료`);
  const att = (v.attachments || "").split(/\n+/).filter(Boolean);
  if (att.length) att.forEach((s, i) => lines.push(`  ${i + 1}. ${s.trim()}`));
  else lines.push("  없음");
  lines.push("");
  lines.push(today());
  lines.push("");
  lines.push(`작성자 ${v.author || "         "}  (서명 또는 인)`);
  return lines.join("\n");
}

export async function downloadDocx(title: string, body: string, expert: boolean) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
  const rows = body.split("\n");
  const children = rows.map((line, i) => {
    if (i === 0)
      return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: line, bold: true, size: 36, font: "맑은 고딕" })] });
    const heading = /^\d+\. /.test(line);
    return new Paragraph({
      spacing: { after: 80, before: heading ? 200 : 0 },
      alignment: /^\d{4}\. /.test(line) || line.startsWith("작성자") ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: line, bold: heading, size: 22, font: "맑은 고딕" })],
    });
  });
  if (expert)
    children.unshift(new Paragraph({ children: [new TextRun({ text: "※ AI 초안 — 제출 전 변호사 등 전문가 검토 필요", color: "B42318", size: 18, font: "맑은 고딕" })] }));
  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${title}.docx`);
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// PDF: 인쇄 창을 열어 'PDF로 저장' (한글 글꼴 깨짐 없이 저장되는 방식)
export function printPdf(title: string, body: string, expert: boolean) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 눌러 주세요.");
    return;
  }
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const [first, ...rest] = body.split("\n");
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page{size:A4;margin:22mm 20mm}body{font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif;font-size:11pt;line-height:1.7;color:#111}
h1{text-align:center;font-size:18pt;margin:0 0 18pt}pre{white-space:pre-wrap;font-family:inherit;margin:0}.warn{color:#b42318;font-size:9pt;border:1px solid #f3c4bf;padding:6px 8px;margin-bottom:12pt}</style></head>
<body>${expert ? '<div class="warn">※ AI 초안 — 제출 전 변호사 등 전문가 검토 필요</div>' : ""}<h1>${esc(first)}</h1><pre>${esc(rest.join("\n").trim())}</pre>
<script>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
}
