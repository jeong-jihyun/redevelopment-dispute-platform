// 기준 데이터 — 설계서(요구사항 v0.1, 기본설계 v1.0) 기준
// 법령 요약은 공식 원문을 쉽게 풀어 쓴 것이며, 실제 적용 전 원문 링크로 반드시 확인해야 한다.

export const DATA_CHECKED = "2026.11.18"; // 조문 번호·기한을 공식·판례 자료로 대조한 날

export const lawUrl = (law: string, article?: string) =>
  `https://www.law.go.kr/${encodeURIComponent("법령")}/${encodeURIComponent(law.replace(/\s/g, ""))}${
    article ? "/" + encodeURIComponent(article) : ""
  }`;
export const precUrl = (caseNo: string) =>
  `https://www.law.go.kr/${encodeURIComponent("판례")}/(${encodeURIComponent(caseNo)})`;

export const BUSINESS_TYPES = [
  { id: "redev", name: "재개발사업", group: "도시정비사업" },
  { id: "rebuild", name: "재건축사업", group: "도시정비사업" },
  { id: "street", name: "가로주택정비사업", group: "소규모주택정비사업" },
  { id: "small-rebuild", name: "소규모재건축사업", group: "소규모주택정비사업" },
  { id: "small-redev", name: "소규모재개발사업", group: "소규모주택정비사업" },
  { id: "self", name: "자율주택정비사업", group: "소규모주택정비사업" },
  { id: "urban", name: "도시개발사업", group: "도시개발 및 기타" },
  { id: "etc", name: "기타 부동산 개발·정비사업", group: "도시개발 및 기타" },
] as const;

export const STAGES = [
  "정비구역 지정 및 정비계획 수립",
  "추진위원회 구성 및 승인",
  "조합 설립 및 인가",
  "사업시행계획 수립 및 인가",
  "시공사 선정 및 공사 계약",
  "관리처분계획 수립 및 인가",
  "이주 및 보상·현금청산",
  "철거 및 착공",
  "공사 진행 및 추가 분담금",
  "준공 및 이전고시",
  "청산 및 조합 해산",
  "사업 완료 이후 법적 분쟁",
];

export const ROLES = [
  { id: "resident", name: "일반 주민", purpose: "재개발 절차 및 권리 확인" },
  { id: "owner", name: "토지등소유자", purpose: "재산권 및 보상 관련 대응" },
  { id: "member", name: "조합원", purpose: "조합 운영 및 총회 관련 분쟁" },
  { id: "tenant", name: "세입자", purpose: "주거이전비 및 영업손실 보상" },
  { id: "committee", name: "추진위원회", purpose: "추진 절차 및 법률 검토" },
  { id: "officer", name: "조합 임원", purpose: "조합 운영 및 행정업무" },
  { id: "biz", name: "사업 관계자", purpose: "사업 관련 법률 및 계약 검토" },
  { id: "lawyer", name: "법률 전문가", purpose: "사건 검토 및 자료 관리" },
];

export type LawRef = {
  id: string;
  law: string;
  short: string;
  article: string;
  title: string;
  summary: string;
  deadline?: { days: number; from: string; label: string };
  url: string;
};

const L = (
  id: string,
  law: string,
  short: string,
  article: string,
  title: string,
  summary: string,
  deadline?: LawRef["deadline"],
): LawRef => ({ id, law, short, article, title, summary, deadline, url: lawUrl(law, article) });

const DJ = "도시 및 주거환경정비법";
export const LAWS: LawRef[] = [
  L("dj2", DJ, "도시정비법", "제2조", "정의", "토지등소유자·정비사업 등 법에서 쓰는 말의 뜻을 정합니다. 재개발에서 토지등소유자는 정비구역 안 토지 또는 건축물의 소유자나 지상권자입니다."),
  L("dj29", DJ, "도시정비법", "제29조", "계약의 방법 및 시공자 선정 등", "추진위원장·사업시행자의 계약 방법(원칙적 일반경쟁)과 시공자 선정 절차를 정합니다. 구체적 예외와 절차는 원문과 시행령을 확인해야 합니다."),
  L("dj35", DJ, "도시정비법", "제35조", "조합설립인가 등", "재개발 조합을 설립하려면 토지등소유자 4분의 3 이상과 토지면적 2분의 1 이상 토지소유자의 동의를 받아 인가를 받아야 합니다. 재건축은 동별·전체 동의 요건이 따로 있고 최근 개정으로 완화된 부분이 있어 현행 원문 확인이 필요합니다."),
  L("dj39", DJ, "도시정비법", "제39조", "조합원의 자격 등", "조합원 자격을 정합니다. 여러 사람이 공유하거나 조합설립인가 후 양수로 여러 명이 소유하게 되면 그중 대표 1명만 조합원으로 보는 경우가 있습니다."),
  L("dj41", DJ, "도시정비법", "제41조", "조합의 임원", "조합장·이사·감사 등 임원의 자격 요건을 정합니다. 조합장은 선임일부터 관리처분계획인가 때까지 정비구역에 거주(영업)해야 합니다."),
  L("dj43", DJ, "도시정비법", "제43조", "조합임원 등의 결격사유 및 해임", "임원이 될 수 없는 사람을 정하고, 조합원 10분의 1 이상의 요구로 소집된 총회에서 조합원 과반수 출석과 출석 조합원 과반수 동의로 임원을 해임할 수 있게 합니다(제4항)."),
  L("dj45", DJ, "도시정비법", "제45조", "총회의 의결", "정관 변경, 자금 차입, 시공자 선정·계약 등 총회 의결을 거쳐야 하는 사항과 의결 방법을 정합니다. 전자적 방법의 의결권 행사 근거가 개정으로 추가되었습니다."),
  L("dj46", DJ, "도시정비법", "제46조", "대의원회", "조합원이 100명 이상이면 대의원회를 두어야 하며, 대의원회가 총회 권한을 대신할 수 없는 사항은 시행령으로 정합니다."),
  L("dj72", DJ, "도시정비법", "제72조", "분양공고 및 분양신청", "사업시행계획인가 고시 후 정해진 기간 안에 분담금 추산액·분양신청기간 등을 토지등소유자에게 알리고 공고해야 합니다. 이 기간에 분양신청을 하지 않으면 현금청산 대상이 될 수 있습니다."),
  L("dj73", DJ, "도시정비법", "제73조", "분양신청을 하지 아니한 자 등에 대한 조치", "사업시행자는 관리처분계획 인가·고시 다음 날부터 90일 이내에 분양 미신청자 등과 손실보상 협의를 해야 하고, 협의가 안 되면 그 기간 만료일 다음 날부터 60일 이내에 수용재결 신청 또는 매도청구소송을 해야 합니다.", { days: 90, from: "관리처분계획 인가·고시일", label: "현금청산 손실보상 협의 기간" }),
  L("dj74", DJ, "도시정비법", "제74조", "관리처분계획의 인가 등", "분양신청기간이 끝나면 분양설계, 종전자산 가격, 분담금 추산 등이 들어간 관리처분계획을 세워 인가를 받아야 합니다."),
  L("dj81", DJ, "도시정비법", "제81조", "건축물 등의 사용·수익의 중지 및 철거 등", "관리처분계획 인가·고시가 있으면 종전 토지·건축물 사용이 원칙적으로 정지되며, 손실보상이 끝나지 않은 경우 등 예외가 있습니다. 이주·명도 분쟁의 핵심 조문입니다."),
  L("dj124", DJ, "도시정비법", "제124조", "관련 자료의 공개 등", "추진위원장·조합임원은 회의록·용역계약서·관리처분계획서 등 서류가 작성·변경된 뒤 15일 이내에 인터넷 등으로 공개해야 하고, 조합원·토지등소유자의 열람·복사 요청에는 15일 이내에 응해야 합니다.", { days: 15, from: "열람·복사 요청일", label: "조합 자료 열람·복사 응답 기한" }),
  L("info11", "공공기관의 정보공개에 관한 법률", "정보공개법", "제11조", "정보공개 여부의 결정", "공공기관은 정보공개청구를 받은 날부터 10일 이내에 공개 여부를 결정해야 하며, 부득이하면 10일 범위에서 연장할 수 있습니다.", { days: 10, from: "정보공개청구일", label: "공개 여부 결정 기한" }),
  L("info18", "공공기관의 정보공개에 관한 법률", "정보공개법", "제18조", "이의신청", "비공개·부분공개 결정에 불복하거나 청구 후 20일이 지나도 결정이 없으면, 통지받은 날 또는 20일이 지난 날부터 30일 이내에 문서로 이의신청할 수 있습니다.", { days: 30, from: "결정 통지일", label: "정보공개 이의신청 기한" }),
  L("ah27", "행정심판법", "행정심판법", "제27조", "심판청구의 기간", "행정심판은 처분이 있음을 알게 된 날부터 90일 이내, 처분이 있었던 날부터 180일 이내에 청구해야 합니다(정당한 사유 예외).", { days: 90, from: "처분이 있음을 안 날", label: "행정심판 청구 기한" }),
  L("al20", "행정소송법", "행정소송법", "제20조", "제소기간", "취소소송은 처분 등이 있음을 안 날부터 90일 이내, 처분 등이 있은 날부터 1년 이내에 제기해야 합니다. 행정심판을 거친 경우 재결서 정본을 받은 날부터 계산합니다.", { days: 90, from: "처분이 있음을 안 날", label: "취소소송 제소 기한" }),
  L("lc78", "공익사업을 위한 토지 등의 취득 및 보상에 관한 법률", "토지보상법", "제78조", "이주대책의 수립 등", "주거용 건축물 제공자에 대한 이주대책과 주거이전비 등의 근거 조문입니다. 세입자 주거이전비·이사비의 세부 요건은 시행규칙 원문을 확인해야 합니다."),
  L("lc83", "공익사업을 위한 토지 등의 취득 및 보상에 관한 법률", "토지보상법", "제83조", "이의의 신청", "토지수용위원회 재결에 이의가 있으면 재결서 정본을 받은 날부터 30일 이내에 중앙토지수용위원회에 이의신청할 수 있습니다.", { days: 30, from: "재결서 정본 수령일", label: "수용재결 이의신청 기한" }),
  L("lc85", "공익사업을 위한 토지 등의 취득 및 보상에 관한 법률", "토지보상법", "제85조", "행정소송의 제기", "재결에 불복하면 재결서를 받은 날부터 90일 이내, 이의신청을 거쳤으면 이의재결서를 받은 날부터 60일 이내에 행정소송(보상금 증감 소송 등)을 낼 수 있습니다.", { days: 90, from: "재결서 수령일", label: "보상금 행정소송 기한" }),
  L("cx300", "민사집행법", "민사집행법", "제300조", "가처분의 목적", "다툼의 대상에 관한 가처분과 임시의 지위를 정하기 위한 가처분의 근거입니다. 총회 결의 효력정지·직무집행정지 가처분 등에 쓰입니다."),
];

export type Precedent = {
  id: string;
  court: string;
  date: string;
  caseNo: string;
  title: string;
  gist: string;
  disputes: string[];
  url: string;
};

const P = (id: string, court: string, date: string, caseNo: string, title: string, gist: string, disputes: string[]): Precedent => ({
  id, court, date, caseNo, title, gist, disputes, url: precUrl(caseNo),
});

export const PRECEDENTS: Precedent[] = [
  P("p1", "대법원", "2024. 9. 13.", "2023도16588", "작성되지 않은 서류와 자료공개 의무", "도시정비법 제124조의 공개의무는 실제로 작성되어 존재하는 서류를 전제로 하며, 작성되지 않은 서류를 공개하지 않았다는 이유로 위반죄가 성립하지는 않는다는 취지입니다.", ["d9", "d3"]),
  P("p2", "대법원", "2023. 7. 27.", "2022두52980", "정보공개 이의신청 후 소송의 제소기간", "공공기관 결정에 이의신청을 하고 그 결과를 통지받은 뒤 취소소송을 내는 경우, 제소기간은 이의신청 결과를 통지받은 날부터 계산한다는 취지입니다.", ["d9", "d12", "d13"]),
  P("p3", "대법원", "2013. 12. 26.", "2011두8291", "조합설립 동의서의 적법성", "재개발 추진위원회가 법령이 정한 서식의 동의서로 조합설립 동의를 받았다면, 비용분담 기준 등이 더 구체적이지 않다는 이유만으로 동의를 무효로 볼 수 없다는 취지입니다.", ["d1", "d2"]),
  P("p4", "대법원", "1991. 6. 28.", "90누6521", "'처분이 있음을 안 날'의 의미", "제소기간의 기산점인 '처분이 있음을 안 날'은 통지·공고 등으로 처분이 있었다는 사실을 현실적으로 안 날을 뜻한다는 취지입니다.", ["d12", "d13"]),
];

export type Dispute = {
  id: string;
  name: string;
  short: string;
  icon: string;
  overview: string;
  causes: string[];
  stages: number[];
  laws: string[];
  procedure: string[];
  evidence: string[];
  docs: string[];
  keywords: string[];
};

export const DISPUTES: Dispute[] = [
  {
    id: "d1", name: "조합 설립 및 추진위원회 관련 분쟁", short: "조합 설립", icon: "Landmark",
    overview: "추진위원회 승인, 조합설립 동의율, 조합설립인가의 적법성을 다투는 분쟁입니다.",
    causes: ["동의율 산정 오류·중복 동의", "동의서 서식·기재사항 하자", "토지등소유자 수 산정 다툼"],
    stages: [1, 2], laws: ["dj2", "dj35", "dj124"],
    procedure: ["동의서·토지등소유자 명부 열람·복사 요청", "동의율 재산정 및 하자 정리", "인가권자(시·군·구)에 민원·의견 제출", "인가처분 취소·무효 소송 검토"],
    evidence: ["조합설립 동의서 사본", "토지등소유자 명부", "인가 신청서류", "등기부등본"],
    docs: ["t2", "t4", "t7"], keywords: ["조합설립", "추진위", "동의율", "설립인가", "동의서"],
  },
  {
    id: "d2", name: "조합원 자격 및 동의서 관련 분쟁", short: "조합원 자격", icon: "UserCheck",
    overview: "조합원 지위 인정, 대표조합원 선임, 동의서 철회·위조 등을 다투는 분쟁입니다.",
    causes: ["공유·다주택에 따른 대표조합원 문제", "조합설립인가 후 양수", "동의서 위조·철회 처리"],
    stages: [2, 3, 6], laws: ["dj39", "dj35", "dj72"],
    procedure: ["조합원 명부 및 자격 판단 근거 요청", "조합에 이의제기서 제출", "조합원 지위확인 소송 검토"],
    evidence: ["등기부등본", "매매계약서", "조합원 명부", "조합 통지문"],
    docs: ["t4", "t1", "t2"], keywords: ["조합원 자격", "대표조합원", "동의서", "지위", "공유", "양수", "분양자격"],
  },
  {
    id: "d3", name: "총회 개최, 의결 및 결의 무효 분쟁", short: "총회·결의", icon: "Users",
    overview: "총회 소집 절차, 의결정족수, 서면결의서, 결의 효력을 다투는 분쟁입니다.",
    causes: ["소집 통지 누락·기간 위반", "직접 출석·정족수 미달", "서면결의서 위조·중복", "안건 사전 미공개"],
    stages: [3, 4, 5, 6, 9, 11], laws: ["dj45", "dj46", "dj43", "dj124", "cx300"],
    procedure: ["총회 의사록·서면결의서 열람·복사 요청", "총회 전 의견서·이의신청서 제출", "결의 효력정지 가처분 검토", "총회결의 무효확인 소송 검토"],
    evidence: ["총회 소집 통지서", "안건 책자", "의사록·속기록·영상", "서면결의서 집계표"],
    docs: ["t3", "t2", "t9", "t8"], keywords: ["총회", "의결", "결의", "서면결의", "정족수", "소집", "대의원", "회의록", "의사록"],
  },
  {
    id: "d4", name: "사업시행계획 및 관리처분계획 관련 분쟁", short: "사업시행·관리처분", icon: "FileStack",
    overview: "사업시행계획인가, 관리처분계획의 내용(분양설계·분담금)과 인가처분의 적법성을 다툽니다.",
    causes: ["분양설계·평형 배정 불공정", "분담금 산정 근거 불투명", "절차(공람·총회) 하자"],
    stages: [4, 6], laws: ["dj72", "dj74", "dj45", "ah27", "al20"],
    procedure: ["관리처분계획서 열람·복사", "공람 기간 의견서 제출", "행정심판 또는 취소소송(기한 확인)"],
    evidence: ["관리처분계획서", "공람 공고문", "분양신청서", "총회 자료"],
    docs: ["t3", "t7", "t11"], keywords: ["사업시행", "관리처분", "분양설계", "평형", "분담금 산정", "공람"],
  },
  {
    id: "d5", name: "감정평가 및 종전자산·종후자산 평가 분쟁", short: "감정평가", icon: "Scale",
    overview: "종전자산(내 집·땅) 평가액과 종후자산(새 아파트) 평가액, 권리가액 산정을 다툽니다.",
    causes: ["저평가 의심", "비교 사례 선정 문제", "평가 기준시점 다툼"],
    stages: [6, 7], laws: ["dj74", "lc83", "lc85"],
    procedure: ["감정평가서 열람·복사 요청", "감정평가 이의신청·의견서 제출", "수용재결 이의신청(30일)", "보상금 증액 소송(90일/60일)"],
    evidence: ["감정평가서", "주변 실거래가 자료", "건물 현황 사진", "공시지가 자료"],
    docs: ["t5", "t2", "t6"], keywords: ["감정평가", "종전자산", "종후자산", "평가액", "권리가액", "저평가"],
  },
  {
    id: "d6", name: "현금청산 및 보상금 관련 분쟁", short: "현금청산", icon: "Banknote",
    overview: "분양신청을 하지 않았거나 분양대상에서 빠진 사람의 손실보상(현금청산) 금액과 절차를 다툽니다.",
    causes: ["분양신청 기간 놓침", "협의 금액 불만", "90일 협의 기간 위반 여부"],
    stages: [6, 7], laws: ["dj72", "dj73", "lc83", "lc85"],
    procedure: ["관리처분계획 인가·고시일 확인", "90일 협의 기간 내 협의", "수용재결 신청 확인", "이의신청(30일)·행정소송(90일/60일)"],
    evidence: ["분양신청 통지서", "관리처분 인가 고시문", "협의 요청서", "감정평가서"],
    docs: ["t6", "t1", "t5"], keywords: ["현금청산", "청산금", "분양신청", "손실보상", "수용", "매도청구", "보상금"],
  },
  {
    id: "d7", name: "이주·명도·철거 관련 분쟁", short: "이주·명도", icon: "Truck",
    overview: "이주 기간, 명도(집 비워주기) 소송, 철거 시점을 둘러싼 분쟁입니다.",
    causes: ["보상 완료 전 이주 요구", "명도소송 제기", "이주비 대출 조건"],
    stages: [7, 8], laws: ["dj81", "lc78", "dj73"],
    procedure: ["손실보상 완료 여부 확인", "조합에 내용증명 발송", "명도소송 답변서 준비"],
    evidence: ["이주 안내문", "보상 협의 내역", "임대차계약서"],
    docs: ["t1", "t8", "t10"], keywords: ["이주", "명도", "철거", "퇴거", "인도", "이주비"],
  },
  {
    id: "d8", name: "시공사 선정 및 계약 관련 분쟁", short: "시공사", icon: "HardHat",
    overview: "시공사 선정 절차, 금품 제공, 공사계약 내용과 변경을 다툽니다.",
    causes: ["입찰 절차 위반", "홍보 과정 금품 제공", "계약서 불리한 조항"],
    stages: [5, 9], laws: ["dj29", "dj45"],
    procedure: ["입찰 공고·계약서 열람", "총회 전 의견서 제출", "선정 결의 무효 다툼 검토"],
    evidence: ["입찰 공고문", "시공사 제안서", "공사도급계약서", "홍보 관련 자료"],
    docs: ["t3", "t2", "t11"], keywords: ["시공사", "시공자", "입찰", "도급계약", "건설사"],
  },
  {
    id: "d9", name: "조합 임원 비리·횡령·배임 및 정보공개 거부", short: "임원 비리·정보공개", icon: "Search",
    overview: "조합 자료 공개 거부, 임원의 횡령·배임, 해임 절차와 관련된 분쟁입니다.",
    causes: ["회의록·용역계약서 비공개", "자금 집행 불투명", "임원 결격사유"],
    stages: [2, 3, 4, 5, 6, 9, 11], laws: ["dj124", "dj43", "dj41", "info11", "info18"],
    procedure: ["조합에 서면 열람·복사 요청(15일 기한)", "미응답 시 내용증명 및 관할 구청 민원", "공공기관 보유자료는 정보공개청구(10일)", "임원 해임 총회 소집 요구(조합원 1/10)", "형사 고발 검토"],
    evidence: ["열람·복사 요청서 사본과 발송 증명", "조합 홈페이지 공개 현황 캡처", "자금 집행 자료"],
    docs: ["t2", "t1", "t7", "t10"], keywords: ["공개", "정보공개", "열람", "복사", "회의록", "비리", "횡령", "배임", "조합장", "해임", "자료"],
  },
  {
    id: "d10", name: "세입자 주거이전비 및 영업손실 보상", short: "세입자 보상", icon: "Home",
    overview: "세입자의 주거이전비·이사비, 상가 세입자의 영업손실 보상 요건과 금액을 다툽니다.",
    causes: ["거주 기간 요건 다툼", "보상 대상 제외", "영업손실 산정 금액"],
    stages: [7, 8], laws: ["lc78", "lc83", "lc85"],
    procedure: ["거주·영업 사실 증빙 정리", "사업시행자에 보상 청구서 제출", "재결 신청 청구·이의신청 검토"],
    evidence: ["전입세대 열람·주민등록초본", "임대차계약서", "사업자등록증·매출 자료"],
    docs: ["t6", "t1", "t10"], keywords: ["세입자", "주거이전비", "이사비", "영업손실", "상가", "임차인"],
  },
  {
    id: "d11", name: "공사비 증액 및 추가 분담금 분쟁", short: "공사비·분담금", icon: "TrendingUp",
    overview: "시공사의 공사비 증액 요구와 그에 따른 조합원 추가 분담금을 다툽니다.",
    causes: ["물가 상승 이유 증액", "설계 변경", "총회 의결 없는 계약 변경"],
    stages: [5, 9], laws: ["dj45", "dj29", "dj124"],
    procedure: ["증액 근거 자료 공개 요청", "총회 의견서 제출", "공사비 검증 요청 검토"],
    evidence: ["공사도급계약서·변경계약서", "증액 요청 공문", "총회 자료"],
    docs: ["t3", "t2", "t11"], keywords: ["공사비", "증액", "추가 분담금", "분담금", "물가"],
  },
  {
    id: "d12", name: "행정청의 인허가 및 행정처분 관련 분쟁", short: "인허가·처분", icon: "Building2",
    overview: "구청·시청의 인가, 고시, 처분이 위법·부당하다고 다투는 분쟁입니다.",
    causes: ["인가 요건 미비", "절차 하자", "재량권 일탈·남용"],
    stages: [1, 2, 3, 4, 6, 10], laws: ["ah27", "al20", "info11"],
    procedure: ["처분서·고시문 확보", "처분을 안 날 기록", "행정심판(90일) 또는 취소소송(90일)"],
    evidence: ["처분서·고시문", "인가 신청서류(정보공개)", "통지 수령일 증빙"],
    docs: ["t7", "t2", "t11"], keywords: ["인가", "처분", "구청", "시청", "고시", "허가", "행정청", "취소"],
  },
  {
    id: "d13", name: "소송·가처분·행정심판 등 법적 대응", short: "법적 대응", icon: "Gavel",
    overview: "민사·행정소송, 가처분, 행정심판 등 공식 절차로 다툴 때의 준비를 돕습니다.",
    causes: ["협의·민원으로 해결 안 됨", "기한 임박", "긴급한 손해 우려"],
    stages: [3, 4, 6, 7, 8, 12], laws: ["ah27", "al20", "cx300"],
    procedure: ["기한 계산 및 일정 등록", "증거 목록 정리", "전문가 검토", "소장·신청서 제출"],
    evidence: ["사건 관련 전체 자료", "증거 목록"],
    docs: ["t8", "t9", "t7", "t10", "t11"], keywords: ["소송", "소장", "가처분", "행정심판", "고소", "변호사", "재판"],
  },
  {
    id: "d14", name: "기타 재개발 관련 분쟁", short: "기타", icon: "CircleHelp",
    overview: "위 유형에 딱 맞지 않는 재개발 관련 문제입니다. AI 상담으로 먼저 상황을 정리해 보세요.",
    causes: ["복합 분쟁", "준공·이전고시·청산 관련"],
    stages: [10, 11, 12], laws: ["dj124", "ah27", "al20"],
    procedure: ["사실관계 정리", "AI 상담으로 쟁점 파악", "전문가 상담"],
    evidence: ["관련 문서 일체"], docs: ["t10", "t11", "t1"], keywords: ["조합 청산", "청산인", "해산", "이전고시", "준공", "기타"],
  },
];

export const STRATEGIES = [
  { id: "admin", name: "행정적 대응", desc: "관할 행정기관에 민원 및 의견 제출", check: "관할 기관과 처리기간 확인" },
  { id: "info", name: "정보공개 대응", desc: "조합 자료 열람·복사, 공공기관 정보공개청구", check: "조합 15일 / 공공기관 10일 기한" },
  { id: "internal", name: "조합 내부 대응", desc: "총회 의견 제출, 이의제기, 총회 소집 요구", check: "정관의 절차·정족수 확인" },
  { id: "civil", name: "민사적 대응", desc: "내용증명, 청구 및 소송 준비", check: "소멸시효·비용·증거 확인" },
  { id: "appeal", name: "행정적 불복", desc: "행정심판 및 행정소송 검토", check: "안 날부터 90일 등 불변기간" },
  { id: "preserve", name: "보전처분", desc: "가처분 등 긴급 보전절차 검토", check: "보전의 필요성·담보 비용" },
];

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date";
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type DocTemplate = {
  id: string;
  name: string;
  category: string;
  desc: string;
  disputes: string[];
  laws: string[];
  expertReview: boolean;
  version: string;
  title: string;
  fields: Field[];
  intro: (v: Record<string, string>) => string;
  requestHeading: string;
};

const BASE_FIELDS: Field[] = [
  { key: "author", label: "작성자(성명)", required: true, placeholder: "홍길동" },
  { key: "authorAddress", label: "작성자 주소", required: true, placeholder: "서울시 ○○구 ○○로 00" },
  { key: "authorContact", label: "연락처", placeholder: "010-0000-0000" },
  { key: "recipient", label: "수신자", required: true, placeholder: "○○구역 주택재개발정비사업조합 조합장" },
  { key: "projectName", label: "사업명", required: true, placeholder: "○○구역 주택재개발정비사업" },
  { key: "eventDate", label: "사건 발생일", type: "date" },
  { key: "facts", label: "주요 사실관계", type: "textarea", required: true, placeholder: "언제, 누가, 무엇을 했는지 순서대로 적어 주세요.", help: "날짜 순서로 짧은 문장으로 적으면 문서가 깔끔해집니다." },
  { key: "requests", label: "요청 및 주장 내용", type: "textarea", required: true, placeholder: "상대방에게 요구하는 것을 적어 주세요." },
  { key: "attachments", label: "첨부자료", type: "textarea", placeholder: "한 줄에 하나씩 (예: 열람 요청서 사본 1부)" },
];

const T = (t: Omit<DocTemplate, "version" | "fields"> & { extra?: Field[]; fields?: Field[] }): DocTemplate => ({
  version: "1.0",
  ...t,
  fields: t.fields ?? [...BASE_FIELDS.slice(0, 6), ...(t.extra ?? []), ...BASE_FIELDS.slice(6)],
});

export const TEMPLATES: DocTemplate[] = [
  T({ id: "t1", name: "내용증명 및 법적 통지서", category: "내용증명", desc: "상대방에게 요구사항을 공식적으로 알리는 문서", disputes: ["d7", "d9", "d6", "d10"], laws: [], expertReview: false, title: "내용증명(통지서)",
    extra: [{ key: "deadline", label: "회신 요청 기한", placeholder: "본 서면 수령 후 15일 이내" }],
    intro: (v) => `발신인은 ${v.projectName || "본 사업"}과 관련하여 아래와 같이 통지하오니, ${v.deadline || "본 서면 수령 후 상당한 기간 내"}에 회신하여 주시기 바랍니다.`, requestHeading: "통지 및 요구 사항" }),
  T({ id: "t2", name: "정보공개청구서 및 자료 열람 요청서", category: "정보공개청구", desc: "조합 자료 열람·복사 또는 공공기관 정보공개를 요청", disputes: ["d9", "d1", "d3", "d4", "d5"], laws: ["dj124", "info11"], expertReview: false, title: "자료 열람·복사 요청서",
    extra: [
      { key: "materials", label: "요청 자료 목록", type: "textarea", required: true, placeholder: "예) 2026년 정기총회 의사록, 감정평가서" },
      { key: "usePurpose", label: "사용 목적", required: true, placeholder: "조합원 권리 확인 및 총회 안건 검토" },
      { key: "method", label: "공개 방법", placeholder: "사본 교부(전자파일 포함)" },
    ],
    intro: (v) => `요청인은 ${v.projectName || "본 사업"}의 조합원(토지등소유자)으로서, 「도시 및 주거환경정비법」 제124조에 따라 아래 자료의 열람·복사를 요청합니다. 같은 조에 따라 요청일부터 15일 이내에 응하여 주시기 바랍니다. 주민등록번호 등 개인정보는 제외하고 제공하여 주시기 바랍니다.`, requestHeading: "요청 자료 및 사용 목적" }),
  T({ id: "t3", name: "조합 총회 관련 의견서 및 이의신청서", category: "총회", desc: "총회 안건·절차에 대한 의견 및 이의 제기", disputes: ["d3", "d4", "d8", "d11"], laws: ["dj45"], expertReview: false, title: "총회 안건 의견서 및 이의신청서",
    extra: [{ key: "meeting", label: "대상 총회(일시·명칭)", required: true, placeholder: "2026. 12. 5. 정기총회 제3호 안건" }],
    intro: (v) => `신청인은 ${v.projectName || "본 사업"}의 조합원으로서 ${v.meeting || "해당 총회"}에 관하여 다음과 같이 의견을 제출하고 이의를 신청합니다.`, requestHeading: "의견 및 이의 내용" }),
  T({ id: "t4", name: "조합원 자격 및 동의서 관련 이의제기서", category: "조합원 자격", desc: "조합원 지위·동의서 처리에 대한 이의", disputes: ["d2", "d1"], laws: ["dj39", "dj35"], expertReview: false, title: "조합원 자격 관련 이의제기서",
    extra: [{ key: "property", label: "소유 부동산 표시", required: true, placeholder: "서울시 ○○구 ○○동 00번지 토지 및 건물" }],
    intro: (v) => `이의제기인은 ${v.property || "정비구역 내 부동산"}의 소유자로서 조합원 자격(동의서) 처리에 관하여 다음과 같이 이의를 제기합니다.`, requestHeading: "이의 내용 및 요청" }),
  T({ id: "t5", name: "감정평가 이의신청 및 의견서", category: "감정평가", desc: "종전·종후자산 평가액에 대한 이의", disputes: ["d5", "d6"], laws: ["dj74", "lc83"], expertReview: false, title: "감정평가 결과에 대한 의견서(이의신청)",
    extra: [
      { key: "property", label: "평가 대상 부동산", required: true },
      { key: "appraised", label: "통지된 평가액", placeholder: "금 000,000,000원" },
      { key: "noticeDate", label: "통지 받은 날", type: "date", help: "수용재결 이의신청은 재결서 정본 수령일부터 30일입니다." },
    ],
    intro: (v) => `신청인은 ${v.property || "대상 부동산"}에 대하여 통지된 평가액(${v.appraised || "미기재"})이 적정하지 않다고 판단하여 다음과 같이 의견을 제출합니다.`, requestHeading: "이의 사유 및 요청" }),
  T({ id: "t6", name: "현금청산 및 손실보상 관련 청구서", category: "보상", desc: "현금청산금·주거이전비·영업손실 등 청구", disputes: ["d6", "d10"], laws: ["dj73", "lc78"], expertReview: false, title: "손실보상(현금청산) 청구서",
    extra: [{ key: "claimItems", label: "청구 항목", type: "textarea", required: true, placeholder: "예) 주거이전비, 이사비, 영업손실" }],
    intro: (v) => `청구인은 ${v.projectName || "본 사업"}과 관련하여 아래 손실에 대한 보상을 청구합니다.`, requestHeading: "청구 항목 및 내용" }),
  T({ id: "t7", name: "행정심판 청구서 및 행정기관 민원서", category: "행정심판·민원", desc: "행정처분 불복 또는 관할 기관 민원", disputes: ["d12", "d4", "d1", "d9"], laws: ["ah27"], expertReview: true, title: "행정심판 청구서(초안) / 민원서",
    extra: [
      { key: "disposition", label: "대상 처분(처분청·처분 내용)", required: true, placeholder: "○○구청장의 2026. 10. 1.자 관리처분계획인가 처분" },
      { key: "knownDate", label: "처분을 안 날", type: "date", required: true, help: "안 날부터 90일, 있었던 날부터 180일 안에 청구해야 합니다." },
    ],
    intro: (v) => `청구인은 ${v.disposition || "대상 처분"}에 대하여 다음과 같이 행정심판을 청구(민원 제기)합니다. 청구인이 처분이 있음을 안 날은 ${v.knownDate || "(기재 필요)"}입니다.`, requestHeading: "청구 취지 및 이유" }),
  T({ id: "t8", name: "소장·답변서·준비서면 초안", category: "소송", desc: "민사·행정소송 서면 초안(전문가 검토 필수)", disputes: ["d13", "d3", "d7"], laws: ["al20"], expertReview: true, title: "소장(초안)",
    extra: [
      { key: "court", label: "관할 법원", required: true, placeholder: "서울행정법원" },
      { key: "defendant", label: "피고", required: true },
      { key: "claim", label: "청구취지", type: "textarea", required: true },
    ],
    intro: (v) => `원고는 피고 ${v.defendant || "(피고)"}를 상대로 다음과 같이 소를 제기합니다.\n\n[청구취지]\n${v.claim || "(청구취지 기재)"}`, requestHeading: "청구원인" }),
  T({ id: "t9", name: "가처분 신청 관련 서류 초안", category: "가처분", desc: "총회 효력정지·직무집행정지 등(전문가 검토 필수)", disputes: ["d13", "d3"], laws: ["cx300"], expertReview: true, title: "가처분 신청서(초안)",
    extra: [
      { key: "court", label: "관할 법원", required: true },
      { key: "respondent", label: "채무자", required: true },
      { key: "purpose", label: "신청취지", type: "textarea", required: true },
      { key: "urgency", label: "보전의 필요성(긴급한 이유)", type: "textarea", required: true },
    ],
    intro: (v) => `채권자는 채무자 ${v.respondent || "(채무자)"}를 상대로 다음과 같이 가처분을 신청합니다.\n\n[신청취지]\n${v.purpose || "(신청취지 기재)"}\n\n[보전의 필요성]\n${v.urgency || ""}`, requestHeading: "피보전권리 및 신청이유" }),
  T({ id: "t10", name: "증거자료 목록 및 사실관계 정리서", category: "증거정리", desc: "사건 자료를 번호 붙여 정리", disputes: ["d13", "d7", "d9", "d10", "d14"], laws: [], expertReview: false, title: "사실관계 정리서 및 증거목록",
    intro: (v) => `${v.projectName || "본 사업"} 관련 사건의 사실관계와 증거자료를 다음과 같이 정리합니다.`, requestHeading: "정리 목적 및 요청" }),
  T({ id: "t11", name: "법률 검토 보고서 및 변호사 상담용 자료", category: "검토보고서", desc: "전문가 상담 전 쟁점과 질문 정리", disputes: ["d4", "d8", "d11", "d12", "d13", "d14"], laws: [], expertReview: false, title: "법률 검토 요청 자료(상담용)",
    extra: [{ key: "questions", label: "전문가에게 묻고 싶은 질문", type: "textarea", required: true }],
    intro: (v) => `${v.projectName || "본 사업"}과 관련하여 전문가 상담 전 쟁점과 질문을 정리한 자료입니다.`, requestHeading: "검토 요청 사항" }),
];

export const CASE_STATUSES = ["준비 중", "진행 중", "대응 대기", "종결"];
export const MEMBER_ROLES = [
  { id: "owner", name: "사건 소유자", can: ["view", "edit", "manage", "delete"] },
  { id: "admin", name: "관리자", can: ["view", "edit", "manage"] },
  { id: "member", name: "일반 참여자", can: ["view", "edit"] },
  { id: "viewer", name: "열람자", can: ["view"] },
  { id: "expert", name: "외부 전문가", can: ["view", "edit"] },
] as const;

export const EVIDENCE_CATEGORIES = ["계약·서류", "통지·공문", "사진·영상", "녹음", "회의자료", "금융·영수증", "기타"];
export const ALLOWED_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"],
  mp3: ["audio/mpeg", "audio/mp3"], mp4: ["video/mp4"], txt: ["text/plain"],
};
export const MAX_FILE_MB = 50;

export const lawById = (id: string) => LAWS.find((l) => l.id === id);
export const disputeById = (id: string) => DISPUTES.find((d) => d.id === id);
export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
