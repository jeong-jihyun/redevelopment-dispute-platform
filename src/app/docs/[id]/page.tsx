"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { DISPUTES, lawById, templateById } from "@/lib/data";
import { buildBody, downloadDocx, missingFields, printPdf } from "@/lib/docgen";
import { fmtDate, getDB, logCase, now, uid, update } from "@/lib/store";
import {
  Alert, Btn, Disclaimer, Empty, Field, Page, PageHeader, Panel, Section, StepList, TextBtn, TopBar, btnCls, inputCls, type BadgeSpec,
} from "@/components/ui";

const draftKey = (tid: string) => `redev-doc-draft:${tid}`;
type Draft = { values: Record<string, string>; lawIds: string[]; savedAt: string };

function Inner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const t = templateById(id);
  const docId = sp.get("doc");
  const fromConv = sp.get("from");
  const caseParam = sp.get("case");

  const lawChoices = useMemo(() => {
    if (!t) return [];
    const ids = new Set([...t.laws, ...t.disputes.flatMap((d) => DISPUTES.find((x) => x.id === d)?.laws || [])]);
    return Array.from(ids).map((x) => lawById(x)!).filter(Boolean);
  }, [t]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [lawIds, setLawIds] = useState<string[]>(t?.laws || []);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [body, setBody] = useState("");
  const [edited, setEdited] = useState(false);
  const [tried, setTried] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "warn" | "danger"; title: string; text: string } | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<string | null>(docId);
  const loaded = useRef(false);

  // 불러오기: 저장된 서류 → 임시 저장본 → AI 상담 내용 순서
  useEffect(() => {
    if (!t || loaded.current) return;
    loaded.current = true;
    const db = getDB();
    if (docId) {
      const d = db.docs.find((x) => x.id === docId);
      if (d) {
        setValues(d.values); setLawIds(d.lawIds || t.laws); setBody(d.body); setEdited(!!d.edited); setStep("preview");
        setNotice({ tone: "info", title: "불러옴", text: `저장된 서류(버전 ${d.version})를 열었습니다. 고친 뒤 다시 저장하면 버전이 올라갑니다.` });
        return;
      }
    }
    const cs = caseParam ? db.cases.find((x) => x.id === caseParam) : undefined;
    try {
      const raw = cs ? null : localStorage.getItem(draftKey(t.id));
      if (raw) {
        const dr = JSON.parse(raw) as Draft;
        setValues(dr.values); setLawIds(dr.lawIds); setSavedAt(dr.savedAt);
        setNotice({ tone: "info", title: "임시 저장본", text: "작성하던 내용을 불러왔습니다." });
        return;
      }
    } catch { /* 저장소를 못 읽으면 빈 양식으로 시작 */ }
    const prof = db.profile;
    const init: Record<string, string> = {};
    if (prof?.name) init.author = prof.name;
    if (fromConv) {
      const c = db.conversations.find((x) => x.id === fromConv);
      const q = c?.messages.find((m) => m.role === "user")?.text;
      if (q) {
        init.facts = q;
        setNotice({ tone: "info", title: "AI 상담 내용 반영", text: "상담에서 적은 상황을 '주요 사실관계'에 넣어 두었습니다. 날짜 순서로 다듬어 주세요." });
      }
    }
    if (cs) {
      const ev = cs.evidence.filter((e) => !e.deletedAt);
      Object.assign(init, {
        projectName: cs.projectName, eventDate: cs.eventDate || "", facts: init.facts || cs.description,
        attachments: ev.map((e) => `${e.number} ${e.name}${e.docDate ? ` (${e.docDate})` : ""}`).join("\n"),
      });
      setLawIds(Array.from(new Set([...(t.laws || []), ...cs.lawIds])));
      setNotice({ tone: "info", title: "사건 내용 반영", text: `‘${cs.title}’ 사건의 사업명·발생일·사건 설명·증거 목록 ${ev.length}건·근거 법령을 채웠습니다. 저장하면 사건에 연결됩니다.` });
    }
    setValues(init);
  }, [t, docId, fromConv, caseParam]);

  // 입력 중 자동 임시 저장 (저장된 서류를 고치는 중이 아닐 때)
  useEffect(() => {
    if (!t || !loaded.current || currentDoc || step !== "input") return;
    const has = Object.values(values).some((v) => v?.trim());
    if (!has) return;
    const h = setTimeout(() => {
      const at = now();
      try { localStorage.setItem(draftKey(t.id), JSON.stringify({ values, lawIds, savedAt: at } satisfies Draft)); setSavedAt(at); } catch { /* 공간 부족 시 무시 */ }
    }, 600);
    return () => clearTimeout(h);
  }, [values, lawIds, t, currentDoc, step]);

  if (!t) return (<><TopBar title="서류 작성" back="/docs" /><Page><Empty>없는 서류 양식입니다.</Empty></Page></>);

  const missing = missingFields(t, values);
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));
  const fileTitle = `${t.title.replace(/[\\/:*?"<>|()]/g, "")}_${(values.author || "작성자").trim()}`;

  function makePreview(force = false) {
    setTried(true);
    if (missing.length) {
      setNotice({ tone: "danger", title: "필수 항목", text: `${missing.join(", ")}을(를) 입력해 주세요.` });
      document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center" });
      return;
    }
    if (edited && !force) { setConfirmRegen(true); return; }
    setBody(buildBody(t!, values, lawIds)); setEdited(false); setConfirmRegen(false); setStep("preview"); setNotice(null);
    window.scrollTo({ top: 0 });
  }

  function saveMine() {
    const at = now();
    let ver = 1; let newId = currentDoc;
    update((db) => {
      const ex = currentDoc ? db.docs.find((d) => d.id === currentDoc) : undefined;
      if (ex) {
        ex.values = values; ex.lawIds = lawIds; ex.body = body; ex.edited = edited; ex.updatedAt = at; ex.version += 1; ver = ex.version;
        ex.title = `${t!.title} — ${values.recipient || values.projectName || "제목 없음"}`;
      } else {
        newId = uid();
        db.docs.unshift({ id: newId, templateId: t!.id, title: `${t!.title} — ${values.recipient || values.projectName || "제목 없음"}`, values, lawIds, body, edited, caseId: caseParam && db.cases.some((c) => c.id === caseParam) ? caseParam : undefined, createdAt: at, updatedAt: at, version: 1 });
      }
      const d = db.docs.find((x) => x.id === newId);
      const cs = d?.caseId ? db.cases.find((c) => c.id === d.caseId) : undefined;
      if (cs && d) logCase(cs, `서류 저장 · ${d.title} (v${ver}, ${fmtDate(at)})`);
    });
    try { localStorage.removeItem(draftKey(t!.id)); } catch { /* 무시 */ }
    setCurrentDoc(newId);
    if (newId && !docId) router.replace(`/docs/${t!.id}?doc=${newId}${caseParam ? `&case=${caseParam}` : ""}`);
    setNotice({ tone: "info", title: "저장 완료", text: `내 서류에 버전 ${ver}로 저장했습니다. 서류 목록의 '내가 만든 서류'에서 다시 열 수 있습니다.` });
  }

  function resetDraft() {
    try { localStorage.removeItem(draftKey(t!.id)); } catch { /* 무시 */ }
    setValues({}); setLawIds(t!.laws); setSavedAt(null); setTried(false); setNotice({ tone: "info", title: "새로 작성", text: "입력 내용을 비웠습니다." });
  }

  const steps: { title: string; desc: string; badge: BadgeSpec }[] = [
    { title: "질문에 답하기", desc: `필수 ${t.fields.filter((f) => f.required).length}개 항목`, badge: step === "input" ? { text: "진행 중", tone: "blue" } : { text: "완료", tone: "green" } },
    { title: "미리보기에서 고치기", desc: "문장을 직접 수정할 수 있습니다", badge: step === "preview" ? { text: "진행 중", tone: "blue" } : { text: "대기", tone: "gray" } },
    { title: "저장하기", desc: "Word(DOCX)·PDF·내 서류", badge: currentDoc ? { text: "저장됨", tone: "green" } : { text: "대기", tone: "gray" } },
  ];

  return (
    <>
      <TopBar title={t.name} crumb="서류 작성" back="/docs" />
      <Page wide>
        <PageHeader eyebrow="Document" title={t.name} lead={t.desc}
          badges={[{ text: t.category, tone: "blue" }, ...(t.expertReview ? [{ text: "전문가 검토", tone: "purple" as const }] : []), { text: `양식 v${t.version}`, tone: "gray" }]} />
        {t.expertReview && <Alert tone="danger" title="전문가 검토 필요">소송·가처분·행정심판 서류는 AI가 만든 초안입니다. 제출 전에 반드시 변호사 등 전문가의 검토를 받으세요.</Alert>}

        <Section title="작성 순서" kicker="PROCESS"><StepList items={steps} /></Section>

        {notice && <Alert tone={notice.tone} title={notice.title}>{notice.text}</Alert>}

        {step === "input" ? (
          <>
            <Section title="질문에 답하기" desc="* 표시는 꼭 입력해야 합니다" kicker="INPUT">
              <Panel>
                {t.fields.map((f) => {
                  const err = tried && f.required && !values[f.key]?.trim() ? `${f.label}을(를) 입력해 주세요.` : undefined;
                  const common = { value: values[f.key] || "", "aria-invalid": !!err, placeholder: f.placeholder };
                  return (
                    <Field key={f.key} label={f.label} required={f.required} help={f.help} error={err}>
                      {f.type === "textarea"
                        ? <textarea {...common} rows={4} onChange={(e) => set(f.key, e.target.value)} className={`${inputCls} min-h-[104px] resize-y leading-relaxed`} />
                        : <input {...common} type={f.type === "date" ? "date" : "text"} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />}
                    </Field>
                  );
                })}
                <p className="t-meta">{savedAt ? `자동 임시 저장됨 · ${new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : "입력하면 이 기기에 자동으로 임시 저장됩니다."}</p>
              </Panel>
            </Section>

            <Section title="법률적 근거" desc="서류에 넣을 조문을 고르세요 (요약은 원문으로 확인)" kicker="LEGAL EVIDENCE">
              <Panel className="!py-1">
                {lawChoices.length === 0 ? <p className="t-meta py-3">이 서류는 기본 근거 조문이 없습니다.</p> : lawChoices.map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-start gap-3 border-b border-line py-3 last:border-0">
                    <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-blue-600" checked={lawIds.includes(l.id)}
                      onChange={(e) => setLawIds((p) => (e.target.checked ? [...p, l.id] : p.filter((x) => x !== l.id)))} />
                    <span className="min-w-0 flex-1">
                      <span className="t-title block">「{l.short}」 {l.article} {l.title}</span>
                      <span className="t-desc block">{l.summary}</span>
                    </span>
                    <a href={l.url} target="_blank" rel="noreferrer" className="t-label flex shrink-0 items-center gap-1 pt-0.5">원문 <ExternalLink size={12} /></a>
                  </label>
                ))}
              </Panel>
            </Section>

            <Alert tone="info" title="개인정보 보호">주민등록번호·휴대폰 번호는 서류를 만들 때 자동으로 가립니다. 꼭 필요하면 저장한 뒤 직접 적어 넣으세요.</Alert>
            {confirmRegen && (
              <Alert tone="warn" title="직접 고친 내용">미리보기에서 직접 고친 문장이 있습니다. 다시 만들면 고친 내용이 사라집니다.
                <span className="mt-1 flex gap-3"><TextBtn tone="danger" onClick={() => makePreview(true)}>다시 만들기</TextBtn><TextBtn tone="muted" onClick={() => { setConfirmRegen(false); setStep("preview"); }}>고친 미리보기로 돌아가기</TextBtn></span>
              </Alert>
            )}
            <div className="mt-4 flex flex-wrap gap-[9px]">
              <Btn onClick={() => makePreview()} className="flex-1 tab:flex-none">미리보기 만들기</Btn>
              <Btn kind="secondary" onClick={resetDraft}>새로 작성</Btn>
            </div>
          </>
        ) : (
          <>
            <Section title="미리보기" desc="문장을 직접 고칠 수 있습니다" kicker="PREVIEW">
              <Panel>
                <textarea aria-label="서류 내용" value={body} onChange={(e) => { setBody(e.target.value); setEdited(true); }}
                  className={`${inputCls} min-h-[60vh] resize-y leading-relaxed`} />
                <p className="t-meta mt-2">{edited ? "직접 고친 내용이 있습니다." : "질문에 답한 내용으로 만든 초안입니다."} 글자 {body.length.toLocaleString()}자</p>
              </Panel>
            </Section>

            <Section title="저장하기" kicker="SAVE">
              <Panel>
                <div className="flex flex-wrap gap-[9px]">
                  <Btn onClick={async () => { try { await downloadDocx(fileTitle, body, t.expertReview); setNotice({ tone: "info", title: "DOCX 저장", text: `'${fileTitle}.docx' 파일을 내려받았습니다.` }); } catch { setNotice({ tone: "danger", title: "저장 실패", text: "Word 파일을 만들지 못했습니다. 다시 시도해 주세요." }); } }} className="flex-1 tab:flex-none">Word(DOCX)로 저장</Btn>
                  <Btn kind="secondary" onClick={() => printPdf(fileTitle, body, t.expertReview)}>PDF로 저장</Btn>
                  <Btn kind="secondary" onClick={saveMine}>{currentDoc ? "내 서류 업데이트" : "내 서류에 저장"}</Btn>
                </div>
                <p className="t-meta mt-2.5">PDF는 인쇄 창이 열리면 대상을 ‘PDF로 저장’으로 고르세요. 팝업이 막히면 브라우저에서 팝업을 허용해 주세요.</p>
              </Panel>
            </Section>
            <div className="mt-4 flex flex-wrap gap-[9px]">
              <Btn kind="secondary" onClick={() => { setStep("input"); window.scrollTo({ top: 0 }); }}>입력 내용 고치기</Btn>
              <Btn kind="ghost" onClick={() => { navigator.clipboard?.writeText(body); setNotice({ tone: "info", title: "복사", text: "서류 내용을 복사했습니다." }); }}>내용 복사</Btn>
              {caseParam ? <Link href={`/cases/${caseParam}?tab=docs`} className={btnCls("ghost")}>사건으로 돌아가기</Link> : <Link href="/docs" className={btnCls("ghost")}>서류 목록</Link>}
            </div>
          </>
        )}
        <Disclaimer />
      </Page>
    </>
  );
}

export default function DocWrite() {
  return <Suspense><Inner /></Suspense>;
}
