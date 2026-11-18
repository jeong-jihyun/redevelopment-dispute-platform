import { NextRequest, NextResponse } from "next/server";
import { DISPUTES, LAWS, PRECEDENTS, TEMPLATES } from "@/lib/data";
import { maskSensitive } from "@/lib/analyze";

// RAG: 확인된 법령·판례 목록만 근거로 주고, 답변의 인용을 서버에서 다시 검증한다.
// 무료: Google AI Studio 무료 등급 키(GEMINI_API_KEY). 키가 없으면 configured:false → 화면은 규칙 기반 분석 사용.
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ configured: false });
  const { question, facts } = (await req.json()) as { question: string; facts: Record<string, string> };
  const q = maskSensitive(String(question || "")).slice(0, 2000);

  const sources = [
    ...LAWS.map((l) => `[${l.id}] 「${l.law}」 ${l.article}(${l.title}) — ${l.summary}`),
    ...PRECEDENTS.map((p) => `[${p.id}] ${p.court} ${p.date} 선고 ${p.caseNo} — ${p.gist}`),
  ].join("\n");
  const prompt = `너는 대한민국 재개발·정비사업 분쟁 법률정보 도우미다. 변호사가 아니며 법률의견이 아닌 정보를 준다.
규칙:
1) 아래 [근거 목록]에 있는 id만 인용한다. 목록에 없는 법령·조문·판례·사건번호를 절대 만들지 않는다.
2) 사실관계가 부족하면 결론을 확정하지 말고 needCheck에 확인할 점을 적는다.
3) 법적 기한은 근거 목록에 기한이 적힌 조문을 인용할 때만 말하고, 기산점을 함께 적는다.
4) 쉬운 말로, 각 항목은 1~2문장.

[사용자 정보] ${JSON.stringify(facts || {})}
[질문] ${q}
[분쟁 유형 id] ${DISPUTES.map((d) => `${d.id}:${d.short}`).join(", ")}
[서류 id] ${TEMPLATES.map((t) => `${t.id}:${t.name}`).join(", ")}
[근거 목록]
${sources}

JSON만 출력: {"summary":"","facts":[],"needCheck":[],"disputeIds":[],"lawIds":[],"precedentIds":[],"issues":[],"favorable":[],"unfavorable":[],"methods":[{"name":"","desc":"","check":""}],"risks":[],"steps":[],"docIds":[],"expertLevel":"높음|보통|낮음","expertReason":""}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return NextResponse.json({ configured: true, error: `AI 서비스 오류(${res.status})` }, { status: 502 });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const out = JSON.parse(text);
    // 출처 검증: 목록에 없는 id 제거
    const lawIds: string[] = (out.lawIds || []).filter((id: string) => LAWS.some((l) => l.id === id));
    const precIds: string[] = (out.precedentIds || []).filter((id: string) => PRECEDENTS.some((p) => p.id === id));
    const removed = (out.lawIds?.length || 0) + (out.precedentIds?.length || 0) - lawIds.length - precIds.length;
    return NextResponse.json({
      configured: true,
      result: {
        ...out,
        lawIds,
        precedentIds: precIds,
        disputeIds: (out.disputeIds || []).filter((id: string) => DISPUTES.some((d) => d.id === id)),
        docIds: (out.docIds || []).filter((id: string) => TEMPLATES.some((t) => t.id === id)),
        removedCitations: removed,
      },
    });
  } catch {
    return NextResponse.json({ configured: true, error: "AI 응답을 받지 못했습니다." }, { status: 502 });
  }
}
