"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { TEMPLATES, templateById } from "@/lib/data";
import { fmtDate, update, useDB } from "@/lib/store";
import { Alert, CardGrid, CaseCard, Disclaimer, Empty, Page, PageHeader, Section, SelectField, TextBtn, TopBar } from "@/components/ui";

const CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

function Inner() {
  const db = useDB();
  const caseId = useSearchParams().get("case");
  const linkCase = caseId ? db.cases.find((x) => x.id === caseId) : undefined;
  const q = linkCase ? `?case=${linkCase.id}` : "";
  const [cat, setCat] = useState("all");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const list = cat === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);
  const mine = [...db.docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <TopBar title="서류 작성" crumb="도시정비 분쟁지원" />
      <Page wide>
        <PageHeader eyebrow="Documents" title="서류 자동 작성"
          lead="질문에 답하면 서류 초안을 만들어 드립니다. 미리보기에서 직접 고친 뒤 Word(DOCX)나 PDF로 저장하세요."
          badges={[{ text: `양식 ${TEMPLATES.length}종`, tone: "blue" }, { text: "DOCX·PDF 저장", tone: "green" }]} />
        {linkCase && <Alert tone="info" title="사건 연결">‘{linkCase.title}’ 사건의 서류로 작성합니다. 사업명·발생일·사건 설명·증거 목록이 미리 채워지고, 저장하면 사건에 연결됩니다.</Alert>}
        <Alert tone="info" title="작성 순서">① 서류 고르기 → ② 질문에 답하기 → ③ 미리보기에서 고치기 → ④ 저장(DOCX·PDF·내 서류)</Alert>

        {mine.length > 0 && (
          <Section title="내가 만든 서류" desc="이 기기에 저장된 서류" kicker="MY DOCUMENTS">
            <CardGrid cols={3}>
              {mine.map((d) => {
                const t = templateById(d.templateId);
                const dc = d.caseId ? db.cases.find((x) => x.id === d.caseId) : undefined;
                return (
                  <CaseCard key={d.id} badges={[{ text: t?.category || "서류", tone: "blue" }, { text: `버전 ${d.version}`, tone: "green" }]}
                    title={d.title} desc={dc ? `${t?.name} · 사건: ${dc.title}` : t?.name} meta={`최근 수정 ${fmtDate(d.updatedAt)}`}
                    footer={
                      <span className="flex shrink-0 items-center gap-3">
                        {confirmDel === d.id ? (
                          <>
                            <TextBtn tone="danger" onClick={() => { update((x) => { x.docs = x.docs.filter((y) => y.id !== d.id); }); setConfirmDel(null); }}>삭제 확인</TextBtn>
                            <TextBtn tone="muted" onClick={() => setConfirmDel(null)}>취소</TextBtn>
                          </>
                        ) : <TextBtn tone="muted" onClick={() => setConfirmDel(d.id)}>삭제</TextBtn>}
                        <Link href={`/docs/${d.templateId}?doc=${d.id}`} className="t-label">열기 →</Link>
                      </span>
                    } />
                );
              })}
            </CardGrid>
          </Section>
        )}

        <Section title="서류 종류" desc="분류를 고르면 해당 서류만 보입니다" kicker="TEMPLATES">
          <div className="max-w-[320px]">
            <SelectField label="분류" value={cat} onChange={setCat} options={[{ value: "all", label: `전체 (${TEMPLATES.length})` }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
          </div>
          {list.length === 0 ? <Empty>해당 분류의 서류가 없습니다.</Empty> : (
            <CardGrid cols={3}>
              {list.map((t) => (
                <CaseCard key={t.id} href={`/docs/${t.id}${q}`}
                  badges={[{ text: t.category, tone: "blue" }, t.expertReview ? { text: "전문가 검토", tone: "purple" } : { text: "바로 작성", tone: "green" }]}
                  title={t.name} desc={t.desc} meta={`입력 항목 ${t.fields.length}개 · 필수 ${t.fields.filter((f) => f.required).length}개`} action="작성하기" />
              ))}
            </CardGrid>
          )}
        </Section>
        <Disclaimer />
      </Page>
    </>
  );
}

export default function Docs() {
  return <Suspense><Inner /></Suspense>;
}
