"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_LABEL, removeMember, setRole, type Member, type SharedCase } from "@/lib/cloud";
import { fmtDate } from "@/lib/store";
import { ActionPanel, Alert, Btn, CardGrid, CaseCard, Panel, Section, SelectField, TextBtn, btnCls, runBusy } from "@/components/ui";

export default function SharedMembers({ c, members, uid, role, reload }: { c: SharedCase; members: Member[]; uid: string; role: Member["role"]; reload: () => void }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const m = members.find((x) => x.user_id === sel);
  const isOwner = role === "owner";
  const act = (label: string, fn: () => Promise<void>) => runBusy(label, async () => { try { setErr(null); await fn(); reload(); } catch (e) { setErr(e instanceof Error ? e.message : "실패했습니다."); } });

  return (
    <>
      {isOwner && (
        <div className="mt-5">
          <ActionPanel title="초대 링크·공개 범위" desc="내 사건 화면의 ‘공유’ 탭에서 초대 링크를 보내고 공개할 내용을 고릅니다."
            action={<Link href={`/cases/${c.local_case_id}?tab=share`} className={btnCls("secondary")}>공유 설정 열기</Link>} />
        </div>
      )}
      <Section title="참여자" desc={isOwner ? "누르면 권한을 바꿀 수 있습니다" : "이 사건에 참여한 사람"} kicker="MEMBERS">
        <CardGrid>
          {members.map((x) => (
            <CaseCard key={x.user_id} badges={[{ text: ROLE_LABEL[x.role], tone: x.role === "owner" ? "blue" : x.role === "editor" ? "green" : "gray" }, ...(x.user_id === uid ? [{ text: "나", tone: "purple" as const }] : [])]}
              title={x.display_name} desc={isOwner ? x.email || "" : undefined} meta={`참여 ${fmtDate(x.joined_at)}`}
              footer={isOwner && x.role !== "owner" ? <TextBtn onClick={() => { setSel(sel === x.user_id ? null : x.user_id); setConfirm(false); }}>{sel === x.user_id ? "닫기" : "권한 변경"}</TextBtn> : undefined} />
          ))}
        </CardGrid>
        {isOwner && m && (
          <Panel className="mt-3.5">
            <p className="t-title mb-2">{m.display_name} · 권한</p>
            <SelectField label="권한" value={m.role} onChange={(v) => act("권한 바꾸는 중", () => setRole(c.id, m.user_id, v as "editor" | "viewer"))}
              options={[{ value: "editor", label: "작성 가능 — 글·댓글·동의서 작성" }, { value: "viewer", label: "열람만 — 보기·서명만" }]} />
            {confirm ? (
              <div className="flex gap-[9px]"><Btn kind="danger" onClick={() => act("내보내는 중", async () => { await removeMember(c.id, m.user_id); setSel(null); setConfirm(false); })}>정말 내보내기</Btn><Btn kind="secondary" onClick={() => setConfirm(false)}>취소</Btn></div>
            ) : <Btn kind="danger" onClick={() => setConfirm(true)}>사건에서 내보내기</Btn>}
            <p className="t-meta mt-2">내보내도 그 사람이 쓴 글과 서명은 남습니다.</p>
          </Panel>
        )}
      </Section>
      {!isOwner && (
        <Section title="참여 그만두기" kicker="LEAVE">
          <Panel>
            <p className="t-desc">나가면 이 사건을 더 볼 수 없습니다. 내가 쓴 글과 서명은 남습니다. 다시 들어오려면 새 초대 링크가 필요합니다.</p>
            <div className="mt-3">
              {confirm ? (
                <div className="flex gap-[9px]"><Btn kind="danger" onClick={() => act("나가는 중", async () => { await removeMember(c.id, uid); router.replace("/cases"); })}>정말 나가기</Btn><Btn kind="secondary" onClick={() => setConfirm(false)}>취소</Btn></div>
              ) : <Btn kind="danger" onClick={() => setConfirm(true)}>이 사건에서 나가기</Btn>}
            </div>
          </Panel>
        </Section>
      )}
      {err && <Alert tone="danger" title="실패">{err}</Alert>}
    </>
  );
}
