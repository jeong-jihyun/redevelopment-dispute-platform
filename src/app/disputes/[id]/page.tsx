"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import { PRECEDENTS, STAGES, disputeById, lawById, templateById } from "@/lib/data";
import { Card, Disclaimer, Empty, H2, LawCard, Page, PrecCard, Tag, TopBar } from "@/components/ui";

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const d = disputeById(id);
  if (!d) return (<><TopBar title="분쟁 유형" back /><Page><Empty>없는 분쟁 유형입니다.</Empty></Page></>);
  const precs = PRECEDENTS.filter((p) => p.disputes.includes(d.id));
  return (
    <>
      <TopBar title={d.short} back />
      <Page>
        <h1 className="text-[20px] font-bold leading-snug">{d.name}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{d.overview}</p>
        <div className="mt-2 flex flex-wrap gap-1">{d.stages.map((s) => <Tag key={s} tone="navy">{s}. {STAGES[s - 1]}</Tag>)}</div>

        <H2>주요 발생 원인</H2>
        <Card><ul className="space-y-1.5 text-[14px]">{d.causes.map((c) => <li key={c}>· {c}</li>)}</ul></Card>

        <H2>대응 절차</H2>
        <Card>
          <ol className="space-y-3">
            {d.procedure.map((p, i) => (
              <li key={p} className="flex gap-3 text-[14px]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">{i + 1}</span><span className="pt-0.5">{p}</span></li>
            ))}
          </ol>
        </Card>

        <H2>관련 법령</H2>
        <div className="space-y-2">{d.laws.map((lid) => lawById(lid)).filter(Boolean).map((l) => <LawCard key={l!.id} l={l!} />)}</div>

        <H2>관련 판례</H2>
        {precs.length ? <div className="space-y-2">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div> : <Empty>확인된 대표 판례가 아직 없습니다. 법령·판례 메뉴에서 국가법령정보센터 검색을 이용하세요.</Empty>}

        <H2>준비할 증거자료</H2>
        <Card><ul className="space-y-1.5 text-[14px]">{d.evidence.map((e) => <li key={e} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />{e}</li>)}</ul></Card>

        <H2>관련 서류</H2>
        <div className="grid grid-cols-2 gap-2">
          {d.docs.map((tid) => templateById(tid)!).map((t) => (
            <Link key={t.id} href={`/docs/${t.id}`} className="rounded-2xl border border-line bg-white p-3"><FileText size={18} className="text-navy" /><div className="mt-1 text-[13px] font-semibold leading-snug">{t.name}</div></Link>
          ))}
        </div>

        <Link href={`/ai?topic=${d.id}`} className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-navy py-3.5 font-bold text-white"><Sparkles size={18} /> 이 유형으로 AI 상담</Link>
        <Disclaimer />
      </Page>
    </>
  );
}
