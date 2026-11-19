"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Analysis } from "@/lib/analyze";
import { analysisToText } from "@/lib/chat";
import { useDB } from "@/lib/store";
import { Alert, Badge, BulletList, CardGrid, CaseCard, IconBtn, LawCard, Panel, PrecCard, Step, SubPanel, btnCls, type Tone } from "./ui";

function Sec({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 mt-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="t-title">{title}</p>
        {kicker && <span className="t-kicker">{kicker}</span>}
      </div>
      {children}
    </section>
  );
}
export default function AnalysisCard({ a, note, convId }: { a: Analysis; note?: string; convId?: string }) {
  const db = useDB();
  const conv = convId ? db.conversations.find((x) => x.id === convId) : undefined;
  const linkedCase = conv?.caseId ? db.cases.find((x) => x.id === conv.caseId) : undefined;
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const expertTone: Tone = a.expertNeeded.level === "높음" ? "red" : a.expertNeeded.level === "보통" ? "amber" : "green";
  return (
    <Panel>
      {/* 1. 핵심 결론 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={a.engine === "ai" ? "blue" : "gray"}>{a.engine === "ai" ? "AI 분석" : "기본 분석"}</Badge>
        <Badge tone={a.confidence === "근거 충분" ? "green" : "red"}>{a.confidence === "근거 충분" ? "법령 근거 확인" : "근거 부족 · 검토 필요"}</Badge>
        <Badge tone={expertTone}>전문가 상담 {a.expertNeeded.level}</Badge>
      </div>
      <p className="t-label mt-3">질문 요약</p>
      <p className="t-title">{a.summary}</p>
      {a.disputes.length > 0 && (
        <p className="t-sub mt-2">관련 분쟁 유형 · {a.disputes.map((d, i) => (
          <span key={d.id}>{i > 0 && ", "}<Link href={`/disputes/${d.id}`} className="t-label">{d.name} →</Link></span>
        ))}</p>
      )}
      {note && <Alert tone="warn" title="안내">{note}</Alert>}

      {/* 2. 사실관계 */}
      <Sec title="확인된 사실관계" kicker="FACTS"><BulletList items={a.facts} empty="아직 확인된 사실이 없습니다." /></Sec>
      {a.needCheck.length > 0 && (
        <Sec title="추가 확인이 필요한 사항">
          <Alert tone="danger" title="검토 필요">입력된 사실만으로 법적 결론을 확정할 수 없습니다.</Alert>
          <BulletList items={a.needCheck} />
        </Sec>
      )}

      {/* 3. 쟁점 · 유불리 */}
      {a.issues.length > 0 && <Sec title="핵심 쟁점" kicker="ISSUES"><BulletList items={a.issues} /></Sec>}
      {(a.favorable.length > 0 || a.unfavorable.length > 0) && (
        <Sec title="유리한 점 · 불리한 점">
          <div className="grid gap-2.5 tab:grid-cols-2">
            <SubPanel badge={{ text: "유리한 점", tone: "green" }}><BulletList items={a.favorable} /></SubPanel>
            <SubPanel badge={{ text: "불리한 점", tone: "red" }}><BulletList items={a.unfavorable} /></SubPanel>
          </div>
        </Sec>
      )}

      {/* 4. 법적 근거 */}
      <Sec title="관련 법령 · 판례" kicker="LEGAL EVIDENCE">
        {a.laws.length === 0 && a.precedents.length === 0 ? <p className="t-meta">확인된 근거가 없습니다. 법률 자료 메뉴에서 직접 찾아보세요.</p> : (
          <CardGrid>
            {a.laws.map((l) => <LawCard key={l.id} l={l} compact />)}
            {a.precedents.map((p) => <PrecCard key={p.id} p={p} compact />)}
          </CardGrid>
        )}
      </Sec>

      {/* 5. 대응 방법 · 위험 */}
      {a.methods.length > 0 && (
        <Sec title="가능한 대응 방법" kicker="STRATEGY">
          <CardGrid>
            {a.methods.map((m) => <CaseCard key={m.name} badges={[{ text: "대응 방법", tone: "blue" }, { text: "확인 필요", tone: "amber" }]} title={m.name} desc={m.desc} meta={`확인: ${m.check}`} action={null} />)}
          </CardGrid>
        </Sec>
      )}
      {a.risks.length > 0 && <Sec title="예상 위험요소">{a.risks.map((r) => <Alert key={r} tone="warn" title="주의">{r}</Alert>)}</Sec>}

      {/* 6. 다음 행동 */}
      {a.steps.length > 0 && <Sec title="다음 단계 행동" kicker="NEXT ACTION">{a.steps.map((s, i) => <Step key={s} n={i + 1} title={s} />)}</Sec>}
      {a.docs.length > 0 && (
        <Sec title="추천 서류">
          <div className="flex flex-wrap gap-[9px]">{a.docs.map((d) => <Link key={d.id} href={`/docs/${d.id}${convId ? `?from=${convId}` : ""}${linkedCase ? `${convId ? "&" : "?"}case=${linkedCase.id}` : ""}`} className={btnCls("secondary")}>{d.name}</Link>)}</div>
        </Sec>
      )}
      {convId && (
        <Sec title="사건 관리">
          {linkedCase ? (
            <div className="flex flex-wrap items-center gap-[9px]"><p className="t-body flex-1">이 상담은 ‘{linkedCase.title}’ 사건에 연결되어 있습니다.</p><Link href={`/cases/${linkedCase.id}?tab=analysis`} className={btnCls("secondary")}>사건으로 이동</Link></div>
          ) : (
            <div className="flex flex-wrap items-center gap-[9px]"><p className="t-body flex-1">증거자료·기한·서류를 한곳에서 관리하려면 사건으로 만드세요.</p><Link href={`/cases/new?from=${convId}`} className={btnCls("secondary")}>이 상담으로 사건 만들기</Link></div>
          )}
        </Sec>
      )}
      <Sec title="전문가 상담 필요성">
        <div className="flex items-start gap-2"><Badge tone={expertTone}>{a.expertNeeded.level}</Badge><p className="t-body">{a.expertNeeded.reason}</p></div>
      </Sec>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <button type="button" className={btnCls("ghost")} onClick={() => { navigator.clipboard?.writeText(analysisToText(a)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 결과 복사</>}
        </button>
        <span className="t-meta ml-auto">도움이 됐나요?</span>
        <IconBtn label="도움됨" on={vote === "up"} onClick={() => setVote("up")}><ThumbsUp size={16} /></IconBtn>
        <IconBtn label="도움 안 됨" tone="red" on={vote === "down"} onClick={() => setVote("down")}><ThumbsDown size={16} /></IconBtn>
      </div>
    </Panel>
  );
}
