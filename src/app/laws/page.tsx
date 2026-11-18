"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LAWS, PRECEDENTS } from "@/lib/data";
import { Alert, Badge, CardGrid, Disclaimer, LawCard, Page, PageHeader, Panel, PrecCard, Section, SelectField, TopBar, btnCls, inputCls, Field } from "@/components/ui";
import LiveLawSearch from "@/components/LiveLawSearch";

const KINDS = [
  { value: "law", label: "법령" },
  { value: "prec", label: "판례" },
  { value: "decc", label: "행정심판 재결례" },
  { value: "ordin", label: "자치법규" },
];

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState(sp.get("tab") || "law");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const focus = sp.get("focus");
  useEffect(() => { if (focus) setTimeout(() => document.getElementById(focus)?.scrollIntoView({ block: "center" }), 80); }, [focus]);

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
        <PageHeader eyebrow="Legal sources" title="법령 · 판례" lead="공식 출처(국가법령정보센터) 원문으로 연결됩니다. 요약은 이해를 돕기 위한 참고 정보입니다." />

        <Panel className="mt-5">
          <form onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
            <div className="grid gap-x-4 tab:grid-cols-[220px_1fr]">
              <SelectField label="자료 종류" value={tab} onChange={(v) => { setTab(v); router.replace(`/laws?tab=${v}`); }} options={KINDS} />
              <Field label="검색어" help={tab === "prec" ? "사건번호 또는 키워드 (예: 2023도16588)" : "법령명·조문·키워드 (예: 현금청산)"}>
                <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} className={`${inputCls} min-w-0 flex-1`} aria-label="검색어" />
                  <button className={btnCls("primary")}>검색</button>
                </div>
              </Field>
            </div>
          </form>
        </Panel>

        {tab === "law" && (
          <>
            {laws.map(([law, items]) => (
              <Section key={law} title={law} desc={`핵심 조문 ${items.length}개`}>
                <CardGrid>
                  {items.map((l) => <LawCard key={l.id} l={l} highlight={focus === l.id} />)}
                </CardGrid>
              </Section>
            ))}
            {!laws.length && <Alert tone="warn" title="결과 없음">핵심 조문 중에는 없습니다. 아래 국가법령정보센터 검색 결과를 확인하세요.</Alert>}
          </>
        )}
        {tab === "prec" && (
          <Section title={<>대표 판례 <Badge tone="blue">{precs.length}건</Badge></>} desc="판결 요지 · 원문 링크" kicker="PRECEDENTS">
            <CardGrid>{precs.map((p) => <PrecCard key={p.id} p={p} />)}</CardGrid>
          </Section>
        )}
        {(tab === "decc" || tab === "ordin") && !q && (
          <Alert tone="info" title="검색 안내">검색어를 입력하면 국가법령정보센터의 {tab === "decc" ? "행정심판 재결례" : "자치법규(시·도 정비 조례 등)"}를 찾아 드립니다. 예) {tab === "decc" ? "관리처분계획" : "도시 및 주거환경정비 조례"}</Alert>
        )}
        {q && (
          <Section title="국가법령정보센터 검색" desc="공식 데이터 실시간 검색" kicker="OPEN API">
            <LiveLawSearch query={q} initial={tab} hideSelect />
          </Section>
        )}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function Laws() {
  return <Suspense><Inner /></Suspense>;
}
