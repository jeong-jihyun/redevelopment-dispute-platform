# 공유·커뮤니티·동의서 서버 (Supabase 무료)

- 프로젝트: `redevelopment-dispute-platform` (서울 ap-northeast-2)
- 테이블: `shared_cases`(공유 사건·공개 범위·초대 코드), `case_members`(owner/editor/viewer), `posts`(글·댓글 쓰레드), `consent_forms`(동의서, 본문 변경 불가·서버가 SHA-256 계산), `consent_signatures`(손글씨 서명 PNG, 수정·삭제 불가)
- 보안(RLS): 참여자만 열람 / editor 이상만 글·동의서 작성 / 본인 글만 수정 / 서명은 본인만, 본문 확인값이 같을 때만
- 초대: `join_case(code, name)` 함수로만 참여
- 앱 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (공개용 키)
- 로그인 메일: Supabase 기본 발송은 팀원에게만·시간당 2통 → Brevo 무료 SMTP 연결 필요
- 보안 규칙 시험 18개 통과 (2026-11-20)
