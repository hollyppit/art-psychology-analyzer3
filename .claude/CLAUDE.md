작업 전 .claude/ 폴더의 모든 md 파일을 참고할 것.
특히 webview.md, app-nongame.md, toss.md, deploy.md 우선 숙지.

## 만트라 스튜디오 공통 개발 규칙
작업 시작 전 반드시 이 파일 숙지할 것.

### 기본 원칙
- 폴더별 역할이 다르니 작업 대상 폴더 외에는 절대 건드리지 말 것
- 작업 전 반드시 어느 폴더를 수정하는지 명시할 것
- API는 웹 버전(Cloudflare Functions)에만 추가, 다른 버전은 절대경로로 호출

### 플랫폼별 폴더 구조 규칙
- {앱명}-web/ 또는 {앱명}-vision/: 브라우저 웹 버전
  - 순수 HTML/JS 구조
  - npm 빌드 없음, 토스 SDK npm 패키지 설치 금지
  - Cloudflare Functions (API) 포함
  - 환경변수 여기서만 관리

- {앱명}-toss/ 또는 {앱명}-mirror/: 토스 미니앱 전용
  - Vite + @apps-in-toss/web-framework
  - UI만 담당, functions 폴더 없음
  - 모든 API는 웹 버전 절대경로로 호출
  - npm run build → .ait 번들 → 토스 콘솔 업로드

- {앱명}-app/: 앱스토어/플레이스토어용 (추후)
  - React Native 구조
  - API는 웹 버전 절대경로로 호출

### 환경변수 (웹 버전 Cloudflare Pages에만 등록)
- ANTHROPIC_API_KEY: Claude API
- GEMINI_API_KEY: Gemini API (이미지 생성)
- TOSS_LOGIN_DECRYPT_KEY: 토스 로그인 복호화 키
- TOSS_PAY_SECRET_KEY: 토스페이 시크릿 키

### 배포 규칙
- 웹 버전: git push → Cloudflare 자동 배포
- 토스 미니앱: npm run build → .ait → 토스 콘솔 업로드
- 앱스토어/플레이스토어: 별도 빌드 프로세스

### 현재 프로젝트 (운명의 거울)
- saju-vision/: 웹 버전 (sajuvision2.pages.dev)
- unmyeong-mirror/: 토스 미니앱 (appName: mystic-mirror)
- 토스 콘솔: apps-in-toss.toss.im/workspace/31579
- 카테고리: 생활 > 콘텐츠 > 운세
- 수익모델: 전생/배우자/관상 건당 ₩1,500 / 오늘의 운세 무료 + 광고
