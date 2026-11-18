"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LAWS, PRECEDENTS } from "@/lib/data";
import { Chip, Disclaimer, H2, LawCard, Page, PrecCard, TopBar } from "@/components/ui";
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
  useEffect(() => { if (focus) document.getElementById(focus)?.scrollIntoView({ block: "center" }); }, [focus]);

  const laws = useMemo(() => {
    const groups = new Map<string, typeof LAWS>();
    LAWS.filter((l) => !q || `${l.law}${l.short}${l.article}${l.title}${l.summary}`.includes(q)).forEach((l) => groups.set(l.law, [...(groups.get(l.law) || []), l]));
    return Array.from(groups.entries());
  }, [q]);
  const precs = PRECEDENTS.filter((p) => !q || `${p.caseNo}${p.title}${p.gist}`.includes(q));

  return (
    <>
      <TopBar title="법령·판례" />
      <Page>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map((t) => <Chip key={t.id} on={tab === t.id} onClick={() => setTab(t.id)}>{t.name}</Chip>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }} className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-white p-1.5 pl-3">
          <Search size={18} className="text-muted" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={tab === "prec" ? "사건번호 또는 키워드 (예: 2023도16588)" : "법령명·조문·키워드 (예: 현금청산)"} className="min-w-0 flex-1 py-2 outline-none" aria-label="법령 검색" />
          <button className="rounded-xl bg-navy px-3 py-2 text-[14px] font-bold text-white">검색</button>
        </form>

        {tab === "law" && (
          <>
            {laws.map(([law, items]) => (
              <section key={law}>
                <H2>{law}</H2>
                <div className="space-y-2">{items.map((l) => <div id={l.id} key={l.id} className={focus === l.id ? "rounded-2xl ring-2 ring-amber" : ""}><LawCard l={l} /></div>)}</div>
              </section>
            ))}
            {!laws.length && <p className="mt-4 text-[14px] text-muted">핵심 조문 중에는 없습니다. 아래 국가법령정보센터 검색 결과를 확인하세요.</p>}
            <p className="mt-3 text-[12px] text-muted">조문 요약은 이해를 돕기 위해 쉽게 풀어 쓴 것입니다. ‘원문’에서 시행일·개정 이력(연혁)을 함께 확인하세요.</p>
          </>
        )}
        {tab === "prec" && (
          <>
            <H2>대표 판례</H2>
            <div className="space-y-2">{precs.map((p) => <PrecCard key={p.id} p={p} />)}</div>
          </>
        )}
        {q && (<><H2>국가법령정보센터 실시간 검색</H2><LiveLawSearch key={tab} query={q} initial={tab} /></>)}
        {!q && (tab === "decc" || tab === "ordin") && (
          <p className="mt-6 text-[14px] text-muted">검색어를 입력하면 국가법령정보센터의 {tab === "decc" ? "행정심판 재결례" : "자치법규(시·도 정비 조례 등)"}를 찾아 드립니다. 예) {tab === "decc" ? "관리처분계획" : "서울특별시 도시 및 주거환경정비 조례"}</p>
        )}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function Laws() {
  return <Suspense><Inner /></Suspense>;
}
