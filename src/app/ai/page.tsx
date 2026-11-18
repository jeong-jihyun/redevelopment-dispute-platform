"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Plus, SendHorizontal } from "lucide-react";
import { disputeById } from "@/lib/data";
import { detectFacts, maskSensitive, type Facts } from "@/lib/analyze";
import { analyzeQuestion, nextFollowUp } from "@/lib/chat";
import { getDB, now, uid, update, useDB, type Conversation, type Msg } from "@/lib/store";
import AnalysisCard from "@/components/AnalysisCard";
import { Alert, Badge, Card, Chip, Disclaimer, Empty, Eyebrow, Field, H2, Page, Step, TopBar, btnCls, inputCls } from "@/components/ui";

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

function Composer({ onSend, busy, placeholder, autoFocus }: { onSend: (t: string) => void; busy: boolean; placeholder: string; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [text]);
  const send = () => { const t = text.trim(); if (!t || busy) return; onSend(t); setText(""); };
  return (
    <div className="flex items-end gap-2 rounded-[14px] border border-line-strong bg-white p-1.5 pl-3 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_#3978ea20]">
      <textarea ref={ref} rows={1} value={text} maxLength={MAX} autoFocus={autoFocus} aria-label="질문 입력"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        placeholder={placeholder} className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 leading-snug outline-none focus-visible:outline-none" />
      <button type="button" onClick={send} disabled={!text.trim() || busy} aria-label="보내기" className={`${btnCls("primary")} !px-3`}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
      </button>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "user")
    return <div className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-blue-600 px-4 py-2.5 text-[15px] leading-relaxed text-white">{m.text}</div></div>;
  return null;
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
        {topic && <div className="flex justify-center"><Badge tone="blue">상담 주제 · {topic.name}</Badge></div>}
        {c.messages.map((m, i) => {
          if (m.role === "user") return <Bubble key={i} m={m} />;
          if (m.analysis) return <div key={i} ref={i === c.messages.length - 1 ? lastRef : undefined} className="scroll-mt-[76px]"><AnalysisCard a={m.analysis} note={m.note} /></div>;
          const isActive = i === c.messages.length - 1 && !!m.followUp && !busy;
          return (
            <div key={i} className="max-w-[92%] rounded-[18px] rounded-bl-[6px] border border-line bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
              <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-blue-600"><MessageCircle size={14} /> 정확한 분석을 위해 확인할게요</div>
              <p className="text-[15px] font-semibold text-navy-950">{m.text}</p>
              {m.followUp && isActive && (
                <>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.followUp.options.map((o) => <Chip key={o} onClick={() => answer(m.followUp!.key, o)}>{o}</Chip>)}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <button type="button" className={btnCls("ghost")} onClick={() => skip(m.followUp!.key)}>건너뛰기</button>
                    <button type="button" className={btnCls("ghost")} onClick={analyzeNow}>바로 분석하기 →</button>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">보기에 없으면 아래 입력창에 직접 적어도 됩니다.</p>
                </>
              )}
            </div>
          );
        })}
        {busy && (
          <div className="flex items-center gap-2 rounded-[14px] border border-line bg-white px-4 py-3 text-[14px] text-ink-500">
            <Loader2 size={16} className="animate-spin text-blue-600" /> {aiOn ? "AI가 법령·판례 근거를 대조하며 분석하고 있어요…" : "관련 분쟁 유형과 법령을 찾아 분석하고 있어요…"}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력창: 폰은 하단 탭 위, 태블릿·PC는 화면 아래 고정 */}
      <div className="no-print fixed inset-x-0 z-30 border-t border-line bg-canvas/95 px-3 py-2.5 backdrop-blur bottom-[calc(56px+env(safe-area-inset-bottom))] tab:bottom-0 tab:left-[210px] desk:left-[252px]">
        <div className="mx-auto max-w-[960px]">
          <Composer busy={busy} onSend={send} placeholder={activeFollow ? "직접 답하기…" : "이어서 질문하기 (예: 그럼 언제까지 해야 하나요?)"} />
        </div>
      </div>
    </>
  );
}

function StartForm({ onStart, topicName }: { onStart: (t: string) => void; topicName?: string }) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const empty = !text.trim();
  return (
    <form onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!empty) onStart(text); }}>
      <Field label="상황 설명" required help="언제, 누가, 무엇을 했는지 시간 순서대로 적어 주세요. 개인정보는 필요한 범위에서만 입력하세요.">
        <textarea value={text} maxLength={MAX} rows={4} onChange={(e) => setText(e.target.value)}
          placeholder={topicName ? `예) ${topicName} 관련해서 조합에서 통보를 받았는데…` : "예) 조합에 총회 회의록 열람을 요청했는데 한 달째 답이 없어요"}
          className={`${inputCls} min-h-[112px] resize-y leading-relaxed`} aria-invalid={touched && empty} />
      </Field>
      <div className="-mt-1 mb-3 flex items-center justify-between text-[11px]">
        <span className="text-red">{touched && empty ? "상황 설명을 입력해 주세요." : ""}</span>
        <span className="text-ink-400">{text.length} / {MAX}</span>
      </div>
      <Alert tone="info" title="개인정보 보호">주민등록번호·휴대폰 번호는 자동으로 가린 뒤 분석하며, 상담 내용은 이 기기에만 저장됩니다.</Alert>
      <div className="mt-3 flex flex-wrap gap-[9px]">
        <button type="submit" className={`${btnCls("primary")} flex-1 tab:flex-none`}>분석 시작</button>
        {!empty && <button type="button" className={btnCls("secondary")} onClick={() => { setText(""); setTouched(false); }}>지우기</button>}
      </div>
    </form>
  );
}

function Start({ aiOn }: { aiOn: boolean | null }) {
  const router = useRouter();
  const sp = useSearchParams();
  const db = useDB();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const topicId = sp.get("topic") || undefined;
  const topic = topicId ? disputeById(topicId) : undefined;
  const preset = sp.get("q");
  const started = useRef(false);

  function start(text: string) {
    const t = maskSensitive(text.trim());
    if (!t) return;
    const id = uid();
    update((d) => {
      d.conversations.unshift({ id, title: t.slice(0, 40), topic: topicId, facts: detectFacts(t), messages: [{ role: "user", text: t, at: now() }], pendingQuestion: t, skipped: [], createdAt: now(), updatedAt: now() });
    });
    router.replace(`/ai?c=${id}`);
  }
  // 검색 화면에서 넘어온 질문은 바로 시작
  useEffect(() => { if (preset && !started.current) { started.current = true; start(preset); } }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page>
      {/* 디자인 시스템: eyebrow → h1 → lead */}
      <Eyebrow>AI legal assistant</Eyebrow>
      <h1 className="mb-[9px] mt-[7px] text-[24px] font-bold tracking-[-0.7px] text-navy-950 tab:text-[30px] tab:tracking-[-1.2px]">내 상황 분석하기</h1>
      <p className="max-w-[720px] text-[14px] text-ink-500">상황을 적어 주시면 부족한 정보를 몇 가지 확인한 뒤 쟁점·근거 법령·대응 방법을 정리해 드립니다.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {aiOn === null ? <Badge>연결 확인 중</Badge> : aiOn ? <Badge tone="blue">AI 분석 연결됨</Badge> : <Badge tone="gray">기본 분석 모드</Badge>}
        <Badge tone="green">확인된 법령·판례만 인용</Badge>
        {topic && <Badge tone="purple">상담 주제 · {topic.short}</Badge>}
      </div>

      {/* 입력 컴포넌트: 패널 안 라벨·입력·도움말·검증 메시지 */}
      <Card className="mt-5">
        <StartForm onStart={start} topicName={topic?.short} />
      </Card>

      {/* 진행 순서: 사건 관리 UI 단계 패턴 */}
      <H2 desc="상담은 이 순서로 진행됩니다" kicker="PROCESS">진행 순서</H2>
      <Card className="!py-1">
        <Step n="1" title="상황 입력" desc="겪고 있는 일을 편하게 적습니다" />
        <Step n="2" title="추가 확인" desc="사업 유형·내 지위·사업 단계를 보기에서 고릅니다" />
        <Step n="3" title="분석 결과" desc="쟁점·근거 법령·판례·대응 방법을 정리합니다" />
        <Step n="4" title="다음 행동" desc="필요한 서류 작성과 사건 관리로 이어집니다" />
      </Card>

      <H2 desc="누르면 바로 상담이 시작됩니다" kicker="EXAMPLES">이렇게 물어보세요</H2>
      <Card className="!py-1">
        {EXAMPLES.map((e, i) => (
          <button key={e} type="button" onClick={() => start(e)} className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-0">
            <span className="grid h-[25px] w-[25px] shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-600">{i + 1}</span>
            <span className="min-w-0 flex-1 text-[14px] text-ink-900">{e}</span>
            <span className="shrink-0 text-[12px] font-bold text-ink-700">시작 →</span>
          </button>
        ))}
      </Card>

      <H2 desc="이 기기에 저장된 상담" kicker="HISTORY">최근 상담</H2>
      {db.conversations.length === 0 ? <Empty>아직 상담 기록이 없습니다.</Empty> : (
        <div className="grid gap-3.5 tab:grid-cols-2">
          {db.conversations.map((c) => {
            const done = c.messages.find((m) => m.analysis)?.analysis;
            const kind = done?.disputes[0]?.name.split(" ")[0] || (c.topic ? disputeById(c.topic)?.short : undefined);
            return (
              <article key={c.id} className="rounded-[14px] border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-2.5">
                  <Badge tone="blue">{kind || "분류 전"}</Badge>
                  <Badge tone={done ? "green" : "amber"}>{done ? "분석 완료" : "답변 대기"}</Badge>
                </div>
                <h3 className="mb-[5px] mt-[13px] line-clamp-2 text-[14px] font-bold text-navy-950">{c.title}</h3>
                <p className="text-[12px] text-ink-500">질문 {c.messages.filter((m) => m.role === "user").length}건 · 분석 {c.messages.filter((m) => m.analysis).length}건</p>
                <div className="mt-[14px] flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-400">
                  <span>최근 업데이트 {new Date(c.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex items-center gap-3">
                    {confirmDel === c.id ? (
                      <>
                        <button className="font-bold text-red" onClick={() => { update((d) => { d.conversations = d.conversations.filter((x) => x.id !== c.id); }); setConfirmDel(null); }}>삭제 확인</button>
                        <button className="font-bold text-ink-500" onClick={() => setConfirmDel(null)}>취소</button>
                      </>
                    ) : (
                      <button aria-label="상담 삭제" className="text-ink-400 hover:text-red" onClick={() => setConfirmDel(c.id)}>삭제</button>
                    )}
                    <Link href={`/ai?c=${c.id}`} className="font-bold text-ink-700">상담 보기 →</Link>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Disclaimer />
    </Page>
  );
}

function Inner() {
  const sp = useSearchParams();
  const db = useDB();
  const aiOn = useStatus();
  const cid = sp.get("c");
  const c = cid ? db.conversations.find((x) => x.id === cid) : undefined;

  if (cid && !c && typeof window !== "undefined") {
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
