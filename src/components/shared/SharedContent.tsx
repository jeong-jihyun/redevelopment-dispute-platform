"use client";
import { dday } from "@/lib/analyze";
import type { SharedCase } from "@/lib/cloud";
import { fmtDate } from "@/lib/store";
import { Alert, Badge, CardGrid, CaseCard, DataTable, Empty, Panel, Section, type Tone } from "@/components/ui";

const ddTone = (d: string, done?: boolean): Tone => {
  if (done) return "green";
  const n = d === "D-Day" ? 0 : d.startsWith("D-") ? Number(d.slice(2)) : -Number(d.slice(2));
  return n < 0 ? "gray" : n <= 7 ? "red" : n <= 30 ? "amber" : "blue";
};

export default function SharedContent({ c }: { c: SharedCase }) {
  const s = c.snapshot;
  const none = !s.overview && !s.description && !s.schedules && !s.evidence && !s.laws;
  return (
    <>
      <Alert tone="info" title="일부 공개">사건 주인이 고른 내용만 보입니다. 증거 원본 파일과 AI 상담 내용은 공유되지 않습니다. 공유 시각: {fmtDate(s.publishedAt || c.updated_at)}</Alert>
      {none && <Empty>공개된 내용이 없습니다. 커뮤니티와 동의서는 이용할 수 있습니다.</Empty>}

      {s.overview && (
        <Section title="사건 개요" kicker="OVERVIEW">
          <DataTable head={["항목", "내용"]} rows={[
            ["사건명", s.overview.title], ["사업명", s.overview.projectName], ["사업 유형", s.overview.businessType], ["사업 지역", s.overview.region],
            ["사업 단계", s.overview.stage || "-"], ["분쟁 유형", s.overview.dispute || "-"], ["진행 상태", s.overview.status], ["사건 발생일", s.overview.eventDate || "-"],
          ]} />
        </Section>
      )}
      {s.description && (
        <Section title="사건 설명" kicker="FACTS">
          <Panel><p className="t-body whitespace-pre-wrap">{s.description}</p></Panel>
        </Section>
      )}
      {s.schedules && (
        <Section title="일정·기한" desc="가까운 날짜 순서" kicker="SCHEDULE">
          {s.schedules.length === 0 ? <Empty>등록된 일정이 없습니다.</Empty> : (
            <CardGrid>
              {s.schedules.map((x, i) => {
                const d = dday(x.date);
                return <CaseCard key={i} badges={[{ text: x.kind, tone: x.kind === "기한" ? "amber" : "blue" }, { text: x.done ? "완료" : d, tone: ddTone(d, x.done) }]} title={x.title} desc={x.basis} meta={x.date} />;
              })}
            </CardGrid>
          )}
        </Section>
      )}
      {s.evidence && (
        <Section title="증거 목록" desc="목록만 공개 · 원본 파일은 사건 주인이 보관" kicker="EVIDENCE">
          {s.evidence.length === 0 ? <Empty>등록된 자료가 없습니다.</Empty> : (
            <>
              <div className="grid gap-3 tab:hidden">
                {s.evidence.map((e) => <CaseCard key={e.number} badges={[{ text: e.number, tone: "blue" }, { text: e.review || "미검토", tone: e.review === "확인 완료" ? "green" : e.review === "검토 필요" ? "amber" : "gray" }]} title={e.name} desc={e.category} meta={`기준일 ${e.docDate || fmtDate(e.createdAt)}`} />)}
              </div>
              <div className="hidden tab:block">
                <DataTable head={["번호", "자료명", "자료 유형", "기준일", "검토 상태"]} rows={s.evidence.map((e) => [e.number, e.name, e.category, e.docDate || fmtDate(e.createdAt), <Badge key="b" tone={e.review === "확인 완료" ? "green" : e.review === "검토 필요" ? "amber" : "gray"}>{e.review || "미검토"}</Badge>])} />
              </div>
            </>
          )}
        </Section>
      )}
      {s.laws && (
        <Section title="근거 법령" kicker="LEGAL EVIDENCE">
          {s.laws.length === 0 ? <Empty>연결된 조문이 없습니다.</Empty> : (
            <div className="grid gap-3.5 tab:grid-cols-2">
              {s.laws.map((l, i) => (
                <Panel key={i}><p className="t-title">「{l.short}」 {l.article} {l.title}</p><p className="t-desc mt-1">{l.summary}</p></Panel>
              ))}
            </div>
          )}
        </Section>
      )}
      {s.docs && s.docs.length > 0 && (
        <Section title="공유된 서류" desc="눌러서 내용 보기" kicker="DOCUMENTS">
          <div className="grid gap-3">
            {s.docs.map((d, i) => (
              <Panel key={i}>
                <details>
                  <summary className="t-title cursor-pointer list-none">{d.title} <span className="t-meta">· v{d.version} · {fmtDate(d.updatedAt)}</span></summary>
                  <p className="t-body mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap border-t border-line pt-3">{d.body}</p>
                </details>
              </Panel>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
