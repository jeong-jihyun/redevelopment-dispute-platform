"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SHARE_PARTS, buildSnapshot, cloudReady, getMembers, inviteUrl, myShare, newInviteCode, publish, stopShare, updateShare, useLoad, useSession, type SharePart } from "@/lib/cloud";
import { fmtDate, getDB, logCase, update, useDB, type Case } from "@/lib/store";
import { ActionPanel, Alert, Btn, CheckRow, Loading, Panel, Section, SelectField, StepList, SubPanel, btnCls, runBusy } from "@/components/ui";

export default function CaseShare({ c }: { c: Case }) {
  const db = useDB();
  const session = useSession();
  const uid = session?.user.id;
  const share = useLoad(uid ? () => myShare(c.id, uid) : null, [c.id, uid]);
  const sc = share.data || null;
  const mem = useLoad(sc ? () => getMembers(sc.id) : null, [sc?.id]);
  const [parts, setParts] = useState<SharePart[]>(["overview", "schedule", "evidence", "laws"]);
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "danger"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (sc) setParts(sc.share_parts); }, [sc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cloudReady) return <Alert tone="warn" title="준비 중">공유 서버가 아직 연결되지 않았습니다.</Alert>;
  if (session === undefined) return <Loading>로그인 상태 확인 중</Loading>;
  if (!session) {
    return (
      <>
        <div className="mt-5">
          <ActionPanel title="공유하려면 로그인" desc="이메일로 받은 링크나 6자리 코드로 로그인합니다. 비밀번호는 없습니다."
            action={<Link href={`/auth?next=${encodeURIComponent(`/cases/${c.id}?tab=share`)}`} className={btnCls("primary")}>이메일로 로그인</Link>} />
        </div>
        <Section title="사건 공유란?" kicker="ABOUT">
          <StepList items={[
            { title: "공개할 내용 고르기", desc: "개요·일정·증거 목록·근거 법령 중 고른 것만 올라갑니다. 증거 원본 파일과 AI 상담은 올라가지 않습니다." },
            { title: "초대 링크 보내기", desc: "카카오톡·문자로 링크를 보내면, 받은 사람이 로그인 후 참여합니다." },
            { title: "함께 쓰기", desc: "참여자는 커뮤니티에 글을 쓰고 동의서에 손글씨로 서명합니다." },
          ]} />
        </Section>
      </>
    );
  }
  if (share.loading && !share.data) return <Loading>공유 상태 확인 중</Loading>;
  if (share.error) return <Alert tone="danger" title="불러오기 실패">{share.error}</Alert>;

  const toggle = (p: SharePart, v: boolean) => setParts((x) => (v ? [...x, p] : x.filter((y) => y !== p)));
  const changed = sc ? JSON.stringify([...sc.share_parts].sort()) !== JSON.stringify([...parts].sort()) : true;
  const preview = buildSnapshot(c, parts, db);
  const pv = [
    preview.overview && "개요",
    preview.description && "사건 설명",
    preview.schedules && `일정 ${preview.schedules.length}건`,
    preview.evidence && `증거 목록 ${preview.evidence.length}건`,
    preview.laws && `조문 ${preview.laws.length}개`,
    preview.docs && `서류 ${preview.docs.length}건`,
  ].filter(Boolean).join(" · ") || "없음 (커뮤니티·동의서만)";

  const doPublish = () => runBusy(sc ? "공유 내용 업데이트 중" : "공유 시작하는 중", async () => {
    try {
      const name = getDB().profile?.name || session.user.email?.split("@")[0] || "사건 주인";
      await publish(c, parts, getDB(), name, sc);
      update((d) => { const cs = d.cases.find((x) => x.id === c.id); if (cs) logCase(cs, `${sc ? "공유 내용 업데이트" : "공유 시작"} · ${pv}`); });
      setMsg({ tone: "info", text: sc ? "참여자에게 보이는 내용을 지금 상태로 바꿨습니다." : "공유를 시작했습니다. 아래 초대 링크를 보내세요." });
      share.reload();
    } catch (e) { setMsg({ tone: "danger", text: e instanceof Error ? e.message : "실패했습니다." }); }
  }, 600);
  const link = sc ? inviteUrl(sc.invite_code) : "";
  const copy = () => runBusy("링크 복사 중", async () => {
    try { await navigator.clipboard.writeText(link); setMsg({ tone: "info", text: "초대 링크를 복사했습니다. 카카오톡·문자에 붙여 넣으세요." }); }
    catch { setMsg({ tone: "warn", text: "복사가 막혔습니다. 링크를 길게 눌러 직접 복사하세요." }); }
  }, 300);
  const sendLink = () => { if (navigator.share) navigator.share({ title: `${c.title} 공유 초대`, text: `‘${c.title}’ 사건 공유에 초대합니다.`, url: link }).catch(() => {}); else copy(); };
  const patch = (label: string, p: Parameters<typeof updateShare>[1], done: string) => runBusy(label, async () => {
    try { await updateShare(sc!.id, p); setMsg({ tone: "info", text: done }); share.reload(); } catch (e) { setMsg({ tone: "danger", text: e instanceof Error ? e.message : "실패했습니다." }); }
  });
  const stop = () => runBusy("공유 멈추는 중", async () => {
    try {
      await stopShare(sc!.id);
      update((d) => { const cs = d.cases.find((x) => x.id === c.id); if (cs) logCase(cs, "공유 중단 (커뮤니티·동의서 함께 삭제)"); });
      setConfirm(false); setMsg({ tone: "info", text: "공유를 멈췄습니다. 참여자는 더 이상 볼 수 없습니다." }); share.reload();
    } catch (e) { setMsg({ tone: "danger", text: e instanceof Error ? e.message : "실패했습니다." }); }
  }, 600);

  return (
    <>
      {msg && <Alert tone={msg.tone} title="공유">{msg.text}</Alert>}
      {sc && (
        <div className="mt-5">
          <ActionPanel title="공유 중 · 커뮤니티와 동의서" desc={`참여자 ${mem.data?.length ?? "…"}명 · 마지막 공유 ${fmtDate(sc.updated_at)}`}
            action={<Link href={`/shared/${sc.id}`} className={btnCls("secondary")}>공유 공간 열기</Link>} />
        </div>
      )}

      <Section title="공개할 내용" desc="참여자는 여기서 고른 것만 봅니다" kicker="SHARE SCOPE">
        <Panel className="!py-1">
          {SHARE_PARTS.map((p) => <CheckRow key={p.id} checked={parts.includes(p.id)} onChange={(v) => toggle(p.id, v)} title={p.title} desc={p.desc} />)}
        </Panel>
        <div className="mt-3"><SubPanel><p className="t-label">올라갈 내용</p><p className="t-desc">{pv}</p></SubPanel></div>
        <Alert tone="info" title="올라가지 않는 것">증거 원본 파일, AI 상담 내용, 활동 이력, 참여자 기록은 이 기기에만 남습니다.</Alert>
        <div className="mt-3">
          {sc ? <Btn kind={changed ? "primary" : "secondary"} onClick={doPublish}>{changed ? "바뀐 범위로 업데이트" : "지금 내용으로 다시 올리기"}</Btn>
            : <Btn onClick={doPublish} className="w-full tab:w-auto">공유 시작</Btn>}
          {sc && <p className="t-meta mt-2">사건을 고친 뒤에는 ‘다시 올리기’를 눌러야 참여자 화면에 반영됩니다.</p>}
        </div>
      </Section>

      {sc && (
        <>
          <Section title="초대 링크" desc="링크를 가진 사람은 로그인 후 참여할 수 있습니다" kicker="INVITE">
            <Panel>
              <SubPanel><p className="t-body break-all">{sc.invite_open ? link : "초대가 닫혀 있습니다"}</p></SubPanel>
              <div className="mt-3 flex flex-wrap gap-[9px]">
                <Btn kind="secondary" onClick={sendLink} disabled={!sc.invite_open}>링크 보내기</Btn>
                <Btn kind="secondary" onClick={copy} disabled={!sc.invite_open}>복사</Btn>
              </div>
              <div className="mt-3">
                <SelectField label="새로 들어오는 사람의 권한" value={sc.invite_role} onChange={(v) => patch("권한 바꾸는 중", { invite_role: v as "editor" | "viewer" }, "새 참여자 권한을 바꿨습니다. 이미 들어온 사람은 ‘참여자’에서 바꾸세요.")}
                  options={[{ value: "editor", label: "작성 가능 — 글·댓글·동의서 작성" }, { value: "viewer", label: "열람만 — 보기·서명만" }]} />
              </div>
              <CheckRow checked={sc.invite_open} onChange={(v) => patch(v ? "초대 여는 중" : "초대 닫는 중", { invite_open: v }, v ? "초대를 다시 열었습니다." : "초대를 닫았습니다. 링크로 새로 들어올 수 없습니다.")} title="초대 받기" desc="끄면 링크로 새로 들어올 수 없습니다 (이미 들어온 사람은 그대로)" />
              <div className="mt-2"><Btn kind="ghost" onClick={() => patch("새 링크 만드는 중", { invite_code: newInviteCode() }, "새 초대 링크를 만들었습니다. 이전 링크는 더 이상 쓸 수 없습니다.")}>링크 새로 만들기 (이전 링크 무효)</Btn></div>
            </Panel>
          </Section>

          <Section title="공유 멈추기" kicker="DANGER">
            <Panel>
              <p className="t-desc">서버에서 이 사건의 공유 내용·참여자·커뮤니티 글·동의서와 서명이 모두 지워집니다. 이 기기의 사건 자료는 그대로입니다. 동의서 서명이 필요하면 먼저 ‘현황 인쇄·PDF’로 보관하세요.</p>
              <div className="mt-3 flex gap-[9px]">
                {confirm ? <><Btn kind="danger" onClick={stop}>정말 공유 멈추기</Btn><Btn kind="secondary" onClick={() => setConfirm(false)}>취소</Btn></>
                  : <Btn kind="danger" onClick={() => setConfirm(true)}>공유 멈추기</Btn>}
              </div>
            </Panel>
          </Section>
        </>
      )}
    </>
  );
}
