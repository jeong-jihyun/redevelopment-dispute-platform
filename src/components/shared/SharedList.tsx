"use client";
import Link from "next/link";
import { ROLE_LABEL, cloudReady, mySharedCases, useLoad, useSession, acct } from "@/lib/cloud";
import { useNews } from "@/lib/notify";
import { fmtDate } from "@/lib/store";
import { Alert, CardGrid, CaseCard, Empty, Loading, Section } from "@/components/ui";

/** 내가 참여한(공유받은·공유한) 사건 목록 */
export default function SharedList() {
  const session = useSession();
  const uid = session?.user.id;
  const list = useLoad(uid ? () => mySharedCases(uid) : null, [uid]);
  const news = useNews((list.data || []).filter((x) => x.shared_cases).map((x) => x.shared_cases.id), uid);
  if (!cloudReady || session === undefined) return null;
  return (
    <Section title="함께 보는 사건" desc="공유한 사건과 초대받은 사건 · 커뮤니티와 동의서" kicker="SHARED"
      more={!session ? { href: "/auth?next=/cases", label: "로그인" } : undefined}>
      {!session ? <Empty>초대받은 사건은 로그인하면 보입니다. 초대 링크를 받았다면 그 링크를 여세요.</Empty>
        : list.loading && !list.data ? <Loading>불러오는 중</Loading>
        : list.error ? <Alert tone="danger" title="불러오기 실패">{list.error}</Alert>
        : !list.data?.length ? <Empty>아직 함께 보는 사건이 없습니다. 사건 화면의 ‘공유’ 탭에서 초대 링크를 만들 수 있습니다.</Empty>
        : (
          <CardGrid>
            {list.data.filter((x) => x.shared_cases).map((x) => (
              <CaseCard key={x.shared_cases.id} href={`/shared/${x.shared_cases.id}`}
                badges={[...(news[x.shared_cases.id] ? [{ text: `새 소식 ${news[x.shared_cases.id]}`, tone: "red" as const }] : []), { text: x.role === "owner" ? "내가 공유" : "초대받음", tone: x.role === "owner" ? "blue" : "purple" }, { text: ROLE_LABEL[x.role], tone: "gray" }]}
                title={x.shared_cases.title} desc={`${x.shared_cases.owner_name}님의 사건`} meta={`마지막 공유 ${fmtDate(x.shared_cases.updated_at)}`} action="열기" />
            ))}
          </CardGrid>
        )}
      {session && <p className="t-meta mt-2"><Link href="/auth" className="underline">{acct(session.user)}</Link>로 로그인됨</p>}
    </Section>
  );
}
