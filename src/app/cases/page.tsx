"use client";
import Link from "next/link";
import { useState } from "react";
import { BUSINESS_TYPES, disputeById } from "@/lib/data";
import { CASE_STATUSES, ddayBadge, statusBadge } from "@/lib/cases";
import { fmtDate, useDB } from "@/lib/store";
import SharedList from "@/components/shared/SharedList";
import {
  ActionPanel, Alert, CardGrid, CaseCard, Disclaimer, Empty, MetricCard, Page, SearchHero, Section, SelectField, StepList, TopBar, btnCls,
} from "@/components/ui";

export default function CasesPage() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updated");

  const docsOf = (id: string) => db.docs.filter((d) => d.caseId === id).length;
  const kw = q.trim().toLowerCase();
  const list = db.cases
    .filter((c) => !status || c.status === status)
    .filter((c) => !kw || [c.title, c.projectName, c.region, c.description, disputeById(c.disputeType)?.name || ""].some((t) => t.toLowerCase().includes(kw)))
    .sort((a, b) => sort === "updated" ? b.updatedAt.localeCompare(a.updatedAt) : sort === "created" ? b.createdAt.localeCompare(a.createdAt) : a.title.localeCompare(b.title, "ko"));

  const open = db.cases.filter((c) => c.status !== "종결").length;
  const upcoming = db.cases.flatMap((c) => c.schedules.filter((s) => !s.done && ddayBadge(s).tone !== "gray")).length;
  const evCount = db.cases.reduce((n, c) => n + c.evidence.filter((e) => !e.deletedAt).length, 0);
  const typeName = (id: string) => BUSINESS_TYPES.find((b) => b.id === id || b.name === id)?.name || id;

  return (
    <>
      <TopBar title="내 사건" crumb="도시정비 분쟁지원" />
      <Page wide>
        <SearchHero eyebrow="MY CASES" title="내 사건 관리" lead="사건마다 분석·서류·증거자료·참여자·일정을 한 공간에 모아 관리합니다."
          badges={[{ text: `등록 사건 ${db.cases.length}건`, tone: "blue" }, { text: "이 기기에 저장", tone: "gray" }]}
          label="사건 검색" value={q} onChange={setQ} onSubmit={() => {}} placeholder="사건명·사업명·지역으로 찾기"
          help={kw ? `검색 결과 ${list.length}건` : "입력하면 바로 걸러집니다."} />

        {db.cases.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-2.5 tab:gap-3.5">
            <MetricCard n={String(open)} title="진행 사건" label="종결 제외" />
            <MetricCard n={String(upcoming)} title="남은 기한" label="완료 안 한 일정" />
            <MetricCard n={String(evCount)} title="등록 자료" label="증거자료" />
          </div>
        )}

        <div className="mt-5">
          <ActionPanel title="새 사건 만들기" desc="사건명·사업 정보·분쟁 유형을 적으면 사건 공간이 만들어집니다."
            action={<Link href="/cases/new" className={btnCls("secondary")}>새 사건 만들기</Link>} />
        </div>

        <Section title="사건 목록" desc="최근에 고친 사건이 위에 보입니다" kicker="CASES">
          {db.cases.length === 0 ? (
            <>
              <Empty>아직 만든 사건이 없습니다. ‘새 사건 만들기’로 시작하거나 AI 상담 결과에서 ‘이 상담으로 사건 만들기’를 누르세요.</Empty>
              <div className="mt-4">
                <StepList items={[
                  { title: "사건 만들기", desc: "사건명·사업 정보·분쟁 유형 입력" },
                  { title: "자료 올리기", desc: "회의록·통지서·사진 등 증거자료 등록 (원본 확인값 자동 기록)" },
                  { title: "분석과 서류", desc: "AI 상담·법령 근거·서류를 사건에 연결" },
                  { title: "기한 관리", desc: "법정 기한 계산 후 휴대폰 캘린더에 알림 등록" },
                ]} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 tab:max-w-[520px]">
                <SelectField label="진행 상태" value={status} onChange={setStatus} options={[{ value: "", label: "전체" }, ...CASE_STATUSES.map((s) => ({ value: s.name, label: s.name }))]} />
                <SelectField label="정렬" value={sort} onChange={setSort} options={[{ value: "updated", label: "최근 수정순" }, { value: "created", label: "만든 순" }, { value: "title", label: "이름순" }]} />
              </div>
              {list.length === 0 ? <Empty>조건에 맞는 사건이 없습니다.</Empty> : (
                <CardGrid>
                  {list.map((c) => {
                    const next = c.schedules.filter((s) => !s.done).sort((a, b) => a.date.localeCompare(b.date))[0];
                    return (
                      <CaseCard key={c.id} href={`/cases/${c.id}`}
                        badges={[{ text: disputeById(c.disputeType)?.short || "분쟁 유형 미정", tone: "blue" }, statusBadge(c.status)]}
                        title={c.title}
                        desc={[c.projectName, typeName(c.businessType), c.region].filter(Boolean).join(" · ")}
                        meta={`최근 수정 ${fmtDate(c.updatedAt)} · 문서 ${docsOf(c.id)}건 · 증거 ${c.evidence.filter((e) => !e.deletedAt).length}건${next ? ` · ${next.title} ${ddayBadge(next).text}` : ""}`}
                        action="사건 상세" />
                    );
                  })}
                </CardGrid>
              )}
            </>
          )}
        </Section>
        <SharedList />
        <Alert tone="info" title="저장 위치">사건과 증거 원본은 이 기기 브라우저 안에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 마이페이지에서 백업 파일을 내려받으세요.</Alert>
        <Disclaimer />
      </Page>
    </>
  );
}
