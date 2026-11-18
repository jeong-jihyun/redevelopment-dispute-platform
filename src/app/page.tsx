"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, ChevronRight, FileText, FolderLock, MessageCircle, Search, Sparkles, UserRound } from "lucide-react";
import { DISPUTES, LAWS, PRECEDENTS, STAGES, TEMPLATES } from "@/lib/data";
import { useDB } from "@/lib/store";
import { dday } from "@/lib/analyze";
import { Card, Disclaimer, H2, ICONS, Page, PrecCard } from "@/components/ui";

const EXAMPLES = ["조합에서 총회 회의록을 공개하지 않습니다", "분양신청을 못 해서 현금청산 대상이 됐어요", "세입자인데 주거이전비를 받을 수 있나요"];

export default function Home() {
  const router = useRouter();
  const db = useDB();
  const [q, setQ] = useState("");
  const go = (text: string) => text.trim() && router.push(`/search?q=${encodeURIComponent(text.trim())}`);
  const upcoming = db.cases
    .flatMap((c) => c.schedules.filter((s) => !s.done).map((s) => ({ ...s, caseId: c.id, caseTitle: c.title })))
    .filter((s) => s.date >= new Date(Date.now() - 86400000).toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-[17px] font-bold">재개발 분쟁 도우미</span>
          </div>
          <Link href="/my" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[13px]">
            <UserRound size={16} /> {db.profile ? db.profile.name : "시작하기"}
          </Link>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-6 pt-5">
          <p className="text-[22px] font-bold leading-snug">어떤 문제가 있으신가요?<br /><span className="text-white/70 text-[16px] font-medium">상황을 적으면 법령·판례·대응 방법을 찾아 드려요</span></p>
          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-1.5 pl-3 text-ink">
            <Search size={20} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예) 조합이 감정평가 자료를 안 보여줘요" className="min-w-0 flex-1 bg-transparent py-2 outline-none" aria-label="통합 검색" />
            <button className="rounded-xl bg-amber px-3.5 py-2 text-[14px] font-bold text-white">검색</button>
          </form>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => go(e)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white/90">{e}</button>
            ))}
          </div>
        </div>
      </header>

      <Page>
        <Link href="/ai" className="flex items-center gap-3 rounded-2xl bg-amber-soft p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber text-white"><Sparkles size={22} /></div>
          <div className="flex-1">
            <div className="font-bold">AI 법률 도우미에게 물어보기</div>
            <div className="text-[13px] text-muted">쟁점·근거 법령·대응 방법을 한 번에 정리</div>
          </div>
          <ChevronRight className="text-muted" />
        </Link>

        {upcoming.length > 0 && (
          <>
            <H2 more={{ href: "/cases" }}>다가오는 기한</H2>
            <div className="space-y-2">
              {upcoming.map((s) => (
                <Link key={s.id} href={`/cases/${s.caseId}?tab=schedule`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
                  <CalendarClock className="text-amber" size={20} />
                  <div className="flex-1 min-w-0"><div className="truncate font-semibold">{s.title}</div><div className="truncate text-[12px] text-muted">{s.caseTitle} · {s.date}</div></div>
                  <span className={`text-[13px] font-bold ${dday(s.date).startsWith("D+") ? "text-muted" : "text-bad"}`}>{dday(s.date)}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <H2 more={{ href: "/disputes" }}>자주 찾는 분쟁 유형</H2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {DISPUTES.slice(0, 12).map((d) => {
            const I = ICONS[d.icon];
            return (
              <Link key={d.id} href={`/disputes/${d.id}`} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white px-1 py-3 text-center">
                <I size={22} className="text-navy" />
                <span className="text-[12px] font-semibold leading-tight">{d.short}</span>
              </Link>
            );
          })}
        </div>

        <H2 more={{ href: "/disputes?view=stage" }}>사업 단계별 안내</H2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {STAGES.map((s, i) => (
            <Link key={s} href={`/disputes?stage=${i + 1}`} className="w-36 shrink-0 rounded-2xl border border-line bg-white p-3">
              <div className="text-[11px] font-bold text-amber">{i + 1}단계</div>
              <div className="mt-0.5 text-[13px] font-semibold leading-snug">{s}</div>
            </Link>
          ))}
        </div>

        <H2>바로가기</H2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/docs" className="rounded-2xl border border-line bg-white p-4"><FileText className="text-navy" /><div className="mt-2 font-bold">서류 자동 작성</div><div className="text-[12px] text-muted">{TEMPLATES.length}종 · 질문에 답하면 완성</div></Link>
          <Link href="/cases" className="rounded-2xl border border-line bg-white p-4"><FolderLock className="text-navy" /><div className="mt-2 font-bold">내 사건 관리</div><div className="text-[12px] text-muted">{db.cases.length ? `${db.cases.length}건 관리 중` : "증거·일정 한곳에"}</div></Link>
        </div>

        <H2 more={{ href: "/laws" }}>꼭 알아둘 법정 기한</H2>
        <Card className="!p-0 divide-y divide-line">
          {LAWS.filter((l) => l.deadline).slice(0, 5).map((l) => (
            <Link key={l.id} href={`/laws?focus=${l.id}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-12 shrink-0 text-center text-[17px] font-extrabold text-amber">{l.deadline!.days}일</span>
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{l.deadline!.label}</div><div className="truncate text-[12px] text-muted">{l.short} {l.article} · {l.deadline!.from}부터</div></div>
            </Link>
          ))}
        </Card>

        <H2 more={{ href: "/laws?tab=prec" }}>주요 판례</H2>
        <div className="space-y-2">{PRECEDENTS.slice(0, 2).map((p) => <PrecCard key={p.id} p={p} />)}</div>

        <Link href="/ai" className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-navy py-3.5 font-bold text-white"><MessageCircle size={18} /> 내 상황 상담 시작</Link>
        <Disclaimer />
      </Page>
    </>
  );
}
