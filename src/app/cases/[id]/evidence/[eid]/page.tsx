"use client";
/* eslint-disable @next/next/no-img-element -- 기기 안 파일(blob) 미리보기라 next/image를 쓸 수 없음 */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EVIDENCE_ACCESS, EVIDENCE_CATEGORIES, EVIDENCE_REVIEW, MAX_FILE, fileKind, reviewBadge, saveFile } from "@/lib/cases";
import { delFile, fmtDate, fmtSize, getFile, logCase, now, putFile, sha256, update, useDB, useMounted, type Evidence } from "@/lib/store";
import {
  Alert, Btn, CheckRow, DataTable, Disclaimer, Empty, Field, Loading, Page, PageHeader, Panel, Section, SelectField, SubPanel, TopBar, btnCls, inputCls, runBusy,
} from "@/components/ui";

export default function EvidenceDetail() {
  const { id, eid } = useParams<{ id: string; eid: string }>();
  const router = useRouter();
  const db = useDB();
  const mounted = useMounted();
  const c = db.cases.find((x) => x.id === id);
  const e = c?.evidence.find((x) => x.id === eid);
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [fileMissing, setFileMissing] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "danger"; title: string; text: string } | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "purge" | null>(null);
  const [form, setForm] = useState<Partial<Evidence>>({});
  const [dirty, setDirty] = useState(false);
  const replaceInput = useRef<HTMLInputElement>(null);
  const ver = e?.versions.length;

  useEffect(() => {
    if (!e) return;
    setForm({ category: e.category, review: e.review || "미검토", docDate: e.docDate || "", retentionUntil: e.retentionUntil || "", access: e.access, legalHold: !!e.legalHold, memo: e.memo || "" });
    setDirty(false);
  }, [e?.id, e?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!e || e.deletedAt) return;
    let u: string | null = null;
    getFile(id, eid).then(async (b) => {
      if (!b) { setFileMissing(true); return; }
      u = URL.createObjectURL(b); setUrl(u);
      if (fileKind(e.name, e.type) === "텍스트") setText((await b.text()).slice(0, 20000));
    });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id, eid, ver, e?.deletedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c || !e) {
    return (<><TopBar title="증거자료" back={`/cases/${id}?tab=evidence`} /><Page>{mounted && <Empty>자료를 찾을 수 없습니다. 이 사건에 등록된 자료만 볼 수 있습니다.</Empty>}</Page></>);
  }
  const kind = fileKind(e.name, e.type);
  const log = (action: string) => update((d) => { const cs = d.cases.find((x) => x.id === id)!; logCase(cs, action); d.access.unshift({ at: now(), who: d.profile?.name || "나", action: `${cs.title} · ${action}` }); });
  const patch = (fn: (x: Evidence) => void, action: string) => update((d) => {
    const cs = d.cases.find((x) => x.id === id)!; const ev = cs.evidence.find((x) => x.id === eid)!;
    fn(ev); ev.updatedAt = now(); logCase(cs, action);
  });

  const download = () => runBusy("내려받는 중", doDownload);
  async function doDownload() {
    const b = await getFile(id, eid);
    if (!b) { setMsg({ tone: "danger", title: "원본 없음", text: "이 기기에 원본 파일이 없습니다. 백업 파일을 불러오면 복구됩니다." }); return; }
    saveFile(b, e!.name); log(`증거 내려받기 · ${e!.number}`);
  }
  const verify = () => runBusy("원본 확인값 계산 중", doVerify);
  async function doVerify() {
    const b = await getFile(id, eid);
    if (!b) { setMsg({ tone: "danger", title: "원본 없음", text: "이 기기에 원본 파일이 없습니다." }); return; }
    const h = await sha256(b);
    const ok = h === e!.hash;
    setMsg(ok ? { tone: "info", title: "원본과 같음", text: "등록할 때 기록한 확인값과 지금 파일의 확인값이 같습니다. 파일이 바뀌지 않았습니다." }
      : { tone: "danger", title: "확인값 다름", text: "등록 당시와 파일 내용이 다릅니다. 변경 이력을 확인하세요." });
    log(`원본 확인 · ${e!.number} · ${ok ? "같음" : "다름"}`);
  }
  function replace(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_FILE) { setMsg({ tone: "warn", title: "파일이 큼", text: "50MB 이하 파일만 올릴 수 있습니다." }); if (replaceInput.current) replaceInput.current.value = ""; return; }
    runBusy("새 버전 올리는 중", () => doReplace(f));
  }
  async function doReplace(f: File) {
    try {
      const h = await sha256(f);
      await putFile(id, eid, f);
      patch((x) => { x.name = f.name; x.type = f.type || x.type; x.size = f.size; x.hash = h; x.versions.push({ at: now(), hash: h, note: `새 버전으로 교체 · ${f.name}` }); }, `증거 새 버전 · ${e!.number} ${f.name}`);
      setMsg({ tone: "info", title: "교체 완료", text: `버전 ${e!.versions.length + 1}로 바꿨습니다. 이전 확인값은 변경 이력에 남아 있습니다.` });
    } catch { setMsg({ tone: "danger", title: "저장 실패", text: "기기 저장 공간이 부족할 수 있습니다." }); }
    if (replaceInput.current) replaceInput.current.value = "";
  }
  function saveForm() {
    runBusy("자료 정보 저장 중", () => {
      patch((x) => Object.assign(x, form), `증거 정보 수정 · ${e!.number}`);
      setDirty(false); setMsg({ tone: "info", title: "저장", text: "자료 정보를 저장했습니다." });
    });
  }
  const purge = () => runBusy("완전 삭제 중", doPurge);
  async function doPurge() {
    await delFile(id, eid);
    update((d) => { const cs = d.cases.find((x) => x.id === id)!; cs.evidence = cs.evidence.filter((x) => x.id !== eid); logCase(cs, `증거 완전 삭제 · ${e!.number} ${e!.name}`); });
    router.replace(`/cases/${id}?tab=evidence`);
  }
  const set = <K extends keyof Evidence>(k: K, v: Evidence[K]) => { setForm((p) => ({ ...p, [k]: v })); setDirty(true); };

  return (
    <>
      <TopBar title={`${e.number} ${e.name}`} crumb={c.title} back={`/cases/${id}?tab=evidence`} />
      <Page>
        <PageHeader eyebrow="EVIDENCE" title={e.number} lead={e.name}
          badges={[{ text: e.category, tone: "blue" }, e.deletedAt ? { text: "삭제됨 · 복구 가능", tone: "gray" } : reviewBadge(e.review), ...(e.legalHold ? [{ text: "법적 보존", tone: "red" as const }] : [])]} />
        {msg && <Alert tone={msg.tone} title={msg.title}>{msg.text}</Alert>}

        {e.deletedAt ? (
          <Section title="삭제한 자료" kicker="TRASH">
            <Panel>
              <p className="t-desc">{fmtDate(e.deletedAt)}에 삭제했습니다. 복구하면 원래 번호 그대로 돌아옵니다. 완전히 지우면 이 기기에서 원본이 사라지고 되돌릴 수 없습니다.</p>
              <div className="mt-3 flex flex-wrap gap-[9px]">
                <Btn onClick={() => runBusy("복구 중", () => patch((x) => { x.deletedAt = undefined; }, `증거 복구 · ${e.number}`))}>복구하기</Btn>
                {confirm === "purge" ? <><Btn kind="danger" onClick={purge}>정말 완전 삭제</Btn><Btn kind="secondary" onClick={() => setConfirm(null)}>취소</Btn></>
                  : <Btn kind="danger" onClick={() => setConfirm("purge")}>완전 삭제</Btn>}
              </div>
            </Panel>
          </Section>
        ) : (
          <>
            <Section title="미리보기" kicker="PREVIEW">
              <Panel>
                {fileMissing ? <Alert tone="danger" title="원본 없음">이 기기에 원본 파일이 없습니다. 다른 기기에서 등록했거나 브라우저 데이터가 지워졌을 수 있습니다. 백업 파일을 불러오면 복구됩니다.</Alert>
                  : !url ? <Loading>불러오는 중</Loading>
                  : kind === "이미지" ? <img src={url} alt={e.name} className="max-h-[70vh] w-full object-contain" />
                  : kind === "PDF" ? <><iframe src={url} title={e.name} className="h-[70vh] w-full border border-line" /><p className="t-meta mt-2">폰에서 첫 장만 보이면 ‘새 창에서 열기’를 누르세요.</p></>
                  : kind === "음성" ? <audio src={url} controls className="w-full" />
                  : kind === "영상" ? <video src={url} controls playsInline className="max-h-[70vh] w-full" />
                  : kind === "텍스트" ? <SubPanel><pre className="t-body max-h-[60vh] overflow-auto whitespace-pre-wrap">{text}</pre></SubPanel>
                  : <p className="t-desc">{kind} 파일은 앱 안에서 미리 볼 수 없습니다. 내려받아 확인하세요.</p>}
                <div className="mt-3 flex flex-wrap gap-[9px]">
                  <Btn onClick={download} className="flex-1 tab:flex-none">내려받기</Btn>
                  {url && (kind === "PDF" || kind === "이미지") && <a href={url} target="_blank" rel="noreferrer" className={btnCls("secondary")} onClick={() => log(`증거 열람 · ${e.number}`)}>새 창에서 열기</a>}
                  <Btn kind="secondary" onClick={verify}>원본 확인</Btn>
                </div>
              </Panel>
            </Section>

            <Section title="자료 정보" desc="분류·검토 상태·보관 기간을 정합니다" kicker="DETAIL">
              <Panel>
                <SelectField label="자료 분류" value={form.category || ""} onChange={(v) => set("category", v)} options={EVIDENCE_CATEGORIES.map((x) => ({ value: x, label: x }))} />
                <SelectField label="검토 상태" value={form.review || "미검토"} onChange={(v) => set("review", v)} options={EVIDENCE_REVIEW.map((x) => ({ value: x.name, label: x.name }))} />
                <Field label="자료 작성일(기준일)" help="회의록이면 회의한 날, 통지서면 받은 날">
                  <input type="date" value={form.docDate || ""} onChange={(ev) => set("docDate", ev.target.value)} className={inputCls} />
                </Field>
                <SelectField label="접근 권한" value={form.access || ""} onChange={(v) => set("access", v)} options={EVIDENCE_ACCESS.map((x) => ({ value: x, label: x }))} />
                <Field label="보관 종료 예정일" help="이 날이 지나면 목록에서 정리하라고 알려 드립니다. 비워 두면 계속 보관합니다.">
                  <input type="date" value={form.retentionUntil || ""} onChange={(ev) => set("retentionUntil", ev.target.value)} className={inputCls} />
                </Field>
                <Field label="입증 취지(메모)" help="이 자료로 무엇을 증명하려는지 한두 문장으로">
                  <textarea value={form.memo || ""} onChange={(ev) => set("memo", ev.target.value)} rows={3} className={`${inputCls} resize-y`} />
                </Field>
                <CheckRow checked={!!form.legalHold} onChange={(v) => set("legalHold", v)} title="법적 보존 자료" desc="소송·분쟁 중인 자료. 삭제하려 하면 경고합니다." />
                <div className="mt-3"><Btn kind="secondary" disabled={!dirty} onClick={saveForm}>{dirty ? "정보 저장" : "저장됨"}</Btn></div>
              </Panel>
            </Section>
          </>
        )}

        <Section title="파일 정보" kicker="METADATA">
          <DataTable head={["항목", "내용"]} rows={[
            ["파일명", e.name], ["파일 유형", `${kind} (${e.type || "-"})`], ["파일 크기", fmtSize(e.size)], ["증거 번호", e.number],
            ["등록자", e.createdBy], ["등록일", fmtDate(e.createdAt)], ["수정일", fmtDate(e.updatedAt)], ["삭제 상태", e.deletedAt ? `삭제됨 (${fmtDate(e.deletedAt)})` : "보관 중"],
            ["원본 확인값 (SHA-256)", <code key="h" className="t-meta break-all">{e.hash}</code>],
          ]} />
        </Section>

        <Section title="변경 이력" desc="파일을 바꿀 때마다 확인값이 남습니다" kicker="VERSIONS">
          <DataTable head={["버전", "일시", "내용", "확인값 앞 12자리"]} rows={e.versions.map((v, i) => [
            `v${i + 1}`, new Date(v.at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), v.note, v.hash.slice(0, 12),
          ])} />
        </Section>

        <Section title="접근 이력" desc="이 자료를 열람·내려받기·수정한 기록" kicker="ACCESS LOG">
          {(() => {
            const logs = c.activity.filter((a) => a.action.includes(e.number));
            return logs.length ? <DataTable head={["일시", "한 사람", "내용"]} rows={logs.slice(0, 30).map((a) => [new Date(a.at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), a.who, a.action])} /> : <Empty>기록이 없습니다.</Empty>;
          })()}
        </Section>

        {!e.deletedAt && (
          <Section title="파일 교체·삭제" kicker="MANAGE">
            <Panel>
              <input ref={replaceInput} type="file" className="hidden" onChange={(ev) => replace(ev.target.files?.[0])} aria-label="새 버전 파일" />
              <p className="t-desc">새 버전으로 바꿔도 번호는 그대로이고, 이전 확인값은 변경 이력에 남습니다. 삭제하면 ‘삭제한 자료’로 옮겨지고 복구할 수 있습니다.</p>
              {confirm === "delete" && e.legalHold && <Alert tone="danger" title="법적 보존 자료">소송·분쟁 중 보존이 필요한 자료로 표시되어 있습니다. 정말 삭제하려면 한 번 더 누르세요.</Alert>}
              <div className="mt-3 flex flex-wrap gap-[9px]">
                <Btn kind="secondary" onClick={() => replaceInput.current?.click()}>새 버전으로 교체</Btn>
                {confirm === "delete" ? (
                  <><Btn kind="danger" onClick={() => runBusy("삭제 중", () => { patch((x) => { x.deletedAt = now(); }, `증거 삭제(복구 가능) · ${e.number}`); setConfirm(null); })}>삭제 확인</Btn><Btn kind="secondary" onClick={() => setConfirm(null)}>취소</Btn></>
                ) : <Btn kind="danger" onClick={() => setConfirm("delete")}>삭제</Btn>}
              </div>
            </Panel>
          </Section>
        )}
        <div className="mt-4"><Link href={`/cases/${id}?tab=evidence`} className={btnCls("ghost")}>← 증거자료 목록</Link></div>
        <Disclaimer />
      </Page>
    </>
  );
}
