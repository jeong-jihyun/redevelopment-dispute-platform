"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cloudReady, sendLogin, signOut, useSession, verifyCode } from "@/lib/cloud";
import { getDB } from "@/lib/store";
import { Alert, Btn, Disclaimer, Field, Loading, Page, PageHeader, Panel, Section, StepList, TopBar, inputCls, runBusy } from "@/components/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/my";
  const session = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "danger"; text: string } | null>(null);
  const [cool, setCool] = useState(0);

  useEffect(() => { const p = getDB().profile?.email; if (p) setEmail(p); try { const e = sessionStorage.getItem("redev-login-email"); if (e) { setEmail(e); setSent(true); } } catch { /* 무시 */ } }, []);
  useEffect(() => { if (session) router.replace(next); }, [session, next, router]);
  useEffect(() => { if (!cool) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  const send = () => {
    if (!EMAIL.test(email.trim())) { setMsg({ tone: "danger", text: "이메일 주소를 확인해 주세요." }); return; }
    runBusy("로그인 메일 보내는 중", async () => {
      try {
        await sendLogin(email.trim(), next);
        try { sessionStorage.setItem("redev-login-email", email.trim()); } catch { /* 무시 */ }
        setSent(true); setCool(60);
        setMsg({ tone: "info", text: `${email.trim()}로 메일을 보냈습니다. 메일의 ‘로그인’ 버튼을 누르거나, 6자리 코드를 아래에 입력하세요. 메일이 없으면 스팸함도 확인하세요.` });
      } catch (e) { setMsg({ tone: "danger", text: e instanceof Error ? e.message : "보내지 못했습니다." }); }
    });
  };
  const verify = () => {
    if (!/^\d{6}$/.test(code.trim())) { setMsg({ tone: "danger", text: "메일에 있는 6자리 숫자를 입력해 주세요." }); return; }
    runBusy("로그인 확인 중", async () => {
      try { await verifyCode(email.trim(), code); try { sessionStorage.removeItem("redev-login-email"); } catch { /* 무시 */ } }
      catch (e) { setMsg({ tone: "danger", text: e instanceof Error ? e.message : "확인하지 못했습니다." }); }
    });
  };

  if (!cloudReady) return (<><TopBar title="로그인" back="/my" /><Page><Alert tone="warn" title="준비 중">공유 서버가 아직 연결되지 않았습니다.</Alert></Page></>);

  return (
    <>
      <TopBar title="로그인" crumb="공유·커뮤니티" back="/my" />
      <Page>
        <PageHeader eyebrow="SIGN IN" title="이메일로 로그인" lead="비밀번호 없이, 메일로 받은 링크나 6자리 코드로 로그인합니다. 사건 공유·커뮤니티·동의서에만 필요합니다." />
        {session === undefined && <Loading>로그인 상태 확인 중</Loading>}
        {session && <Alert tone="info" title="로그인됨">{session.user.email}로 로그인되어 있습니다. 이동합니다…</Alert>}
        {msg && <Alert tone={msg.tone} title={msg.tone === "danger" ? "확인 필요" : "메일 보냄"}>{msg.text}</Alert>}

        <Section title="1. 이메일 입력" kicker="EMAIL">
          <Panel>
            <Field label="이메일" required help="처음이면 자동으로 가입됩니다.">
              <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@example.com" onKeyDown={(e) => e.key === "Enter" && send()} />
            </Field>
            <Btn kind={sent ? "secondary" : "primary"} onClick={send} disabled={cool > 0} className="w-full tab:w-auto">{cool > 0 ? `다시 보내기 (${cool}초)` : sent ? "메일 다시 보내기" : "로그인 메일 받기"}</Btn>
          </Panel>
        </Section>

        {sent && (
          <Section title="2. 6자리 코드 입력" desc="메일 링크가 다른 앱 브라우저에서 열려 로그인이 안 되면 코드를 쓰세요" kicker="CODE">
            <Panel>
              <Field label="6자리 코드">
                <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${inputCls} tracking-[6px]`} placeholder="000000" onKeyDown={(e) => e.key === "Enter" && verify()} />
              </Field>
              <Btn onClick={verify} className="w-full tab:w-auto">코드로 로그인</Btn>
            </Panel>
          </Section>
        )}

        <Section title="알아 두기" kicker="NOTE">
          <StepList items={[
            { title: "내 사건 자료는 그대로 이 기기에", desc: "로그인해도 증거 원본·상담은 서버로 가지 않습니다. 공유를 켠 사건의 고른 내용만 올라갑니다." },
            { title: "공유받은 사람도 같은 방법으로", desc: "초대 링크를 연 사람은 이메일로 로그인한 뒤 이름을 적고 참여합니다." },
            { title: "글·서명은 계정에 기록", desc: "누가 언제 글을 쓰고 서명했는지 계정(이메일)으로 남습니다." },
          ]} />
        </Section>
        {session && <div className="mt-4"><Btn kind="ghost" onClick={() => runBusy("로그아웃 중", signOut)}>로그아웃</Btn></div>}
        <Disclaimer />
      </Page>
    </>
  );
}
export default function AuthPage() { return <Suspense><Inner /></Suspense>; }
