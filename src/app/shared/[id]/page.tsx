"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ROLE_LABEL, cloudReady, getMembers, getShared, useLoad, useSession } from "@/lib/cloud";
import { markSeen } from "@/lib/notify";
import { fmtDate } from "@/lib/store";
import { Alert, Disclaimer, Empty, Loading, Page, PageHeader, Tabs, TopBar, btnCls } from "@/components/ui";
import SharedContent from "@/components/shared/SharedContent";
import Community from "@/components/shared/Community";
import Consents from "@/components/shared/Consents";
import SharedMembers from "@/components/shared/SharedMembers";

const TABS = ["content", "community", "consent", "members"] as const;

function Inner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const uid = session?.user.id;
  const sc = useLoad(uid ? () => getShared(id) : null, [id, uid]);
  const mem = useLoad(uid ? () => getMembers(id) : null, [id, uid]);
  const raw = sp.get("tab");
  const tab = (TABS as readonly string[]).includes(raw || "") ? raw! : "content";
  const go = (t: string) => router.replace(`/shared/${id}?tab=${t}`, { scroll: false });

  useEffect(() => { if (uid && (tab === "community" || tab === "consent")) markSeen(id); }, [id, uid, tab]);
  const head = <TopBar title={sc.data?.title || "공유 사건"} crumb="공유받은 사건" back="/cases" />;
  if (!cloudReady) return (<>{head}<Page><Alert tone="warn" title="준비 중">공유 서버가 아직 연결되지 않았습니다.</Alert></Page></>);
  if (session === undefined) return (<>{head}<Page><Loading>로그인 상태 확인 중</Loading></Page></>);
  if (!session) return (<>{head}<Page><Alert tone="info" title="로그인 필요">공유 사건은 참여자만 볼 수 있습니다.</Alert><div className="mt-4"><Link href={`/auth?next=${encodeURIComponent(`/shared/${id}`)}`} className={btnCls("primary")}>이메일로 로그인</Link></div></Page></>);
  if (sc.loading && !sc.data) return (<>{head}<Page><Loading>공유 사건 불러오는 중</Loading></Page></>);
  if (sc.error) return (<>{head}<Page><Alert tone="danger" title="불러오기 실패">{sc.error}</Alert></Page></>);
  if (!sc.data) return (<>{head}<Page><Empty>이 사건을 볼 수 없습니다. 참여자가 아니거나, 주인이 공유를 멈췄거나, 참여자에서 빠졌습니다.</Empty></Page></>);

  const c = sc.data;
  const members = mem.data || [];
  const me = members.find((m) => m.user_id === uid);
  const role = me?.role || "viewer";

  return (
    <>
      {head}
      <Page wide>
        <PageHeader eyebrow="SHARED CASE" title={c.title} lead={`${c.owner_name}님이 공유 · 마지막 공유 ${fmtDate(c.updated_at)}`}
          badges={[{ text: `내 권한 · ${ROLE_LABEL[role]}`, tone: role === "viewer" ? "gray" : "blue" }, { text: `참여자 ${members.length}명`, tone: "gray" }]} />
        <Tabs tabs={[{ id: "content", label: "공유 내용" }, { id: "community", label: "커뮤니티" }, { id: "consent", label: "동의서" }, { id: "members", label: "참여자", count: members.length }]} value={tab} onChange={go} />
        <div className="pt-1">
          {tab === "content" && <SharedContent c={c} />}
          {tab === "community" && <Community caseId={c.id} uid={uid!} role={role} myName={me?.display_name || ""} />}
          {tab === "consent" && <Consents caseId={c.id} caseTitle={c.title} uid={uid!} role={role} myName={me?.display_name || ""} memberCount={members.length} members={members} />}
          {tab === "members" && <SharedMembers c={c} members={members} uid={uid!} role={role} reload={mem.reload} />}
        </div>
        <Disclaimer />
      </Page>
    </>
  );
}
export default function SharedPage() { return <Suspense><Inner /></Suspense>; }
