"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROLES } from "@/lib/data";
import { buildIcs, clearAllFiles, exportBackup, readBackup, restoreFiles, saveFile, usedStorage } from "@/lib/cases";
import { fmtDate, fmtSize, getDB, logAccess, now, update, useDB, type Profile } from "@/lib/store";
import { cloudReady, signOut, useSession, acct } from "@/lib/cloud";
import { disablePush, enablePush, isIOS, isStandalone, pushOn, pushSupported } from "@/lib/notify";
import SharedList from "@/components/shared/SharedList";
import {
  Alert, Btn, Loading, CheckRow, DataTable, Disclaimer, Empty, Field, MetricCard, runBusy, useBusy, Page, PageHeader, Panel, Section, SelectField, TopBar, btnCls, inputCls,
} from "@/components/ui";

const EMPTY: Profile = { name: "", email: "", role: "", region: "", notify: false };
const KEY = "redev-legal-v1";

export default function MyPage() {
  const db = useDB();
  const [p, setP] = useState<Profile>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "danger"; title: string; text: string } | null>(null);
  const busy = useBusy();
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);
  const [withFiles, setWithFiles] = useState(true);
  const [wipe, setWipe] = useState("");
  const [perm, setPerm] = useState<string>("default");
  const fileIn = useRef<HTMLInputElement>(null);
  const session = useSession();
  const router = useRouter();
  useEffect(() => { if (cloudReady && session === null) router.replace("/auth?next=/my"); }, [session, router]);
  const [push, setPush] = useState(false);
  const [pushErr, setPushErr] = useState("");
  useEffect(() => { if (session) pushOn().then(setPush).catch(() => {}); }, [session]);
  const togglePush = (v: boolean) => runBusy(v ? "푸시 알림 켜는 중" : "푸시 알림 끄는 중", async () => {
    setPushErr("");
    try { if (v) await enablePush(session!.user.id); else await disablePush(); setPush(v); update((d) => logAccess(d, `푸시 알림 ${v ? "켬" : "끔"}`)); }
    catch (e) { setPushErr(e instanceof Error ? e.message : "처리하지 못했습니다."); }
  });

  useEffect(() => { setP({ ...EMPTY, ...(getDB().profile || {}) }); usedStorage().then(setStorage); if (typeof Notification !== "undefined") setPerm(Notification.permission); }, []);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setP((x) => ({ ...x, [k]: v })); setDirty(true); };
  const evCount = db.cases.reduce((n, c) => n + c.evidence.filter((e) => !e.deletedAt).length, 0);
  const open = db.cases.flatMap((c) => c.schedules.filter((s) => !s.done).map((s) => ({ s, caseTitle: c.title })));

  function saveProfile() {
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { setMsg({ tone: "danger", title: "이메일", text: "이메일 형식을 확인해 주세요." }); return; }
    runBusy("회원정보 저장 중", () => {
    update((d) => { d.profile = { ...p, name: p.name.trim(), joinedAt: d.profile?.joinedAt || now() }; logAccess(d, "회원정보 수정"); });
    setDirty(false); setMsg({ tone: "info", title: "저장", text: "회원정보를 저장했습니다. 서류 작성자·사건 소유자 이름에 쓰입니다." });
    });
  }
  async function toggleNotify(v: boolean) {
    if (v && typeof Notification !== "undefined" && Notification.permission === "default") setPerm(await Notification.requestPermission());
    update((d) => { d.profile = { ...EMPTY, ...(d.profile || {}), notify: v }; logAccess(d, `기한 알림 ${v ? "켬" : "끔"}`); });
    setP((x) => ({ ...x, notify: v }));
  }
  const backup = () => runBusy("백업 파일 만드는 중 (증거 원본이 많으면 오래 걸립니다)", doBackup, 600);
  async function doBackup() {
    try {
      const r = await exportBackup(withFiles);
      saveFile(r.blob, `재개발분쟁도우미_백업_${new Date().toISOString().slice(0, 10)}.json`);
      update((d) => logAccess(d, `백업 내려받기 (증거 원본 ${r.fileCount}건)`));
      setMsg({ tone: r.missing ? "warn" : "info", title: "백업 완료", text: `백업 파일을 내려받았습니다 (${fmtSize(r.blob.size)}, 증거 원본 ${r.fileCount}건).${r.missing ? ` 원본이 없는 자료 ${r.missing}건은 목록만 들어갔습니다.` : ""} 파일에 개인정보가 들어 있으니 안전한 곳에 보관하세요.` });
    } catch { setMsg({ tone: "danger", title: "백업 실패", text: "파일을 만들지 못했습니다. ‘증거 원본 포함’을 끄고 다시 시도해 보세요." }); }
  }
  function restore(f: File | undefined) {
    if (!f) return;
    runBusy("백업 불러오는 중", () => doRestore(f), 900);
  }
  async function doRestore(f: File) {
    try {
      const j = await readBackup(f);
      await restoreFiles(j);
      localStorage.setItem(KEY, JSON.stringify(j.db));
      setMsg({ tone: "info", title: "불러오기 완료", text: `${fmtDate(j.exportedAt)} 백업을 불러왔습니다 (사건 ${j.db.cases.length}건). 화면을 새로 고칩니다.` });
      await new Promise((r) => setTimeout(r, 900));
      location.reload();
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) { setMsg({ tone: "danger", title: "불러오기 실패", text: e instanceof Error ? e.message : "백업 파일을 읽지 못했습니다." }); }
    if (fileIn.current) fileIn.current.value = "";
  }
  const wipeAll = () => runBusy("모든 자료 삭제 중", doWipe, 800);
  async function doWipe() {
    await clearAllFiles();
    localStorage.removeItem(KEY);
    Object.keys(localStorage).filter((k) => k.startsWith("redev-")).forEach((k) => localStorage.removeItem(k));
    location.href = "/";
    await new Promise((r) => setTimeout(r, 3000));
  }

  /* 비로그인: 마이페이지 대신 로그인·가입 화면으로 보낸다 (로그인해야 마이페이지가 열림) */
  if (cloudReady && session !== undefined && !session) return (<><TopBar title="마이페이지" crumb="도시정비 분쟁지원" /><Page><Loading>로그인 화면으로 이동 중</Loading></Page></>);
  if (cloudReady && session === undefined) return (<><TopBar title="마이페이지" crumb="도시정비 분쟁지원" /><Page><Loading>로그인 상태 확인 중</Loading></Page></>);
  return (
    <>
      <TopBar title="마이페이지" crumb="도시정비 분쟁지원" />
      <Page>
        <PageHeader eyebrow="MY PAGE" title="마이페이지" lead="회원정보·이용 이력·알림·자료 백업을 관리합니다." badges={[{ text: "이 기기에 저장", tone: "gray" }, ...(db.profile?.joinedAt ? [{ text: `시작 ${fmtDate(db.profile.joinedAt)}`, tone: "blue" as const }] : [])]} />
        {msg && <Alert tone={msg.tone} title={msg.title}>{msg.text}</Alert>}

        {cloudReady && (
          <Section title="내 계정" desc="로그인·가입 · 사건 공유·커뮤니티·동의서에 쓰입니다" kicker="ACCOUNT">
            <Panel>
              {session ? (
                <div className="flex flex-wrap items-center gap-[9px]"><p className="t-body flex-1">{acct(session.user)}로 로그인됨</p><Btn kind="secondary" onClick={() => runBusy("계정 바꾸는 중", async () => { await signOut(); update((d) => logAccess(d, "공유 계정 전환")); location.assign("/auth?next=/my"); })}>다른 계정으로 로그인</Btn><Btn kind="ghost" onClick={() => runBusy("로그아웃 중", async () => { await signOut(); update((d) => logAccess(d, "공유 계정 로그아웃")); })}>로그아웃</Btn></div>
              ) : (
                <div className="flex flex-wrap items-center gap-[9px]"><p className="t-desc flex-1">지금은 로그인하지 않은 상태입니다. 이메일로 로그인하면 처음에는 자동으로 가입됩니다. 내 사건은 로그인 없이도 쓸 수 있고, 공유·커뮤니티·동의서에만 필요합니다.</p><Link href="/auth?next=/my" className={btnCls("secondary")}>로그인 · 가입</Link></div>
              )}
            </Panel>
          </Section>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2.5 tab:grid-cols-4 tab:gap-3.5">
          <MetricCard n={String(db.cases.length)} title="사건" label="내 사건" />
          <MetricCard n={String(db.conversations.length)} title="상담" label="AI 상담" />
          <MetricCard n={String(db.docs.length)} title="서류" label="내가 만든 서류" />
          <MetricCard n={String(evCount)} title="증거" label="등록 자료" />
        </div>

        <Section title="회원정보" desc="서류 작성자·사건 소유자 이름으로 자동 입력됩니다" kicker="PROFILE">
          <Panel>
            <Field label="이름"><input value={p.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="홍길동" /></Field>
            <Field label="이메일" help="서류 작성에 쓰이는 연락처입니다. 로그인 계정과는 별개입니다."><input type="email" value={p.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="name@example.com" /></Field>
            <SelectField label="내 지위" value={p.role} onChange={(v) => set("role", v)} options={[{ value: "", label: "선택 안 함" }, ...ROLES.map((r) => ({ value: r.name, label: r.name }))]} />
            <Field label="사업 지역" help="새 사건을 만들 때 미리 채워집니다."><input value={p.region} onChange={(e) => set("region", e.target.value)} className={inputCls} placeholder="예) 서울 성북구" /></Field>
            <Btn onClick={saveProfile} disabled={!dirty} className="w-full tab:w-auto">{dirty ? "회원정보 저장" : "저장됨"}</Btn>
          </Panel>
        </Section>

        <SharedList />

        <Section title="알림 설정" kicker="NOTIFICATION">
          <Panel className="!py-1">
            <CheckRow checked={!!db.profile?.notify} onChange={toggleNotify} title="기한 알림 받기" desc="앱을 열 때 3일 안에 다가오는 기한을 알려 드립니다."
              right={<span className="t-meta">{perm === "granted" ? "허용됨" : perm === "denied" ? "차단됨" : "미설정"}</span>} />
          </Panel>
          {session && cloudReady && (
            <Panel className="!py-1">
              <CheckRow checked={push} onChange={togglePush} title="공유 사건 푸시 알림" desc="새 글·댓글·동의서가 올라오면 폰 알림창으로 알려 드립니다 (이 기기에서만)."
                right={<span className="t-meta">{push ? "켜짐" : "꺼짐"}</span>} />
            </Panel>
          )}
          {pushErr && <Alert tone="warn" title="푸시 알림">{pushErr}</Alert>}
          {session && isIOS() && !isStandalone() && <Alert tone="info" title="아이폰 안내">푸시는 사파리 ‘공유 → 홈 화면에 추가’로 설치한 앱에서만 켜집니다. 안드로이드·PC 크롬은 바로 켤 수 있습니다.</Alert>}
          {session && !pushSupported() && !isIOS() && <Alert tone="info" title="푸시 미지원">이 브라우저는 푸시를 지원하지 않습니다. 앱 안 ‘새 소식’ 표시와 카톡 공유는 그대로 쓸 수 있습니다.</Alert>}
          {perm === "denied" && db.profile?.notify && <Alert tone="warn" title="알림 차단됨">브라우저 설정에서 이 사이트 알림을 허용해야 합니다. 앱 안의 ‘다가오는 기한’ 표시는 그대로 보입니다.</Alert>}
          <Alert tone="info" title="확실한 알림">앱을 닫아 두어도 알림을 받으려면 일정을 휴대폰 캘린더에 넣으세요. 기한 7일 전·하루 전에 캘린더가 알려 줍니다.</Alert>
          <Btn kind="secondary" disabled={!open.length} onClick={() => runBusy("캘린더 파일 만드는 중", () => { saveFile(buildIcs(open), `내사건_일정_${new Date().toISOString().slice(0, 10)}.ics`); update((d) => logAccess(d, `캘린더 파일 내려받기 (${open.length}건)`)); })}>
            모든 남은 일정 캘린더로 받기 ({open.length}건)
          </Btn>
        </Section>

        <Section title="이용 이력" desc="최근 30건 · 내려받기·삭제·설정 변경 기록" kicker="HISTORY">
          {db.access.length === 0 ? <Empty>기록이 없습니다.</Empty> : (
            <DataTable head={["일시", "내용"]} rows={db.access.slice(0, 30).map((a) => [new Date(a.at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), a.action])} />
          )}
        </Section>

        <Section title="보안 설정" kicker="SECURITY">
          <Panel>
            <p className="t-title">저장 방식</p>
            <p className="t-desc">상담·서류·사건·증거 원본은 서버로 보내지 않고 이 기기 브라우저 안에만 저장합니다. AI 분석을 켠 경우에만 질문 글이 분석을 위해 전송되며, 주민등록번호·휴대폰 번호는 먼저 가립니다.</p>
            <ul className="t-body mt-2.5 space-y-1.5">
              <li>· 다른 사람과 같이 쓰는 기기에서는 사용 후 아래 ‘모든 자료 삭제’를 하세요.</li>
              <li>· 휴대폰 화면 잠금을 켜 두세요. 이 앱에는 별도 잠금이 없습니다.</li>
              <li>· 백업 파일에는 증거 원본이 들어 있으니 공유 폴더에 두지 마세요.</li>
            </ul>
          </Panel>
        </Section>

        <section id="data" className="scroll-mt-20">
          <Section title="개인정보 및 자료 관리" desc="기기를 바꾸기 전에 백업하세요" kicker="DATA">
            <Panel>
              <p className="t-title">사용 중인 공간</p>
              <p className="t-desc">{storage ? `${fmtSize(storage.used)} 사용 / 약 ${fmtSize(storage.quota)}까지 가능` : "이 브라우저는 사용량을 알려 주지 않습니다."}</p>
            </Panel>
            <Panel className="mt-3.5">
              <p className="t-title">백업 파일 내려받기</p>
              <p className="t-desc">사건·상담·서류와 증거 원본을 파일 하나로 내려받습니다. 새 기기에서 ‘백업 불러오기’로 그대로 옮길 수 있습니다.</p>
              <CheckRow checked={withFiles} onChange={setWithFiles} title="증거 원본 파일 포함" desc="끄면 목록만 들어가 파일이 작아집니다." />
              <div className="mt-2 flex flex-wrap gap-[9px]">
                <Btn kind="secondary" onClick={backup} disabled={!!busy}>백업 내려받기</Btn>
                <input ref={fileIn} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} aria-label="백업 파일 고르기" />
                <Btn kind="secondary" onClick={() => fileIn.current?.click()} disabled={!!busy}>백업 불러오기</Btn>
              </div>
              <p className="t-meta mt-2">불러오기를 하면 지금 기기의 자료가 백업 내용으로 바뀝니다.</p>
            </Panel>
            <Panel className="mt-3.5">
              <p className="t-title">모든 자료 삭제</p>
              <p className="t-desc">이 기기에서 사건·증거 원본·상담·서류·회원정보를 모두 지웁니다. 되돌릴 수 없습니다.</p>
              <Field label="확인을 위해 ‘삭제’라고 입력하세요"><input value={wipe} onChange={(e) => setWipe(e.target.value)} className={inputCls} /></Field>
              <Btn kind="danger" disabled={wipe.trim() !== "삭제"} onClick={wipeAll}>모든 자료 삭제</Btn>
            </Panel>
          </Section>
        </section>
        <div className="mt-4"><Link href="/cases" className={btnCls("ghost")}>내 사건으로 →</Link></div>
        <Disclaimer />
      </Page>
    </>
  );
}
