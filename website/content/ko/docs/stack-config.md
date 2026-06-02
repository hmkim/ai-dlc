---
title: 스택 구성 참조
description: .ai-dlc/settings.yml 스택 레이어(인프라, 컴퓨트, 패키징, 파이프라인, 시크릿, 모니터링, 알림, 운영)에 대한 참조 문서
order: 8
---

스택 구성은 `.ai-dlc/settings.yml`의 `stack:` 키 아래에서 프로젝트의 인프라를 정의합니다. AI-DLC는 이 구성을 사용하여 배포 매니페스트를 생성하고, 운영을 검증하며, 환경에 맞는 조언을 제공합니다.

모든 레이어는 선택 사항입니다. 빈 스택(`stack: {}`)도 유효하며, AI-DLC는 프로젝트 파일에서 가능한 정보를 자동으로 추론합니다.

## 레이어 참조

### 인프라

인프라 프로비저닝 방식을 정의합니다.

```yaml
stack:
  infrastructure:
    - provider: terraform  # terraform | cloudformation | pulumi
      state_backend: s3
      modules_path: infra/modules/
```

**프로바이더:** `terraform`, `cloudformation`, `pulumi`

### 컴퓨트

워크로드가 실행되는 위치를 정의합니다.

```yaml
stack:
  compute:
    - provider: kubernetes  # kubernetes | ecs | lambda | docker-compose
      cluster: production
      namespace: default
```

**프로바이더:** `kubernetes`, `ecs`, `lambda`, `docker-compose`

### 패키징

애플리케이션의 배포 패키징 방식을 정의합니다.

```yaml
stack:
  packaging:
    - provider: helm  # helm | kustomize | raw
      charts_path: deploy/charts/
```

**프로바이더:** `helm`, `kustomize`, `raw`

### 파이프라인

CI/CD 파이프라인 구성을 정의합니다.

```yaml
stack:
  pipeline:
    - provider: github-actions  # github-actions | gitlab-ci | jenkins | circleci
      workflows_path: .github/workflows/
```

**프로바이더:** `github-actions`, `gitlab-ci`, `jenkins`, `circleci`

### 시크릿

시크릿 관리 방식을 정의합니다.

```yaml
stack:
  secrets:
    - provider: vault  # vault | aws-sm | gcp-sm | env
      path: secret/data/app
```

**프로바이더:** `vault`, `aws-sm`, `gcp-sm`, `env`

### 모니터링

옵저버빌리티 스택을 정의합니다.

```yaml
stack:
  monitoring:
    - provider: prometheus  # prometheus | datadog | cloudwatch | newrelic | otel
      endpoint: http://prometheus:9090
```

**프로바이더:** `prometheus`, `datadog`, `cloudwatch`, `newrelic`, `otel`

### 알림

알림 및 인시던트 관리를 정의합니다.

```yaml
stack:
  alerting:
    - provider: pagerduty  # pagerduty | opsgenie | datadog | alertmanager
      service_id: P123ABC
```

**프로바이더:** `pagerduty`, `opsgenie`, `datadog`, `alertmanager`

### 운영

운영 런타임 및 구성을 정의합니다.

```yaml
stack:
  operations:
    runtime: node  # node | python | go | shell
    scheduled:
      - name: cleanup
        schedule: "0 3 * * *"
        command: node scripts/cleanup.js
    reactive:
      - name: alert-handler
        trigger: webhook
        command: node scripts/handle-alert.js
```

**런타임:** `node`, `python`, `go`, `shell`

`runtime`이 지정되지 않은 경우, AI-DLC는 프로젝트 파일에서 런타임을 자동으로 감지합니다:
- `package.json` → `node`
- `pyproject.toml` 또는 `requirements.txt` → `python`
- `go.mod` → `go`
- 기본값 → `shell`

## 예시

### 간단한 구성 — 개인 개발자

CI와 기본 모니터링만 포함한 최소 구성:

```yaml
stack:
  pipeline:
    - provider: github-actions
  monitoring:
    - provider: datadog
```

### 중간 구성 — 소규모 팀

컨테이너 오케스트레이션, CI, 모니터링, 운영을 포함한 일반적인 팀 구성:

```yaml
stack:
  compute:
    - provider: kubernetes
      cluster: staging
      namespace: app
  pipeline:
    - provider: github-actions
      workflows_path: .github/workflows/
  monitoring:
    - provider: prometheus
      endpoint: http://prometheus:9090
  alerting:
    - provider: pagerduty
      service_id: P456DEF
  operations:
    runtime: node
    scheduled:
      - name: cleanup
        schedule: "0 3 * * *"
        command: node scripts/cleanup.js
```

### 복잡한 구성 — 엔터프라이즈

대규모 프로덕션 환경을 위한 전체 스택 구성:

```yaml
stack:
  infrastructure:
    - provider: terraform
      state_backend: s3
      modules_path: infra/modules/
  compute:
    - provider: kubernetes
      cluster: prod-us-east-1
      namespace: platform
  packaging:
    - provider: helm
      charts_path: deploy/charts/
  pipeline:
    - provider: github-actions
      workflows_path: .github/workflows/
  secrets:
    - provider: vault
      path: secret/data/platform
  monitoring:
    - provider: otel
      endpoint: http://otel-collector:4317
  alerting:
    - provider: pagerduty
      service_id: P789GHI
  operations:
    runtime: node
    scheduled:
      - name: cleanup
        schedule: "0 3 * * *"
        command: node scripts/cleanup.js
    reactive:
      - name: alert-handler
        trigger: webhook
        command: node scripts/handle-alert.js
```

## 다음 단계

- **[운영 가이드](/docs/operations-guide/)** — 운영 단계에 대한 상세 안내
- **[운영 파일 참조](/docs/operation-schema/)** — 운영 스펙 파일의 스키마 참조
