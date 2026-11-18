import { BUSINESS_TYPES, DISPUTES, LAWS, PRECEDENTS, ROLES, STAGES, STRATEGIES, TEMPLATES, type Dispute, type LawRef, type Precedent } from "./data";

// 주민등록번호·전화번호 등 민감정보 마스킹 (AI 전달 전, 저장 전)
export function maskSensitive(text: string) {
  return text
    .replace(/(\d{6})[-\s]?([1-4])\d{6}/g, "$1-$2******")
    .replace(/(01[016789])[-\s]?(\d{3,4})[-\s]?(\d{4})/g, "$1-****-$3");
}

export function scoreDisputes(q: string): { d: Dispute; score: number }[] {
  const text = q.replace(/\s/g, "");
  return DISPUTES.map((d) => {
    let score = 0;
    for (const k of d.keywords) if (text.includes(k.replace(/\s/g, ""))) score += k.length >= 3 ? 2 : 1;
    if (text.includes(d.short.replace(/[·\s]/g, ""))) score += 2;
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function searchLaws(q: string): LawRef[] {
  const t = q.trim();
  if (!t) return [];
  const words = t.split(/\s+/).filter((w) => w.length >= 2);
  const fromDisputes = new Set(scoreDisputes(t).slice(0, 3).flatMap((x) => x.d.laws));
  return LAWS.map((l) => {
    const hay = `${l.law}${l.short}${l.article}${l.title}${l.summary}`;
    let s = fromDisputes.has(l.id) ? 2 : 0;
    // 조사(을/를/이/가 등)를 떼고 비교
    for (const w of words) {
      const stems = [w, w.length >= 3 ? w.slice(0, -1) : "", w.length >= 4 ? w.slice(0, -2) : ""].filter((x) => x.length >= 2);
      if (stems.some((x) => hay.includes(x))) s += 1;
    }
    return { l, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.l);
}

export function searchPrecedents(q: string): Precedent[] {
  const t = q.trim();
  if (!t) return [];
  const ds = new Set(scoreDisputes(t).slice(0, 3).map((x) => x.d.id));
  const words = t.split(/\s+/).filter((w) => w.length >= 2);
  return PRECEDENTS.filter((p) => p.disputes.some((d) => ds.has(d)) || words.some((w) => `${p.caseNo}${p.title}${p.gist}`.includes(w)));
}

export type Facts = {
  businessType?: string;
  role?: string;
  stage?: string;
  requested?: string;
  priorRequest?: string;
};

const has = (q: string, arr: string[]) => arr.some((k) => q.includes(k));

export function detectFacts(q: string): Facts {
  const f: Facts = {};
  const bt = BUSINESS_TYPES.find((b) => q.includes(b.name.replace("사업", "")));
  if (bt) f.businessType = bt.name;
  const role = ROLES.find((r) => q.includes(r.name));
  if (role) f.role = role.name;
  else if (has(q, ["세입", "임차"])) f.role = "세입자";
  const st = STAGES.find((s) => q.includes(s.split(" ")[0]));
  if (st) f.stage = st;
  if (has(q, ["요청했", "요구했", "신청했", "보냈", "청구했"])) f.priorRequest = "예";
  return f;
}

export type FollowUp = { key: keyof Facts; question: string; options: string[] };

// 설계서 4.2: 정보가 부족하면 AI가 추가 질문
export function followUps(q: string, f: Facts): FollowUp[] {
  const out: FollowUp[] = [];
  if (!f.businessType) out.push({ key: "businessType", question: "어떤 사업인가요?", options: BUSINESS_TYPES.slice(0, 6).map((b) => b.name) });
  if (!f.role) out.push({ key: "role", question: "본인의 지위는 무엇인가요?", options: ["조합원", "토지등소유자", "세입자", "일반 주민", "조합 임원"] });
  if (!f.stage) out.push({ key: "stage", question: "현재 사업은 어느 단계인가요?", options: ["조합 설립 및 인가", "사업시행계획 수립 및 인가", "관리처분계획 수립 및 인가", "이주 및 보상·현금청산", "모르겠음"] });
  const isInfo = scoreDisputes(q)[0]?.d.id === "d9" || has(q, ["공개", "열람", "자료"]);
  if (isInfo && !f.priorRequest)
    out.push({ key: "priorRequest", question: "조합(또는 기관)에 서면으로 요청한 적이 있나요?", options: ["예, 서면으로 요청함", "말로만 요청함", "아직 요청 안 함"] });
  return out;
}

export type Analysis = {
  summary: string;
  facts: string[];
  needCheck: string[];
  disputes: { id: string; name: string }[];
  laws: LawRef[];
  precedents: Precedent[];
  issues: string[];
  favorable: string[];
  unfavorable: string[];
  methods: { name: string; desc: string; check: string }[];
  risks: string[];
  steps: string[];
  docs: { id: string; name: string }[];
  expertNeeded: { level: "높음" | "보통" | "낮음"; reason: string };
  confidence: "근거 충분" | "근거 부족";
  engine: "rule" | "ai";
};

// 규칙 기반 분석: 확인된 데이터(LAWS/PRECEDENTS)만 인용하고, 없는 사실은 만들지 않는다.
export function ruleAnalyze(question: string, f: Facts): Analysis {
  const q = maskSensitive(question);
  const scored = scoreDisputes(q);
  const top = scored.slice(0, 2).map((x) => x.d);
  const main = top[0];
  const lawIds = Array.from(new Set(top.flatMap((d) => d.laws)));
  const laws = lawIds.map((id) => LAWS.find((l) => l.id === id)!).filter(Boolean);
  const precedents = PRECEDENTS.filter((p) => top.some((d) => p.disputes.includes(d.id)));
  const facts = [
    f.businessType && `사업 유형: ${f.businessType}`,
    f.role && `이용자 지위: ${f.role}`,
    f.stage && f.stage !== "모르겠음" && `사업 단계: ${f.stage}`,
    f.priorRequest && `사전 요청 여부: ${f.priorRequest}`,
  ].filter(Boolean) as string[];

  const needCheck: string[] = [];
  if (!f.stage || f.stage === "모르겠음") needCheck.push("현재 사업 단계(조합 인가, 관리처분 인가 등) — 적용 조문과 기한이 달라집니다.");
  if (!f.role) needCheck.push("본인의 법적 지위(조합원·세입자 등)");
  needCheck.push("사건 발생 당시 시행 법령 — 개정 전후로 요건이 다를 수 있습니다(부칙·경과규정 확인).");
  needCheck.push("처분·통지를 실제로 받은 날짜 — 기한 계산의 시작점입니다.");

  if (!main) {
    return {
      summary: q.length > 80 ? q.slice(0, 80) + "…" : q,
      facts, needCheck: ["어떤 문제인지 조금 더 구체적으로 적어 주세요(예: 무엇을, 누가, 언제)."],
      disputes: [], laws: [], precedents: [], issues: [], favorable: [], unfavorable: [],
      methods: [], risks: [], steps: ["분쟁 유형 메뉴에서 가장 가까운 유형을 골라 보세요."], docs: [],
      expertNeeded: { level: "보통", reason: "상황이 확인되지 않아 판단할 수 없습니다." },
      confidence: "근거 부족", engine: "rule",
    };
  }

  const issues: string[] = [];
  const favorable: string[] = [];
  const unfavorable: string[] = [];
  const risks: string[] = [];
  const isMember = !f.role || ["조합원", "토지등소유자"].includes(f.role);

  switch (main.id) {
    case "d9":
      issues.push("요청한 자료가 제124조 공개·열람 대상 서류(또는 관련 자료)에 해당하는지");
      issues.push("서면 요청(사용 목적 기재)이 있었는지와 15일 기한 경과 여부");
      if (isMember) favorable.push("조합원·토지등소유자는 정비사업 시행 서류의 열람·복사를 요청할 수 있고, 조합은 15일 이내에 응해야 합니다(제124조).");
      else unfavorable.push(`${f.role}은(는) 열람·복사 요청 주체(조합원·토지등소유자)에 해당하지 않을 수 있습니다.`);
      unfavorable.push("아직 작성되지 않은 서류는 공개의무 위반죄 대상이 아니라는 판례가 있습니다(2023도16588).");
      if (f.priorRequest !== "예, 서면으로 요청함" && f.priorRequest !== "예") risks.push("말로 한 요청은 입증이 어렵습니다. 서면(내용증명 등)으로 다시 요청해 두세요.");
      break;
    case "d6":
      issues.push("관리처분계획 인가·고시일과 90일 협의 기간 준수 여부");
      issues.push("협의 불성립 후 60일 이내 수용재결 신청·매도청구 여부");
      favorable.push("사업시행자는 정해진 기간 안에 손실보상 협의를 해야 할 의무가 있습니다(제73조).");
      unfavorable.push("분양신청 기간을 놓친 사정만으로는 현금청산 대상에서 벗어나기 어려운 경우가 많습니다.");
      risks.push("수용재결 이의신청(30일)·행정소송(90일/60일) 기한이 짧습니다.");
      break;
    case "d3":
      issues.push("총회 소집 통지·안건 공개 절차를 지켰는지");
      issues.push("의결정족수와 직접 출석 요건, 서면결의서 유효성");
      favorable.push("총회 의결 사항은 법과 정관이 정한 절차를 거쳐야 하며, 하자가 중대하면 결의 효력을 다툴 수 있습니다(제45조).");
      unfavorable.push("절차 하자가 있어도 결과에 영향이 없다고 보아 유효로 판단되는 경우가 있습니다.");
      risks.push("가처분은 담보 제공 비용이 들 수 있고, 시기를 놓치면 실익이 줄어듭니다.");
      break;
    case "d5":
      issues.push("감정평가의 기준시점·비교 사례가 적정한지");
      favorable.push("수용재결에 불복하면 이의신청 또는 보상금 증감 소송으로 다툴 수 있습니다(토지보상법 제83조·제85조).");
      unfavorable.push("감정평가는 전문 판단 영역이라 근거 자료(실거래가 등) 없이 다투기 어렵습니다.");
      risks.push("이의신청은 재결서 정본 수령일부터 30일입니다.");
      break;
    case "d12": case "d4": case "d1":
      issues.push("처분(인가)의 요건·절차에 하자가 있는지");
      issues.push("처분이 있음을 안 날과 불복 기한");
      favorable.push("행정처분은 행정심판(안 날 90일) 또는 취소소송(안 날 90일)으로 다툴 수 있습니다.");
      unfavorable.push("불복 기한이 지나면 원칙적으로 다툴 수 없습니다.");
      risks.push("기한은 불변기간에 가깝게 엄격하게 적용됩니다. 날짜를 먼저 확정하세요.");
      break;
    default:
      issues.push(`${main.short} 관련 법적 요건 충족 여부`);
      favorable.push(`${main.short} 분쟁은 관련 법령(${laws.slice(0, 2).map((l) => `${l.short} ${l.article}`).join(", ")})을 근거로 대응할 수 있습니다.`);
      unfavorable.push("구체적 사실과 증거에 따라 결론이 달라질 수 있습니다.");
  }
  risks.push("이 결과는 법률정보 제공이며 변호사의 법률의견을 대체하지 않습니다.");

  const methodIds: Record<string, string[]> = {
    d9: ["info", "admin", "internal", "civil"], d6: ["civil", "appeal"], d3: ["internal", "preserve", "civil"],
    d5: ["civil", "appeal"], d12: ["appeal", "admin", "info"], d4: ["admin", "appeal"], d1: ["info", "appeal"],
    d13: ["appeal", "preserve", "civil"], d7: ["civil"], d10: ["civil", "appeal"], d8: ["internal", "info"], d11: ["internal", "info"],
  };
  const methods = (methodIds[main.id] ?? ["admin", "civil"]).map((id) => STRATEGIES.find((s) => s.id === id)!);
  const docs = main.docs.map((id) => TEMPLATES.find((t) => t.id === id)!).map((t) => ({ id: t.id, name: t.name }));
  const expertLevel: Analysis["expertNeeded"]["level"] = ["d13", "d3", "d12", "d4"].includes(main.id) ? "높음" : ["d5", "d6"].includes(main.id) ? "보통" : "낮음";

  return {
    summary: q.length > 120 ? q.slice(0, 120) + "…" : q,
    facts,
    needCheck,
    disputes: top.map((d) => ({ id: d.id, name: d.name })),
    laws,
    precedents,
    issues,
    favorable,
    unfavorable,
    methods,
    risks,
    steps: main.procedure,
    docs,
    expertNeeded: {
      level: expertLevel,
      reason: expertLevel === "높음" ? "소송·가처분·행정심판 등 공식 절차가 예상되어 전문가 검토를 권합니다." : expertLevel === "보통" ? "금액 산정과 기한이 걸려 있어 상담을 권합니다." : "서면 요청 등 스스로 할 수 있는 단계부터 시작할 수 있습니다.",
    },
    confidence: laws.length > 0 ? "근거 충분" : "근거 부족",
    engine: "rule",
  };
}

// 기한 계산: 초일 불산입, 말일이 토·일이면 다음 월요일(공휴일은 별도 확인)
export function calcDeadline(base: string, days: number) {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  let moved = false;
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
    moved = true;
  }
  return { date: ymd(d), moved };
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dday(date: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  return diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${-diff}`;
}
