"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BUSINESS_TYPES, DISPUTES, STAGES } from "@/lib/data";
import { Alert, Badge, Chip, Eyebrow, ICONS, ListLink, Page, TopBar } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const [stage, setStage] = useState<number>(Number(sp.get("stage")) || 0);
  const [bt, setBt] = useState("redev");
  const list = stage ? DISPUTES.filter((d) => d.stages.includes(stage)) : DISPUTES;
  return (
    <>
      <TopBar title="분쟁 대응" crumb="도시정비 분쟁지원" back />
      <Page wide>
        <Eyebrow>Dispute types</Eyebrow>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.7px] text-navy-950">분쟁 유형 검색</h1>
        <p className="mt-1 text-[14px] text-ink-500">사업 유형과 단계를 고르면 그 단계에서 생길 수 있는 분쟁만 보여 드립니다.</p>

        <div className="mt-5 text-[12px] font-bold text-ink-700">사업 유형</div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 tab:mx-0 tab:flex-wrap tab:px-0">
          {BUSINESS_TYPES.map((b) => <Chip key={b.id} on={bt === b.id} onClick={() => setBt(b.id)}>{b.name}</Chip>)}
        </div>
        <div className="mt-4 text-[12px] font-bold text-ink-700">사업 단계</div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 tab:mx-0 tab:flex-wrap tab:px-0">
          <Chip on={!stage} onClick={() => setStage(0)}>전체</Chip>
          {STAGES.map((s, i) => <Chip key={s} on={stage === i + 1} onClick={() => setStage(i + 1)}>{i + 1}. {s}</Chip>)}
        </div>
        {bt !== "redev" && bt !== "rebuild" && (
          <Alert tone="warn" title="적용 법률 확인">
            {BUSINESS_TYPES.find((b) => b.id === bt)?.name}은(는) 도시정비법 외에 「빈집 및 소규모주택 정비에 관한 특례법」·「도시개발법」 등 다른 법률이 적용될 수 있습니다. 아래 내용은 도시정비법 기준입니다.
          </Alert>
        )}
        <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-500"><Badge tone="blue">{list.length}건</Badge>{stage ? `${stage}단계 · ${STAGES[stage - 1]}` : "전체 단계"}</div>
        <div className="mt-2.5 grid gap-2 desk:grid-cols-2">
          {list.map((d) => { const I = ICONS[d.icon]; return <ListLink key={d.id} href={`/disputes/${d.id}`} icon={<I size={20} />} title={d.name} desc={d.overview} />; })}
        </div>
      </Page>
    </>
  );
}

export default function Disputes() {
  return <Suspense><Inner /></Suspense>;
}
