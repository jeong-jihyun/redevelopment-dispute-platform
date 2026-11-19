"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cloudReady, joinCase, useSession } from "@/lib/cloud";
import { getDB } from "@/lib/store";
import { Alert, Btn, Disclaimer, Field, Loading, Page, PageHeader, Panel, Section, StepList, TopBar, btnCls, inputCls, runBusy } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const code = sp.get("code") || "";
  const session = useSession();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { const n = getDB().profile?.name; if (n) setName(n); }, []);

  const join = () => {
    if (!name.trim()) { setErr("이름을 입력해 주세요. 다른 참여자에게 이 이름으로 보입니다."); return; }
    runBusy("사건에 참여하는 중", async () => {
      try { const id = await joinCase(code, name.trim()); router.replace(`/shared/${id}`); await new Promise((r) => setTimeout(r, 600)); }
      catch (e) { setErr(e instanceof Error ? e.message : "참여하지 못했습니다."); }
    });
  };
  const next = `/join?code=${encodeURIComponent(code)}`;

  return (
    <>
      <TopBar title="사건 참여" crumb="공유·커뮤니티" back="/" />
      <Page>
        <PageHeader eyebrow="INVITATION" title="공유 사건에 참여하기" lead="초대받은 사건의 공유 내용을 보고, 커뮤니티 글과 동의서에 참여할 수 있습니다." />
        {!cloudReady ? <Alert tone="warn" title="준비 중">공유 서버가 아직 연결되지 않았습니다.</Alert>
          : !code ? <Alert tone="danger" title="초대 링크 오류">초대 코드가 없습니다. 받은 링크 전체를 다시 열어 주세요.</Alert>
          : session === undefined ? <Loading>로그인 상태 확인 중</Loading>
          : !session ? (
            <>
              <Alert tone="info" title="로그인 필요">참여하려면 먼저 이메일로 로그인해야 합니다. 로그인하면 이 화면으로 돌아옵니다.</Alert>
              <div className="mt-4"><Link href={`/auth?next=${encodeURIComponent(next)}`} className={btnCls("primary")}>이메일로 로그인</Link></div>
            </>
          ) : (
            <Section title="참여 정보" kicker="JOIN">
              <Panel>
                <p className="t-desc mb-3">로그인: {session.user.email}</p>
                <Field label="표시할 이름" required help="다른 참여자에게 이 이름으로 보이고, 동의서 서명에도 쓰입니다." error={err && !name.trim() ? err : undefined}>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={inputCls} placeholder="홍길동 (101동)" />
                </Field>
                <Btn onClick={join} className="w-full tab:w-auto">이 사건에 참여</Btn>
              </Panel>
              {err && name.trim() && <Alert tone="danger" title="참여 실패">{err}</Alert>}
            </Section>
          )}
        <Section title="참여하면" kicker="ABOUT">
          <StepList items={[
            { title: "공유 내용 열람", desc: "사건 주인이 공개한 개요·일정·증거 목록·근거 법령만 볼 수 있습니다." },
            { title: "커뮤니티", desc: "작성 권한이 있으면 글과 댓글을 쓰고 본인 글을 고칠 수 있습니다." },
            { title: "동의서 서명", desc: "주제별 동의서를 읽고 동의·반대를 고른 뒤 손글씨로 서명합니다." },
          ]} />
        </Section>
        <Disclaimer />
      </Page>
    </>
  );
}
export default function JoinPage() { return <Suspense><Inner /></Suspense>; }
