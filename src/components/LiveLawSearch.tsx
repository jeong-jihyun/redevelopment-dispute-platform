"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Card, Chip } from "./ui";

type Item = { id: string; title: string; sub: string; date: string; source: string; url: string };
const TARGETS = [
  { id: "law", name: "법령" },
  { id: "prec", name: "판례" },
  { id: "decc", name: "행정심판" },
  { id: "ordin", name: "자치법규" },
];

// 국가법령정보센터 실시간 검색(서버에 무료 OC 키가 설정된 경우). 없으면 공식 사이트 바로가기 제공.
export default function LiveLawSearch({ query, initial = "law" }: { query: string; initial?: string }) {
  const [target, setTarget] = useState(initial);
  const [state, setState] = useState<{ loading: boolean; items: Item[]; total: number; configured?: boolean; error?: string }>({ loading: false, items: [], total: 0 });

  useEffect(() => {
    if (!query.trim()) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fetch(`/api/law?target=${target}&query=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j) => alive && setState({ loading: false, items: j.items || [], total: j.total || 0, configured: j.configured !== false, error: j.error }))
      .catch(() => alive && setState({ loading: false, items: [], total: 0, configured: true, error: "네트워크 연결을 확인해 주세요." }));
    return () => { alive = false; };
  }, [query, target]);

  return (
    <div>
      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
        {TARGETS.map((t) => <Chip key={t.id} on={t.id === target} onClick={() => setTarget(t.id)}>{t.name}</Chip>)}
      </div>
      {state.loading && <div className="flex items-center gap-2 py-4 text-[14px] text-muted"><Loader2 className="animate-spin" size={16} /> 국가법령정보센터에서 찾는 중…</div>}
      {!state.loading && state.configured === false && (
        <Card className="text-[14px] leading-relaxed">
          실시간 검색은 관리자가 국가법령정보 공동활용 <b>무료 OC 키</b>를 등록하면 켜집니다. 지금은 공식 사이트에서 직접 찾아보세요.
          <a href="https://www.law.go.kr/" target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 font-semibold text-navy">국가법령정보센터 열기 <ExternalLink size={14} /></a>
          <button onClick={() => navigator.clipboard?.writeText(query)} className="mt-1 text-[12px] text-muted underline">검색어 복사하기</button>
        </Card>
      )}
      {!state.loading && state.error && <Card className="text-[14px] text-bad">{state.error}</Card>}
      {!state.loading && state.configured && !state.error && state.items.length === 0 && <Card className="text-[14px] text-muted">검색 결과가 없습니다. 검색어를 짧게(예: 도시정비법, 현금청산) 바꿔 보세요.</Card>}
      <div className="space-y-2">
        {state.items.map((it) => (
          <a key={it.id + it.title} href={it.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-line bg-white p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold leading-snug">{it.title}</div>
              <ExternalLink size={14} className="mt-1 shrink-0 text-muted" />
            </div>
            <div className="mt-1 text-[12px] text-muted">{it.sub}</div>
            <div className="mt-0.5 text-[12px] text-muted">{it.date} · 출처: {it.source}</div>
          </a>
        ))}
      </div>
      {state.total > state.items.length && <div className="mt-2 text-center text-[12px] text-muted">전체 {state.total}건 중 {state.items.length}건 표시</div>}
    </div>
  );
}
