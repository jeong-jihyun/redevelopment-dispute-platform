"use client";
import Link from "next/link";
import { Construction } from "lucide-react";
import { Badge, Card, Page, Step, TopBar, btnCls } from "./ui";

export default function Soon({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <TopBar title={title} crumb="도시정비 분쟁지원" />
      <Page>
        <Card className="mt-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-amber-bg"><Construction className="text-amber" size={28} /></div>
          <div className="mt-3"><Badge tone="gray">다음 단계 개발 예정</Badge></div>
          <h2 className="mt-2 text-[19px] font-bold text-navy-950">{title}</h2>
          <p className="mx-auto mt-1 max-w-[440px] text-[14px] leading-relaxed text-ink-500">{desc}</p>
          <div className="mx-auto mt-4 max-w-[440px] text-left">
            <Step n="1" title="기준 데이터·검색·법령 화면" badge={<Badge tone="green">완료</Badge>} />
            <Step n="2" title="AI 법률 도우미" badge={<Badge tone="green">완료</Badge>} />
            <Step n="3" title="서류 자동 작성" badge={<Badge tone="blue">다음</Badge>} />
            <Step n="4" title="내 사건 관리" badge={<Badge tone="gray">대기</Badge>} />
          </div>
          <Link href="/" className={`${btnCls("primary")} mt-5`}>홈으로</Link>
        </Card>
      </Page>
    </>
  );
}
