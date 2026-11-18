"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Banknote, Building2, ChevronLeft, CircleHelp, ExternalLink, FileStack, FileText, FolderLock, Gavel, HardHat, Home,
  Landmark, MessageCircle, Scale, Search, TrendingUp, Truck, UserCheck, UserRound, Users,
} from "lucide-react";
import type { LawRef, Precedent } from "@/lib/data";

export const ICONS: Record<string, typeof Home> = {
  Landmark, UserCheck, Users, FileStack, Scale, Banknote, Truck, HardHat, Search, Home, TrendingUp, Building2, Gavel, CircleHelp,
};

const NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/ai", label: "AI 상담", icon: MessageCircle },
  { href: "/laws", label: "법령·판례", icon: Scale },
  { href: "/docs", label: "서류 작성", icon: FileText },
  { href: "/cases", label: "내 사건", icon: FolderLock },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-40 border-t border-line bg-white/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex max-w-2xl">
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${on ? "text-navy font-semibold" : "text-muted"}`}>
              <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title, back, right }: { title: string; back?: boolean | string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-2">
        {back ? (
          <button aria-label="뒤로" onClick={() => (typeof back === "string" ? router.push(back) : router.back())} className="grid h-10 w-10 place-items-center rounded-full active:bg-line">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
        {right ?? (
          <Link href="/my" aria-label="마이페이지" className="grid h-10 w-10 place-items-center rounded-full active:bg-line">
            <UserRound size={22} />
          </Link>
        )}
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="safe-bottom mx-auto max-w-2xl px-4 pt-4">{children}</main>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</div>;
}

export function H2({ children, more }: { children: ReactNode; more?: { href: string; label?: string } }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {more && <Link href={more.href} className="text-[13px] text-muted">{more.label ?? "전체보기"} ›</Link>}
    </div>
  );
}

export function Btn({ children, onClick, kind = "primary", type = "button", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "danger" | "soft"; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const k = {
    primary: "bg-navy text-white active:bg-navy-2",
    ghost: "border border-line bg-white text-ink active:bg-paper",
    danger: "border border-bad/30 bg-bad-soft text-bad",
    soft: "bg-amber-soft text-ink",
  }[kind];
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold disabled:opacity-40 ${k} ${className}`}>
      {children}
    </button>
  );
}

export function Chip({ children, on, onClick }: { children: ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}`}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "amber" | "good" | "bad" | "navy" }) {
  const t = { plain: "bg-paper text-muted", amber: "bg-amber-soft text-[#8a5a10]", good: "bg-good-soft text-good", bad: "bg-bad-soft text-bad", navy: "bg-navy/10 text-navy" }[tone];
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

export function LawCard({ l, compact }: { l: LawRef; compact?: boolean }) {
  return (
    <Card className="!p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] text-muted">{l.law}</div>
          <div className="text-[15px] font-bold">{l.article} {l.title}</div>
        </div>
        <a href={l.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 text-[12px] text-navy">
          원문 <ExternalLink size={12} />
        </a>
      </div>
      {!compact && <p className="mt-1.5 text-[14px] leading-relaxed text-ink/85">{l.summary}</p>}
      {l.deadline && (
        <div className="mt-2"><Tag tone="amber">기한 {l.deadline.days}일 · 기산점: {l.deadline.from}</Tag></div>
      )}
    </Card>
  );
}

export function PrecCard({ p }: { p: Precedent }) {
  return (
    <Card className="!p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] text-muted">{p.court} {p.date} 선고</div>
          <div className="text-[15px] font-bold">{p.caseNo} · {p.title}</div>
        </div>
        <a href={p.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 text-[12px] text-navy">
          원문 <ExternalLink size={12} />
        </a>
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink/85">{p.gist}</p>
      <div className="mt-1.5 text-[11px] text-muted">요지는 쉽게 풀어 쓴 것입니다. 정확한 판단은 판결 원문을 확인하세요.</div>
    </Card>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-6 rounded-xl bg-white/60 p-3 text-[12px] leading-relaxed text-muted">
      이 서비스는 법률정보 제공 및 문서 작성 보조 서비스로, 변호사의 법률의견이나 법률대리를 대체하지 않습니다. 법정 기한·소송·가처분은 반드시 전문가와 확인하세요.
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-white/50 p-6 text-center text-[14px] text-muted">{children}</div>;
}

export function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold">
        {label} {required && <span className="text-bad">*</span>}
      </span>
      {children}
      {help && <span className="mt-1 block text-[12px] text-muted">{help}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-navy";
