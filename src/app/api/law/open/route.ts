import { NextRequest, NextResponse } from "next/server";

// 원문 보기: OC 값을 화면에 노출하지 않고 국가법령정보센터 원문(HTML)으로 연결
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target") || "";
  const id = req.nextUrl.searchParams.get("id") || "";
  const oc = process.env.LAW_OC;
  if (!oc || !["law", "prec", "decc", "ordin"].includes(target) || !/^\d+$/.test(id))
    return NextResponse.redirect("https://www.law.go.kr/");
  const key = target === "law" || target === "ordin" ? "MST" : "ID";
  return NextResponse.redirect(`https://www.law.go.kr/DRF/lawService.do?OC=${encodeURIComponent(oc)}&target=${target}&${key}=${id}&type=HTML`);
}
