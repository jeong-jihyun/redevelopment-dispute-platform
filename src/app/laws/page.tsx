"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LAWS, PRECEDENTS } from "@/lib/data";
import { Alert, Badge, Disclaimer, Eyebrow, H2, LawCard, Page, PrecCard, TopBar, btnCls } from "@/components/ui";
import LiveLawSearch from "@/components/LiveLawSearch";

const TABS = [
  { id: "law", name: "법령" },
  { id: "prec", name: "판례" },
  { id: "decc", name: "행정심판 재결례" },
  { id: "ordin", name: "자치법규" },
];

function Inner() {
  const sp = useSearchParams();
  const [tab, setTab] = useState(sp.get("tab") || "law");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const focus = sp.get("focus");
  useEffect(() => { if (focus) setTimeout(() => document.getElementById(focus)?.scrollIntoView({ block: "center" }), 50); }, [focus]);

  const laws = useMemo(() => {
    const groups = new Map<string, typeof LAWS>();
    LAWS.filter((l) => !q || `${l.law}${l.short}${l.article}${l.title}${l.summary}`.includes(q)).forEach((l) => groups.set(l.law, [...(groups.get(l.law) || []), l]));
    return Array.from(groups.entries());
  }, [q]);
  const precs = PRECEDENTS.filter((p) => !q || `${p.caseNo}${p.title}${p.gist}`.includes(q));

  return (
    <>
      <TopBar title="법률 자료" crumb="도시정비 분쟁지원" />
      <Page wide>
        <Eyebrow>Legal sources</Eyebrow>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.7px] text-navy-950">법령 · 판례</h1>
        <p className="mt-1 text-[14px] text-ink-500">공식 출처(국가법령정보센터) 원문으로 연결됩니다. 요약은 이해를 돕기 위한 참고 정보입니다.</p>

        <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`min-h-11 shrink-0 border-b-2 px-3.5 text-[14px] font-bold ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-ink-500"}`}>{t.name}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }} className="mt-4 flex max-w-[720px] items-center gap-2 rounded-[14px] border border-line-strong bg-white p-1.5 pl-3.5 focus-within:border-blue-500">
          <Search size={18} className="shrink-0 text-ink-400" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={tab === "prec" ? "사건번호 또는 키워드 (예: 2023도16588)" : "법령명·조문·키워드 (예: 현금청산)"} className="min-w-0 flex-1 py-2 outline-none" aria-label="법령 검색" />
          <button className={btnCls("primary")}>검색</button>
        </form>

        {tab === "law" && (
          <>
            {laws.map(([law, items]) => (
              <section key={law}>
                <H2 desc={`핵심 조문 ${items.length}개`}>{law}</H2>
                <div className="grid gap-3 desk:grid-cols-2">
                  {items.map((l) => <div id={l.id} key={l.id} className={focus === l.id ? "rounded-[18px] ring-2 ring-blue-500" : ""}><LawCard l={l} /></div>)}
                </div>
              </section>
            ))}
            {!laws.length && <Alert tone="warn" title="결과 없음">핵심 조문 중에는 없습니다. 아래 국가법령정보센터 검색 결과를 확인하세요.</Alert>}
          </>
        )}
        {tab === "prec" && (
          <>
            <H2 desc="판결 요지 · 원문 링크" kicker="PRECEDENTS">대표 판례 <Badge tone="blue">{precs.length}건</Badge></H2>
            <div className="grid gap-3 desk:grid-cols-2">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div>
          </>
        )}
        {(tab === "decc" || tab === "ordin") && !q && (
          <Alert tone="info" title="검색 안내">검색어를 입력하면 국가법령정보센터의 {tab === "decc" ? "행정심판 재결례" : "자치법규(시·도 정비 조례 등)"}를 찾아 드립니다. 예) {tab === "decc" ? "관리처분계획" : "도시 및 주거환경정비 조례"}</Alert>
        )}
        {q && (<><H2 desc="공식 데이터 실시간 검색" kicker="OPEN API">국가법령정보센터 검색</H2><LiveLawSearch key={tab} query={q} initial={tab} /></>)}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function Laws() {
  return <Suspense><Inner /></Suspense>;
}
