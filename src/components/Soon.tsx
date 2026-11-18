"use client";
import Link from "next/link";
import { Construction } from "lucide-react";
import { Page, TopBar } from "./ui";

export default function Soon({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <TopBar title={title} />
      <Page>
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-soft"><Construction className="text-amber" size={30} /></div>
          <h2 className="mt-4 text-[18px] font-bold">{title} — 다음 단계에서 열립니다</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{desc}</p>
          <Link href="/" className="mt-6 rounded-xl bg-navy px-5 py-3 font-semibold text-white">홈으로</Link>
        </div>
      </Page>
    </>
  );
}
