"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronRight, FileText, Search, Sparkles } from "lucide-react";
import { DISPUTES, templateById } from "@/lib/data";
import { scoreDisputes, searchLaws, searchPrecedents } from "@/lib/analyze";
import { Card, Disclaimer, Empty, H2, ICONS, LawCard, Page, PrecCard, TopBar } from "@/components/ui";
import LiveLawSearch from "@/components/LiveLawSearch";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") || "";
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const disputes = scoreDisputes(q).slice(0, 3).map((x) => x.d);
  const laws = searchLaws(q).slice(0, 5);
  const precs = searchPrecedents(q);
  const docs = Array.from(new Set(disputes.flatMap((d) => d.docs))).slice(0, 4).map((id) => templateById(id)!);
  const nothing = !disputes.length && !laws.length;

  return (
    <>
      <TopBar title="검색 결과" back="/" />
      <Page>
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) router.replace(`/search?q=${encodeURIComponent(input.trim())}`); }} className="flex items-center gap-2 rounded-2xl border border-line bg-white p-1.5 pl-3">
          <Search size={18} className="text-muted" />
          <input value={input} onChange={(e) => setInput(e.target.value)} className="min-w-0 flex-1 py-2 outline-none" aria-label="검색어" />
          <button className="rounded-xl bg-navy px-3 py-2 text-[14px] font-bold text-white">검색</button>
        </form>

        <Link href={`/ai?q=${encodeURIComponent(q)}`} className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-soft p-3.5">
          <Sparkles className="text-amber" size={20} />
          <div className="flex-1 text-[14px]"><b>AI 분석 받기</b><div className="text-[12px] text-muted">이 내용으로 쟁점·유불리·대응 방법 정리</div></div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        {nothing && (
          <div className="mt-4"><Empty>관련 분쟁 유형을 찾지 못했어요.<br />단어를 바꿔 보거나(예: 총회, 현금청산, 감정평가) AI 상담을 이용해 보세요.</Empty></div>
        )}

        {disputes.length > 0 && (
          <>
            <H2>관련 분쟁 유형</H2>
            <div className="space-y-2">
              {disputes.map((d) => {
                const I = ICONS[d.icon];
                return (
                  <Link key={d.id} href={`/disputes/${d.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
                    <I className="text-navy" size={22} />
                    <div className="min-w-0 flex-1"><div className="font-bold">{d.name}</div><div className="truncate text-[12px] text-muted">{d.overview}</div></div>
                    <ChevronRight size={18} className="text-muted" />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {laws.length > 0 && (<><H2 more={{ href: "/laws" }}>관련 법령</H2><div className="space-y-2">{laws.map((l) => <LawCard key={l.id} l={l} />)}</div></>)}
        {precs.length > 0 && (<><H2 more={{ href: "/laws?tab=prec" }}>관련 판례</H2><div className="space-y-2">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div></>)}

        {q && <><H2>국가법령정보센터 검색</H2><LiveLawSearch query={q} /></>}

        {docs.length > 0 && (
          <>
            <H2>관련 서류 작성</H2>
            <div className="grid grid-cols-2 gap-2">
              {docs.map((t) => (
                <Link key={t.id} href={`/docs/${t.id}`} className="rounded-2xl border border-line bg-white p-3"><FileText size={18} className="text-navy" /><div className="mt-1 text-[13px] font-semibold leading-snug">{t.name}</div></Link>
              ))}
            </div>
          </>
        )}

        {disputes[0] && (
          <>
            <H2>이런 것도 확인해 보세요</H2>
            <Card className="space-y-2 text-[14px]">
              <p>· 현재 사업은 몇 단계인가요? (단계에 따라 적용 조문이 달라요)</p>
              <p>· 조합이나 구청에서 받은 문서의 날짜를 알고 있나요? (기한 계산의 시작점)</p>
              <p>· 이미 서면으로 요청하거나 이의를 제기한 적이 있나요?</p>
            </Card>
          </>
        )}
        {!disputes.length && (<><H2>전체 분쟁 유형</H2><div className="flex flex-wrap gap-2">{DISPUTES.map((d) => <Link key={d.id} href={`/disputes/${d.id}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px]">{d.short}</Link>)}</div></>)}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function SearchPage() {
  return <Suspense><Inner /></Suspense>;
}
