"use client";
// AI 상담 흐름: 질문 → (부족한 정보 추가 질문) → 분석. AI 키가 없거나 실패하면 규칙 기반 분석으로 대체.
import { DISPUTES, LAWS, PRECEDENTS, STRATEGIES, TEMPLATES, disputeById } from "./data";
import { followUps, maskSensitive, ruleAnalyze, type Analysis, type Facts, type FollowUp } from "./analyze";

type AiResult = {
  summary?: string; facts?: string[]; needCheck?: string[]; disputeIds?: string[]; lawIds?: string[]; precedentIds?: string[];
  issues?: string[]; favorable?: string[]; unfavorable?: string[]; methods?: { name: string; desc: string; check: string }[];
  risks?: string[]; steps?: string[]; docIds?: string[]; expertLevel?: string; expertReason?: string; removedCitations?: number;
};

export function nextFollowUp(question: string, facts: Facts, skipped: (keyof Facts)[] = []): FollowUp | undefined {
  return followUps(question, facts).find((f) => !skipped.includes(f.key));
}

const withTopic = (q: string, topic?: string) => {
  const d = topic ? disputeById(topic) : undefined;
  return d ? `[${d.short}] ${q}` : q;
};

export async function analyzeQuestion(question: string, facts: Facts, topic?: string): Promise<{ analysis: Analysis; note?: string }> {
  const q = withTopic(maskSensitive(question), topic);
  const fallback = ruleAnalyze(q, facts);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, facts }),
      signal: AbortSignal.timeout(30000),
    });
    const j = await res.json();
    if (j.configured === false) return { analysis: fallback };
    if (!res.ok || !j.result) return { analysis: fallback, note: `AI 서비스에 연결하지 못해 기본 분석으로 보여 드립니다. (${j.error || res.status})` };
    return { analysis: fromAi(j.result as AiResult, fallback) };
  } catch {
    return { analysis: fallback, note: "네트워크 문제로 AI 대신 기본 분석으로 보여 드립니다." };
  }
}

// AI 응답을 화면 구조로 변환. 근거(법령·판례)는 앱에 등록된 확인 자료만 사용한다.
function fromAi(r: AiResult, fb: Analysis): Analysis {
  const laws = (r.lawIds || []).map((id) => LAWS.find((l) => l.id === id)!).filter(Boolean);
  const precedents = (r.precedentIds || []).map((id) => PRECEDENTS.find((p) => p.id === id)!).filter(Boolean);
  const disputes = (r.disputeIds || []).map((id) => DISPUTES.find((d) => d.id === id)!).filter(Boolean).map((d) => ({ id: d.id, name: d.name }));
  const docs = (r.docIds || []).map((id) => TEMPLATES.find((t) => t.id === id)!).filter(Boolean).map((t) => ({ id: t.id, name: t.name }));
  const lvl = (["높음", "보통", "낮음"].includes(r.expertLevel || "") ? r.expertLevel : fb.expertNeeded.level) as Analysis["expertNeeded"]["level"];
  const risks = [...(r.risks || [])];
  if (r.removedCitations) risks.push(`확인되지 않은 인용 ${r.removedCitations}건을 자동으로 제외했습니다.`);
  if (!risks.some((x) => x.includes("법률의견"))) risks.push("이 결과는 법률정보 제공이며 변호사의 법률의견을 대체하지 않습니다.");
  return {
    summary: r.summary || fb.summary,
    facts: r.facts?.length ? r.facts : fb.facts,
    needCheck: r.needCheck?.length ? r.needCheck : fb.needCheck,
    disputes: disputes.length ? disputes : fb.disputes,
    laws,
    precedents,
    issues: r.issues || [],
    favorable: r.favorable || [],
    unfavorable: r.unfavorable || [],
    methods: r.methods?.length ? r.methods : fb.methods.length ? fb.methods : STRATEGIES.slice(0, 2),
    risks,
    steps: r.steps?.length ? r.steps : fb.steps,
    docs: docs.length ? docs : fb.docs,
    expertNeeded: { level: lvl, reason: r.expertReason || fb.expertNeeded.reason },
    confidence: laws.length ? "근거 충분" : "근거 부족",
    engine: "ai",
  };
}

export function analysisToText(a: Analysis) {
  const sec = (t: string, xs: string[]) => (xs.length ? `■ ${t}\n${xs.map((x) => `- ${x}`).join("\n")}\n` : "");
  return [
    `■ 질문 요약\n${a.summary}\n`,
    sec("확인된 사실관계", a.facts),
    sec("추가 확인 필요", a.needCheck),
    sec("관련 분쟁 유형", a.disputes.map((d) => d.name)),
    sec("관련 법령", a.laws.map((l) => `「${l.law}」 ${l.article}(${l.title}) ${l.url}`)),
    sec("관련 판례", a.precedents.map((p) => `${p.court} ${p.date} 선고 ${p.caseNo} ${p.url}`)),
    sec("핵심 쟁점", a.issues),
    sec("유리한 점", a.favorable),
    sec("불리한 점", a.unfavorable),
    sec("가능한 대응 방법", a.methods.map((m) => `${m.name}: ${m.desc} (확인: ${m.check})`)),
    sec("예상 위험요소", a.risks),
    sec("다음 단계", a.steps),
    sec("추천 서류", a.docs.map((d) => d.name)),
    `■ 전문가 상담 필요성: ${a.expertNeeded.level} — ${a.expertNeeded.reason}`,
  ].join("\n");
}
