"use client";
/* eslint-disable @next/next/no-img-element -- 서명 이미지는 data URL이라 next/image를 쓸 수 없음 */
import { useState } from "react";
import { dday } from "@/lib/analyze";
import { printConsent } from "@/lib/consentPrint";
import { addConsent, closeConsent, getConsents, sha256Text, sign, useLive, useLoad, type ConsentForm, type Member, type Signature } from "@/lib/cloud";
import {
  ActionPanel, Alert, Btn, CardGrid, CaseCard, CheckRow, ChoiceGroup, DataTable, Empty, Field, Loading, Panel, Section, SignaturePad, SubPanel, TextBtn, inputCls, runBusy, type BadgeSpec,
} from "@/components/ui";

const when = (t: string) => new Date(t).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function stateBadge(f: ConsentForm): BadgeSpec {
  if (f.closed) return { text: "마감", tone: "gray" };
  if (f.deadline) { const d = dday(f.deadline); if (d.startsWith("D+")) return { text: "기한 지남", tone: "gray" }; return { text: `진행 중 · ${d}`, tone: "blue" }; }
  return { text: "진행 중", tone: "blue" };
}
const isOpen = (f: ConsentForm) => !f.closed && !(f.deadline && dday(f.deadline).startsWith("D+"));

export default function Consents({ caseId, caseTitle, uid, role, myName, memberCount, members }: { caseId: string; caseTitle: string; uid: string; role: Member["role"]; myName: string; memberCount: number; members: Member[] }) {
  const data = useLoad(() => getConsents(caseId), [caseId]);
  useLive(caseId, ["consent_forms", "consent_signatures"], data.reload);
  const [sel, setSel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const forms = data.data?.forms || [];
  const sigs = data.data?.sigs || [];
  const f = forms.find((x) => x.id === sel);

  if (data.loading && !data.data) return <Loading>동의서 불러오는 중</Loading>;
  if (data.error) return <Alert tone="danger" title="불러오기 실패">{data.error}</Alert>;
  if (f) return <Detail f={f} sigs={sigs.filter((s) => s.form_id === f.id)} uid={uid} role={role} myName={myName} members={members} caseTitle={caseTitle} back={() => setSel(null)} reload={data.reload} />;
  if (creating) return <Create caseId={caseId} myName={myName} done={(id) => { setCreating(false); data.reload(); if (id) setSel(id); }} />;

  return (
    <>
      {role !== "viewer" ? (
        <div className="mt-5">
          <ActionPanel title="새 동의서 만들기" desc="주제 하나에 동의서 하나. 참여자 모두가 읽고 동의·반대를 고른 뒤 손글씨로 서명합니다."
            action={<Btn onClick={() => setCreating(true)}>동의서 만들기</Btn>} />
        </div>
      ) : <Alert tone="info" title="서명만 가능">동의서는 ‘작성 가능’ 권한이 있는 사람이 만듭니다. 열람만 권한이어도 서명은 할 수 있습니다.</Alert>}
      <Section title="동의서 목록" desc="눌러서 읽고 서명하기" kicker="CONSENT">
        {forms.length === 0 ? <Empty>아직 동의서가 없습니다.</Empty> : (
          <CardGrid>
            {forms.map((x) => {
              const s = sigs.filter((y) => y.form_id === x.id);
              const mine = s.find((y) => y.user_id === uid);
              const agree = s.filter((y) => y.decision === "agree").length;
              return (
                <CaseCard key={x.id} badges={[stateBadge(x), mine ? { text: mine.decision === "agree" ? "내가 동의함" : "내가 반대함", tone: mine.decision === "agree" ? "green" : "red" } : isOpen(x) ? { text: "서명 필요", tone: "amber" } : { text: "미서명", tone: "gray" }]}
                  title={x.title} desc={`동의 ${agree} · 반대 ${s.length - agree} · 미서명 ${Math.max(0, memberCount - s.length)} (참여자 ${memberCount}명)`}
                  meta={`${x.author_name} · ${when(x.created_at)}${x.deadline ? ` · 기한 ${x.deadline}` : ""}`}
                  footer={<TextBtn onClick={() => setSel(x.id)}>{mine || !isOpen(x) ? "현황 보기 →" : "읽고 서명하기 →"}</TextBtn>} />
              );
            })}
          </CardGrid>
        )}
      </Section>
    </>
  );
}

function Create({ caseId, myName, done }: { caseId: string; myName: string; done: (id?: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    setTried(true);
    if (!title.trim() || !body.trim()) return;
    if (deadline && deadline < new Date().toISOString().slice(0, 10)) { setErr("기한은 오늘 이후 날짜로 정해 주세요."); return; }
    runBusy("동의서 만드는 중", async () => {
      try { const f = await addConsent({ case_id: caseId, author_name: myName, title, body, deadline: deadline || null }); done(f.id); }
      catch (e) { setErr(e instanceof Error ? e.message : "만들지 못했습니다."); }
    });
  };
  return (
    <Section title="새 동의서" desc="만든 뒤에는 내용을 고칠 수 없습니다 (서명한 내용이 바뀌지 않게)" kicker="NEW CONSENT">
      <Panel>
        <Field label="주제(제목)" required error={tried && !title.trim() ? "제목을 입력해 주세요." : undefined}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-invalid={tried && !title.trim()} className={inputCls} placeholder="예) 조합장 해임 총회 소집 요구 동의" />
        </Field>
        <Field label="동의서 내용" required help="무엇에 동의하는지, 어디에 쓰는지, 철회 방법을 분명하게 적으세요." error={tried && !body.trim() ? "내용을 입력해 주세요." : undefined}>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} maxLength={10000} aria-invalid={tried && !body.trim()} className={`${inputCls} min-h-[180px] resize-y leading-relaxed`}
            placeholder={"예)\n본인은 ○○구역 조합원으로서 「도시정비법」 제44조에 따라 조합장 해임을 위한 임시총회 소집을 요구하는 데 동의합니다.\n이 동의서는 소집 요구서에 첨부되며, 총회 소집 전까지 서면으로 철회할 수 있습니다."} />
        </Field>
        <Field label="기한 (선택)" help="이 날이 지나면 더 이상 서명할 수 없습니다."><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} /></Field>
        <Alert tone="warn" title="법적 효력">앱 안의 전자 서명은 기록·취합용입니다. 총회 소집 요구 등 법정 동의서는 조합 정관이 정한 방식(서면·인감 등)을 따로 확인하세요.</Alert>
        <div className="mt-3 flex gap-[9px]"><Btn onClick={submit}>동의서 만들기</Btn><Btn kind="secondary" onClick={() => done()}>취소</Btn></div>
        {err && <Alert tone="danger" title="실패">{err}</Alert>}
      </Panel>
    </Section>
  );
}

function Detail({ f, sigs, uid, role, myName, members, caseTitle, back, reload }: { f: ConsentForm; sigs: Signature[]; uid: string; role: Member["role"]; myName: string; members: Member[]; caseTitle: string; back: () => void; reload: () => void }) {
  const mine = sigs.find((s) => s.user_id === uid);
  const [name, setName] = useState(myName);
  const [decision, setDecision] = useState<"agree" | "disagree" | "">("");
  const [read, setRead] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const open = isOpen(f);
  const canClose = f.author_id === uid || role === "owner";
  const agree = sigs.filter((s) => s.decision === "agree").length;
  const unsigned = members.filter((m) => !sigs.some((s) => s.user_id === m.user_id));
  const missing = [!name.trim() && "이름", !decision && "동의·반대 선택", !read && "내용 확인", !png && "서명"].filter(Boolean) as string[];

  const submit = () => {
    setTried(true); setErr(null);
    if (missing.length) return;
    runBusy("서명 저장 중", async () => {
      try {
        const h = await sha256Text(f.body);
        if (h !== f.body_hash) throw new Error("화면의 동의서 내용이 서버와 다릅니다. 새로 고친 뒤 다시 서명하세요.");
        await sign({ form_id: f.id, case_id: f.case_id, signer_name: name.trim(), decision: decision as "agree" | "disagree", signature: png!, body_hash: h });
        reload();
      } catch (e) { setErr(e instanceof Error ? e.message : "저장하지 못했습니다."); }
    }, 600);
  };
  const print = () => {
    const ok = printConsent({ f, sigs, caseTitle, unsignedCount: unsigned.length, when });
    if (!ok) setErr("팝업이 막혔습니다. 브라우저에서 팝업을 허용해 주세요.");
  };
  return (
    <>
      <div className="mt-4"><TextBtn onClick={back}>← 동의서 목록</TextBtn></div>
      <Section title={f.title} desc={`${f.author_name} · ${when(f.created_at)}${f.deadline ? ` · 기한 ${f.deadline} (${dday(f.deadline)})` : ""}`} kicker={f.closed ? "CLOSED" : "CONSENT"}>
        <Panel>
          <p className="t-text whitespace-pre-wrap break-words">{f.body}</p>
          <p className="t-meta mt-3 break-all">본문 확인값 {f.body_hash.slice(0, 16)}… · 만든 뒤 내용을 바꿀 수 없습니다</p>
        </Panel>
      </Section>

      {mine ? (
        <Section title="내 서명" kicker="MY SIGNATURE">
          <Panel>
            <p className="t-title">{mine.signer_name} · {mine.decision === "agree" ? "동의합니다" : "동의하지 않습니다"}</p>
            <p className="t-meta">{when(mine.signed_at)} 서명 · 서명은 바꾸거나 지울 수 없습니다</p>
            <SubPanel><img src={mine.signature} alt={`${mine.signer_name} 서명`} className="mx-auto h-24 object-contain" /></SubPanel>
          </Panel>
        </Section>
      ) : open ? (
        <Section title="서명하기" desc="모두 채워야 제출할 수 있습니다" kicker="SIGN">
          <Panel>
            <Field label="이름" required error={tried && !name.trim() ? "이름을 입력해 주세요." : undefined}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={inputCls} />
            </Field>
            <p className="t-label mb-1.5">의사 표시 <span className="text-red">*</span></p>
            <ChoiceGroup label="의사 표시" value={decision} onChange={setDecision} options={[{ value: "agree", label: "동의합니다", tone: "green" }, { value: "disagree", label: "동의하지 않습니다", tone: "red" }]} />
            <CheckRow checked={read} onChange={setRead} title="위 동의서 내용을 끝까지 읽고 이해했습니다" />
            <p className="t-label mb-1.5 mt-2">손글씨 서명 <span className="text-red">*</span></p>
            <SignaturePad onChange={setPng} />
            {tried && missing.length > 0 && <Alert tone="danger" title="빠진 항목">{missing.join(", ")}을(를) 채워 주세요.</Alert>}
            <Btn onClick={submit} className="mt-3 w-full tab:w-auto">서명 제출</Btn>
            <p className="t-meta mt-2">제출하면 이름·의사·서명·시각·로그인 계정이 함께 저장되고 바꿀 수 없습니다.</p>
            {err && <Alert tone="danger" title="저장 실패">{err}</Alert>}
          </Panel>
        </Section>
      ) : <Alert tone="info" title="서명 마감">{f.closed ? "마감된 동의서입니다." : "기한이 지나 더 이상 서명할 수 없습니다."}</Alert>}

      <Section title="서명 현황" desc={`동의 ${agree} · 반대 ${sigs.length - agree} · 미서명 ${unsigned.length}`} kicker="STATUS">
        {sigs.length === 0 ? <Empty>아직 서명한 사람이 없습니다.</Empty> : (
          <DataTable head={["이름", "의사", "서명", "일시"]} rows={sigs.map((s) => [
            s.signer_name, s.decision === "agree" ? "동의" : "반대",
            <img key="i" src={s.signature} alt={`${s.signer_name} 서명`} className="h-10 max-w-[120px] object-contain" />, when(s.signed_at),
          ])} />
        )}
        {unsigned.length > 0 && <p className="t-desc mt-2.5">미서명: {unsigned.map((m) => m.display_name).join(", ")}</p>}
        <div className="mt-3.5 flex flex-wrap gap-[9px]">
          <Btn kind="secondary" onClick={() => runBusy("인쇄 화면 여는 중", print, 600)}>현황 인쇄·PDF</Btn>
          {canClose && <Btn kind="ghost" onClick={() => runBusy(f.closed ? "다시 여는 중" : "마감하는 중", async () => { try { await closeConsent(f.id, !f.closed); reload(); } catch (e) { setErr(e instanceof Error ? e.message : "실패"); } })}>{f.closed ? "다시 열기" : "서명 마감"}</Btn>}
        </div>
      </Section>
    </>
  );
}
