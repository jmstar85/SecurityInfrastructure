# Security Infrastructure MCP Servers

포괄적인 보안 플랫폼 통합을 위한 MCP (Model Context Protocol) 서버 구현체 모음입니다.

## 🔐 지원 플랫폼

### Splunk SIEM
- 보안 정보 및 이벤트 관리
- SPL 쿼리 실행 및 결과 분석
- 실시간 알림 및 대시보드 관리

### CrowdStrike EDR  
- 엔드포인트 탐지 및 대응
- 위협 헌팅 및 사고 조사
- 호스트 관리 및 정책 배포

### Microsoft MISP
- 위협 정보 공유 플랫폼
- IOC 검색 및 분석
- 위협 인텔리전스 피드 관리

## 📖 라이브 문서

**전체 문서 및 코드 예제**: [https://jmstar85.github.io/SecurityInfrastructure](https://jmstar85.github.io/SecurityInfrastructure)

라이브 문서에서 제공되는 기능:
- 📋 완전한 서버 구현 코드
- 🔍 실시간 검색 및 필터링
- 📱 반응형 모바일 지원
- 📑 코드 복사 기능
- 🗂️ 카테고리별 정리

## 🚀 빠른 시작

```bash
# 1. 저장소 복제
git clone https://github.com/jmstar85/SecurityInfrastructure.git
cd SecurityInfrastructure

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키 및 자격증명 입력

# 4. 테스트 실행
pytest tests/

# 5. 서버 시작
docker-compose up -d
```

## 📁 프로젝트 구조

```
SecurityInfrastructure/
├── docs/                    # GitHub Pages 문서
│   ├── index.html          # 메인 문서 페이지
│   └── assets/             # CSS, JS 리소스
├── src/                    # MCP 서버 소스 코드
│   ├── splunk_server.py    # Splunk SIEM 통합
│   ├── crowdstrike_server.py # CrowdStrike EDR 통합
│   └── misp_server.py      # Microsoft MISP 통합
├── tests/                  # 단위 테스트
├── config/                 # 설정 파일
├── docker-compose.yml      # 컨테이너 구성
└── requirements.txt        # Python 의존성
```

## 🔧 설정 예제

### Splunk 연결
```yaml
splunk:
  host: "your-splunk-server.com"
  port: 8089
  username: "admin"
  token: "your-api-token"
  verify_ssl: true
```

### CrowdStrike 인증
```yaml
crowdstrike:
  client_id: "your-client-id"
  client_secret: "your-client-secret"
  base_url: "https://api.crowdstrike.com"
```

### MISP 설정
```yaml
misp:
  url: "https://your-misp-instance.com"
  key: "your-api-key"
  verifycert: true
```

## 🛠️ 주요 기능

- **비동기 API 호출**: 모든 플랫폼과의 효율적인 통신
- **에러 핸들링**: 강건한 오류 처리 및 재시도 로직
- **보안 인증**: 토큰 기반 및 OAuth 2.0 지원
- **로깅 시스템**: 구조화된 로그 및 모니터링
- **테스트 커버리지**: 포괄적인 단위 테스트 및 통합 테스트

## 📋 요구사항

- Python 3.11+
- Docker & Docker Compose
- 해당 보안 플랫폼 접근 권한

## 🤝 기여하기

1. Fork 저장소 생성
2. 기능 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -am '새 기능 추가'`)
4. 브랜치에 Push (`git push origin feature/새기능`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 보안 연구 및 교육 목적으로 제공됩니다.

## 🔗 관련 링크

- [MCP 프로토콜 문서](https://github.com/anthropics/mcp)
- [Splunk API 문서](https://docs.splunk.com/Documentation/Splunk/latest/RESTREF)
- [CrowdStrike API 문서](https://falcon.crowdstrike.com/documentation)
- [MISP API 문서](https://www.misp-project.org/openapi/)

---

⭐ **유용하다면 스타를 눌러주세요!**