# 만트라 스튜디오 앱 출시 템플릿

## 플랫폼별 출시 체크리스트

### 토스 미니앱
- [ ] 토스 콘솔 앱 등록 (apps-in-toss.toss.im)
- [ ] appName 설정
- [ ] 토스 로그인 연동 + 복호화 키 등록
- [ ] 토스페이 청약 신청 (영업일 7~14일)
- [ ] 서비스 이용약관 + 환불정책 URL 등록
- [ ] 라이트모드 고정, 핀치줌 비활성화
- [ ] 인트로 화면 (토스 로그인 전 서비스 소개)
- [ ] 샌드박스 테스트 (같은 와이파이 환경 필요)
- [ ] npm run build → .ait 번들 생성
- [ ] 토스 콘솔 번들 업로드
- [ ] QR 테스트 1회 이상 완료
- [ ] 검수 요청

### 구글 플레이스토어
- [ ] React Native 또는 WebView 앱 구성
- [ ] 구글 플레이 콘솔 등록
- [ ] 개인정보처리방침 URL 등록
- [ ] 앱 서명 키 생성
- [ ] AAB 빌드
- [ ] 내부 테스트 → 비공개 테스트 → 공개

### 앱스토어 (iOS)
- [ ] Apple Developer 계정 ($99/년)
- [ ] Xcode 빌드 환경 (맥 필수)
- [ ] TestFlight 테스트
- [ ] 심사 제출

## API 공유 구조
- 웹/토스/앱 모두 동일한 Cloudflare Functions 사용
- 기능 추가 시 웹 버전 API 한 곳만 수정하면 전 플랫폼 적용
- API 호출 시 반드시 절대경로 사용

## 환경변수 표준
- ANTHROPIC_API_KEY: Claude API
- GEMINI_API_KEY: Gemini API
- TOSS_LOGIN_DECRYPT_KEY: 토스 로그인
- TOSS_PAY_SECRET_KEY: 토스페이 결제

## 수익 모델 표준
- 핵심 기능: 건당 결제 (₩500~₩2,000)
- 무료 기능: 광고 수익
- 웹 버전: 구글 애드센스
- 토스 미니앱: 토스 인앱 광고
- 앱스토어/플레이스토어: 구글 애드몹

## 새 프로젝트 시작 시 Claude Code 명령어 템플릿

### 웹 버전 생성
{앱명}-web 폴더 생성, 순수 HTML/JS 구조,
Cloudflare Functions API 포함, git add, commit, push

### 토스 미니앱 생성
{앱명}-toss 폴더 생성, Vite + @apps-in-toss/web-framework,
appName: {appName}, API는 {웹버전URL}/api/... 절대경로,
npm run build, git add, commit, push
