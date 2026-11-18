"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ChevronRight } from "lucide-react";
import { BUSINESS_TYPES, DISPUTES, STAGES } from "@/lib/data";
import { Chip, ICONS, Page, TopBar } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const [stage, setStage] = useState<number>(Number(sp.get("stage")) || 0);
  const [bt, setBt] = useState("redev");
  const list = stage ? DISPUTES.filter((d) => d.stages.includes(stage)) : DISPUTES;
  return (
    <>
      <TopBar title="분쟁 유형 검색" back />
      <Page>
        <div className="text-[13px] font-semibold text-muted">사업 유형</div>
        <div className="no-scrollbar -mx-4 mt-1.5 flex gap-2 overflow-x-auto px-4">
          {BUSINESS_TYPES.map((b) => <Chip key={b.id} on={bt === b.id} onClick={() => setBt(b.id)}>{b.name}</Chip>)}
        </div>
        <div className="mt-4 text-[13px] font-semibold text-muted">사업 단계</div>
        <div className="no-scrollbar -mx-4 mt-1.5 flex gap-2 overflow-x-auto px-4">
          <Chip on={!stage} onClick={() => setStage(0)}>전체</Chip>
          {STAGES.map((s, i) => <Chip key={s} on={stage === i + 1} onClick={() => setStage(i + 1)}>{i + 1}. {s}</Chip>)}
        </div>
        {bt !== "redev" && bt !== "rebuild" && (
          <p className="mt-3 rounded-xl bg-amber-soft p-3 text-[13px] leading-relaxed">
            {BUSINESS_TYPES.find((b) => b.id === bt)?.name}은(는) 도시정비법 외에 「빈집 및 소규모주택 정비에 관한 특례법」·「도시개발법」 등 다른 법률이 적용될 수 있습니다. 아래 내용은 도시정비법 기준이므로 적용 법률을 꼭 확인하세요.
          </p>
        )}
        <div className="mt-4 space-y-2">
          {list.map((d) => {
            const I = ICONS[d.icon];
            return (
              <Link key={d.id} href={`/disputes/${d.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy/5"><I className="text-navy" size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-snug">{d.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] text-muted">{d.overview}</div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            );
          })}
        </div>
      </Page>
    </>
  );
}

export default function Disputes() {
  return <Suspense><Inner /></Suspense>;
}
