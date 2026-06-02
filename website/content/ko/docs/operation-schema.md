---
title: 오퍼레이션 파일 레퍼런스
description: .ai-dlc/{intent}/operations/*.md 오퍼레이션 스펙 파일의 스키마 레퍼런스
order: 9
---

이 문서는 오퍼레이션 스펙 파일에 대한 완전한 레퍼런스입니다. 오퍼레이션 스펙 파일은 AI-DLC에서 운영 작업을 정의하는 Markdown 파일입니다.

## 파일 위치

```
.ai-dlc/{intent}/operations/{name}.md
```

파일명(`.md` 제외)은 오퍼레이션 식별자로 사용되며, 프론트매터의 `name` 필드와 일치해야 합니다.

## 프론트매터 스키마

모든 오퍼레이션 스펙은 다음 필드를 포함하는 YAML 프론트매터를 사용합니다:

| 필드 | 타입 | 필수 여부 | 설명 |
|-------|------|----------|-------------|
| `name` | string | 필수 | 오퍼레이션 식별자, 파일명과 일치해야 함 |
| `type` | enum | 필수 | `scheduled`, `reactive`, 또는 `process` |
| `owner` | enum | 필수 | `agent` 또는 `human` |
| `schedule` | string | 조건부 | Cron 표현식 (`scheduled` 타입에 필수) |
| `trigger` | string | 조건부 | 조건 표현식 (`reactive` 타입에 필수) |
| `frequency` | string | 조건부 | 사람이 읽을 수 있는 주기 (`process` 타입에 필수) |
| `runtime` | enum | 선택 | `node`, `python`, `go`, 또는 `shell` — 스택 기본값을 오퍼레이션 단위로 재정의 |

### 타입별 필수 필드

- **Scheduled** 오퍼레이션은 `schedule`이 필요합니다
- **Reactive** 오퍼레이션은 `trigger`가 필요합니다
- **Process** 오퍼레이션은 `frequency`가 필요합니다

## 본문 내용

Markdown 본문은 소유권에 따라 다른 목적으로 사용됩니다:

**에이전트 소유:** 컴패니언 스크립트가 수행하는 작업, 즉 로직, 예상 동작, 제약 조건 등을 설명합니다. 이는 AI가 실행할 때 참조하는 문서 및 컨텍스트 역할을 합니다.

**휴먼 소유:** `/ai-dlc:operate`가 사람에게 제시하는 체크리스트를 포함합니다. 표준 Markdown 작업 목록 문법을 사용하세요:

```markdown
- [ ] Step one
- [ ] Step two
- [ ] Final verification
```

## 컴패니언 파일

에이전트 소유 오퍼레이션은 동일한 디렉터리에 컴패니언 파일을 가질 수 있습니다:

| 파일 | 용도 |
|------|---------|
| `{name}.ts` | TypeScript 구현체 |
| `{name}.py` | Python 구현체 |
| `{name}.go` | Go 구현체 |
| `{name}.sh` | Shell 스크립트 구현체 |
| `{name}.deploy.yaml` | 생성된 배포 매니페스트 |

런타임(오퍼레이션별 또는 스택 설정으로 지정)에 따라 실행할 컴패니언 파일이 결정됩니다. 오퍼레이션당 하나의 구현 파일만 사용합니다.

## 상태 스키마

오퍼레이션 상태는 `.ai-dlc/{intent}/state/operation-status.json`에 추적됩니다. 각 오퍼레이션은 이름을 키로 하는 항목을 가집니다:

```json
{
  "operations": {
    "operation-name": {
      "last_run": "2026-03-15T00:00:00Z",
      "last_presented": "2026-03-14T10:30:00Z",
      "status": "on-track",
      "last_exit_code": 0,
      "last_output": "Rotated 3 secrets successfully",
      "deployed": true,
      "deploy_target": "k8s-cronjob"
    }
  }
}
```

### 상태 필드

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `last_run` | ISO-8601 또는 `null` | 마지막 실행 타임스탬프 |
| `last_presented` | ISO-8601 또는 `null` | 마지막으로 사람에게 제시된 타임스탬프 (process 타입) |
| `status` | enum | `on-track`, `needs-attention`, `failed`, `pending`, 또는 `torn-down` |
| `last_exit_code` | number 또는 `null` | 마지막 에이전트 실행의 종료 코드 |
| `last_output` | string 또는 `null` | 마지막 실행 출력의 앞 2000자 |
| `deployed` | boolean | 오퍼레이션의 현재 배포 여부 |
| `deploy_target` | enum | `k8s-cronjob`, `k8s-deployment`, `github-actions`, `docker-compose`, `systemd`, 또는 `none` |

## 전체 예시

### Scheduled 에이전트 오퍼레이션

```markdown
<!-- .ai-dlc/auth-system/operations/rotate-secrets.md -->
---
name: rotate-secrets
type: scheduled
owner: agent
schedule: "0 0 1 * *"
runtime: node
---

Rotate API keys and database credentials on the first of each month.

1. List all secrets due for rotation from the secrets provider
2. Generate new credentials via provider API
3. Update the secrets store with new values
4. Verify connectivity using the new credentials
5. Revoke the old credentials
6. Log rotation summary to audit trail
```

동일한 디렉터리에 컴패니언 스크립트 `rotate-secrets.ts`가 위치합니다.

### Reactive 에이전트 오퍼레이션

```markdown
<!-- .ai-dlc/api-service/operations/scale-on-load.md -->
---
name: scale-on-load
type: reactive
owner: agent
trigger: "p99_latency > 200ms for 5m"
runtime: shell
---

Scale API replicas when sustained high latency is detected.

1. Query current replica count and resource utilization
2. Compute target replicas based on request rate and latency
3. Apply scaling via kubectl (capped at 20 replicas)
4. Wait for rollout to complete
5. Verify latency has returned to acceptable levels
```

동일한 디렉터리에 컴패니언 스크립트 `scale-on-load.sh`가 위치합니다.

### Process 휴먼 오퍼레이션

```markdown
<!-- .ai-dlc/platform/operations/quarterly-security-review.md -->
---
name: quarterly-security-review
type: process
owner: human
frequency: quarterly
---

- [ ] Run dependency audit (`npm audit` / `pip audit`)
- [ ] Review OWASP top 10 against current endpoints
- [ ] Check certificate expiration dates
- [ ] Review IAM roles and permissions for least privilege
- [ ] Verify backup restoration process
- [ ] Update threat model if architecture changed
- [ ] Document findings and file tickets for remediation
```

`/ai-dlc:operate platform quarterly-security-review`로 호출하면 체크리스트가 사람에게 제시되어 순서대로 진행할 수 있습니다. 진행 상황은 상태 파일에 추적됩니다.

## 다음 단계

- **[오퍼레이션 가이드](/docs/operations-guide/)** — 오퍼레이션 단계의 전체 안내
- **[스택 설정 레퍼런스](/docs/stack-config/)** — 오퍼레이션 런타임 및 기타 스택 레이어 설정
