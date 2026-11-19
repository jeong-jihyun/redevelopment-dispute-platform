"use client";
import { useState } from "react";
import { ymd } from "@/lib/analyze";
import { buildIcs, ddayBadge, deadlineLaws, lawDeadline, saveFile } from "@/lib/cases";
import { logCase, uid, update, type Case, type Schedule } from "@/lib/store";
import { Alert, Btn, CardGrid, CaseCard, Empty, Field, Panel, Section, SelectField, TextBtn, inputCls } from "@/components/ui";

export default function ScheduleTab({ c }: { c: Case }) {
  const [mode, setMode] = useState<"law" | "free">("law");
  const [lawId, setLawId] = useState(deadlineLaws().find((l) => c.lawIds.includes(l.id))?.id || deadlineLaws()[0].id);
  const [base, setBase] = useState(ymd(new Date()));
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<Schedule["kind"]>("일정");
  const [memo, setMemo] = useState("");
  const [tried, setTried] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const calc = mode === "law" ? lawDeadline(lawId, base) : null;
  const errTitle = tried && mode === "free" && !title.trim() ? "제목을 입력해 주세요." : undefined;
  const errDate = tried && mode === "free" && !date ? "날짜를 고르세요." : undefined;

  function add() {
    setTried(true);
    let s: Schedule;
    if (mode === "law") {
      if (!calc) return;
      s = { id: uid(), title: calc.law.deadline!.label, date: calc.date, kind: "기한", basis: calc.basis, memo: `기준일 ${base}${memo ? ` · ${memo}` : ""}` };
    } else {
      if (!title.trim() || !date) return;
      s = { id: uid(), title: title.trim(), date, kind, memo: memo.trim() || undefined };
    }
    update((d) => { const cs = d.cases.find((x) => x.id === c.id)!; cs.schedules.push(s); logCase(cs, `${s.kind} 등록 · ${s.title} (${s.date})`); });
    setMsg(`‘${s.title}’ ${s.date}를 등록했습니다. 휴대폰 알림을 받으려면 아래 ‘휴대폰 캘린더에 넣기’를 누르세요.`);
    setTitle(""); setDate(""); setMemo(""); setTried(false);
  }
  const patch = (sid: string, fn: (s: Schedule) => void, action: string) => update((d) => {
    const cs = d.cases.find((x) => x.id === c.id)!; const s = cs.schedules.find((x) => x.id === sid); if (!s) return; fn(s); logCase(cs, action);
  });
  const list = [...c.schedules].filter((s) => showDone || !s.done).sort((a, b) => a.date.localeCompare(b.date));
  const open = c.schedules.filter((s) => !s.done);

  return (
    <>
      <Section title="일정 및 기한" desc="가까운 날짜 순서" kicker="SCHEDULE">
        <div className="max-w-[260px]">
          <SelectField label="보기" value={showDone ? "all" : "open"} onChange={(v) => setShowDone(v === "all")} options={[{ value: "open", label: `남은 일정 (${open.length})` }, { value: "all", label: `전체 (${c.schedules.length})` }]} />
        </div>
        {list.length === 0 ? <Empty>등록한 일정이 없습니다. 아래에서 법정 기한을 계산해 넣어 보세요.</Empty> : (
          <CardGrid>
            {list.map((s) => (
              <CaseCard key={s.id} badges={[{ text: s.kind, tone: s.kind === "기한" ? "amber" : "blue" }, ddayBadge(s)]} title={s.title}
                desc={[s.basis, s.memo].filter(Boolean).join(" · ") || undefined} meta={s.date}
                footer={
                  <span className="flex shrink-0 items-center gap-3">
                    <TextBtn tone="muted" onClick={() => patch(s.id, (x) => { x.done = !x.done; }, `${s.done ? "일정 되돌림" : "일정 완료"} · ${s.title}`)}>{s.done ? "되돌리기" : "완료"}</TextBtn>
                    <TextBtn tone="danger" onClick={() => update((d) => { const cs = d.cases.find((x) => x.id === c.id)!; cs.schedules = cs.schedules.filter((x) => x.id !== s.id); logCase(cs, `일정 삭제 · ${s.title}`); })}>삭제</TextBtn>
                  </span>
                } />
            ))}
          </CardGrid>
        )}
        {open.length > 0 && (
          <Panel className="mt-3.5">
            <p className="t-title">휴대폰 캘린더에 넣기</p>
            <p className="t-desc">남은 일정 {open.length}건을 캘린더 파일(.ics)로 내려받습니다. 파일을 열면 휴대폰 캘린더에 추가되고, 기한 7일 전·하루 전에 알림이 옵니다.</p>
            <div className="mt-3"><Btn kind="secondary" onClick={() => { saveFile(buildIcs(open.map((s) => ({ s, caseTitle: c.title }))), `일정_${c.title.replace(/[\\/:*?"<>|]/g, "")}.ics`); update((d) => { const cs = d.cases.find((x) => x.id === c.id)!; logCase(cs, `캘린더 파일 내려받기 (${open.length}건)`); }); }}>캘린더 파일 내려받기</Btn></div>
          </Panel>
        )}
      </Section>

      <Section title="일정 추가" kicker="ADD">
        <Panel>
          <SelectField label="추가 방법" value={mode} onChange={(v) => { setMode(v as "law" | "free"); setTried(false); }} options={[{ value: "law", label: "법정 기한 계산" }, { value: "free", label: "직접 입력" }]} />
          {mode === "law" ? (
            <>
              <SelectField label="기한 종류" value={lawId} onChange={setLawId} options={deadlineLaws().map((l) => ({ value: l.id, label: `${l.deadline!.label} (${l.deadline!.days}일)` }))} />
              <Field label={`기준일 · ${calc?.law.deadline?.from || ""}`} help="통지서·결정서를 실제로 받은 날을 고르세요.">
                <input type="date" value={base} onChange={(e) => setBase(e.target.value)} className={inputCls} />
              </Field>
              {calc && (
                <Alert tone="warn" title={`계산 결과 ${calc.date}`}>
                  {calc.basis}. 공휴일·송달 시점·다른 기산 방법(처분이 있은 날부터 180일·1년 등)은 반영되지 않으니 전문가와 확인하세요.
                </Alert>
              )}
            </>
          ) : (
            <>
              <Field label="제목" required error={errTitle}><input value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errTitle} className={inputCls} placeholder="예) 임시총회 참석" /></Field>
              <Field label="날짜" required error={errDate}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errDate} className={inputCls} /></Field>
              <SelectField label="종류" value={kind} onChange={(v) => setKind(v as Schedule["kind"])} options={[{ value: "일정", label: "일정" }, { value: "기한", label: "기한 (넘기면 불이익)" }]} />
            </>
          )}
          <Field label="메모"><input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="예) 등기우편 접수번호" /></Field>
          <Btn onClick={add} className="w-full tab:w-auto">일정 추가</Btn>
        </Panel>
        {msg && <Alert tone="info" title="등록">{msg}</Alert>}
      </Section>
    </>
  );
}
