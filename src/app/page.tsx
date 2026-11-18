"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, FileText, FolderLock, MessageCircle, Search } from "lucide-react";
import { DISPUTES, LAWS, PRECEDENTS, STAGES, TEMPLATES } from "@/lib/data";
import { useDB } from "@/lib/store";
import { dday } from "@/lib/analyze";
import { Badge, Card, Disclaimer, Eyebrow, H2, ICONS, Page, PrecCard, TopBar, btnCls } from "@/components/ui";

const EXAMPLES = ["조합에서 총회 회의록을 공개하지 않습니다", "분양신청을 못 해서 현금청산 대상이 됐어요", "세입자인데 주거이전비를 받을 수 있나요"];

export default function Home() {
  const router = useRouter();
  const db = useDB();
  const [q, setQ] = useState("");
  const go = (text: string) => text.trim() && router.push(`/search?q=${encodeURIComponent(text.trim())}`);
  const today = new Date(); today.setDate(today.getDate() - 1);
  const upcoming = db.cases
    .flatMap((c) => c.schedules.filter((s) => !s.done).map((s) => ({ ...s, caseId: c.id, caseTitle: c.title })))
    .filter((s) => s.date >= today.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const quick = [
    { href: "/ai", icon: MessageCircle, n: String(DISPUTES.length).padStart(2, "0"), unit: "분쟁 유형", title: "AI 법률 도우미", desc: "상황을 적으면 쟁점·근거·대응 방법 정리" },
    { href: "/docs", icon: FileText, n: String(TEMPLATES.length).padStart(2, "0"), unit: "서류 양식", title: "서류 자동 작성", desc: "질문에 답하면 내용증명·청구서 초안 완성" },
    { href: "/cases", icon: FolderLock, n: String(db.cases.length).padStart(2, "0"), unit: "내 사건", title: "사건 관리", desc: "증거자료·일정·참여자를 사건별로 관리" },
  ];

  return (
    <>
      <TopBar title="홈" crumb="도시정비 분쟁지원" right={
        <Link href="/my" className={btnCls("secondary")}>{db.profile ? db.profile.name : "시작하기"}</Link>
      } />
      <Page wide>
        {/* 히어로: 핵심 행동(검색)을 가장 먼저 */}
        <section className="rounded-[24px] bg-navy-950 p-5 text-white shadow-[var(--shadow-md)] tab:p-8 desk:p-10">
          <div className="text-[11px] font-extrabold tracking-[1.4px] text-[#8fb4ff]">REDEVELOPMENT DISPUTE SUPPORT</div>
          <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-[-1px] tab:text-[30px] tab:tracking-[-1.2px]">복잡한 분쟁을 명확한 대응으로</h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#b9c7d9]">어떤 문제가 있는지 그대로 적어 주세요. 관련 법령·판례와 대응 절차, 필요한 서류까지 이어서 찾아 드립니다.</p>
          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="mt-5 flex max-w-[720px] items-center gap-2 rounded-[14px] bg-white p-1.5 pl-3.5 text-ink-900">
            <Search size={19} className="shrink-0 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예) 조합이 감정평가 자료를 안 보여줘요" className="min-w-0 flex-1 bg-transparent py-2 outline-none" aria-label="통합 검색" />
            <button className={btnCls("primary")}>검색</button>
          </form>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 tab:mx-0 tab:flex-wrap tab:px-0">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => go(e)} className="min-h-9 shrink-0 rounded-full border border-[#34465f] bg-[#1a2b45] px-3.5 text-[12px] text-[#dbe5f3] hover:bg-[#243a59]">{e}</button>
            ))}
          </div>
        </section>

        {/* 주요 서비스 */}
        <div className="mt-4 grid gap-3.5 tab:grid-cols-3">
          {quick.map(({ href, icon: Icon, n, unit, title, desc }) => (
            <Link key={href} href={href} className="flex items-center gap-4 rounded-[18px] border border-line bg-white p-4 shadow-[var(--shadow-sm)] hover:border-blue-500/40 tab:block tab:p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-blue-50 text-blue-600"><Icon size={22} /></div>
              <div className="min-w-0 flex-1 tab:mt-3">
                <div className="flex items-baseline gap-2"><b className="text-[15px] text-navy-950">{title}</b><span className="hidden text-[22px] font-extrabold tracking-[-1px] text-navy-950 desk:inline">{n}</span><span className="hidden text-[10px] text-ink-500 desk:inline">{unit}</span></div>
                <div className="text-[12px] text-ink-500">{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {upcoming.length > 0 && (
          <>
            <H2 desc="내 사건에 등록한 기한 중 가까운 순서" more={{ href: "/cases" }}>다가오는 기한</H2>
            <div className="grid gap-2 tab:grid-cols-3">
              {upcoming.map((s) => {
                const d = dday(s.date);
                return (
                  <Link key={s.id} href={`/cases/${s.caseId}?tab=schedule`} className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-3.5">
                    <CalendarClock className="shrink-0 text-amber" size={20} />
                    <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{s.title}</div><div className="truncate text-[11px] text-ink-500">{s.caseTitle} · {s.date}</div></div>
                    <Badge tone={d.startsWith("D+") ? "gray" : "amber"}>{d}</Badge>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        <H2 desc="재개발 사업 전 과정에서 자주 생기는 14가지 분쟁" more={{ href: "/disputes", label: "전체 보기" }}>분쟁 유형으로 찾기</H2>
        <div className="grid grid-cols-3 gap-2 tab:grid-cols-4 desk:grid-cols-7">
          {DISPUTES.map((d) => {
            const I = ICONS[d.icon];
            return (
              <Link key={d.id} href={`/disputes/${d.id}`} className="flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-[14px] border border-line bg-white px-1 py-3 text-center hover:border-blue-500/40">
                <I size={21} className="text-blue-600" />
                <span className="text-[12px] font-bold leading-tight text-ink-900">{d.short}</span>
              </Link>
            );
          })}
        </div>

        <H2 desc="지금 사업이 어느 단계인지 고르면 그 단계의 분쟁만 보여 드려요" kicker="BUSINESS STAGE">사업 단계별 안내</H2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 tab:mx-0 tab:grid tab:grid-cols-4 tab:px-0 desk:grid-cols-6">
          {STAGES.map((s, i) => (
            <Link key={s} href={`/disputes?stage=${i + 1}`} className="w-[150px] shrink-0 rounded-[14px] border border-line bg-white p-3 hover:border-blue-500/40 tab:w-auto">
              <div className="grid h-[25px] w-[25px] place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-600">{i + 1}</div>
              <div className="mt-2 text-[13px] font-bold leading-snug text-ink-900">{s}</div>
            </Link>
          ))}
        </div>

        <H2 desc="기한은 기산점(언제부터 세는지)과 함께 확인해야 합니다" more={{ href: "/laws", label: "법령 보기" }}>꼭 알아둘 법정 기한</H2>
        <div className="overflow-x-auto rounded-[12px] border border-line bg-white">
          <table className="w-full min-w-[580px] border-collapse text-[13px]">
            <thead><tr className="bg-[#f7f9fc] text-left text-[12px] text-ink-500">
              <th className="border-b border-line px-[13px] py-[11px] font-bold">기한</th><th className="border-b border-line px-[13px] py-[11px] font-bold">내용</th><th className="border-b border-line px-[13px] py-[11px] font-bold">기산점</th><th className="border-b border-line px-[13px] py-[11px] font-bold">근거</th>
            </tr></thead>
            <tbody>
              {LAWS.filter((l) => l.deadline).map((l) => (
                <tr key={l.id} className="border-b border-[#edf0f4] last:border-0">
                  <td className="px-[13px] py-3"><Badge tone="amber">{l.deadline!.days}일</Badge></td>
                  <td className="px-[13px] py-3 font-semibold text-ink-900">{l.deadline!.label}</td>
                  <td className="px-[13px] py-3 text-ink-700">{l.deadline!.from}</td>
                  <td className="px-[13px] py-3"><Link href={`/laws?focus=${l.id}`} className="font-bold text-blue-600">{l.short} {l.article}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-400">기간의 말일이 토요일·공휴일이면 다음 날 만료되는 등 계산 규칙이 있습니다. 실제 기한은 전문가와 확인하세요.</p>

        <H2 desc="판결 요지와 원문 링크" more={{ href: "/laws?tab=prec", label: "판례 더 보기" }}>주요 판례</H2>
        <div className="grid gap-3.5 desk:grid-cols-2">{PRECEDENTS.slice(0, 2).map((p) => <PrecCard key={p.id} p={p} />)}</div>

        <Card className="mt-8 flex flex-col items-start gap-3 tab:flex-row tab:items-center">
          <div className="flex-1">
            <Eyebrow>Next action</Eyebrow>
            <b className="mt-1 block text-[16px] text-navy-950">내 상황을 정리해서 대응 방법을 찾아볼까요?</b>
            <p className="text-[13px] text-ink-500">사업 단계·내 지위·언제 무슨 일이 있었는지 순서로 물어봅니다.</p>
          </div>
          <Link href="/ai" className={`${btnCls("primary")} w-full tab:w-auto`}><MessageCircle size={16} /> AI 상담 시작</Link>
        </Card>
        <Disclaimer />
      </Page>
    </>
  );
}
