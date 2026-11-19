"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DISPUTES, LAWS, PRECEDENTS, STAGES, TEMPLATES } from "@/lib/data";
import { useDB } from "@/lib/store";
import { dday } from "@/lib/analyze";
import {
  Badge, CardGrid, CaseCard, DataTable, Disclaimer, SearchHero, Page, Panel, PrecCard, Section, SelectField, TopBar, btnCls, type BadgeSpec,
} from "@/components/ui";

const EXAMPLES = ["조합에서 총회 회의록을 공개하지 않습니다", "분양신청을 못 해서 현금청산 대상이 됐어요", "세입자인데 주거이전비를 받을 수 있나요"];
const HOME_DISPUTES = ["d9", "d3", "d6", "d5", "d10", "d7"];

export default function Home() {
  const router = useRouter();
  const db = useDB();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("6");
  const go = (text: string) => text.trim() && router.push(`/search?q=${encodeURIComponent(text.trim())}`);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const upcoming = db.cases
    .flatMap((c) => c.schedules.filter((s) => !s.done).map((s) => ({ ...s, caseId: c.id, caseTitle: c.title })))
    .filter((s) => s.date >= yesterday)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const analyzed = db.conversations.filter((c) => c.messages.some((m) => m.analysis)).length;

  const services: { href: string; badges: BadgeSpec[]; title: string; desc: string; meta: string; action: string }[] = [
    { href: "/ai", badges: [{ text: "AI 상담", tone: "blue" }, analyzed ? { text: `분석 완료 ${analyzed}건`, tone: "green" } : { text: "바로 이용 가능", tone: "blue" }],
      title: "AI 법률 도우미", desc: "상황을 적으면 쟁점·근거 법령·대응 방법을 정리합니다.", meta: `상담 기록 ${db.conversations.length}건`, action: "상담 시작" },
    { href: "/docs", badges: [{ text: "서류 작성", tone: "blue" }, db.docs.length ? { text: `내 서류 ${db.docs.length}건`, tone: "green" } : { text: "바로 이용 가능", tone: "blue" }],
      title: "서류 자동 작성", desc: "질문에 답하면 내용증명·청구서 초안을 만듭니다.", meta: `양식 ${TEMPLATES.length}종 · DOCX·PDF`, action: "작성하기" },
    { href: "/cases", badges: [{ text: "사건 관리", tone: "blue" }, { text: "4단계 준비 중", tone: "gray" }],
      title: "내 사건 관리", desc: "증거자료·일정·참여자를 사건별로 관리합니다.", meta: `등록 사건 ${db.cases.length}건`, action: "자세히 보기" },
  ];

  return (
    <>
      <TopBar title="홈" crumb="도시정비 분쟁지원" right={<Link href="/my" className={btnCls("secondary")}>{db.profile ? db.profile.name : "시작하기"}</Link>} />
      <Page wide>
        <SearchHero eyebrow="REDEVELOPMENT DISPUTE SUPPORT" title="복잡한 분쟁을 명확한 대응으로"
          lead="어떤 문제가 있는지 그대로 적어 주세요. 관련 법령·판례와 대응 절차, 필요한 서류까지 이어서 찾아 드립니다."
          label="통합 검색" value={q} onChange={setQ} onSubmit={() => go(q)} placeholder="예) 조합이 감정평가 자료를 안 보여줘요"
          examples={EXAMPLES} onExample={go} />

        {upcoming.length > 0 && (
          <Section title="다가오는 기한" desc="내 사건에 등록한 기한 중 가까운 순서" more={{ href: "/cases", label: "내 사건" }}>
            <CardGrid>
              {upcoming.map((s) => {
                const d = dday(s.date);
                return <CaseCard key={s.id} href={`/cases/${s.caseId}?tab=schedule`} badges={[{ text: s.kind, tone: "blue" }, { text: d, tone: d.startsWith("D+") ? "gray" : "amber" }]} title={s.title} desc={s.caseTitle} meta={s.date} />;
              })}
            </CardGrid>
          </Section>
        )}

        <Section title="주요 서비스" desc="검색 다음에 이어서 할 수 있는 일" kicker="SERVICES">
          <CardGrid cols={3}>
            {services.map((s) => <CaseCard key={s.href} href={s.href} badges={s.badges} title={s.title} desc={s.desc} meta={s.meta} action={s.action} />)}
          </CardGrid>
        </Section>

        <Section title="자주 찾는 분쟁 유형" desc={`전체 ${DISPUTES.length}가지 중 많이 찾는 유형`} more={{ href: "/disputes", label: "전체 보기" }}>
          <CardGrid cols={3}>
            {HOME_DISPUTES.map((id) => DISPUTES.find((d) => d.id === id)!).map((d) => (
              <CaseCard key={d.id} href={`/disputes/${d.id}`} badges={[{ text: "분쟁 유형", tone: "blue" }, { text: `관련 조문 ${d.laws.length}개`, tone: "green" }]}
                title={d.name} desc={d.overview} meta={`대응 절차 ${d.procedure.length}단계`} />
            ))}
          </CardGrid>
        </Section>

        <Section title="사업 단계별 안내" desc="지금 사업 단계를 고르면 그 단계에서 생기는 분쟁만 보여 드립니다" kicker="BUSINESS STAGE">
          <Panel>
            <SelectField label="현재 사업 단계" value={stage} onChange={setStage} options={STAGES.map((s, i) => ({ value: String(i + 1), label: `${i + 1}단계 · ${s}` }))} />
            <div className="flex items-center justify-between gap-3">
              <span className="t-sub">이 단계의 분쟁 <Badge tone="blue">{DISPUTES.filter((d) => d.stages.includes(Number(stage))).length}건</Badge></span>
              <Link href={`/disputes?stage=${stage}`} className={btnCls("secondary")}>분쟁 보기</Link>
            </div>
          </Panel>
        </Section>

        <Section title="꼭 알아둘 법정 기한" desc="기한은 기산점(언제부터 세는지)과 함께 확인해야 합니다" more={{ href: "/laws", label: "법령 보기" }}>
          <DataTable head={["기한", "내용", "기산점", "근거"]} rows={LAWS.filter((l) => l.deadline).map((l) => [
            <Badge key="b" tone="amber">{l.deadline!.days}일</Badge>,
            <b key="t" className="text-ink-900">{l.deadline!.label}</b>,
            l.deadline!.from,
            <Link key="l" href={`/laws?focus=${l.id}`} className="font-bold text-blue-600">{l.short} {l.article}</Link>,
          ])} />
          <p className="t-meta mt-2">기간의 말일이 토요일·공휴일이면 다음 날 만료되는 등 계산 규칙이 있습니다. 실제 기한은 전문가와 확인하세요.</p>
        </Section>

        <Section title="주요 판례" desc="판결 요지와 원문 링크" more={{ href: "/laws?tab=prec", label: "판례 더 보기" }}>
          <CardGrid>{PRECEDENTS.slice(0, 2).map((p) => <PrecCard key={p.id} p={p} compact />)}</CardGrid>
        </Section>

        <Disclaimer />
      </Page>
    </>
  );
}
