"use client";
import Link from "next/link";
import { Alert, Page, PageHeader, Section, StepList, TopBar, btnCls } from "./ui";

export default function Soon({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <TopBar title={title} crumb="도시정비 분쟁지원" />
      <Page>
        <PageHeader eyebrow="Coming next" title={title} lead={desc} badges={[{ text: "다음 단계 개발 예정", tone: "gray" }]} />
        <Alert tone="info" title="준비 중">이 화면은 아직 만들고 있습니다. 아래 순서대로 열립니다.</Alert>
        <Section title="개발 진행 상황" kicker="ROADMAP">
          <StepList items={[
            { title: "기준 데이터·검색·법령 화면", badge: { text: "완료", tone: "green" } },
            { title: "AI 법률 도우미", badge: { text: "완료", tone: "green" } },
            { title: "서류 자동 작성", badge: { text: "완료", tone: "green" } },
            { title: "내 사건 관리", badge: { text: "다음", tone: "blue" } },
          ]} />
        </Section>
        <div className="mt-5"><Link href="/" className={btnCls("secondary")}>홈으로</Link></div>
      </Page>
    </>
  );
}
