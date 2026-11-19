"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { disputeById } from "@/lib/data";
import { detectFacts, maskSensitive, type Facts } from "@/lib/analyze";
import { analyzeQuestion, nextFollowUp } from "@/lib/chat";
import { getDB, logCase, now, uid, update, useDB, useMounted, type Conversation, type Msg } from "@/lib/store";
import AnalysisCard from "@/components/AnalysisCard";
import { Alert, Badge, Btn, CardGrid, CaseCard, Disclaimer, Empty, Loading, Page, Panel, SearchHero, Section, StepList, TextBtn, TopBar, btnCls, inputCls } from "@/components/ui";

const EXAMPLES = [
  "조합에 총회 회의록 열람을 요청했는데 한 달째 답이 없어요",
  "분양신청 기간을 놓쳐서 현금청산 대상이 됐다고 통보받았어요",
  "세입자인데 주거이전비를 받을 수 있는지 궁금해요",
  "감정평가 금액이 주변 시세보다 너무 낮게 나왔어요",
];
const MAX = 2000;

function useStatus() {
  const [ai, setAi] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then((j) => setAi(!!j.ai)).catch(() => setAi(false)); }, []);
  return ai;
}

function Composer({ onSend, busy, placeholder, label }: { onSend: (t: string) => void; busy: boolean; placeholder: string; label: string }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = ""; if (el.scrollHeight > el.clientHeight + 2) el.style.height = Math.min(el.scrollHeight + 2, 140) + "px"; el.style.overflowY = el.scrollHeight > 140 ? "auto" : "hidden";
  }, [text]);
  const send = () => { const t = text.trim(); if (!t || busy) return; onSend(t); setText(""); };
  return (
    <div className="flex items-end gap-2">
      <textarea ref={ref} rows={1} value={text} maxLength={MAX} aria-label={label}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        placeholder={placeholder} className={`${inputCls} h-11 max-h-36 min-h-11 flex-1 resize-none overflow-hidden leading-[22px] tab:h-10 tab:min-h-10 tab:py-[8px]`} />
      <button type="button" onClick={send} disabled={!text.trim() || busy} className={btnCls("primary")}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : "보내기"}
      </button>
    </div>
  );
}

function QuestionPanel({ m }: { m: Msg }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2.5">
        <Badge tone="gray">내 입력</Badge>
        <span className="t-meta">{new Date(m.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <p className="t-text mt-2.5 whitespace-pre-wrap">{m.text}</p>
    </Panel>
  );
}

function Chat({ c, aiOn }: { c: Conversation; aiOn: boolean | null }) {
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  // 분석 결과가 오면 결과의 맨 위(결론)부터 보이게, 그 외에는 맨 아래로
  useEffect(() => {
    const lm = c.messages[c.messages.length - 1];
    if (lm?.analysis && !busy) lastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    else endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [c.messages.length, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = c.messages[c.messages.length - 1];
  const lock = useRef(-1);
  // 사용자가 말한 직후이고 처리할 질문이 있으면 다음 단계 진행 (메시지 수 기준 1회만)
  useEffect(() => {
    if (last?.role !== "user" || !c.pendingQuestion || lock.current === c.messages.length) return;
    lock.current = c.messages.length;
    proceed(c.id);
  }, [c.messages.length, c.pendingQuestion]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeFollow = last?.role === "ai" && last.followUp ? last.followUp : undefined;

  // 다음 추가 질문을 묻거나, 다 모였으면 분석 실행
  async function proceed(id: string) {
    const conv = getDB().conversations.find((x) => x.id === id)!;
    if (!conv.pendingQuestion) return;
    const fu = nextFollowUp(conv.pendingQuestion, conv.facts, conv.skipped);
    if (fu) {
      update((db) => { const x = db.conversations.find((y) => y.id === id)!; x.messages.push({ role: "ai", text: fu.question, at: now(), followUp: fu }); x.updatedAt = now(); });
      return;
    }
    setBusy(true);
    const { analysis, note } = await analyzeQuestion(conv.pendingQuestion, conv.facts, conv.topic);
    update((db) => {
      const x = db.conversations.find((y) => y.id === id)!;
      x.messages.push({ role: "ai", text: analysis.summary, at: now(), analysis, note });
      x.pendingQuestion = undefined; x.skipped = []; x.updatedAt = now();
    });
    setBusy(false);
  }

  function answer(key: keyof Facts, value: string) {
    update((db) => { const x = db.conversations.find((y) => y.id === c.id)!; x.facts = { ...x.facts, [key]: value }; x.messages.push({ role: "user", text: value, at: now() }); });
  }
  function skip(key: keyof Facts) {
    update((db) => { const x = db.conversations.find((y) => y.id === c.id)!; x.skipped = [...(x.skipped || []), key]; x.messages.push({ role: "user", text: "건너뛰기", at: now() }); });
  }
  function analyzeNow() {
    update((db) => {
      const x = db.conversations.find((y) => y.id === c.id)!;
      x.skipped = ["businessType", "role", "stage", "priorRequest", "requested"];
      x.messages.push({ role: "user", text: "바로 분석해 주세요", at: now() });
    });
  }
  function send(text: string) {
    const t = maskSensitive(text);
    if (activeFollow) return answer(activeFollow.key, t);
    // 후속 질문: 처음 질문을 맥락으로 함께 분석
    const first = c.messages.find((m) => m.role === "user")?.text || "";
    update((db) => {
      const x = db.conversations.find((y) => y.id === c.id)!;
      const found = detectFacts(t);
      x.facts = { ...found, ...x.facts };
      x.messages.push({ role: "user", text: t, at: now() });
      x.pendingQuestion = first && first !== t ? `${first}\n추가 질문: ${t}` : t;
      x.updatedAt = now();
    });
  }

  const topic = c.topic ? disputeById(c.topic) : undefined;
  return (
    <>
      <div className="space-y-3 pb-4">
        {topic && <Alert tone="info" title="상담 주제">{topic.name} 기준으로 분석합니다.</Alert>}
        {c.messages.map((m, i) => {
          if (m.role === "user") return <QuestionPanel key={i} m={m} />;
          if (m.analysis) return <div key={i} ref={i === c.messages.length - 1 ? lastRef : undefined} className="scroll-mt-[76px]"><AnalysisCard a={m.analysis} note={m.note} convId={c.id} /></div>;
          const isActive = i === c.messages.length - 1 && !!m.followUp && !busy;
          return (
            <Panel key={i}>
              <div className="flex items-center justify-between gap-2.5">
                <Badge tone="blue">추가 확인</Badge>
                <Badge tone={isActive ? "amber" : "green"}>{isActive ? "답변 필요" : "확인 완료"}</Badge>
              </div>
              <p className="t-title mb-1 mt-3">{m.text}</p>
              <p className="t-sub">정확한 분석을 위해 확인합니다. 보기에 없으면 아래 입력칸에 직접 적어도 됩니다.</p>
              {m.followUp && isActive && (
                <>
                  <div className="mt-3 flex flex-wrap gap-[9px]">
                    {m.followUp.options.map((o) => <Btn key={o} kind="secondary" onClick={() => answer(m.followUp!.key, o)}>{o}</Btn>)}
                  </div>
                  <div className="mt-[14px] flex items-center justify-between border-t border-line pt-3">
                    <TextBtn tone="muted" onClick={() => skip(m.followUp!.key)}>건너뛰기</TextBtn>
                    <TextBtn onClick={analyzeNow}>바로 분석하기 →</TextBtn>
                  </div>
                </>
              )}
            </Panel>
          );
        })}
        {busy && <Loading>{aiOn ? "AI가 법령·판례 근거를 대조하며 분석하고 있어요…" : "관련 분쟁 유형과 법령을 찾아 분석하고 있어요…"}</Loading>}
        <div ref={endRef} />
      </div>

      {/* 입력창: 폰은 하단 탭 위, 태블릿·PC는 화면 아래 고정 */}
      <div className="no-print fixed inset-x-0 z-30 border-t border-line bg-canvas/95 px-3 py-2.5 backdrop-blur bottom-[calc(56px+env(safe-area-inset-bottom))] tab:bottom-0 tab:left-[210px] desk:left-[252px]">
        <div className="mx-auto max-w-[960px]">
          <Composer busy={busy} onSend={send} label={activeFollow ? "직접 답하기" : "이어서 질문하기"} placeholder={activeFollow ? "직접 답하기" : "이어서 질문하기"} />
        </div>
      </div>
    </>
  );
}

function Start({ aiOn }: { aiOn: boolean | null }) {
  const router = useRouter();
  const sp = useSearchParams();
  const db = useDB();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const topicId = sp.get("topic") || undefined;
  const topic = topicId ? disputeById(topicId) : undefined;
  const preset = sp.get("q");
  const caseId = sp.get("case");
  const linkCase = caseId ? db.cases.find((x) => x.id === caseId) : undefined;
  const started = useRef(false);

  function start(text: string) {
    const t = maskSensitive(text.trim());
    if (!t) return;
    const id = uid();
    update((d) => {
      const cs = linkCase ? d.cases.find((x) => x.id === linkCase.id) : undefined;
      const facts = detectFacts(t);
      if (cs) { facts.businessType ||= cs.businessType; facts.stage ||= cs.stage || undefined; facts.role ||= cs.role || undefined; logCase(cs, `AI 상담 시작 · ${t.slice(0, 30)}`); }
      d.conversations.unshift({ id, title: t.slice(0, 40), topic: topicId || cs?.disputeType || undefined, caseId: cs?.id, facts, messages: [{ role: "user", text: t, at: now() }], pendingQuestion: t, skipped: [], createdAt: now(), updatedAt: now() });
    });
    router.replace(`/ai?c=${id}`);
  }
  // 검색 화면에서 넘어온 질문은 바로 시작
  useEffect(() => { if (preset && !started.current) { started.current = true; start(preset); } }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page>
      <SearchHero eyebrow="AI LEGAL ASSISTANT" title="내 상황 분석하기"
        lead="상황을 적어 주시면 부족한 정보를 몇 가지 확인한 뒤 쟁점·근거 법령·대응 방법을 정리해 드립니다."
        badges={[
          aiOn === null ? { text: "연결 확인 중", tone: "gray" } : aiOn ? { text: "AI 분석 연결됨", tone: "blue" } : { text: "기본 분석 모드", tone: "gray" },
          { text: "확인된 법령·판례만 인용", tone: "green" },
          ...(topic ? [{ text: `상담 주제 · ${topic.short}`, tone: "purple" as const }] : []),
          ...(linkCase ? [{ text: `사건 연결 · ${linkCase.title}`, tone: "blue" as const }] : []),
        ]}
        multiline label="상황 설명" button="분석 시작" maxLength={MAX} value={text} onChange={(v) => { setText(v); if (v.trim()) setTouched(false); }}
        placeholder={topic ? `예) ${topic.short} 관련해서 조합에서 통보를 받았는데…` : "예) 조합에 총회 회의록 열람을 요청했는데 한 달째 답이 없어요"}
        help="언제, 누가, 무엇을 했는지 시간 순서대로 적어 주세요."
        error={touched && !text.trim() ? "상황 설명을 입력해 주세요." : undefined}
        onSubmit={() => { if (!text.trim()) { setTouched(true); return; } start(text); }}
        examples={EXAMPLES} onExample={start} />
      <Alert tone="info" title="개인정보 보호">주민등록번호·휴대폰 번호는 자동으로 가린 뒤 분석하며, 상담 내용은 이 기기에만 저장됩니다. 개인정보는 필요한 범위에서만 입력하세요.</Alert>

      <Section title="진행 순서" desc="상담은 이 순서로 진행됩니다" kicker="PROCESS">
        <StepList items={[
          { title: "상황 입력", desc: "겪고 있는 일을 편하게 적습니다" },
          { title: "추가 확인", desc: "사업 유형·내 지위·사업 단계를 보기에서 고릅니다" },
          { title: "분석 결과", desc: "쟁점·근거 법령·판례·대응 방법을 정리합니다" },
          { title: "다음 행동", desc: "필요한 서류 작성과 사건 관리로 이어집니다" },
        ]} />
      </Section>

      <Section title="최근 상담" desc="이 기기에 저장된 상담" kicker="HISTORY">
        {db.conversations.length === 0 ? <Empty>아직 상담 기록이 없습니다.</Empty> : (
          <CardGrid>
            {db.conversations.map((c) => {
              const done = c.messages.find((m) => m.analysis)?.analysis;
              const kind = done?.disputes[0]?.name.split(" ")[0] || (c.topic ? disputeById(c.topic)?.short : undefined);
              return (
                <CaseCard key={c.id} badges={[{ text: kind || "분류 전", tone: "blue" }, done ? { text: "분석 완료", tone: "green" } : { text: "답변 대기", tone: "amber" }]}
                  title={c.title} desc={`질문 ${c.messages.filter((m) => m.role === "user").length}건 · 분석 ${c.messages.filter((m) => m.analysis).length}건`}
                  meta={`최근 업데이트 ${new Date(c.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                  footer={
                    <span className="flex shrink-0 items-center gap-3">
                      {confirmDel === c.id ? (
                        <>
                          <TextBtn tone="danger" onClick={() => { update((d) => { d.conversations = d.conversations.filter((x) => x.id !== c.id); }); setConfirmDel(null); }}>삭제 확인</TextBtn>
                          <TextBtn tone="muted" onClick={() => setConfirmDel(null)}>취소</TextBtn>
                        </>
                      ) : <TextBtn tone="muted" onClick={() => setConfirmDel(c.id)}>삭제</TextBtn>}
                      <Link href={`/ai?c=${c.id}`} className="t-label">상담 보기 →</Link>
                    </span>
                  } />
              );
            })}
          </CardGrid>
        )}
      </Section>
      <Disclaimer />
    </Page>
  );
}

function Inner() {
  const sp = useSearchParams();
  const db = useDB();
  const aiOn = useStatus();
  const mounted = useMounted();
  const cid = sp.get("c");
  const c = cid ? db.conversations.find((x) => x.id === cid) : undefined;

  if (cid && !c) {
    if (!mounted) return <TopBar title="AI 상담" crumb="도시정비 분쟁지원" back="/ai" />;
    return (<><TopBar title="AI 상담" crumb="도시정비 분쟁지원" back="/ai" /><Page><Empty>상담 기록을 찾을 수 없습니다. 다른 기기에서 만든 상담은 이 기기에 없습니다.</Empty></Page></>);
  }
  if (c) {
    return (
      <>
        <TopBar title={c.title} crumb="AI 상담" back="/ai" right={<Link href="/ai" className={btnCls("secondary")}><Plus size={15} /> 새 상담</Link>} />
        <main className="mx-auto max-w-[960px] px-4 pb-[170px] pt-4 tab:px-6 tab:pb-[110px] desk:px-[42px]">
          <Chat c={c} aiOn={aiOn} />
        </main>
      </>
    );
  }
  return (<><TopBar title="AI 상담" crumb="AI 법률 도우미" /><Start aiOn={aiOn} /></>);
}

export default function AiPage() {
  return <Suspense><Inner /></Suspense>;
}
