"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Alert, Badge, DataTable, Loading, SelectField, btnCls } from "./ui";

type Item = { id: string; title: string; sub: string; date: string; source: string; url: string };
const TARGETS = [
  { value: "law", label: "법령" },
  { value: "prec", label: "판례" },
  { value: "decc", label: "행정심판 재결례" },
  { value: "ordin", label: "자치법규" },
];

// 국가법령정보센터 실시간 검색(서버에 무료 OC 키가 설정된 경우). 없으면 공식 사이트 바로가기 제공.
export default function LiveLawSearch({ query, initial = "law", hideSelect }: { query: string; initial?: string; hideSelect?: boolean }) {
  const [target, setTarget] = useState(initial);
  const [state, setState] = useState<{ loading: boolean; items: Item[]; total: number; configured?: boolean; error?: string }>({ loading: false, items: [], total: 0 });
  useEffect(() => setTarget(initial), [initial]);

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
      {!hideSelect && <div className="max-w-[320px]"><SelectField label="자료 종류" value={target} onChange={setTarget} options={TARGETS} /></div>}
      {state.loading && <Loading>국가법령정보센터에서 찾는 중…</Loading>}
      {!state.loading && state.configured === false && (
        <Alert tone="info" title="실시간 검색 준비 중">
          관리자가 국가법령정보 공동활용 무료 OC 키를 등록하면 이 자리에서 바로 검색됩니다. 지금은 공식 사이트에서 직접 찾아보세요.
          <span className="mt-2 flex flex-wrap gap-[9px]">
            <a href="https://www.law.go.kr/" target="_blank" rel="noreferrer" className={btnCls("secondary")}>국가법령정보센터 열기 <ExternalLink size={13} /></a>
            <button type="button" onClick={() => navigator.clipboard?.writeText(query)} className={btnCls("ghost")}>검색어 복사</button>
          </span>
        </Alert>
      )}
      {!state.loading && state.error && <Alert tone="danger" title="검색 실패">{state.error}</Alert>}
      {!state.loading && state.configured && !state.error && state.items.length === 0 && <Alert tone="warn" title="결과 없음">검색어를 짧게(예: 도시정비법, 현금청산) 바꿔 보세요.</Alert>}
      {state.items.length > 0 && (
        <DataTable head={["자료명", "구분", "기준일", "원문"]} rows={state.items.map((it) => [
          <b key="t" className="text-ink-900">{it.title}</b>, it.sub, it.date,
          <a key="u" href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-blue-600">보기 <ExternalLink size={12} /></a>,
        ])} />
      )}
      {state.total > state.items.length && <div className="mt-2 text-center"><Badge>전체 {state.total}건 중 {state.items.length}건</Badge></div>}
    </div>
  );
}
