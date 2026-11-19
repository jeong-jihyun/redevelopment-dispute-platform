"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { downloadDocx } from "@/lib/docgen";
import { ACCEPT, EVIDENCE_CATEGORIES, MAX_FILE, fileKind, guessCategory, nextEvidenceNo, reviewBadge } from "@/lib/cases";
import { fmtDate, fmtSize, logCase, now, putFile, sha256, uid, update, type Case } from "@/lib/store";
import { ActionPanel, Alert, Badge, Btn, CaseCard, DataTable, Empty, Loading, Panel, Section, SelectField, btnCls } from "@/components/ui";

export default function EvidenceTab({ c }: { c: Case }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "danger"; text: string } | null>(null);
  const [cat, setCat] = useState("");
  const [trash, setTrash] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const tooBig = list.filter((f) => f.size > MAX_FILE);
    const ok = list.filter((f) => f.size <= MAX_FILE);
    let done = 0; const failed: string[] = [];
    for (const f of ok) {
      setBusy(`${done + 1}/${ok.length} 올리는 중 · ${f.name}`);
      try {
        const hash = await sha256(f);
        const dup = c.evidence.find((e) => e.hash === hash && !e.deletedAt);
        const evId = uid();
        await putFile(c.id, evId, f);
        update((d) => {
          const cs = d.cases.find((x) => x.id === c.id)!;
          const at = now();
          const number = nextEvidenceNo(cs);
          cs.evidence.push({ id: evId, name: f.name, type: f.type || fileKind(f.name, ""), size: f.size, category: guessCategory(f.name, f.type), number, hash,
            createdAt: at, updatedAt: at, createdBy: d.profile?.name || "나", access: "참여자 전체", review: "미검토", versions: [{ at, hash, note: "처음 등록" }] });
          logCase(cs, `증거 등록 · ${number} ${f.name}${dup ? ` (${dup.number}와 같은 파일)` : ""}`);
        });
        done++;
      } catch { failed.push(f.name); }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    const parts = [`${done}건을 올렸습니다.`];
    if (tooBig.length) parts.push(`50MB가 넘는 ${tooBig.length}건(${tooBig.map((f) => f.name).join(", ")})은 올리지 않았습니다.`);
    if (failed.length) parts.push(`저장 공간 부족 등으로 ${failed.length}건을 저장하지 못했습니다.`);
    setMsg({ tone: tooBig.length || failed.length ? "warn" : "info", text: parts.join(" ") });
  }

  async function exportList() {
    const live = c.evidence.filter((e) => !e.deletedAt);
    const body = [
      "증거자료 목록", "", `사건: ${c.title}`, `사업: ${c.projectName}`, `작성일: ${new Date().toLocaleDateString("ko-KR")}`, "",
      ...live.map((e) => `${e.number}  ${e.name}\n   분류: ${e.category} · 작성일: ${e.docDate || "-"} · 등록일: ${fmtDate(e.createdAt)}\n   원본 확인값(SHA-256): ${e.hash}${e.memo ? `\n   입증 취지: ${e.memo}` : ""}`),
      "", "※ 원본 확인값은 파일이 바뀌지 않았음을 확인하는 값입니다. 같은 파일이면 같은 값이 나옵니다.",
    ].join("\n");
    await downloadDocx(`증거목록_${c.title.replace(/[\\/:*?"<>|]/g, "")}`, body, false);
    update((d) => { const cs = d.cases.find((x) => x.id === c.id)!; logCase(cs, "증거 목록(Word) 내려받기"); });
  }

  const rows = c.evidence.filter((e) => (trash ? !!e.deletedAt : !e.deletedAt)).filter((e) => !cat || e.category === cat);
  const trashN = c.evidence.filter((e) => e.deletedAt).length;
  const expired = c.evidence.filter((e) => !e.deletedAt && e.retentionUntil && e.retentionUntil < new Date().toISOString().slice(0, 10));
  const href = (eid: string) => `/cases/${c.id}/evidence/${eid}`;

  return (
    <>
      <div className="mt-5">
        <ActionPanel title="증거자료 올리기" desc="PDF·Word·Excel·사진·음성·영상·텍스트, 파일당 50MB까지. 올릴 때 원본 확인값(SHA-256)이 자동 기록됩니다."
          action={
            <>
              <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => upload(e.target.files)} aria-label="증거 파일 고르기" />
              <button type="button" className={btnCls("primary")} disabled={!!busy} onClick={() => input.current?.click()}>파일 올리기</button>
            </>
          } />
      </div>
      {busy && <Loading>{busy}</Loading>}
      {msg && <Alert tone={msg.tone} title="올리기 결과">{msg.text}</Alert>}
      {expired.length > 0 && <Alert tone="warn" title="보관 종료일 지남">{expired.map((e) => e.number).join(", ")}의 보관 종료 예정일이 지났습니다. 계속 보관할지 정해 주세요.</Alert>}

      <Section title={trash ? "삭제한 자료" : "증거자료 목록"} desc={trash ? "복구하거나 완전히 지울 수 있습니다" : "번호는 올린 순서대로 자동으로 붙습니다"} kicker="EVIDENCE">
        <div className="grid grid-cols-2 gap-2.5 tab:max-w-[520px]">
          <SelectField label="자료 분류" value={cat} onChange={setCat} options={[{ value: "", label: "전체" }, ...EVIDENCE_CATEGORIES.map((x) => ({ value: x, label: x }))]} />
          <SelectField label="보기" value={trash ? "trash" : "live"} onChange={(v) => setTrash(v === "trash")} options={[{ value: "live", label: "보관 중" }, { value: "trash", label: `삭제한 자료 (${trashN})` }]} />
        </div>
        {rows.length === 0 ? <Empty>{trash ? "삭제한 자료가 없습니다." : "올린 자료가 없습니다. 회의록·통지서·사진 등을 올려 주세요."}</Empty> : (
          <>
            {/* 폰: 카드형 데이터 / 태블릿 이상: 표 (디자인 시스템 반응형 원칙) */}
            <div className="grid gap-3 tab:hidden">
              {rows.map((e) => (
                <CaseCard key={e.id} href={href(e.id)} badges={[{ text: e.number, tone: "blue" }, e.deletedAt ? { text: "삭제됨", tone: "gray" } : reviewBadge(e.review)]}
                  title={e.name} desc={`${e.category} · ${fileKind(e.name, e.type)} · ${fmtSize(e.size)}${e.legalHold ? " · 법적 보존" : ""}`}
                  meta={`등록 ${fmtDate(e.createdAt)}${e.docDate ? ` · 작성 ${e.docDate}` : ""}`} action="상세 보기" />
              ))}
            </div>
            <div className="hidden tab:block">
              <DataTable head={["번호", "자료명", "자료 유형", "기준일", "검토 상태", "관리"]} rows={rows.map((e) => [
                e.number, e.name, e.category, e.docDate || fmtDate(e.createdAt),
                e.deletedAt ? <Badge key="s" tone="gray">삭제됨</Badge> : <Badge key="s" tone={reviewBadge(e.review).tone}>{reviewBadge(e.review).text}</Badge>,
                <Link key="l" href={href(e.id)} className="t-label">상세 보기 →</Link>,
              ])} />
            </div>
          </>
        )}
        {!trash && c.evidence.some((e) => !e.deletedAt) && (
          <Panel className="mt-3.5">
            <p className="t-title">증거 목록 내려받기</p>
            <p className="t-desc">번호·자료명·분류·작성일·원본 확인값을 정리한 Word 파일입니다. 소장·의견서에 첨부할 때 씁니다.</p>
            <div className="mt-3"><Btn kind="secondary" onClick={exportList}>증거 목록 Word로 저장</Btn></div>
          </Panel>
        )}
      </Section>
    </>
  );
}
