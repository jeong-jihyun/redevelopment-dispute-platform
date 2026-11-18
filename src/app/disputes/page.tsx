"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BUSINESS_TYPES, DISPUTES, STAGES } from "@/lib/data";
import { Alert, Badge, CardGrid, CaseCard, Page, PageHeader, Panel, Section, SelectField, TopBar } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [stage, setStage] = useState(sp.get("stage") || "0");
  const [bt, setBt] = useState("redev");
  const st = Number(stage);
  const list = st ? DISPUTES.filter((d) => d.stages.includes(st)) : DISPUTES;
  return (
    <>
      <TopBar title="분쟁 대응" crumb="도시정비 분쟁지원" back />
      <Page wide>
        <PageHeader eyebrow="Dispute types" title="분쟁 유형 검색" lead="사업 유형과 단계를 고르면 그 단계에서 생길 수 있는 분쟁만 보여 드립니다." />

        <Panel className="mt-5">
          <div className="grid gap-x-4 tab:grid-cols-2">
            <SelectField label="사업 유형" value={bt} onChange={setBt} options={BUSINESS_TYPES.map((b) => ({ value: b.id, label: `${b.name} (${b.group})` }))} />
            <SelectField label="사업 단계" value={stage} onChange={(v) => { setStage(v); router.replace(v === "0" ? "/disputes" : `/disputes?stage=${v}`); }}
              options={[{ value: "0", label: "전체 단계" }, ...STAGES.map((s, i) => ({ value: String(i + 1), label: `${i + 1}단계 · ${s}` }))]} />
          </div>
          {bt !== "redev" && bt !== "rebuild" && (
            <Alert tone="warn" title="적용 법률 확인">
              {BUSINESS_TYPES.find((b) => b.id === bt)?.name}은(는) 도시정비법 외에 「빈집 및 소규모주택 정비에 관한 특례법」·「도시개발법」 등 다른 법률이 적용될 수 있습니다. 아래 내용은 도시정비법 기준입니다.
            </Alert>
          )}
        </Panel>

        <Section title={<>분쟁 유형 <Badge tone="blue">{list.length}건</Badge></>} desc={st ? `${st}단계 · ${STAGES[st - 1]}` : "전체 단계"}>
          <CardGrid cols={3}>
            {list.map((d) => (
              <CaseCard key={d.id} href={`/disputes/${d.id}`} badges={[{ text: "분쟁 유형", tone: "blue" }, { text: `관련 조문 ${d.laws.length}개`, tone: "green" }]}
                title={d.name} desc={d.overview} meta={`대응 절차 ${d.procedure.length}단계 · 서류 ${d.docs.length}종`} />
            ))}
          </CardGrid>
        </Section>
      </Page>
    </>
  );
}

export default function Disputes() {
  return <Suspense><Inner /></Suspense>;
}
