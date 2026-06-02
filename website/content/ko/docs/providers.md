---
title: 프로바이더
description: AI-DLC를 Jira, Notion, Figma, Slack 및 기타 외부 도구에 연결합니다
order: 10
---

# 프로바이더

프로바이더는 AI-DLC를 팀이 이미 사용 중인 외부 시스템(티켓팅, 스펙, 디자인 도구, 커뮤니케이션 채널 등)에 연결합니다. 설정이 완료되면 AI-DLC는 정교화 및 실행 과정에서 이러한 시스템 간에 작업을 자동으로 동기화합니다.

## 프로바이더 카테고리

| 카테고리 | 목적 | 지원 유형 |
|----------|---------|----------------|
| **ticketing** | Unit에 연결된 티켓/이슈로 작업 추적 | Jira, Linear, GitHub Issues, GitLab Issues |
| **spec** | 요구사항 및 인수 기준 가져오기 | Notion, Confluence, Google Docs |
| **design** | 디자인 및 컴포넌트 스펙 참조 | Canva, OpenPencil, Pencil, Penpot, Excalidraw, Figma |
| **comms** | 상태 업데이트 및 알림 게시 | Slack, Teams, Discord |
| **VCS hosting** | git remote에서 자동 감지 | GitHub, GitLab, Bitbucket |
| **CI/CD** | 저장소 설정 파일에서 자동 감지 | GitHub Actions, GitLab CI, Jenkins, CircleCI |

VCS hosting과 CI/CD는 자동으로 감지되므로 별도로 설정할 필요가 없습니다.

## 설정

`.ai-dlc/settings.yml`에 `providers` 섹션을 추가합니다:

```yaml
providers:
  ticketing:
    type: jira
    config:
      project_key: "PROJ"
    instructions: |
      - Set ticket type to "Feature"
      - Use Fibonacci story points (1, 2, 3, 5, 8, 13)
      - Map unit discipline to labels: backend → "Elixir", frontend → "ReactNative"

  spec:
    type: notion
    config:
      workspace_id: "your-workspace-id"
    instructions: |
      - Link each ticket to the specific AC page it covers

  design:
    type: auto          # auto-detects from MCP tools; or set explicitly
    instructions: |
      - Only reference designs marked "Ready for Dev"

  comms:
    type: slack
    config:
      channel: "#dev-updates"
```

각 프로바이더 항목에는 세 가지 필드가 있습니다:

- **type** (필수) — 연결할 도구
- **config** (선택) — 프로젝트 키나 워크스페이스 ID 등 프로바이더별 설정
- **instructions** (선택) — 기본 동작을 커스터마이즈하는 프로젝트별 규칙

## 동작 방식

### 정교화 단계

`/ai-dlc:elaborate`를 실행하면 AI-DLC는 프로바이더를 활용하여 프로세스를 풍부하게 만듭니다:

1. **Spec 프로바이더** — Intent와 관련된 기존 요구사항, PRD, 디자인 문서를 검색합니다
2. **Design 프로바이더** — 관련 목업 및 컴포넌트 스펙을 가져옵니다
3. **Ticketing 프로바이더** — 아티팩트 작성 후 에픽과 티켓을 생성합니다:
   - Intent당 에픽 하나 생성 (또는 제품팀이 제공한 기존 에픽에 연결)
   - Unit당 티켓 하나 생성하여 에픽에 연결
   - Unit의 `depends_on` 관계는 티켓의 blocked-by 링크로 변환
   - 에픽 및 티켓 키는 intent/unit 프론트매터에 저장

### 실행 단계

hats는 작업하면서 프로바이더와 상호작용합니다:

- **Builder** — Unit 시작 시 티켓을 "In Progress"로, 완료 시 "Done"으로, 막힌 경우 "Blocked"로 업데이트
- **Reviewer** — 리뷰 결과를 티켓 댓글로 게시. 승인/거절 시 티켓 상태 업데이트
- **Comms** — 정교화 완료, 리뷰 종료, 또는 블로킹 이슈 발생 시 알림 게시

### 장애 허용 처리

프로바이더 상호작용은 권고 사항(**SHOULD**, **MUST** 아님)입니다. 설정된 프로바이더에 대한 MCP 도구를 사용할 수 없는 경우, AI-DLC는 해당 통합을 자동으로 건너뛰고 작업을 계속합니다. 프로바이더가 없어도 워크플로우가 중단되지 않습니다.

## 3단계 인스트럭션 병합

프로바이더 인스트럭션은 세 가지 소스에서 병합되며, 이후 단계가 이전 단계를 보완합니다:

1. **기본 내장값** — 플러그인에 포함되어 제공됩니다. 티켓팅의 DAG-to-blocked-by 매핑 등 범용 동작을 다룹니다.
2. **인라인 인스트럭션** — settings.yml의 `instructions:` 필드. 프로젝트별 규칙입니다.
3. **프로젝트 오버라이드** — 상세 규칙을 위한 `.ai-dlc/providers/{type}.md` 마크다운 파일.

### 예시: 프로젝트 수준 오버라이드

상세한 Jira 규칙을 위해 `.ai-dlc/providers/jira.md`를 생성합니다:

```markdown
---
provider: jira
type: ticketing
---

# Jira Conventions

## Required Fields
- Story points (Fibonacci: 1, 2, 3, 5, 8, 13)
- Component: Backend | Frontend | Infrastructure
- Sprint: Current sprint unless explicitly backlogged

## Naming Conventions
- Epic titles: "{Quarter} - {Objective}"
- Story titles: Imperative verb (e.g., "Add JWT validation middleware")
```

## 기존 에픽 지원

제품팀이 미리 에픽을 생성한 경우, 정교화 전에 intent 프론트매터에 `epic` 필드를 설정합니다:

```yaml
---
epic: "PROJ-123"
---
```

AI-DLC는 새 에픽을 생성하는 대신 모든 티켓을 해당 기존 에픽에 연결합니다. `epic`이 비어 있으면 새 에픽이 자동으로 생성됩니다.

## MCP 요구사항

프로바이더는 MCP(Model Context Protocol) 도구 서버를 통해 작동합니다. 각 프로바이더 유형에 대해 Claude Code 설정에 해당 MCP 서버가 구성되어 있어야 합니다:

| 프로바이더 유형 | MCP 도구 패턴 |
|--------------|-----------------|
| Jira | `mcp__*jira*` |
| Linear | `mcp__*linear*` |
| GitHub Issues | `gh issue` (built-in) |
| Notion | `mcp__*notion*` |
| Confluence | `mcp__*confluence*` |
| Canva | `mcp__*Canva*` |
| Figma | `mcp__*figma*` or `mcp__*Figma*` |
| OpenPencil | `mcp__*openpencil*` or `mcp__*open_pencil*` |
| Pencil | `mcp__*pencil*` |
| Penpot | `mcp__*penpot*` |
| Excalidraw | `mcp__*excalidraw*` or `mcp__*Excalidraw*` |
| Slack | `mcp__*slack*` |

## 다음 단계

- **[디자인 프로바이더 가이드](/docs/guide-design-providers/)** — 6가지 디자인 프로바이더 상세 설정
- **[빠른 시작](/docs/quick-start/)** — AI-DLC 시작하기
- **[워크플로우](/docs/workflows/)** — hat 기반 워크플로우 시스템 이해하기
- **[Cowork 모드](/docs/cowork/)** — 로컬 체크아웃 없이 원격으로 저장소 작업하기
