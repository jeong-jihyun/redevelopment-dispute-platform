"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, Banknote, BookOpen, Building2, Check, ChevronLeft, CircleHelp, Copy, ExternalLink, FileStack, FileText, FolderLock,
  Gavel, HardHat, Home, Info, Landmark, MessageCircle, Scale, Search, ShieldAlert, TrendingUp, Truck, UserCheck, UserRound, Users,
} from "lucide-react";
import { DATA_CHECKED, type LawRef, type Precedent } from "@/lib/data";

export const ICONS: Record<string, typeof Home> = {
  Landmark, UserCheck, Users, FileStack, Scale, Banknote, Truck, HardHat, Search, Home, TrendingUp, Building2, Gavel, CircleHelp,
};

/* ───────── 내비게이션: 폰 하단 탭 / 태블릿 축소 사이드바 / PC 고정 사이드바 ───────── */
const MOBILE_NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/ai", label: "AI 상담", icon: MessageCircle },
  { href: "/laws", label: "법령·판례", icon: Scale },
  { href: "/docs", label: "서류 작성", icon: FileText },
  { href: "/cases", label: "내 사건", icon: FolderLock },
];
const SIDE_NAV = [
  { group: "서비스", items: [
    { href: "/", label: "홈", icon: Home },
    { href: "/search", label: "통합 검색", icon: Search },
    { href: "/disputes", label: "분쟁 대응", icon: ShieldAlert },
    { href: "/ai", label: "AI 법률 도우미", icon: MessageCircle },
    { href: "/docs", label: "서류 자동 작성", icon: FileText },
  ]},
  { group: "내 작업", items: [
    { href: "/cases", label: "내 사건", icon: FolderLock },
    { href: "/laws", label: "법률 자료", icon: BookOpen },
    { href: "/my", label: "마이페이지", icon: UserRound },
  ]},
];
const isOn = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-[210px] shrink-0 overflow-y-auto bg-navy-950 px-3 py-6 text-[#dbe5f3] tab:block desk:w-[252px] desk:px-[18px]">
      <Link href="/" className="flex items-center gap-[11px] border-b border-[#2a3a52] px-2 pb-6">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-gradient-to-br from-[#4b8bfa] to-[#1f55b8] text-[17px] font-extrabold text-white">도</span>
        <span>
          <b className="block text-[14px] tracking-[-0.3px] text-white">도시정비 분쟁지원</b>
          <small className="block text-[10px] tracking-[1.1px] text-[#9fb0c7]">재개발 분쟁 도우미</small>
        </span>
      </Link>
      {SIDE_NAV.map((g) => (
        <div key={g.group}>
          <div className="mx-2.5 mb-2 mt-6 text-[10px] font-bold tracking-[1.2px] text-[#8092aa]">{g.group}</div>
          <nav>
            {g.items.map(({ href, label, icon: Icon }) => {
              const on = isOn(path, href);
              return (
                <Link key={href} href={href} aria-current={on ? "page" : undefined}
                  className={`my-[3px] flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-[13px] ${on ? "bg-[#243a59] text-white shadow-[inset_3px_0_#66a0ff]" : "text-[#b9c7d9] hover:bg-[#243a59] hover:text-white"}`}>
                  <Icon size={17} /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="mx-1 mt-7 rounded-[12px] border border-[#34465f] bg-[#1a2b45] p-3.5 text-[11px] leading-relaxed text-[#b8c7da]">
        <b className="mb-1 block text-white">설계 기준</b>
        공식 출처 기반 법률정보, 쉬운 분쟁 탐색, 모바일 우선 사용성
      </div>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur tab:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const on = isOn(path, href);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "font-bold text-blue-600" : "text-ink-500"}`}>
              <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title, back, right, crumb }: { title: string; back?: boolean | string; right?: ReactNode; crumb?: string }) {
  const router = useRouter();
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex h-[58px] items-center gap-1 px-2 tab:h-[68px] tab:px-6 desk:px-[38px]">
        {back ? (
          <button aria-label="뒤로" onClick={() => (typeof back === "string" ? router.push(back) : router.back())} className="grid h-10 w-10 place-items-center rounded-full text-navy-900 hover:bg-canvas">
            <ChevronLeft size={24} />
          </button>
        ) : <span className="w-2 tab:w-0" />}
        <div className="min-w-0 flex-1">
          {crumb && <div className="hidden text-[12px] text-ink-500 tab:block">{crumb} / <b className="text-ink-900">{title}</b></div>}
          <h1 className={`truncate text-[17px] font-bold text-navy-950 ${crumb ? "tab:hidden" : ""}`}>{title}</h1>
        </div>
        {right ?? (
          <div className="flex items-center gap-3.5">
            <span className="hidden rounded-full bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] text-ink-500 desk:inline">자료 확인일 {DATA_CHECKED}</span>
            <Link href="/my" aria-label="마이페이지" className="grid h-[31px] w-[31px] place-items-center rounded-full bg-[#e6edfa] text-[#2d5592]">
              <UserRound size={17} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={`safe-bottom mx-auto px-4 pt-5 tab:px-6 tab:pt-[30px] desk:px-[42px] desk:pt-[38px] ${wide ? "max-w-[1240px]" : "max-w-[960px]"}`}>{children}</main>;
}

/* ───────── 기본 컴포넌트 ───────── */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-line bg-white p-4 shadow-[var(--shadow-sm)] tab:p-5 ${className}`}>{children}</div>;
}

export function H2({ children, desc, more, kicker }: { children: ReactNode; desc?: string; more?: { href: string; label?: string }; kicker?: string }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3 tab:mb-4 tab:mt-[42px]">
      <div>
        <h2 className="text-[17px] font-bold tracking-[-0.5px] text-navy-950 tab:text-[19px]">{children}</h2>
        {desc && <p className="mt-1 text-[12px] text-ink-500">{desc}</p>}
      </div>
      {more ? <Link href={more.href} className="shrink-0 text-[12px] font-bold text-ink-700">{more.label ?? "자세히 보기"} →</Link>
        : kicker ? <span className="hidden text-[10px] font-bold tracking-[1px] text-ink-400 tab:block">{kicker}</span> : null}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-extrabold uppercase tracking-[1.4px] text-blue-600">{children}</div>;
}

type BtnKind = "primary" | "secondary" | "ghost" | "danger";
export const btnCls = (kind: BtnKind = "primary") =>
  `inline-flex min-h-11 items-center justify-center gap-[7px] rounded-[9px] border px-4 text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-45 tab:min-h-10 tab:text-[13px] ${
    { primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      secondary: "border-line-strong bg-white text-ink-700 hover:bg-soft",
      ghost: "border-transparent bg-transparent text-ink-700 hover:bg-canvas",
      danger: "border-[#f7cbd1] bg-red-bg text-red" }[kind]}`;

export function Btn({ children, onClick, kind = "primary", type = "button", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: BtnKind; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`${btnCls(kind)} ${className}`}>{children}</button>;
}

export function Chip({ children, on, onClick }: { children: ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold ${on ? "border-blue-600 bg-blue-600 text-white" : "border-line-strong bg-white text-ink-700 hover:bg-soft"}`}>
      {children}
    </button>
  );
}

export type Tone = "blue" | "green" | "amber" | "red" | "gray" | "purple" | "teal";
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  const t = { blue: "bg-blue-100 text-[#2859ae]", green: "bg-green-bg text-green", amber: "bg-amber-bg text-amber", red: "bg-red-bg text-red", gray: "bg-[#eef1f5] text-[#5c6879]", purple: "bg-purple-bg text-purple", teal: "bg-teal-100 text-teal-600" }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-[9px] py-1 text-[11px] font-bold leading-none ${t}`}>{children}</span>;
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "warn" | "danger"; title?: string; children: ReactNode }) {
  const t = {
    info: ["border-[#d9e5ff] bg-blue-50 text-[#345a9b]", Info],
    warn: ["border-[#f4dfb6] bg-amber-bg text-[#81540e]", AlertTriangle],
    danger: ["border-[#f5cbd1] bg-red-bg text-[#a52d3b]", ShieldAlert],
  }[tone] as [string, typeof Info];
  const Icon = t[1];
  return (
    <div className={`my-2.5 flex gap-2.5 rounded-[11px] border px-[15px] py-[13px] text-[13px] leading-relaxed ${t[0]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{title && <b>{title} · </b>}{children}</div>
    </div>
  );
}

export function Step({ n, title, desc, badge }: { n: ReactNode; title: string; desc?: string; badge?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <div className="grid h-[25px] w-[25px] shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-600">{n}</div>
      <div className="min-w-0 flex-1"><b className="block text-[14px]">{title}</b>{desc && <small className="text-[12px] text-ink-500">{desc}</small>}</div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={btnCls("ghost")} onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 인용 내용 복사</>}
    </button>
  );
}

/* ───────── 도메인 UI: 법률 근거 표시 (AI 요약과 원문 분리, 출처 메타데이터) ───────── */
export function LawCard({ l, compact }: { l: LawRef; compact?: boolean }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-ink-500">관련 법령</span>
        <Badge tone="green">공식 출처 연결</Badge>
      </div>
      <p className="mb-1 mt-2.5 text-[15px] font-bold text-navy-950">「{l.law}」 {l.article} {l.title}</p>
      {!compact && <p className="text-[14px] leading-relaxed text-ink-700">{l.summary}</p>}
      {l.deadline && <div className="mt-2.5"><Badge tone="amber">기한 {l.deadline.days}일 · 기산점: {l.deadline.from}</Badge></div>}
      {!compact && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-[10px] bg-soft p-3 text-[11px] text-ink-500 tab:grid-cols-4">
            <div><dt className="font-bold text-ink-700">출처</dt><dd>국가법령정보센터</dd></div>
            <div><dt className="font-bold text-ink-700">적용 기준</dt><dd>현행 법령</dd></div>
            <div><dt className="font-bold text-ink-700">시행일·연혁</dt><dd>원문에서 확인</dd></div>
            <div><dt className="font-bold text-ink-700">조회일</dt><dd>{DATA_CHECKED}</dd></div>
          </dl>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a href={l.url} target="_blank" rel="noreferrer" className={btnCls("secondary")}>법령 원문 보기 <ExternalLink size={13} /></a>
            <CopyBtn text={`「${l.law}」 ${l.article}(${l.title})\n${l.summary}\n출처: ${l.url}`} />
          </div>
        </>
      )}
      {compact && <a href={l.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-blue-600">원문 보기 <ExternalLink size={12} /></a>}
    </Card>
  );
}

export function PrecCard({ p }: { p: Precedent }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-ink-500">관련 판례 · {p.court} {p.date} 선고</span>
        <Badge tone="green">공식 출처 연결</Badge>
      </div>
      <p className="mb-1 mt-2.5 text-[15px] font-bold text-navy-950">{p.caseNo} · {p.title}</p>
      <p className="text-[14px] leading-relaxed text-ink-700">{p.gist}</p>
      <p className="mt-1.5 text-[11px] text-ink-400">판결 요지는 이해를 돕기 위해 풀어 쓴 것입니다 · 조회일 {DATA_CHECKED}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <a href={p.url} target="_blank" rel="noreferrer" className={btnCls("secondary")}>판결 원문 보기 <ExternalLink size={13} /></a>
        <CopyBtn text={`${p.court} ${p.date} 선고 ${p.caseNo} 판결 — ${p.gist}\n출처: ${p.url}`} />
      </div>
    </Card>
  );
}

export function Disclaimer() {
  return (
    <div className="mt-8">
      <Alert tone="info" title="법률정보 안내">
        이 서비스는 법률정보 제공 및 문서 작성 보조 서비스로, 변호사의 법률의견이나 법률대리를 대체하지 않습니다. 법정 기한·소송·가처분은 적용 조문과 기산점을 전문가와 함께 확인하세요.
      </Alert>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-[18px] border border-dashed border-line-strong bg-white/60 p-6 text-center text-[14px] text-ink-500">{children}</div>;
}

export function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <label className="mb-3 flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-ink-700">{label} {required && <span className="text-red">*</span>}</span>
      {children}
      {help && <span className="text-[11px] text-ink-400">{help}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-[9px] border border-line-strong bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_#3978ea20]";

export function ListLink({ href, icon, title, desc, right }: { href: string; icon?: ReactNode; title: string; desc?: string; right?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-sm)] hover:border-blue-500/40">
      {icon && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-blue-50 text-blue-600">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="font-bold leading-snug text-navy-950">{title}</div>
        {desc && <div className="mt-0.5 line-clamp-2 text-[12px] text-ink-500">{desc}</div>}
      </div>
      {right ?? <span className="text-ink-400">›</span>}
    </Link>
  );
}
