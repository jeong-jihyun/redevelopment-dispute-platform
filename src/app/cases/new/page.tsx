"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BUSINESS_TYPES, ROLES, disputeById } from "@/lib/data";
import { maskSensitive } from "@/lib/analyze";
import { CASE_STATUSES, disputeOptions, stageOptions } from "@/lib/cases";
import { getDB, logCase, now, uid, update, type Case } from "@/lib/store";
import { Alert, Btn, Disclaimer, Field, Page, PageHeader, Panel, Section, SelectField, TopBar, inputCls } from "@/components/ui";

type Form = Pick<Case, "title" | "businessType" | "region" | "projectName" | "stage" | "role" | "disputeType" | "eventDate" | "description" | "status">;
const EMPTY: Form = { title: "", businessType: "재개발사업", region: "", projectName: "", stage: "", role: "", disputeType: "", eventDate: "", description: "", status: "진행 중" };
const REQUIRED: (keyof Form)[] = ["title", "businessType", "region", "projectName"];
const LABEL: Record<string, string> = { title: "사건명", businessType: "사업 유형", region: "사업 지역", projectName: "사업명" };

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const editId = sp.get("edit");
  const fromConv = sp.get("from");
  const [f, setF] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const db = getDB();
    if (editId) {
      const c = db.cases.find((x) => x.id === editId);
      if (!c) { setNotFound(true); return; }
      setF({ title: c.title, businessType: c.businessType, region: c.region, projectName: c.projectName, stage: c.stage, role: c.role, disputeType: c.disputeType, eventDate: c.eventDate, description: c.description, status: c.status });
      return;
    }
    const init = { ...EMPTY };
    if (db.profile?.region) init.region = db.profile.region;
    if (db.profile?.role) init.role = db.profile.role;
    if (fromConv) {
      const c = db.conversations.find((x) => x.id === fromConv);
      if (c) {
        const a = [...c.messages].reverse().find((m) => m.analysis)?.analysis;
        const first = c.messages.find((m) => m.role === "user")?.text || "";
        const dId = a?.disputes[0]?.id || c.topic || "";
        Object.assign(init, {
          title: dId ? `${disputeById(dId)?.short || ""} 관련 분쟁` : c.title.slice(0, 30),
          businessType: c.facts.businessType || init.businessType, stage: c.facts.stage || "", role: c.facts.role || init.role,
          disputeType: dId, description: first,
        });
        setNote("AI 상담 내용으로 사업 유형·단계·지위·분쟁 유형·사건 설명을 채웠습니다. 사건명과 사업 정보를 확인해 주세요.");
      }
    }
    setF(init);
  }, [editId, fromConv]);

  const set = (k: keyof Form, v: string) => setF((p) => ({ ...p, [k]: v }));
  const missing = REQUIRED.filter((k) => !f[k].trim());
  const err = (k: keyof Form) => (tried && missing.includes(k) ? `${LABEL[k]}을(를) 입력해 주세요.` : undefined);

  function submit() {
    setTried(true);
    if (missing.length) { document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center" }); return; }
    const clean = { ...f, title: f.title.trim(), description: maskSensitive(f.description.trim()) };
    let id = editId || uid();
    update((db) => {
      const ex = editId ? db.cases.find((c) => c.id === editId) : undefined;
      if (ex) { Object.assign(ex, clean); logCase(ex, "사건 정보 수정"); id = ex.id; return; }
      const at = now();
      const me = db.profile?.name || "나";
      const c: Case = { id, ...clean, createdAt: at, updatedAt: at, lawIds: disputeById(clean.disputeType)?.laws.slice(0, 3) || [], analyses: [], evidence: [], schedules: [],
        members: [{ id: uid(), name: me, email: db.profile?.email || "", role: "사건 소유자", invitedAt: at, accepted: true }], activity: [] };
      logCase(c, "사건 생성");
      if (fromConv) {
        const conv = db.conversations.find((x) => x.id === fromConv);
        if (conv) { conv.caseId = id; logCase(c, `AI 상담 연결 · ${conv.title}`); }
      }
      db.cases.unshift(c);
    });
    router.replace(`/cases/${id}`);
  }

  if (notFound) return (<><TopBar title="사건 수정" back="/cases" /><Page><Alert tone="warn" title="찾을 수 없음">이 기기에 없는 사건입니다.</Alert></Page></>);

  return (
    <>
      <TopBar title={editId ? "사건 정보 수정" : "새 사건 만들기"} crumb="내 사건" back={editId ? `/cases/${editId}` : "/cases"} />
      <Page>
        <PageHeader eyebrow="CASE" title={editId ? "사건 정보 수정" : "새 사건 만들기"} lead="사건마다 독립된 공간이 만들어지고, 다른 사건의 자료와 섞이지 않습니다." />
        {note && <Alert tone="info" title="상담 내용 반영">{note}</Alert>}

        <Section title="사건 정보" desc="* 표시는 꼭 입력해야 합니다" kicker="CASE INFO">
          <Panel>
            <Field label="사건명" required error={err("title")} help="예) 정기총회 의결 절차 관련 이의">
              <input value={f.title} onChange={(e) => set("title", e.target.value)} aria-invalid={!!err("title")} maxLength={60} className={inputCls} placeholder="사건을 알아보기 쉬운 이름" />
            </Field>
            <SelectField label="사업 유형" required value={f.businessType} onChange={(v) => set("businessType", v)} options={BUSINESS_TYPES.map((b) => ({ value: b.name, label: b.name }))} />
            <Field label="사업 지역" required error={err("region")}>
              <input value={f.region} onChange={(e) => set("region", e.target.value)} aria-invalid={!!err("region")} className={inputCls} placeholder="예) 서울 성북구" />
            </Field>
            <Field label="사업명" required error={err("projectName")}>
              <input value={f.projectName} onChange={(e) => set("projectName", e.target.value)} aria-invalid={!!err("projectName")} className={inputCls} placeholder="예) ○○구역 주택재개발정비사업" />
            </Field>
            <SelectField label="사업 단계" value={f.stage} onChange={(v) => set("stage", v)} options={stageOptions} />
            <SelectField label="이용자 지위" value={f.role} onChange={(v) => set("role", v)} options={[{ value: "", label: "선택 안 함" }, ...ROLES.map((r) => ({ value: r.name, label: r.name }))]} />
            <SelectField label="분쟁 유형" value={f.disputeType} onChange={(v) => set("disputeType", v)} options={disputeOptions} help="고르면 관련 법령이 사건에 미리 연결됩니다." />
            <Field label="사건 발생일">
              <input type="date" value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} className={inputCls} />
            </Field>
            <Field label="사건 설명" help="언제, 누가, 무엇을 했는지 순서대로. 주민등록번호·휴대폰 번호는 저장할 때 자동으로 가립니다.">
              <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={3000} className={`${inputCls} min-h-[130px] resize-y leading-relaxed`} />
            </Field>
            {editId && <SelectField label="진행 상태" value={f.status} onChange={(v) => set("status", v)} options={CASE_STATUSES.map((s) => ({ value: s.name, label: s.name }))} />}
          </Panel>
        </Section>
        {tried && missing.length > 0 && <Alert tone="danger" title="필수 항목">{missing.map((k) => LABEL[k]).join(", ")}을(를) 입력해 주세요.</Alert>}
        <div className="mt-4 flex gap-[9px]">
          <Btn onClick={submit} className="flex-1 tab:flex-none">{editId ? "수정 내용 저장" : "사건 만들기"}</Btn>
          <Btn kind="secondary" onClick={() => router.back()}>취소</Btn>
        </div>
        <Disclaimer />
      </Page>
    </>
  );
}

export default function NewCase() {
  return <Suspense><Inner /></Suspense>;
}
