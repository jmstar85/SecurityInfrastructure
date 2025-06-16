# Security Infrastructure MCP Servers

보안 플랫폼을 위한 포괄적인 MCP (Model Context Protocol) 서버 구현체입니다.

## 포함된 통합 시스템

- **Splunk SIEM**: 보안 정보 및 이벤트 관리를 위한 포괄적인 검색 및 분석 기능
- **CrowdStrike EDR**: 위협 탐지 및 사고 대응을 위한 엔드포인트 탐지 및 대응 플랫폼 통합
- **Microsoft MISP**: 위협 정보 공유를 위한 악성코드 정보 공유 플랫폼 통합

## 라이브 문서

실시간 문서는 다음에서 확인할 수 있습니다: [GitHub Pages](https://jmstar85.github.io/SecurityInfrastructure)

## 특징

- **대화형 검색**: 모든 코드 예제에서 키워드 검색 가능
- **카테고리 필터링**: SIEM, EDR, 위협 정보별로 필터링
- **코드 복사**: 원클릭 코드 복사 기능
- **반응형 디자인**: 데스크톱 및 모바일에서 최적화
- **키보드 단축키**: Ctrl+K로 검색, ESC로 검색 초기화

## 빠른 시작

1. 저장소 복제 및 환경 변수 설정
2. 의존성 설치: `pip install -r requirements.txt`
3. 보안 플랫폼 자격 증명 구성
4. 테스트 실행: `pytest tests/`
5. 서버 시작: `docker-compose up -d`

## 기여

추가적인 보안 MCP 서버 예제나 문서 개선사항에 대한 풀 리퀘스트를 환영합니다.

## 라이센스

이 프로젝트는 보안 연구 및 교육 목적으로 제공됩니다.