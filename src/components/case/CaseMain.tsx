"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LAWS, PRECEDENTS, TEMPLATES, disputeById, lawById, templateById } from "@/lib/data";
import { CASE_STATUSES, caseProgress, clearCaseFiles } from "@/lib/cases";
import { fmtDate, logCase, update, useDB, type Case } from "@/lib/store";
import {
  ActionPanel, Alert, Btn, CardGrid, CaseCard, CheckRow, DataTable, Empty, LawCard, MetricCard, Panel, PrecCard, Section, SelectField, StepList, TextBtn, btnCls,
} from "@/components/ui";

const edit = (id: string, fn: (c: Case) => void, log?: string) =>
  update((db) => { const c = db.cases.find((x) => x.id === id); if (c) { fn(c); if (log) logCase(c, log); } });

/* ───── 사건 개요 ───── */
export function OverviewTab({ c, docCount, go }: { c: Case; docCount: number; go: (t: string) => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const steps = caseProgress(c, docCount);
  const doneN = steps.filter((s) => s.badge.text === "완료").length;
  const next = steps.find((s) => s.badge.text !== "완료");
  const nextAction: Record<string, [string, string]> = {
    overview: ["사건 설명 채우기", `/cases/new?edit=${c.id}`], analysis: ["이 사건으로 AI 상담", `/ai?case=${c.id}`],
    docs: ["서류 작성하기", `/docs?case=${c.id}`], schedule: ["기한 등록하기", `/cases/${c.id}?tab=schedule`],
  };
  const held = c.evidence.filter((e) => e.legalHold && !e.deletedAt).length;

  async function remove() {
    await clearCaseFiles(c);
    update((db) => {
      db.cases = db.cases.filter((x) => x.id !== c.id);
      db.docs.forEach((d) => { if (d.caseId === c.id) d.caseId = undefined; });
      db.conversations.forEach((x) => { if (x.caseId === c.id) x.caseId = undefined; });
      db.access.unshift({ at: new Date().toISOString(), who: db.profile?.name || "나", action: `사건 삭제 · ${c.title}` });
    });
    router.replace("/cases");
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-3 gap-2.5 tab:gap-3.5">
        <MetricCard n={`${doneN}/4`} title="진행 단계" label="완료한 단계" />
        <MetricCard n={String(c.evidence.filter((e) => !e.deletedAt).length)} title="등록 자료" label="증거자료" />
        <MetricCard n={String(docCount)} title="작성 문서" label="연결된 서류" />
      </div>

      <Section title="진행 단계" desc="누르면 해당 탭으로 이동합니다" kicker="PROGRESS">
        <StepList items={steps.map((s) => ({ title: s.title, desc: s.desc, badge: s.badge, onClick: () => go(s.tab) }))} />
      </Section>
      {next && nextAction[next.tab] && (
        <ActionPanel title={`다음 할 일 · ${next.title}`} desc={next.desc}
          action={<Link href={nextAction[next.tab][1]} className={btnCls("primary")}>{nextAction[next.tab][0]}</Link>} />
      )}

      <Section title="사건 정보" kicker="CASE INFO" more={{ href: `/cases/new?edit=${c.id}`, label: "수정" }}>
        <DataTable head={["항목", "내용"]} rows={[
          ["사업명", c.projectName], ["사업 유형", c.businessType], ["사업 지역", c.region], ["사업 단계", c.stage || "-"],
          ["이용자 지위", c.role || "-"], ["분쟁 유형", disputeById(c.disputeType)?.name || "-"], ["사건 발생일", c.eventDate || "-"],
          ["만든 날", fmtDate(c.createdAt)], ["최근 수정", fmtDate(c.updatedAt)],
        ]} />
        <Panel className="mt-3.5">
          <p className="t-label mb-1.5">사건 설명</p>
          <p className="t-body whitespace-pre-wrap">{c.description || "아직 적지 않았습니다. ‘수정’에서 언제, 누가, 무엇을 했는지 적어 주세요."}</p>
        </Panel>
        <div className="mt-3.5 max-w-[360px]">
          <SelectField label="진행 상태" value={c.status} onChange={(v) => edit(c.id, (x) => { x.status = v; }, `진행 상태 변경 → ${v}`)}
            options={CASE_STATUSES.map((s) => ({ value: s.name, label: s.name }))} />
        </div>
      </Section>

      <Section title="사건 삭제" kicker="DANGER">
        <Panel>
          <p className="t-desc">사건과 이 사건의 증거 원본 파일이 이 기기에서 지워지며 되돌릴 수 없습니다. 연결된 서류·상담은 지워지지 않고 연결만 풀립니다.</p>
          {held > 0 && <Alert tone="danger" title="법적 보존 자료">‘법적 보존’으로 표시한 자료가 {held}건 있습니다. 소송·분쟁 중이면 지우기 전에 백업 파일을 먼저 내려받으세요.</Alert>}
          <div className="mt-3 flex flex-wrap gap-[9px]">
            {confirm ? (
              <><Btn kind="danger" onClick={remove}>정말 삭제</Btn><Btn kind="secondary" onClick={() => setConfirm(false)}>취소</Btn></>
            ) : <Btn kind="danger" onClick={() => setConfirm(true)}>사건 삭제</Btn>}
          </div>
        </Panel>
      </Section>
    </>
  );
}

/* ───── 상담 및 법률 분석 ───── */
export function AnalysisTab({ c }: { c: Case }) {
  const db = useDB();
  const linked = db.conversations.filter((x) => x.caseId === c.id);
  const free = db.conversations.filter((x) => !x.caseId);
  const [pick, setPick] = useState("");
  const link = (convId: string, on: boolean) => update((d) => {
    const conv = d.conversations.find((x) => x.id === convId); const cs = d.cases.find((x) => x.id === c.id);
    if (!conv || !cs) return;
    conv.caseId = on ? c.id : undefined; logCase(cs, `${on ? "AI 상담 연결" : "AI 상담 연결 해제"} · ${conv.title}`);
  });
  return (
    <>
      <div className="mt-5">
        <ActionPanel title="이 사건으로 AI 상담" desc="상담 결과가 이 사건에 자동으로 연결됩니다."
          action={<Link href={`/ai?case=${c.id}`} className={btnCls("primary")}>새 상담 시작</Link>} />
      </div>
      <Section title="연결된 상담" kicker="CONSULTATION">
        {linked.length === 0 ? <Empty>연결된 상담이 없습니다.</Empty> : (
          <CardGrid>
            {linked.map((x) => {
              const a = [...x.messages].reverse().find((m) => m.analysis)?.analysis;
              return (
                <CaseCard key={x.id} badges={[{ text: a?.disputes[0]?.name.split(" ")[0] || "분류 전", tone: "blue" }, a ? { text: a.confidence, tone: a.confidence === "근거 충분" ? "green" : "amber" } : { text: "답변 대기", tone: "amber" }]}
                  title={x.title} desc={a?.summary} meta={`최근 업데이트 ${fmtDate(x.updatedAt)}`}
                  footer={<span className="flex shrink-0 items-center gap-3"><TextBtn tone="muted" onClick={() => link(x.id, false)}>연결 해제</TextBtn><Link href={`/ai?c=${x.id}`} className="t-label">상담 보기 →</Link></span>} />
              );
            })}
          </CardGrid>
        )}
      </Section>
      {free.length > 0 && (
        <Section title="기존 상담 연결" desc="사건에 연결되지 않은 상담을 골라 붙입니다" kicker="LINK">
          <Panel>
            <SelectField label="상담 고르기" value={pick} onChange={setPick} options={[{ value: "", label: "선택하세요" }, ...free.map((x) => ({ value: x.id, label: `${x.title} (${fmtDate(x.updatedAt)})` }))]} />
            <Btn kind="secondary" disabled={!pick} onClick={() => { link(pick, true); setPick(""); }}>이 사건에 연결</Btn>
          </Panel>
        </Section>
      )}
    </>
  );
}

/* ───── 관련 법령 및 판례 ───── */
export function LawsTab({ c }: { c: Case }) {
  const db = useDB();
  const d = disputeById(c.disputeType);
  const rec = new Set(d?.laws || []);
  const ordered = [...LAWS].sort((a, b) => Number(rec.has(b.id)) - Number(rec.has(a.id)));
  const fromAnalyses = [...c.analyses.map((x) => x.analysis), ...db.conversations.filter((x) => x.caseId === c.id).flatMap((x) => x.messages.map((m) => m.analysis).filter(Boolean))];
  const precIds = new Set([...PRECEDENTS.filter((p) => d && p.disputes.includes(d.id)).map((p) => p.id), ...fromAnalyses.flatMap((a) => a!.precedents.map((p) => p.id))]);
  const precs = PRECEDENTS.filter((p) => precIds.has(p.id));
  const toggle = (lid: string, on: boolean) => edit(c.id, (x) => { x.lawIds = on ? [...x.lawIds, lid] : x.lawIds.filter((y) => y !== lid); }, `${on ? "근거 법령 추가" : "근거 법령 제외"} · ${lawById(lid)?.short} ${lawById(lid)?.article}`);
  const linked = c.lawIds.map((x) => lawById(x)).filter(Boolean);
  return (
    <>
      <Section title="이 사건의 근거 법령" desc="서류 작성과 기한 계산에 쓰는 조문" kicker="LEGAL EVIDENCE">
        {linked.length === 0 ? <Empty>아직 고른 조문이 없습니다. 아래에서 골라 주세요.</Empty> : <div className="grid gap-3.5 tab:grid-cols-2">{linked.map((l) => <LawCard key={l!.id} l={l!} compact />)}</div>}
      </Section>
      <Section title="조문 고르기" desc={d ? `‘${d.short}’ 분쟁의 추천 조문이 위에 있습니다` : "분쟁 유형을 정하면 추천 조문이 표시됩니다"} kicker="SELECT">
        <Panel className="!py-1">
          {ordered.map((l) => (
            <CheckRow key={l.id} checked={c.lawIds.includes(l.id)} onChange={(v) => toggle(l.id, v)} title={`「${l.short}」 ${l.article} ${l.title}`} desc={l.deadline ? `기한: ${l.deadline.label} ${l.deadline.days}일` : undefined}
              right={rec.has(l.id) ? <span className="t-label text-blue-600">추천</span> : undefined} />
          ))}
        </Panel>
      </Section>
      <Section title="관련 판례" desc="분쟁 유형과 연결된 상담에서 찾은 판례" kicker="PRECEDENT">
        {precs.length === 0 ? <Empty>관련 판례가 없습니다. 법령·판례 화면에서 검색해 보세요.</Empty> : <div className="grid gap-3.5 tab:grid-cols-2">{precs.map((p) => <PrecCard key={p.id} p={p} compact />)}</div>}
      </Section>
    </>
  );
}

/* ───── 문서 ───── */
export function DocsTab({ c }: { c: Case }) {
  const db = useDB();
  const linked = db.docs.filter((d) => d.caseId === c.id);
  const free = db.docs.filter((d) => !d.caseId);
  const [pick, setPick] = useState("");
  const rec = (disputeById(c.disputeType)?.docs || ["t10", "t11"]).map(templateById).filter(Boolean);
  const link = (docId: string, on: boolean) => update((d) => {
    const doc = d.docs.find((x) => x.id === docId); const cs = d.cases.find((x) => x.id === c.id);
    if (!doc || !cs) return;
    doc.caseId = on ? c.id : undefined; logCase(cs, `${on ? "서류 연결" : "서류 연결 해제"} · ${doc.title}`);
  });
  return (
    <>
      <div className="mt-5">
        <ActionPanel title="이 사건의 서류 작성" desc="사업명·발생일·사건 설명·증거 목록이 서류에 미리 채워집니다."
          action={<Link href={`/docs?case=${c.id}`} className={btnCls("primary")}>서류 작성하기</Link>} />
      </div>
      <Section title="연결된 서류" kicker="DOCUMENTS">
        {linked.length === 0 ? <Empty>연결된 서류가 없습니다.</Empty> : (
          <CardGrid>
            {linked.map((d) => (
              <CaseCard key={d.id} badges={[{ text: templateById(d.templateId)?.category || "서류", tone: "blue" }, { text: `버전 ${d.version}`, tone: "gray" }]}
                title={d.title} meta={`최근 수정 ${fmtDate(d.updatedAt)}`}
                footer={<span className="flex shrink-0 items-center gap-3"><TextBtn tone="muted" onClick={() => link(d.id, false)}>연결 해제</TextBtn><Link href={`/docs/${d.templateId}?doc=${d.id}`} className="t-label">열기 →</Link></span>} />
            ))}
          </CardGrid>
        )}
      </Section>
      <Section title="추천 서류" desc="분쟁 유형에 맞는 양식" kicker="TEMPLATES">
        <CardGrid cols={3}>
          {rec.map((t) => (
            <CaseCard key={t!.id} href={`/docs/${t!.id}?case=${c.id}`} badges={[{ text: t!.category, tone: "blue" }, t!.expertReview ? { text: "전문가 검토", tone: "purple" } : { text: "바로 작성", tone: "green" }]}
              title={t!.name} desc={t!.desc} meta={`입력 항목 ${t!.fields.length}개`} action="작성하기" />
          ))}
        </CardGrid>
      </Section>
      {free.length > 0 && (
        <Section title="기존 서류 연결" kicker="LINK">
          <Panel>
            <SelectField label="내 서류 고르기" value={pick} onChange={setPick} options={[{ value: "", label: "선택하세요" }, ...free.map((d) => ({ value: d.id, label: `${d.title} (v${d.version})` }))]} />
            <Btn kind="secondary" disabled={!pick} onClick={() => { link(pick, true); setPick(""); }}>이 사건에 연결</Btn>
          </Panel>
        </Section>
      )}
      <p className="t-meta mt-3">양식 {TEMPLATES.length}종 전체는 서류 작성 메뉴에서 볼 수 있습니다.</p>
    </>
  );
}

/* ───── 활동 이력 ───── */
export function ActivityTab({ c }: { c: Case }) {
  const [n, setN] = useState(30);
  return (
    <Section title="활동 이력" desc="사건에서 일어난 일을 최근 순서로 기록합니다 (지울 수 없음)" kicker="ACTIVITY LOG">
      {c.activity.length === 0 ? <Empty>기록이 없습니다.</Empty> : (
        <>
          <DataTable head={["일시", "한 사람", "내용"]} rows={c.activity.slice(0, n).map((a) => [
            new Date(a.at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), a.who, a.action,
          ])} />
          {c.activity.length > n && <div className="mt-3"><Btn kind="ghost" onClick={() => setN(n + 50)}>더 보기 ({c.activity.length - n}건)</Btn></div>}
        </>
      )}
    </Section>
  );
}
