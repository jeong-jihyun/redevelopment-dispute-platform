// 디자인 규칙 검사: 화면 파일이 공통 부품(ui.tsx) 밖에서 모양을 새로 만들었는지 찾는다. (docs/ui-patterns.md)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const ROOT = "src";
const ALLOW = new Set(["src/components/ui.tsx"]);
const RULES = [
  [/#[0-9a-fA-F]{3,6}\b/, "색 코드를 직접 사용 (토큰·부품 사용)"],
  [/\bshadow-\[/, "그림자를 직접 지정"],
  [/\bbg-(blue|navy)-\d{3}\b/, "파랑·남색 배경 직접 지정 (버튼·HeroPanel만 허용)"],
  [/rounded-(\[|full|xl|2xl|3xl)/, "모서리 직접 지정 (부품 사용)"],
  [/text-\[(1[0-9]|2[0-9]|3[0-9])px\]/, "글자 크기 직접 지정"],
];
// 홈 HeroPanel 안 검색창·예시 질문은 사용자 확정 모양이라 예외
const EXCEPT = [
  { file: "src/app/layout.tsx", lines: /themeColor/ }, // 브라우저 상단 색(메타데이터)
];
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") && files.push(p); } })(ROOT);
let bad = 0;
for (const f of files) {
  if (ALLOW.has(f)) continue;
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (EXCEPT.some((e) => e.file === f && e.lines.test(line))) return;
    for (const [re, msg] of RULES) if (re.test(line)) { bad++; console.log(`${f}:${i + 1}  ${msg}\n    ${line.trim().slice(0, 140)}`); }
  });
}
console.log(bad ? `\n규칙 위반 ${bad}건` : "규칙 위반 0건");
process.exit(bad ? 1 : 0);
