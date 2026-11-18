"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink, FileText, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Analysis } from "@/lib/analyze";
import { analysisToText } from "@/lib/chat";
import { Alert, Badge, Step, btnCls } from "./ui";

function Sec({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-4 tab:px-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-navy-950">{title}</h3>
        {kicker && <span className="text-[10px] font-bold tracking-[1px] text-ink-400">{kicker}</span>}
      </div>
      {children}
    </section>
  );
}
const List = ({ xs, empty }: { xs: string[]; empty?: string }) =>
  xs.length ? <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-700">{xs.map((x) => <li key={x} className="flex gap-2"><span className="text-ink-400">·</span><span>{x}</span></li>)}</ul>
    : <p className="text-[13px] text-ink-400">{empty ?? "해당 없음"}</p>;

export default function AnalysisCard({ a, note }: { a: Analysis; note?: string }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const expertTone = a.expertNeeded.level === "높음" ? "red" : a.expertNeeded.level === "보통" ? "amber" : "green";
  return (
    <article className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[var(--shadow-sm)]">
      {/* 1. 핵심 결론 */}
      <header className="px-4 py-4 tab:px-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={a.engine === "ai" ? "blue" : "gray"}>{a.engine === "ai" ? "AI 분석" : "기본 분석"}</Badge>
          <Badge tone={a.confidence === "근거 충분" ? "green" : "red"}>{a.confidence === "근거 충분" ? "법령 근거 확인" : "근거 부족 · 추가 확인 필요"}</Badge>
          <Badge tone={expertTone as "red" | "amber" | "green"}>전문가 상담 {a.expertNeeded.level}</Badge>
        </div>
        <p className="mt-2.5 text-[12px] font-bold text-ink-500">질문 요약</p>
        <p className="text-[15px] font-semibold leading-relaxed text-navy-950">{a.summary}</p>
        {a.disputes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {a.disputes.map((d) => <Link key={d.id} href={`/disputes/${d.id}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-bold text-blue-600">{d.name} ›</Link>)}
          </div>
        )}
        {note && <Alert tone="warn">{note}</Alert>}
      </header>

      {/* 2. 사실관계 */}
      <Sec title="확인된 사실관계" kicker="FACTS"><List xs={a.facts} empty="아직 확인된 사실이 없습니다." /></Sec>
      {a.needCheck.length > 0 && (
        <Sec title="추가 확인이 필요한 사항">
          <Alert tone="danger" title="검토 필요">입력된 사실만으로 법적 결론을 확정할 수 없습니다.</Alert>
          <List xs={a.needCheck} />
        </Sec>
      )}

      {/* 3. 쟁점 · 유불리 */}
      {a.issues.length > 0 && <Sec title="핵심 쟁점" kicker="ISSUES"><List xs={a.issues} /></Sec>}
      {(a.favorable.length > 0 || a.unfavorable.length > 0) && (
        <Sec title="유리한 점 · 불리한 점">
          <div className="grid gap-2.5 tab:grid-cols-2">
            <div className="rounded-[12px] border border-[#cdebdc] bg-green-bg p-3"><div className="mb-1.5"><Badge tone="green">유리한 점</Badge></div><List xs={a.favorable} /></div>
            <div className="rounded-[12px] border border-[#f5cbd1] bg-red-bg p-3"><div className="mb-1.5"><Badge tone="red">불리한 점</Badge></div><List xs={a.unfavorable} /></div>
          </div>
        </Sec>
      )}

      {/* 4. 법적 근거: AI 요약과 원문 분리 */}
      <Sec title="관련 법령 · 판례" kicker="LEGAL EVIDENCE">
        {a.laws.length === 0 && a.precedents.length === 0 && <p className="text-[13px] text-ink-400">확인된 근거가 없습니다. 법률 자료 메뉴에서 직접 찾아보세요.</p>}
        <div className="space-y-2">
          {a.laws.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="block rounded-[12px] border border-line p-3 hover:border-blue-500/40">
              <div className="flex items-start justify-between gap-2">
                <b className="text-[14px] text-navy-950">「{l.short}」 {l.article} {l.title}</b>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-blue-600">원문 <ExternalLink size={12} /></span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{l.summary}</p>
              {l.deadline && <div className="mt-1.5"><Badge tone="amber">기한 {l.deadline.days}일 · {l.deadline.from}부터</Badge></div>}
            </a>
          ))}
          {a.precedents.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block rounded-[12px] border border-line p-3 hover:border-blue-500/40">
              <div className="flex items-start justify-between gap-2">
                <b className="text-[14px] text-navy-950">{p.court} {p.caseNo}</b>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-blue-600">판결 <ExternalLink size={12} /></span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{p.gist}</p>
            </a>
          ))}
        </div>
        {(a.laws.length > 0 || a.precedents.length > 0) && <p className="mt-2 text-[11px] text-ink-400">요약은 참고 정보입니다. 적용 조문·시행일·부칙과 사건 발생 시점을 원문으로 대조하세요.</p>}
      </Sec>

      {/* 5. 대응 방법 · 위험 */}
      {a.methods.length > 0 && (
        <Sec title="가능한 대응 방법" kicker="STRATEGY">
          <div className="grid gap-2 tab:grid-cols-2">
            {a.methods.map((m) => (
              <div key={m.name} className="rounded-[12px] bg-soft p-3">
                <b className="text-[14px] text-navy-950">{m.name}</b>
                <p className="text-[13px] text-ink-700">{m.desc}</p>
                <p className="mt-1 text-[12px] text-amber">확인: {m.check}</p>
              </div>
            ))}
          </div>
        </Sec>
      )}
      {a.risks.length > 0 && <Sec title="예상 위험요소"><Alert tone="warn" title="주의">{a.risks[0]}</Alert>{a.risks.length > 1 && <List xs={a.risks.slice(1)} />}</Sec>}

      {/* 6. 다음 행동 */}
      {a.steps.length > 0 && <Sec title="다음 단계 행동" kicker="NEXT ACTION">{a.steps.map((s, i) => <Step key={s} n={i + 1} title={s} />)}</Sec>}
      {a.docs.length > 0 && (
        <Sec title="추천 서류">
          <div className="flex flex-wrap gap-2">
            {a.docs.map((d) => <Link key={d.id} href={`/docs/${d.id}`} className={btnCls("secondary")}><FileText size={14} /> {d.name}</Link>)}
          </div>
        </Sec>
      )}
      <Sec title="전문가 상담 필요성">
        <div className="flex items-start gap-2"><Badge tone={expertTone as "red" | "amber" | "green"}>{a.expertNeeded.level}</Badge><p className="text-[14px] text-ink-700">{a.expertNeeded.reason}</p></div>
      </Sec>

      <footer className="flex flex-wrap items-center gap-1.5 border-t border-line bg-soft px-3 py-2.5">
        <button type="button" className={btnCls("ghost")} onClick={() => { navigator.clipboard?.writeText(analysisToText(a)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 결과 복사</>}
        </button>
        <span className="ml-auto text-[12px] text-ink-500">도움이 됐나요?</span>
        <button type="button" aria-label="도움됨" aria-pressed={vote === "up"} onClick={() => setVote("up")} className={`grid h-9 w-9 place-items-center rounded-full ${vote === "up" ? "bg-blue-100 text-blue-600" : "text-ink-500 hover:bg-canvas"}`}><ThumbsUp size={16} /></button>
        <button type="button" aria-label="도움 안 됨" aria-pressed={vote === "down"} onClick={() => setVote("down")} className={`grid h-9 w-9 place-items-center rounded-full ${vote === "down" ? "bg-red-bg text-red" : "text-ink-500 hover:bg-canvas"}`}><ThumbsDown size={16} /></button>
      </footer>
    </article>
  );
}
