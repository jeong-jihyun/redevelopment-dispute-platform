"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FileText, MessageCircle, Search } from "lucide-react";
import { DISPUTES, templateById } from "@/lib/data";
import { scoreDisputes, searchLaws, searchPrecedents } from "@/lib/analyze";
import { Alert, Card, Disclaimer, Empty, H2, ICONS, LawCard, ListLink, Page, PrecCard, Step, TopBar, btnCls } from "@/components/ui";
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
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) router.replace(`/search?q=${encodeURIComponent(input.trim())}`); }}
          className="flex items-center gap-2 rounded-[14px] border border-line-strong bg-white p-1.5 pl-3.5 shadow-[var(--shadow-sm)] focus-within:border-blue-500">
          <Search size={18} className="shrink-0 text-ink-400" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="상황이나 키워드를 입력하세요" className="min-w-0 flex-1 py-2 outline-none" aria-label="검색어" />
          <button className={btnCls("primary")}>검색</button>
        </form>
        {q && <p className="mt-2 text-[12px] text-ink-500">‘<b className="text-ink-900">{q}</b>’ 검색 결과</p>}

        {q && (
          <Link href={`/ai?q=${encodeURIComponent(q)}`} className="mt-3 flex items-center gap-3 rounded-[14px] border border-[#d9e5ff] bg-blue-50 p-3.5 desk:hidden">
            <MessageCircle size={20} className="shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1"><b className="text-[14px] text-navy-950">AI로 내 상황 분석하기</b><div className="text-[12px] text-ink-500">쟁점·유불리·대응 방법 정리</div></div>
            <span className={btnCls("primary")}>분석</span>
          </Link>
        )}
        {!q && <div className="mt-4"><Empty>찾고 싶은 상황을 입력해 주세요. 예) 총회 결의, 현금청산, 감정평가</Empty></div>}
        {nothing && <Alert tone="warn" title="결과 없음">관련 분쟁 유형을 찾지 못했어요. 단어를 바꾸거나(예: 총회, 현금청산, 감정평가) AI 상담을 이용해 보세요.</Alert>}

        {q && (
          <div className="mt-4 grid gap-x-6 desk:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              {disputes.length > 0 && (
                <>
                  <H2 desc="입력한 내용과 가까운 분쟁 유형">관련 분쟁 유형</H2>
                  <div className="space-y-2">
                    {disputes.map((d) => { const I = ICONS[d.icon]; return <ListLink key={d.id} href={`/disputes/${d.id}`} icon={<I size={20} />} title={d.name} desc={d.overview} />; })}
                  </div>
                </>
              )}
              {laws.length > 0 && (<><H2 desc="쉽게 풀어 쓴 요약 · 원문으로 꼭 확인" more={{ href: "/laws", label: "법령 전체" }}>관련 법령</H2><div className="space-y-3">{laws.map((l) => <LawCard key={l.id} l={l} />)}</div></>)}
              {precs.length > 0 && (<><H2 more={{ href: "/laws?tab=prec", label: "판례 전체" }}>관련 판례</H2><div className="space-y-3">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div></>)}
              <H2 desc="공식 데이터 실시간 검색" kicker="OPEN API">국가법령정보센터 검색</H2>
              <LiveLawSearch query={q} />
            </div>

            <aside>
              <div className="hidden desk:block"><H2>다음 행동</H2></div>
              <Card className="hidden desk:block">
                <b className="text-[14px] text-navy-950">AI로 내 상황 분석하기</b>
                <p className="mt-1 text-[12px] text-ink-500">쟁점·유리한 점·불리한 점·대응 방법을 정리합니다.</p>
                <Link href={`/ai?q=${encodeURIComponent(q)}`} className={`${btnCls("primary")} mt-3 w-full`}><MessageCircle size={16} /> AI 분석 받기</Link>
              </Card>
              {docs.length > 0 && (
                <>
                  <H2>관련 서류 작성</H2>
                  <div className="grid grid-cols-2 gap-2 desk:grid-cols-1">
                    {docs.map((t) => (
                      <Link key={t.id} href={`/docs/${t.id}`} className="flex items-start gap-2 rounded-[14px] border border-line bg-white p-3 hover:border-blue-500/40">
                        <FileText size={17} className="mt-0.5 shrink-0 text-blue-600" /><span className="text-[13px] font-bold leading-snug">{t.name}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              {disputes[0] && (
                <>
                  <H2>추가로 확인할 점</H2>
                  <Card className="!py-1">
                    <Step n="1" title="현재 사업 단계" desc="단계에 따라 적용 조문과 기한이 달라집니다" />
                    <Step n="2" title="문서를 받은 날짜" desc="기한 계산의 시작점(기산점)이 됩니다" />
                    <Step n="3" title="서면 요청·이의 이력" desc="이미 요청했다면 사본과 발송 증빙을 준비하세요" />
                  </Card>
                </>
              )}
              {!disputes.length && (
                <>
                  <H2>전체 분쟁 유형</H2>
                  <div className="flex flex-wrap gap-2">{DISPUTES.map((d) => <Link key={d.id} href={`/disputes/${d.id}`} className="rounded-full border border-line-strong bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700">{d.short}</Link>)}</div>
                </>
              )}
            </aside>
          </div>
        )}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function SearchPage() {
  return <Suspense><Inner /></Suspense>;
}
