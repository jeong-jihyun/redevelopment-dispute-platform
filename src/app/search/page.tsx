"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DISPUTES, templateById } from "@/lib/data";
import { scoreDisputes, searchLaws, searchPrecedents } from "@/lib/analyze";
import {
  ActionPanel, Alert, CardGrid, CaseCard, Disclaimer, Empty, LawCard, Page, PrecCard, SearchHero, Section, StepList, TopBar, btnCls,
} from "@/components/ui";
import LiveLawSearch from "@/components/LiveLawSearch";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") || "";
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const disputes = scoreDisputes(q).slice(0, 3).map((x) => x.d);
  const laws = searchLaws(q).slice(0, 4);
  const precs = searchPrecedents(q);
  const docs = Array.from(new Set(disputes.flatMap((d) => d.docs))).slice(0, 4).map((id) => templateById(id)!);
  const nothing = q && !disputes.length && !laws.length;

  return (
    <>
      <TopBar title="통합 검색" crumb="도시정비 분쟁지원" back="/" />
      <Page wide>
        <SearchHero eyebrow="SEARCH" title="통합 검색" lead="분쟁 유형·법령·판례·서류를 한 번에 찾습니다."
          label="검색어" value={input} onChange={setInput} placeholder="상황이나 키워드 (예: 총회 회의록 공개)"
          help={q ? `‘${q}’ 검색 결과입니다.` : "문장으로 적어도 됩니다."}
          onSubmit={() => input.trim() && router.replace(`/search?q=${encodeURIComponent(input.trim())}`)} />

        {!q && <div className="mt-4"><Empty>찾고 싶은 상황을 입력해 주세요.</Empty></div>}
        {nothing && <Alert tone="warn" title="결과 없음">관련 분쟁 유형을 찾지 못했어요. 단어를 바꾸거나(예: 총회, 현금청산, 감정평가) AI 상담을 이용해 보세요.</Alert>}

        {q && (
          <>
            <Section title="다음 행동" desc="검색 결과를 내 상황에 맞춰 정리합니다" kicker="NEXT ACTION">
              <ActionPanel title="AI로 내 상황 분석하기" desc="쟁점·유리한 점·불리한 점·대응 방법을 정리합니다."
                action={<Link href={`/ai?q=${encodeURIComponent(q)}`} className={btnCls("secondary")}>AI 분석 받기 →</Link>} />
            </Section>

            {disputes.length > 0 && (
              <Section title="관련 분쟁 유형" desc="입력한 내용과 가까운 순서">
                <CardGrid cols={3}>
                  {disputes.map((d, i) => (
                    <CaseCard key={d.id} href={`/disputes/${d.id}`} badges={[{ text: "분쟁 유형", tone: "blue" }, i === 0 ? { text: "가장 가까움", tone: "green" } : { text: "관련", tone: "gray" }]}
                      title={d.name} desc={d.overview} meta={`대응 절차 ${d.procedure.length}단계`} />
                  ))}
                </CardGrid>
              </Section>
            )}

            {laws.length > 0 && (
              <Section title="관련 법령" desc="쉽게 풀어 쓴 요약 · 원문으로 꼭 확인" more={{ href: "/laws", label: "법령 전체" }}>
                <CardGrid>{laws.map((l) => <LawCard key={l.id} l={l} />)}</CardGrid>
              </Section>
            )}
            {precs.length > 0 && (
              <Section title="관련 판례" more={{ href: "/laws?tab=prec", label: "판례 전체" }}>
                <CardGrid>{precs.map((p) => <PrecCard key={p.id} p={p} />)}</CardGrid>
              </Section>
            )}

            {docs.length > 0 && (
              <Section title="관련 서류" desc="이 상황에서 자주 쓰는 서류">
                <CardGrid>
                  {docs.map((t) => (
                    <CaseCard key={t.id} href={`/docs/${t.id}`} badges={[{ text: t.category, tone: "blue" }, t.expertReview ? { text: "전문가 검토", tone: "purple" } : { text: "바로 작성", tone: "green" }]}
                      title={t.name} desc={t.desc} meta={`입력 항목 ${t.fields.length}개`} action="작성하기" />
                  ))}
                </CardGrid>
              </Section>
            )}

            {disputes[0] && (
              <Section title="추가로 확인할 점">
                <StepList items={[
                  { title: "현재 사업 단계", desc: "단계에 따라 적용 조문과 기한이 달라집니다" },
                  { title: "문서를 받은 날짜", desc: "기한 계산의 시작점(기산점)이 됩니다" },
                  { title: "서면 요청·이의 이력", desc: "이미 요청했다면 사본과 발송 증빙을 준비하세요" },
                ]} />
              </Section>
            )}

            <Section title="국가법령정보센터 검색" desc="공식 데이터 실시간 검색" kicker="OPEN API">
              <LiveLawSearch query={q} />
            </Section>

            {!disputes.length && (
              <Section title="전체 분쟁 유형" more={{ href: "/disputes", label: "분쟁 대응" }}>
                <CardGrid cols={3}>
                  {DISPUTES.slice(0, 6).map((d) => <CaseCard key={d.id} href={`/disputes/${d.id}`} badges={[{ text: "분쟁 유형", tone: "blue" }]} title={d.name} desc={d.overview} meta={`대응 절차 ${d.procedure.length}단계`} />)}
                </CardGrid>
              </Section>
            )}
          </>
        )}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function SearchPage() {
  return <Suspense><Inner /></Suspense>;
}
