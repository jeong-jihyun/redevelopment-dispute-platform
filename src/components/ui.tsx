"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertTriangle, BookOpen, Check, ChevronLeft, Copy, ExternalLink, FileText, FolderLock, Home, Info, MessageCircle, Scale, Search, ShieldAlert, UserRound,
} from "lucide-react";
import { DATA_CHECKED, type LawRef, type Precedent } from "@/lib/data";


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

/* ───────── 기본 부품 (디자인 시스템 v1.0) — 화면은 이 부품만으로 조립한다. docs/ui-patterns.md 참고 ───────── */

export type Tone = "blue" | "green" | "amber" | "red" | "gray" | "purple";
export type BadgeSpec = { text: string; tone: Tone };

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  const t = { blue: "bg-blue-100 text-[#2859ae]", green: "bg-green-bg text-green", amber: "bg-amber-bg text-amber", red: "bg-red-bg text-red", gray: "bg-[#eef1f5] text-[#5c6879]", purple: "bg-purple-bg text-purple" }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-[9px] py-1 text-[11px] font-bold leading-none ${t}`}>{children}</span>;
}

type BtnKind = "primary" | "secondary" | "ghost" | "danger";
export const btnCls = (kind: BtnKind = "primary") =>
  `inline-flex min-h-11 items-center justify-center gap-[7px] rounded-[9px] border px-[14px] text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-45 tab:min-h-10 tab:text-[13px] ${
    { primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      secondary: "border-line-strong bg-white text-ink-700 hover:bg-soft",
      ghost: "border-transparent bg-transparent text-ink-700 hover:bg-canvas",
      danger: "border-[#f7cbd1] bg-red-bg text-red" }[kind]}`;

export function Btn({ children, onClick, kind = "primary", type = "button", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: BtnKind; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`${btnCls(kind)} ${className}`}>{children}</button>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-line bg-white p-4 shadow-[var(--shadow-sm)] tab:p-5 ${className}`}>{children}</div>;
}
/** @deprecated Panel과 같음 */
export const Card = Panel;

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-extrabold uppercase tracking-[1.4px] text-blue-600">{children}</div>;
}

export function PageHeader({ eyebrow, title, lead, badges }: { eyebrow: string; title: string; lead?: string; badges?: BadgeSpec[] }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mb-[9px] mt-[7px] text-[24px] font-bold leading-snug tracking-[-0.7px] text-navy-950 tab:text-[30px] tab:tracking-[-1.2px]">{title}</h1>
      {lead && <p className="max-w-[720px] text-[14px] text-ink-500">{lead}</p>}
      {badges && badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{badges.map((b) => <Badge key={b.text} tone={b.tone}>{b.text}</Badge>)}</div>}
    </div>
  );
}

/** 검색 영역 = 남색 상자 (사용자 확정 2026-11-19). 홈·통합 검색·법령 검색 모두 이 부품만 사용 */
export function SearchHero({ eyebrow, title, lead, label, value, onChange, onSubmit, placeholder, help, examples, onExample, top, badges, multiline, button = "검색", error, maxLength }: {
  eyebrow: string; title: string; lead?: string; label: string; value: string; onChange: (v: string) => void; onSubmit: () => void;
  placeholder?: string; help?: string; examples?: string[]; onExample?: (e: string) => void; top?: ReactNode;
  badges?: BadgeSpec[]; multiline?: boolean; button?: string; error?: string; maxLength?: number;
}) {
  return (
    <section className="rounded-[24px] bg-navy-950 p-5 text-white shadow-[var(--shadow-md)] tab:p-8 desk:p-10">
      <div className="text-[11px] font-extrabold tracking-[1.4px] text-[#8fb4ff]">{eyebrow}</div>
      <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-[-1px] tab:text-[30px] tab:tracking-[-1.2px]">{title}</h1>
      {lead && <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#b9c7d9]">{lead}</p>}
      {badges && badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{badges.map((b) => <Badge key={b.text} tone={b.tone}>{b.text}</Badge>)}</div>}
      {top && <div className="mt-5 max-w-[720px]">{top}</div>}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className={`${top ? "mt-3" : "mt-5"} max-w-[720px]`}>
        <span className="sr-only">{label}</span>
        {multiline ? (
          <div className="rounded-[14px] bg-white p-1.5 text-ink-900">
            <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} maxLength={maxLength} rows={4}
              aria-invalid={!!error} className="block min-h-[112px] w-full resize-none bg-transparent px-2 py-2 leading-relaxed outline-none" />
            <div className="flex items-center justify-between gap-2 border-t border-line px-2 pt-1.5">
              <span className="text-[11px] text-ink-400">{maxLength ? `${value.length} / ${maxLength}` : ""}</span>
              <button type="submit" className={btnCls("primary")}>{button}</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-[14px] bg-white p-1.5 pl-3.5 text-ink-900">
            <Search size={19} className="shrink-0 text-ink-400" />
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className="min-w-0 flex-1 bg-transparent py-2 outline-none" />
            <button type="submit" className={btnCls("primary")}>{button}</button>
          </div>
        )}
      </form>
      {error ? <p className="mt-2 text-[12px] font-bold text-[#ffb4bd]">{error}</p> : help && <p className="mt-2 text-[12px] text-[#9fb0c7]">{help}</p>}
      {examples && examples.length > 0 && (
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 tab:mx-0 tab:flex-wrap tab:px-0">
          {examples.map((e) => (
            <button key={e} type="button" onClick={() => onExample?.(e)} className="min-h-9 shrink-0 rounded-full border border-[#34465f] bg-[#1a2b45] px-3.5 text-[12px] text-[#dbe5f3] hover:bg-[#243a59]">{e}</button>
          ))}
        </div>
      )}
    </section>
  );
}

/** 남색 검색 상자 안의 선택칸 */
export function HeroSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-[#b9c7d9]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[9px] border border-[#34465f] bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-blue-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Section({ title, desc, kicker, more, children }: { title: ReactNode; desc?: string; kicker?: string; more?: { href: string; label?: string }; children: ReactNode }) {
  return (
    <section className="mt-8 tab:mt-[42px]">
      <div className="mb-3 flex items-end justify-between gap-3 tab:mb-4">
        <div>
          <h2 className="text-[17px] font-bold tracking-[-0.5px] text-navy-950 tab:text-[19px]">{title}</h2>
          {desc && <p className="mt-1 text-[12px] text-ink-500">{desc}</p>}
        </div>
        {more ? <Link href={more.href} className="shrink-0 text-[12px] font-bold text-ink-700">{more.label ?? "자세히 보기"} →</Link>
          : kicker ? <span className="hidden text-[10px] font-bold tracking-[1px] text-ink-400 tab:block">{kicker}</span> : null}
      </div>
      {children}
    </section>
  );
}
/** 구역 제목만 필요할 때 (Section과 같은 모양) */
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

/** 목록 항목은 모두 이 카드: 배지 2개 → 제목 → 설명 → 구분선 아래 정보 · 바로가기 */
export function CaseCard({ href, badges, title, desc, meta, action = "자세히 보기", footer }: {
  href?: string; badges: BadgeSpec[]; title: string; desc?: string; meta?: ReactNode; action?: string | null; footer?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2.5">
        {badges[0] ? <Badge tone={badges[0].tone}>{badges[0].text}</Badge> : <span />}
        {badges[1] && <Badge tone={badges[1].tone}>{badges[1].text}</Badge>}
      </div>
      <h3 className="mb-[5px] mt-[13px] text-[14px] font-bold leading-snug text-navy-950">{title}</h3>
      {desc && <p className="text-[13px] leading-relaxed text-ink-500">{desc}</p>}
      <div className="mt-auto pt-[14px]">
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[11px] text-ink-400">
          <span className="min-w-0">{meta}</span>
          {footer ?? (action ? <b className="shrink-0 text-ink-700">{action} →</b> : null)}
        </div>
      </div>
    </>
  );
  const cls = "flex h-full flex-col rounded-[14px] border border-line bg-white p-4";
  return href ? <Link href={href} className={`${cls} hover:border-blue-500/40`}>{body}</Link> : <article className={cls}>{body}</article>;
}

export function CardGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-3.5 ${cols === 3 ? "tab:grid-cols-3" : "tab:grid-cols-2"}`}>{children}</div>;
}

export function MetricCard({ n, title, label }: { n: string; title: string; label: string }) {
  return (
    <Panel>
      <div className="text-[25px] font-extrabold tracking-[-1px] text-navy-950">{n}</div>
      <b className="text-[14px] text-ink-900">{title}</b>
      <div className="text-[11px] text-ink-500">{label}</div>
    </Panel>
  );
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

export function Step({ n, title, desc, badge, right }: { n: ReactNode; title: string; desc?: string; badge?: BadgeSpec; right?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <div className="grid h-[25px] w-[25px] shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-600">{n}</div>
      <div className="min-w-0 flex-1"><b className="block text-[14px] leading-snug text-ink-900">{title}</b>{desc && <small className="text-[12px] text-ink-500">{desc}</small>}</div>
      {badge && <div className="shrink-0"><Badge tone={badge.tone}>{badge.text}</Badge></div>}
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
export function StepList({ items }: { items: { title: string; desc?: string; badge?: BadgeSpec; right?: ReactNode; onClick?: () => void }[] }) {
  return (
    <Panel className="!py-1">
      {items.map((it, i) =>
        it.onClick ? (
          <button key={it.title + i} type="button" onClick={it.onClick} className="block w-full text-left"><Step n={i + 1} title={it.title} desc={it.desc} badge={it.badge} right={it.right} /></button>
        ) : <Step key={it.title + i} n={i + 1} title={it.title} desc={it.desc} badge={it.badge} right={it.right} />,
      )}
    </Panel>
  );
}

export function Field({ label, required, help, error, children }: { label: string; required?: boolean; help?: string; error?: string; children: ReactNode }) {
  return (
    <label className="mb-3 flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-ink-700">{label} {required && <span className="text-red">*</span>}</span>
      {children}
      {error ? <span className="text-[11px] font-bold text-red">{error}</span> : help && <span className="text-[11px] text-ink-400">{help}</span>}
    </label>
  );
}
export const inputCls = "w-full rounded-[9px] border border-line-strong bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_#3978ea20] focus-visible:outline-none";

export function SelectField({ label, value, onChange, options, help, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; help?: string; required?: boolean }) {
  return (
    <Field label={label} help={help} required={required}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-line bg-white">
      <table className="w-full min-w-[580px] border-collapse text-[13px]">
        <thead><tr className="bg-[#f7f9fc] text-left text-[12px] text-ink-500">{head.map((h) => <th key={h} className="border-b border-line px-[13px] py-[11px] font-bold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#edf0f4] last:border-0">{r.map((c, j) => <td key={j} className="px-[13px] py-3 text-ink-700">{c}</td>)}</tr>)}</tbody>
      </table>
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

/** 법률 근거 표시: 법령·판례 모두 같은 모양 */
export function LegalCard({ kind, title, summary, url, copy, deadline, meta, compact }: {
  kind: "law" | "prec"; title: string; summary: string; url: string; copy: string; deadline?: string; meta: string; compact?: boolean;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2.5">
        <b className="text-[13px] text-ink-900">{kind === "law" ? "관련 법령" : "관련 판례"}</b>
        <Badge tone="green">공식 출처 연결</Badge>
      </div>
      <p className="mb-1 mt-3 text-[14px] font-bold leading-snug text-navy-950">{title}</p>
      <p className="text-[13px] leading-relaxed text-ink-500">{summary}</p>
      {deadline && <div className="mt-2.5"><Badge tone="amber">{deadline}</Badge></div>}
      {!compact && <Alert tone="info">요약은 참고 정보입니다. 적용 조문·시행일·부칙과 사건 발생 시점을 원문으로 대조하세요.</Alert>}
      <div className="mt-3 flex flex-wrap gap-[9px]">
        <a href={url} target="_blank" rel="noreferrer" className={btnCls("secondary")}>{kind === "law" ? "법령 원문 보기" : "판결 원문 보기"} <ExternalLink size={13} /></a>
        {!compact && <CopyBtn text={copy} />}
      </div>
      <p className="mt-2.5 text-[11px] text-ink-400">{meta}</p>
    </Panel>
  );
}
export function LawCard({ l, compact, highlight }: { l: LawRef; compact?: boolean; highlight?: boolean }) {
  return <div id={l.id} className={highlight ? "rounded-[18px] ring-2 ring-blue-500" : ""}><LegalCard kind="law" compact={compact} title={`「${l.law}」 ${l.article} ${l.title}`} summary={l.summary} url={l.url}
    deadline={l.deadline ? `기한 ${l.deadline.days}일 · 기산점: ${l.deadline.from}` : undefined}
    copy={`「${l.law}」 ${l.article}(${l.title})\n${l.summary}\n출처: ${l.url}`}
    meta={`출처 국가법령정보센터 · 적용 기준 현행 법령 · 시행일·연혁 원문 확인 · 조회일 ${DATA_CHECKED}`} /></div>;
}
export function PrecCard({ p, compact }: { p: Precedent; compact?: boolean }) {
  return <LegalCard kind="prec" compact={compact} title={`${p.court} ${p.date} 선고 ${p.caseNo} · ${p.title}`} summary={p.gist} url={p.url}
    copy={`${p.court} ${p.date} 선고 ${p.caseNo} 판결 — ${p.gist}\n출처: ${p.url}`}
    meta={`출처 국가법령정보센터 · 판결 요지는 풀어 쓴 것 · 조회일 ${DATA_CHECKED}`} />;
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
  return <div className="rounded-[14px] border border-dashed border-line-strong bg-white/60 p-6 text-center text-[13px] text-ink-500">{children}</div>;
}

/** 제목 + 설명 + 오른쪽 행동 버튼 하나 */
export function ActionPanel({ title, desc, action }: { title: string; desc?: string; action: ReactNode }) {
  return (
    <Panel className="flex flex-col gap-3 tab:flex-row tab:items-center">
      <div className="flex-1"><p className="t-title">{title}</p>{desc && <p className="t-desc">{desc}</p>}</div>
      {action}
    </Panel>
  );
}

/** 점 목록 */
export function BulletList({ items, empty }: { items: string[]; empty?: string }) {
  return items.length ? <ul className="t-body space-y-1.5">{items.map((x) => <li key={x}>· {x}</li>)}</ul> : <p className="t-meta">{empty ?? "해당 없음"}</p>;
}

/** 제목 있는 목록 패널 */
export function ListPanel({ title, items, badge }: { title: string; items: string[]; badge?: BadgeSpec }) {
  return (
    <Panel>
      <div className="mb-2.5 flex items-center justify-between gap-2"><p className="t-title">{title}</p>{badge && <Badge tone={badge.tone}>{badge.text}</Badge>}</div>
      <BulletList items={items} />
    </Panel>
  );
}

/** 패널 안의 작은 테두리 상자 (그림자 없음) */
export function SubPanel({ children, badge }: { children: ReactNode; badge?: BadgeSpec }) {
  return <div className="rounded-[14px] border border-line p-3.5">{badge && <div className="mb-2"><Badge tone={badge.tone}>{badge.text}</Badge></div>}{children}</div>;
}

/** 진행 중 안내 (info 알림 + 회전 아이콘) */
export function Loading({ children }: { children: ReactNode }) {
  return (
    <div className="my-2.5 flex items-center gap-2.5 rounded-[11px] border border-[#d9e5ff] bg-blue-50 px-[15px] py-[13px] text-[13px] text-[#345a9b]">
      <Loader2 size={16} className="shrink-0 animate-spin" />{children}
    </div>
  );
}

/** 아이콘만 있는 둥근 버튼 (선택 상태 표시) */
export function IconBtn({ label, on, tone = "blue", onClick, children }: { label: string; on?: boolean; tone?: "blue" | "red"; onClick: () => void; children: ReactNode }) {
  const onCls = tone === "red" ? "bg-red-bg text-red" : "bg-blue-100 text-blue-600";
  return <button type="button" aria-label={label} aria-pressed={on} onClick={onClick} className={`grid h-10 w-10 place-items-center rounded-full ${on ? onCls : "text-ink-500 hover:bg-canvas"}`}>{children}</button>;
}

/** 글자 링크형 작은 버튼 (카드 바닥줄 등) */
export function TextBtn({ children, onClick, tone = "default" }: { children: ReactNode; onClick: () => void; tone?: "default" | "muted" | "danger" }) {
  const t = { default: "text-ink-700", muted: "text-ink-500", danger: "text-red" }[tone];
  return <button type="button" onClick={onClick} className={`t-label min-h-9 ${t}`}>{children}</button>;
}

/** 화면 안 탭 (사건 상세 등). 현재 탭 = 현재 메뉴와 같은 Blue 600 밑줄, 가로 스크롤, 화면 위에 고정 */
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="no-print no-scrollbar sticky top-[58px] z-20 -mx-4 mt-5 flex overflow-x-auto border-b border-line bg-canvas px-2 tab:top-[68px] tab:mx-0 tab:px-0">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={on} onClick={(e) => { onChange(t.id); e.currentTarget.scrollIntoView({ inline: "center", block: "nearest" }); }}
            className={`min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-[13px] font-bold ${on ? "border-blue-600 text-blue-600" : "border-transparent text-ink-500 hover:text-ink-900"}`}>
            {t.label}{t.count != null && t.count > 0 && <span className={`ml-1 text-[11px] ${on ? "text-blue-600" : "text-ink-400"}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** 켜고 끄는 설정 한 줄 (체크박스 + 제목 + 설명) */
export function CheckRow({ checked, onChange, title, desc, right }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc?: string; right?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-b border-line py-3 last:border-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-blue-600" />
      <span className="min-w-0 flex-1"><span className="t-title block">{title}</span>{desc && <span className="t-desc block">{desc}</span>}</span>
      {right && <span className="shrink-0">{right}</span>}
    </label>
  );
}
