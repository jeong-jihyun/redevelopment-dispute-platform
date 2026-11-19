"use client";
import { useState } from "react";
import { MEMBER_ROLES } from "@/lib/cases";
import { fmtDate, getDB, logCase, now, uid, update, type Case } from "@/lib/store";
import { Alert, Btn, runBusy, CardGrid, CaseCard, CheckRow, Field, Panel, Section, SelectField, TextBtn, inputCls, type Tone } from "@/components/ui";

const roleTone = (r: string): Tone => (r === "사건 소유자" ? "blue" : r === "외부 전문가" ? "purple" : r === "관리자" ? "blue" : "gray");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MembersTab({ c }: { c: Case }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("일반 참여자");
  const [tried, setTried] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dupe = email && c.members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase());
  const errName = tried && !name.trim() ? "이름을 입력해 주세요." : undefined;
  const errEmail = tried && (!EMAIL.test(email.trim()) ? "이메일 형식을 확인해 주세요." : dupe ? "이미 등록된 이메일입니다." : undefined);

  function invite() {
    setTried(true);
    if (!name.trim() || !EMAIL.test(email.trim()) || dupe) return;
    runBusy("초대 등록 중", () => {
    if (getDB().cases.find((x) => x.id === c.id)?.members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) return;
    update((d) => {
      const cs = d.cases.find((x) => x.id === c.id)!;
      cs.members.push({ id: uid(), name: name.trim(), email: email.trim(), role, invitedAt: now(), accepted: false });
      logCase(cs, `참여자 초대 · ${name.trim()} (${role})`);
    });
    setMsg(`${name.trim()}님을 ‘수락 대기’로 등록했습니다.`);
    setName(""); setEmail(""); setRole("일반 참여자"); setTried(false);
    });
  }
  const m = c.members.find((x) => x.id === sel);
  const ownerCount = c.members.filter((x) => x.role === "사건 소유자").length;
  const patch = (fn: (x: Case["members"][number]) => void, action: string) => update((d) => {
    const cs = d.cases.find((x) => x.id === c.id)!; const mm = cs.members.find((x) => x.id === sel); if (!mm) return; fn(mm); logCase(cs, action);
  });

  return (
    <>
      <Alert tone="info" title="연락처 기록">이 목록은 이 기기에만 남는 기록입니다. 실제로 함께 보고 글·동의서에 참여하게 하려면 ‘공유’ 탭에서 초대 링크를 보내세요.</Alert>
      <Section title="참여자" desc="누르면 권한을 바꿀 수 있습니다" kicker="MEMBERS">
        <CardGrid>
          {c.members.map((x) => (
            <CaseCard key={x.id} badges={[{ text: x.role, tone: roleTone(x.role) }, x.accepted ? { text: "참여 중", tone: "green" } : { text: "수락 대기", tone: "amber" }]}
              title={x.name} desc={[x.email || "이메일 없음", MEMBER_ROLES.find((r) => r.name === x.role)?.desc].filter(Boolean).join(" · ")}
              meta={`등록 ${fmtDate(x.invitedAt)}`} footer={<TextBtn onClick={() => { setSel(sel === x.id ? null : x.id); setConfirm(false); }}>{sel === x.id ? "닫기" : "권한 변경"}</TextBtn>} />
          ))}
        </CardGrid>
        {m && (
          <Panel className="mt-3.5">
            <p className="t-title mb-2">{m.name} · 권한 변경</p>
            <SelectField label="권한" value={m.role} onChange={(v) => {
              if (m.role === "사건 소유자" && v !== m.role && ownerCount <= 1) { setMsg("사건 소유자는 최소 1명 있어야 합니다. 다른 사람을 먼저 소유자로 지정하세요."); return; }
              patch((x) => { x.role = v; }, `권한 변경 · ${m.name} → ${v}`);
            }} options={MEMBER_ROLES.map((r) => ({ value: r.name, label: `${r.name} — ${r.desc}` }))} />
            <CheckRow checked={m.accepted} onChange={(v) => patch((x) => { x.accepted = v; }, `참여 상태 · ${m.name} → ${v ? "참여 중" : "수락 대기"}`)} title="초대를 수락함" desc="상대가 수락했다고 알려 오면 체크하세요." />
            <div className="mt-3 flex flex-wrap gap-[9px]">
              {m.role === "사건 소유자" && ownerCount <= 1 ? <p className="t-meta">마지막 사건 소유자는 뺄 수 없습니다.</p>
                : confirm ? <><Btn kind="danger" onClick={() => runBusy("참여자 빼는 중", () => { update((d) => { const cs = d.cases.find((x) => x.id === c.id)!; cs.members = cs.members.filter((x) => x.id !== m.id); logCase(cs, `참여자 제외 · ${m.name}`); }); setSel(null); setConfirm(false); })}>정말 빼기</Btn><Btn kind="secondary" onClick={() => setConfirm(false)}>취소</Btn></>
                : <Btn kind="danger" onClick={() => setConfirm(true)}>사건에서 빼기</Btn>}
            </div>
          </Panel>
        )}
      </Section>

      <Section title="참여자 초대" desc="가족·대표단·변호사 등 함께 볼 사람" kicker="INVITE">
        <Panel>
          <Field label="이름" required error={errName}><input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errName} className={inputCls} placeholder="홍길동" /></Field>
          <Field label="이메일" required error={errEmail || undefined}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errEmail} className={inputCls} placeholder="name@example.com" /></Field>
          <SelectField label="권한" value={role} onChange={setRole} options={MEMBER_ROLES.filter((r) => r.name !== "사건 소유자").map((r) => ({ value: r.name, label: `${r.name} — ${r.desc}` }))} />
          <Btn onClick={invite} className="w-full tab:w-auto">초대 등록</Btn>
        </Panel>
        {msg && <Alert tone="info" title="참여자">{msg}</Alert>}
      </Section>
    </>
  );
}
