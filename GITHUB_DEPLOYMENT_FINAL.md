# GitHub Pages 배포 가이드

현재 Preview 화면과 동일한 GitHub Pages 사이트가 완성되었습니다.

## 배포할 파일들

GitHub repository에 복사해야 할 파일들:

```
docs/
├── index.html          # 메인 문서 페이지 (Preview와 동일한 레이아웃)
├── assets/
│   ├── style.css      # 완전한 스타일시트
│   └── script.js      # 검색 및 네비게이션 기능
├── .nojekyll          # GitHub Pages 설정
└── README.md          # 프로젝트 설명
```

## GitHub Pages 설정 방법

1. **파일 업로드**: `docs/` 폴더 전체를 GitHub repository에 업로드
2. **Settings 이동**: GitHub repository → Settings 탭
3. **Pages 설정**: 
   - Source: "Deploy from a branch"
   - Branch: "main" 
   - Folder: "/docs"
4. **저장**: Save 클릭

## 완성된 기능들

✅ Preview 화면과 동일한 레이아웃
✅ 좌측 사이드바 네비게이션 
✅ 상단 검색 기능
✅ 6개 섹션 (Overview, Splunk, CrowdStrike, MISP, Docker, Tests)
✅ 코드 블록 복사 기능
✅ 반응형 디자인 (모바일 지원)
✅ 키보드 단축키 (Ctrl+K 검색, ESC 초기화)
✅ URL 해시 네비게이션
✅ 검색 하이라이팅

## 접속 URL

배포 완료 후 다음 URL에서 확인 가능:
`https://jmstar85.github.io/SecurityMCP`

## 추가 커스터마이징

더 많은 코드 예제를 추가하려면 `docs/index.html`에서 해당 섹션을 수정하면 됩니다. 현재 모든 MCP 서버 구현체와 설정 파일들이 포함되어 있습니다.