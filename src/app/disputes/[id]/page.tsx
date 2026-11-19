"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PRECEDENTS, STAGES, disputeById, lawById, templateById } from "@/lib/data";
import {
  ActionPanel, Alert, CardGrid, CaseCard, Disclaimer, Empty, LawCard, ListPanel, Page, PageHeader, PrecCard, Section, StepList, TopBar, btnCls,
} from "@/components/ui";

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const d = disputeById(id);
  if (!d) return (<><TopBar title="분쟁 유형" back /><Page><Empty>없는 분쟁 유형입니다.</Empty></Page></>);
  const precs = PRECEDENTS.filter((p) => p.disputes.includes(d.id));
  return (
    <>
      <TopBar title={d.short} crumb="분쟁 대응" back />
      <Page wide>
        <PageHeader eyebrow="Dispute guide" title={d.name} lead={d.overview}
          badges={d.stages.map((s) => ({ text: `${s}단계 · ${STAGES[s - 1]}`, tone: "blue" as const }))} />

        <Section title="대응 절차" desc="일반적인 순서이며 사건에 따라 달라질 수 있습니다" kicker="PROCEDURE">
          <StepList items={d.procedure.map((p) => ({ title: p }))} />
          <Alert tone="warn" title="기한 주의">처분·통지를 받은 날짜를 먼저 기록해 두세요. 대부분의 불복 기한은 그날부터 계산됩니다.</Alert>
        </Section>

        <Section title="주요 발생 원인과 준비할 자료" kicker="CHECKLIST">
          <CardGrid>
            <ListPanel title="주요 발생 원인" items={d.causes} />
            <ListPanel title="준비할 증거자료" items={d.evidence} badge={{ text: `${d.evidence.length}종`, tone: "blue" }} />
          </CardGrid>
        </Section>

        <Section title="관련 법령" desc="요약과 원문을 구분해 표시합니다" kicker="LEGAL EVIDENCE">
          <CardGrid>{d.laws.map((lid) => lawById(lid)).filter(Boolean).map((l) => <LawCard key={l!.id} l={l!} />)}</CardGrid>
        </Section>

        <Section title="관련 판례">
          {precs.length ? <CardGrid>{precs.map((p) => <PrecCard key={p.id} p={p} />)}</CardGrid>
            : <Empty>확인된 대표 판례가 아직 없습니다. 법률 자료 메뉴에서 국가법령정보센터 검색을 이용하세요.</Empty>}
        </Section>

        <Section title="관련 서류">
          <CardGrid cols={3}>
            {d.docs.map((tid) => templateById(tid)!).map((t) => (
              <CaseCard key={t.id} href={`/docs/${t.id}`} badges={[{ text: t.category, tone: "blue" }, t.expertReview ? { text: "전문가 검토", tone: "purple" } : { text: "바로 작성", tone: "green" }]}
                title={t.name} desc={t.desc} meta={`입력 항목 ${t.fields.length}개`} action="작성하기" />
            ))}
          </CardGrid>
        </Section>

        <Section title="이 유형으로 상담하기" kicker="NEXT ACTION">
          <ActionPanel title="내 상황을 이 유형 기준으로 분석" desc="사업 단계·내 지위를 확인한 뒤 쟁점과 대응 방법을 정리합니다."
            action={<Link href={`/ai?topic=${d.id}`} className={btnCls("primary")}>AI 상담 시작</Link>} />
        </Section>
        <Disclaimer />
      </Page>
    </>
  );
}
