"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, FileText, MessageCircle } from "lucide-react";
import { PRECEDENTS, STAGES, disputeById, lawById, templateById } from "@/lib/data";
import { Alert, Badge, Card, Disclaimer, Empty, Eyebrow, H2, LawCard, Page, PrecCard, Step, TopBar, btnCls } from "@/components/ui";

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const d = disputeById(id);
  if (!d) return (<><TopBar title="분쟁 유형" back /><Page><Empty>없는 분쟁 유형입니다.</Empty></Page></>);
  const precs = PRECEDENTS.filter((p) => p.disputes.includes(d.id));
  return (
    <>
      <TopBar title={d.short} crumb="분쟁 대응" back />
      <Page wide>
        <Eyebrow>Dispute guide</Eyebrow>
        <h1 className="mt-1.5 text-[22px] font-bold leading-snug tracking-[-0.7px] text-navy-950 tab:text-[24px]">{d.name}</h1>
        <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-ink-700">{d.overview}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{d.stages.map((s) => <Badge key={s} tone="blue">{s}단계 · {STAGES[s - 1]}</Badge>)}</div>

        <div className="grid gap-x-6 desk:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <H2 desc="일반적인 순서이며 사건에 따라 달라질 수 있습니다" kicker="PROCEDURE">대응 절차</H2>
            <Card className="!py-1">{d.procedure.map((p, i) => <Step key={p} n={i + 1} title={p} />)}</Card>

            <H2 desc="AI 요약과 원문을 구분해 표시합니다" kicker="LEGAL EVIDENCE">관련 법령</H2>
            <div className="space-y-3">{d.laws.map((lid) => lawById(lid)).filter(Boolean).map((l) => <LawCard key={l!.id} l={l!} />)}</div>

            <H2>관련 판례</H2>
            {precs.length ? <div className="space-y-3">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div>
              : <Empty>확인된 대표 판례가 아직 없습니다. 법률 자료 메뉴에서 국가법령정보센터 검색을 이용하세요.</Empty>}
          </div>

          <aside>
            <H2>주요 발생 원인</H2>
            <Card><ul className="space-y-1.5 text-[14px] text-ink-700">{d.causes.map((c) => <li key={c}>· {c}</li>)}</ul></Card>

            <H2>준비할 증거자료</H2>
            <Card><ul className="space-y-2 text-[14px] text-ink-700">{d.evidence.map((e) => <li key={e} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green" />{e}</li>)}</ul></Card>

            <H2>관련 서류</H2>
            <div className="grid grid-cols-2 gap-2 desk:grid-cols-1">
              {d.docs.map((tid) => templateById(tid)!).map((t) => (
                <Link key={t.id} href={`/docs/${t.id}`} className="flex items-start gap-2 rounded-[14px] border border-line bg-white p-3 hover:border-blue-500/40">
                  <FileText size={17} className="mt-0.5 shrink-0 text-blue-600" />
                  <span className="text-[13px] font-bold leading-snug">{t.name}{t.expertReview && <span className="mt-1 block"><Badge tone="purple">전문가 검토</Badge></span>}</span>
                </Link>
              ))}
            </div>
            <Card className="mt-4">
              <b className="text-[14px] text-navy-950">이 유형으로 상담하기</b>
              <p className="mt-1 text-[12px] text-ink-500">내 상황을 입력하면 이 유형 기준으로 분석합니다.</p>
              <Link href={`/ai?topic=${d.id}`} className={`${btnCls("primary")} mt-3 w-full`}><MessageCircle size={16} /> AI 상담 시작</Link>
            </Card>
            <Alert tone="warn" title="기한 주의">처분·통지를 받은 날짜를 먼저 기록해 두세요. 대부분의 불복 기한은 그날부터 계산됩니다.</Alert>
          </aside>
        </div>
        <Disclaimer />
      </Page>
    </>
  );
}
