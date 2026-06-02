---
title: 운영 가이드
description: AI-DLC 운영 단계의 전체 안내 — 운영 작업의 정의, 실행, 배포 및 모니터링
order: 7
---

운영 단계는 구축이 완료된 이후의 지속적인 작업을 관리합니다. AI-DLC는 운영을 외부적인 관심사로 취급하는 대신, 운영 작업을 해당 코드와 함께 위치하는 스펙 파일로 모델링합니다.

## 운영 단계란 무엇인가?

Intent의 구축 및 통합이 완료된 후에도 많은 기능은 지속적인 유지보수를 필요로 합니다. 예를 들어 예약된 작업, 프로덕션 이벤트에 대한 반응적 응답, 또는 주기적인 사람의 검토가 이에 해당합니다. 운영 단계는 AI-DLC의 나머지 부분과 동일한 파일 기반 방식을 사용하여 이러한 작업을 정의, 실행, 배포 및 추적하는 구조화된 방법을 제공합니다.

운영은 `.ai-dlc/{intent}/operations/`에 저장되는 YAML 프론트매터가 포함된 Markdown 파일입니다. 각 파일은 단일 운영 작업을 정의합니다 — 무엇을 하는지, 언제 실행되는지, 누가 소유하는지.

## 빠른 시작

**1. 운영 스펙 생성:**

```markdown
<!-- .ai-dlc/my-intent/operations/rotate-secrets.md -->
---
name: rotate-secrets
type: scheduled
owner: agent
schedule: "0 0 1 * *"
runtime: node
---

API 키와 데이터베이스 자격 증명을 매월 교체합니다.

1. 프로바이더 API를 통해 새 자격 증명 생성
2. 시크릿 스토어 업데이트
3. 새 자격 증명으로 연결 확인
4. 기존 자격 증명 폐기
```

**2. 운영 실행:**

```
/ai-dlc:operate my-intent rotate-secrets
```

**3. 상태 확인:**

```
/ai-dlc:operate my-intent --status
```

## 운영 정의하기

### 파일 위치

운영 스펙은 `.ai-dlc/{intent}/operations/{name}.md`에 위치합니다. 파일명(`.md` 제외)이 해당 운영의 식별자가 됩니다.

### 운영 유형

**Scheduled** — 크론 스케줄에 따라 실행됩니다. 시크릿 교체, 캐시 워밍, 보고서 생성 등 주기적인 유지보수에 사용합니다.

```yaml
---
name: warm-cache
type: scheduled
owner: agent
schedule: "*/30 * * * *"
---
```

**Reactive** — 트리거 조건에 반응하여 실행됩니다. 자동 스케일링, 롤백, 인증서 갱신, 인시던트 대응에 사용합니다.

```yaml
---
name: scale-on-load
type: reactive
owner: agent
trigger: "p99_latency > 200ms for 5m"
---
```

**Process** — 사람의 주기(주간, 분기 등)에 따라 실행됩니다. 검토, 감사, 용량 계획, 컴플라이언스 점검에 사용합니다.

```yaml
---
name: quarterly-security-review
type: process
owner: human
frequency: quarterly
---
```

### 소유권 모델

**에이전트 소유** 운영에는 AI가 자율적으로 실행하는 동반 스크립트(`.ts`, `.py`, `.go`, 또는 `.sh`)가 있습니다. Markdown 본문은 해당 스크립트가 수행하는 작업을 설명합니다.

**사람 소유** 운영은 Markdown 본문에 체크리스트를 사용합니다. `/ai-dlc:operate`를 통해 호출되면 AI가 체크리스트를 제시하고 완료 여부를 추적하지만, 실제 작업은 사람이 수행합니다.

```markdown
---
name: capacity-review
type: process
owner: human
frequency: monthly
---

- [ ] 리소스 사용률 대시보드 검토
- [ ] 스토리지 증가 추세 확인
- [ ] 스케일링 여유 공간 평가
- [ ] 용량 예측 스프레드시트 업데이트
- [ ] 필요한 스케일링 작업에 대한 티켓 등록
```

## 운영 실행하기

### 모든 운영 목록 보기

```
/ai-dlc:operate
```

모든 Intent에 걸친 운영 목록을 유형, 소유자, 상태와 함께 표시합니다.

### Intent 운영 보기

```
/ai-dlc:operate my-intent
```

특정 Intent에 대한 상태 테이블을 표시합니다:

```
┌──────────────────┬───────────┬───────┬──────────────┐
│ Operation        │ Type      │ Owner │ Status       │
├──────────────────┼───────────┼───────┼──────────────┤
│ rotate-secrets   │ scheduled │ agent │ on-track     │
│ scale-on-load    │ reactive  │ agent │ on-track     │
│ capacity-review  │ process   │ human │ pending      │
└──────────────────┴───────────┴───────┴──────────────┘
```

### 특정 운영 실행

```
/ai-dlc:operate my-intent rotate-secrets
```

에이전트 소유 운영의 경우 동반 스크립트를 실행하고 결과를 보고합니다. 사람 소유 운영의 경우 사람이 진행할 수 있도록 체크리스트를 표시합니다.

### 상태 확인

```
/ai-dlc:operate my-intent --status
```

마지막 실행 시간, 종료 코드, 배포 상태를 포함한 상세 상태를 표시합니다.

## 운영 배포하기

`--deploy`를 사용하여 운영 스펙에서 플랫폼별 매니페스트를 생성합니다:

```
/ai-dlc:operate my-intent --deploy k8s-cronjob
```

### 지원 대상

| 대상 | 설명 |
|--------|-------------|
| `k8s-cronjob` | 예약 운영을 위한 Kubernetes CronJob 매니페스트 |
| `k8s-deployment` | 반응형 운영을 위한 헬스 체크가 포함된 Kubernetes Deployment |
| `github-actions` | GitHub Actions 워크플로우 파일 |
| `docker-compose` | Docker Compose 서비스 정의 |
| `systemd` | systemd unit 및 타이머 파일 |

생성된 매니페스트는 운영 스펙과 함께 `{name}.deploy.yaml`로 저장됩니다. 이 파일들은 저장소에 커밋되며 인프라에 적용할 수 있습니다.

## 상태 추적

운영 상태는 `.ai-dlc/{intent}/state/operation-status.json`에 저장됩니다:

```json
{
  "operations": {
    "rotate-secrets": {
      "last_run": "2026-03-15T00:00:00Z",
      "status": "on-track",
      "last_exit_code": 0,
      "deployed": true,
      "deploy_target": "k8s-cronjob"
    }
  }
}
```

### 상태 값

| 상태 | 의미 |
|--------|---------|
| `on-track` | 마지막 실행 성공, 정상 운영 중 |
| `needs-attention` | 비치명적 문제 감지, 사람의 검토 권장 |
| `failed` | 마지막 실행 실패, 개입 필요 |
| `pending` | 아직 실행되지 않음 |
| `torn-down` | 배포 제거됨, 스펙은 보존됨 |

## 구축과의 통합

운영은 사후에 추가되는 것이 아니라 구축 워크플로우의 일부입니다:

- **Builder**는 프로덕션 단계에서 지속적인 유지보수가 필요한 작업(모니터링, 예약 작업, 런북)에 대한 운영 스펙을 생성합니다.
- **Reviewer**는 운영 준비 상태를 검증합니다: 올바른 운영이 정의되어 있는지, 트리거가 적절한지, 사람의 체크리스트가 완전한지 확인합니다.
- **Integrator**는 통합 중 Unit 간 충돌을 확인합니다 — 스케줄 충돌, 트리거 중복, 공유 리소스 참조 등을 점검합니다.

## 해제(Teardown)

운영 스펙을 보존하면서 배포를 제거합니다:

```
/ai-dlc:operate my-intent --teardown
```

이 명령은 운영 상태를 `torn-down`으로 설정하고 생성된 배포 매니페스트를 제거합니다. 스펙 파일은 저장소에 남아 있으므로 나중에 운영을 재배포할 수 있습니다.

## 레거시 형식

기존의 단일 파일 `operations.md` 형식을 사용하는 프로젝트는 계속 작동합니다. 플러그인이 레거시 형식을 감지하여 해당 파일에서 운영을 표시합니다. 새로운 운영은 `.ai-dlc/{intent}/operations/`의 개별 스펙 파일 형식을 사용해야 합니다.

## 다음 단계

- **[운영 파일 레퍼런스](/docs/operation-schema/)** — 운영 스펙 파일의 전체 스키마 레퍼런스
- **[스택 구성 레퍼런스](/docs/stack-config/)** — 운영 런타임을 포함한 인프라 레이어 구성
- **[워크플로우](/docs/workflows/)** — 전체 워크플로우에서 운영이 어떻게 통합되는지 알아보기
