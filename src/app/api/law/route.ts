import { NextRequest, NextResponse } from "next/server";
import { lawUrl, precUrl } from "@/lib/data";

// 국가법령정보 공동활용 Open API(무료, OC=신청한 이메일 ID) 프록시
// target: law(법령) | prec(판례) | decc(행정심판 재결례) | ordin(자치법규)
const TARGETS = ["law", "prec", "decc", "ordin"] as const;
type Target = (typeof TARGETS)[number];

export type LawItem = { id: string; title: string; sub: string; date: string; source: string; url: string };

function pickArray(obj: unknown): Record<string, string>[] {
  if (!obj || typeof obj !== "object") return [];
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(v)) return v as Record<string, string>[];
    if (v && typeof v === "object") {
      for (const [, vv] of Object.entries(v as Record<string, unknown>)) {
        if (Array.isArray(vv)) return vv as Record<string, string>[];
        if (vv && typeof vv === "object" && ("사건번호" in (vv as object) || "법령명한글" in (vv as object) || "자치법규명" in (vv as object)))
          return [vv as Record<string, string>];
      }
    }
  }
  return [];
}
const fmt = (d?: string) => (d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}` : d || "");

function normalize(target: Target, r: Record<string, string>): LawItem {
  switch (target) {
    case "law":
      return { id: r["법령일련번호"], title: r["법령명한글"], sub: [r["법령약칭명"], r["소관부처명"], r["제개정구분명"]].filter(Boolean).join(" · "), date: `시행 ${fmt(r["시행일자"])}`, source: "국가법령정보센터", url: lawUrl(r["법령명한글"]) };
    case "prec":
      return { id: r["판례일련번호"], title: r["사건명"], sub: [r["법원명"], r["사건번호"], r["판결유형"]].filter(Boolean).join(" · "), date: `선고 ${fmt(r["선고일자"])}`, source: "국가법령정보센터(판례)", url: r["사건번호"] ? precUrl(r["사건번호"]) : "" };
    case "decc":
      return { id: r["행정심판재결례일련번호"] || r["행정심판례일련번호"], title: r["사건명"], sub: [r["사건번호"], r["재결청"], r["재결구분명"]].filter(Boolean).join(" · "), date: `의결 ${fmt(r["의결일자"])}`, source: "행정심판 재결례", url: "" };
    case "ordin":
      return { id: r["자치법규일련번호"], title: r["자치법규명"], sub: [r["지자체기관명"], r["자치법규종류"]].filter(Boolean).join(" · "), date: `시행 ${fmt(r["시행일자"])}`, source: "자치법규정보", url: "" };
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("query")?.trim() || "";
  const target = (req.nextUrl.searchParams.get("target") || "law") as Target;
  const page = req.nextUrl.searchParams.get("page") || "1";
  if (!TARGETS.includes(target)) return NextResponse.json({ error: "잘못된 검색 대상" }, { status: 400 });
  if (!q) return NextResponse.json({ items: [], total: 0 });
  const oc = process.env.LAW_OC;
  if (!oc) return NextResponse.json({ configured: false, items: [], total: 0 });
  const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(oc)}&target=${target}&type=JSON&display=20&page=${page}&query=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { return NextResponse.json({ configured: true, error: "법령정보센터 응답을 해석하지 못했습니다(OC 승인 상태를 확인하세요).", items: [] }, { status: 502 }); }
    const rows = pickArray(json);
    const items = rows.map((r) => normalize(target, r)).filter((x) => x.title).map((x) => ({ ...x, url: x.url || `/api/law/open?target=${target}&id=${x.id}` }));
    const root = Object.values(json as Record<string, Record<string, string>>)[0] || {};
    return NextResponse.json({ configured: true, items, total: Number(root.totalCnt || items.length) });
  } catch {
    return NextResponse.json({ configured: true, error: "법령정보센터에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", items: [] }, { status: 502 });
  }
}
