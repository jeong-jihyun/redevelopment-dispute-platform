"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { disputeById } from "@/lib/data";
import { statusBadge } from "@/lib/cases";
import { useDB, useMounted } from "@/lib/store";
import { Alert, Disclaimer, Empty, Page, PageHeader, Tabs, TopBar, btnCls } from "@/components/ui";
import { ActivityTab, AnalysisTab, DocsTab, LawsTab, OverviewTab } from "@/components/case/CaseMain";
import EvidenceTab from "@/components/case/CaseEvidence";
import MembersTab from "@/components/case/CaseMembers";
import ScheduleTab from "@/components/case/CaseSchedule";

const TAB_IDS = ["overview", "analysis", "laws", "docs", "evidence", "members", "schedule", "activity"] as const;
export type TabId = (typeof TAB_IDS)[number];

function Inner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const db = useDB();
  const mounted = useMounted();
  const c = db.cases.find((x) => x.id === id);
  const raw = sp.get("tab") as TabId | null;
  const tab: TabId = raw && (TAB_IDS as readonly string[]).includes(raw) ? raw : "overview";
  const go = (t: string) => router.replace(`/cases/${id}?tab=${t}`, { scroll: false });

  if (!c) {
    return (
      <>
        <TopBar title="사건" back="/cases" />
        <Page>
          {!mounted ? null : (
            <>
              <Empty>이 기기에 없는 사건입니다. 다른 기기에서 만든 사건은 백업 파일을 불러와야 보입니다.</Empty>
              <div className="mt-4 flex gap-[9px]"><Link href="/cases" className={btnCls("secondary")}>사건 목록</Link><Link href="/my#data" className={btnCls("ghost")}>백업 불러오기</Link></div>
            </>
          )}
        </Page>
      </>
    );
  }

  const docs = db.docs.filter((d) => d.caseId === c.id);
  const convs = db.conversations.filter((x) => x.caseId === c.id);
  const liveEv = c.evidence.filter((e) => !e.deletedAt);
  const tabs = [
    { id: "overview", label: "사건 개요" },
    { id: "analysis", label: "상담·분석", count: convs.length + c.analyses.length },
    { id: "laws", label: "법령·판례", count: c.lawIds.length },
    { id: "docs", label: "문서", count: docs.length },
    { id: "evidence", label: "증거자료", count: liveEv.length },
    { id: "members", label: "참여자", count: c.members.length },
    { id: "schedule", label: "일정", count: c.schedules.filter((s) => !s.done).length },
    { id: "activity", label: "활동 이력" },
  ];
  const dispute = disputeById(c.disputeType);
  const overdue = c.schedules.filter((s) => !s.done && s.date < new Date().toISOString().slice(0, 10));

  return (
    <>
      <TopBar title={c.title} crumb="내 사건" back="/cases" />
      <Page wide>
        <PageHeader eyebrow="CASE WORKSPACE" title={c.title} lead={[c.projectName, c.region, c.stage].filter(Boolean).join(" · ")}
          badges={[statusBadge(c.status), ...(dispute ? [{ text: dispute.short, tone: "blue" as const }] : []), ...(overdue.length ? [{ text: `지난 기한 ${overdue.length}건`, tone: "red" as const }] : [])]} />
        <Tabs tabs={tabs} value={tab} onChange={go} />
        <div className="pt-1">
          {tab === "overview" && <OverviewTab c={c} docCount={docs.length} go={go} />}
          {tab === "analysis" && <AnalysisTab c={c} />}
          {tab === "laws" && <LawsTab c={c} />}
          {tab === "docs" && <DocsTab c={c} />}
          {tab === "evidence" && <EvidenceTab c={c} />}
          {tab === "members" && <MembersTab c={c} />}
          {tab === "schedule" && <ScheduleTab c={c} />}
          {tab === "activity" && <ActivityTab c={c} />}
        </div>
        {tab === "members" || tab === "evidence" ? (
          <Alert tone="info" title="권한 안내">지금은 이 기기 한 대에서만 쓰는 방식이라, 참여자·접근 권한은 기록으로만 관리됩니다. 실제 초대 메일과 서버 권한 검증은 로그인 기능이 생긴 뒤 동작합니다.</Alert>
        ) : null}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function CaseDetail() {
  return <Suspense><Inner /></Suspense>;
}
