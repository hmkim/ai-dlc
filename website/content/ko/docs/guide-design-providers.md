---
title: 디자인 프로바이더
description: 디자인 프로바이더 구성 및 사용 — Canva, Figma, OpenPencil, Pencil, Penpot, Excalidraw
order: 10
---

AI-DLC는 여섯 가지 디자인 프로바이더를 지원하며, 각각 MCP(Model Context Protocol)를 통해 워크플로우를 서로 다른 디자인 도구에 연결합니다. 디자인 프로바이더는 정교화 및 실행 과정에서 디자인 참조 자동 해석, 컴포넌트 스펙 조회, 에셋 내보내기를 가능하게 합니다.

## 지원 프로바이더

| 프로바이더 | 유형 | 라이선스 | 적합한 용도 |
|----------|------|---------|----------|
| **Canva** | 클라우드 | 상용 | 브랜드 중심 디자인, 마케팅 에셋, 팀 템플릿 |
| **Figma** | 클라우드 | 상용 | 컴포넌트 시스템, 디자인 토큰, 협업 UI 디자인 |
| **OpenPencil** | 로컬/클라우드 | 오픈 소스 | 코드 우선 디자인, 멀티 프레임워크 내보내기 |
| **Pencil** | 로컬 | 오픈 소스 | AI 생성 기능을 갖춘 경량 디자인 |
| **Penpot** | 자체 호스팅/클라우드 | 오픈 소스 | 자체 호스팅 디자인, SVG 네이티브 워크플로우 |
| **Excalidraw** | 로컬/클라우드 | 오픈 소스 | 빠른 다이어그램, 아키텍처 스케치, 저충실도 와이어프레임 |

## 구성

`.ai-dlc/settings.yml`에서 디자인 프로바이더를 설정합니다:

```yaml
providers:
  design:
    type: figma
    config:
      project_id: "your-project-id"
      team_id: "your-team-id"
      file_key: "your-file-key"
    instructions: |
      - Only reference designs marked "Ready for Dev"
      - Export at 2x for retina displays
```

### 자동 감지

`type: auto`(기본값)로 설정하면 AI-DLC가 사용 가능한 MCP 도구에서 프로바이더를 자동으로 감지합니다:

```yaml
providers:
  design:
    type: auto
```

감지는 다음 우선순위 순서로 MCP 도구를 확인합니다:

1. **Canva** — `mcp__*Canva*`
2. **Figma** — `mcp__*figma*` 또는 `mcp__*Figma*`
3. **OpenPencil** — `mcp__*openpencil*` 또는 `mcp__*open_pencil*`
4. **Pencil** — `mcp__*pencil*`
5. **Penpot** — `mcp__*penpot*`
6. **Excalidraw** — `mcp__*excalidraw*` 또는 `mcp__*Excalidraw*`

가장 먼저 일치하는 프로바이더가 선택됩니다. MCP 도구가 감지되지 않으면 디자인 프로바이더 기능은 자동으로 건너뜁니다.

## 기능 참조

모든 프로바이더가 동일한 작업을 지원하지는 않습니다. AI-DLC는 프로바이더별 작업을 시도하기 전에 기능을 확인합니다.

| 기능 | Canva | Figma | OpenPencil | Pencil | Penpot | Excalidraw |
|------------|-------|-------|------------|--------|--------|------------|
| **read** | yes | yes | yes | yes | yes | yes |
| **write** | yes | yes | yes | yes | yes | yes |
| **export** | yes | yes | yes | yes | yes | yes |
| **comment** | yes | yes | — | — | yes | — |
| **components** | — | yes | — | — | yes | — |
| **variables** | — | yes | yes | yes | — | — |
| **prototyping** | — | yes | — | — | yes | — |
| **generate** | yes | — | yes | yes | — | — |

**각 기능의 의미:**

- **read/write** — 디자인 파일 조회 및 수정
- **export** — 에셋 내보내기 (PNG, SVG, PDF 등)
- **comment** — 디자인 댓글 읽기 및 쓰기
- **components** — 재사용 가능한 컴포넌트 라이브러리 접근
- **variables** — 디자인 토큰/변수 읽기 및 쓰기
- **prototyping** — 인터랙티브 프로토타입 플로우 접근
- **generate** — AI 기반 디자인 생성

## 디자인 참조

각 프로바이더는 unit 프론트매터에 디자인 참조를 저장하기 위한 URI 체계를 사용합니다:

| 프로바이더 | URI 형식 | 예시 |
|----------|-----------|---------|
| Canva | `canva://<design_id>` | `canva://DAFx1234#page=2` |
| Figma | `figma://<file_key>` | `figma://abc123#node=1:42` |
| OpenPencil | `openpencil://<document_id>` | `openpencil://doc-456#node=btn-1` |
| Pencil | `pencil://<document_id>` | `pencil://doc-789#node=header` |
| Penpot | `penpot://<host>/<project>/<file>` | `penpot://app.penpot.app/proj-1/file-2#component=btn` |
| Excalidraw | `excalidraw://<drawing_id>` | `excalidraw://drawing-1` 또는 `excalidraw://local/path.excalidraw` |

참조는 unit의 `design_ref` 필드에 저장되며 실행 중에 자동으로 해석됩니다.

## 프로바이더 설정

### Canva

**MCP 서버:** Canva MCP (Claude Code 통합을 통해 사용 가능)

```yaml
providers:
  design:
    type: canva
    config:
      team_id: "your-team-id"
      brand_kit_id: "your-brand-kit-id"
      default_folder: "AI-DLC Designs"
      export_format: png        # png, jpg, or pdf
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `team_id` | Canva 팀 ID |
| `brand_kit_id` | 일관된 브랜딩을 위한 브랜드 킷 ID |
| `folder_id` | Canva 폴더 ID |
| `default_folder` | 새 디자인의 기본 폴더 경로 |
| `export_format` | 내보내기 형식: `png`(기본값), `jpg`, 또는 `pdf` |

**AI-DLC의 Canva 활용 방식:**

- 브랜드 킷 스타일링을 사용하여 디자인 생성
- 구성된 폴더에 디자인 정리
- 편집 트랜잭션 워크플로우 사용: 시작 → 작업 수행 → 커밋
- 구성된 형식으로 내보내기

### Figma

**MCP 서버:** Figma MCP

```yaml
providers:
  design:
    type: figma
    config:
      project_id: "your-project-id"
      team_id: "your-team-id"
      file_key: "your-file-key"
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `project_id` | Figma 프로젝트 ID |
| `team_id` | Figma 팀 ID |
| `file_key` | 기본 디자인 파일 키 |

**AI-DLC의 Figma 활용 방식:**

- 구현을 위한 디자인 스펙 참조
- Figma API를 통해 컴포넌트, 변수, 스타일 접근
- 지정된 배율(1x, 2x, 3x)로 에셋 내보내기
- `figma://<file_key>?branch=<branch_key>`를 통한 브랜치별 참조 지원

### OpenPencil

**MCP 서버:** OpenPencil MCP

```yaml
providers:
  design:
    type: openpencil
    config:
      project_id: "your-project-id"
      document_id: "your-document-id"
      default_export_target: react    # react, vue, svelte, html, flutter, swiftui, compose, react-native
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `project_id` | OpenPencil 프로젝트 ID |
| `document_id` | OpenPencil 문서 ID |
| `cli_path` | OpenPencil CLI 바이너리 경로 |
| `default_export_target` | 프레임워크 대상: `react`(기본값), `vue`, `svelte`, `html`, `flutter`, `swiftui`, `compose`, `react-native` |
| `mcp_transport` | MCP 전송 방식: `stdio`(기본값) 또는 `http` |

**AI-DLC의 OpenPencil 활용 방식:**

- `design_skeleton` → `design_content` → `design_refine` 순서로 디자인 생성
- `get_variables` / `set_variables`를 통해 디자인 토큰 읽기 및 쓰기
- 프레임워크 대상으로 내보내기 (8가지 프레임워크 지원)
- 일관된 스타일링을 위한 테마 프리셋 적용

### Pencil

**MCP 서버:** Pencil MCP

```yaml
providers:
  design:
    type: pencil
    config:
      project_id: "your-project-id"
      document_id: "your-document-id"
      mcp_port: 3100
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `project_id` | Pencil 프로젝트 ID |
| `document_id` | Pencil 문서 ID |
| `cli_path` | Pencil CLI 바이너리 경로 |
| `mcp_port` | MCP 서버 포트 (기본값: `3100`) |
| `model` | 생성에 사용할 AI 모델 (기본값: `claude-opus-4-6`) |

**AI-DLC의 Pencil 활용 방식:**

- 효율적인 다중 요소 생성을 위해 `batch_design`으로 디자인 생성
- `get_guidelines`를 사용하여 디자인 시스템 제약 조건 파악
- `get_variables` / `set_variables`를 통해 디자인 토큰 읽기 및 쓰기
- 빠른 시각적 검증을 위해 `get_screenshot` 사용

### Penpot

**MCP 서버:** Penpot MCP

```yaml
providers:
  design:
    type: penpot
    config:
      instance_url: "https://design.penpot.app"
      project_id: "your-project-id"
      mcp_port: 4401
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `instance_url` | Penpot 인스턴스 URL |
| `project_id` | Penpot 프로젝트 ID |
| `team_id` | Penpot 팀 ID |
| `file_id` | Penpot 파일 ID |
| `mcp_port` | MCP 서버 포트 (기본값: `4401`) |

**AI-DLC의 Penpot 활용 방식:**

- 구성된 인스턴스를 통해 디자인 접근
- Penpot의 네이티브 컴포넌트 및 라이브러리 시스템 활용
- SVG, PNG, 또는 PDF로 내보내기
- 다중 인스턴스 지원을 위해 URI에 인스턴스 호스트 포함

### Excalidraw

**MCP 서버:** Excalidraw MCP

```yaml
providers:
  design:
    type: excalidraw
    config:
      mcp_mode: remote
      style: hand-drawn
```

**구성 옵션:**

| 필드 | 설명 |
|-------|-------------|
| `file_path` | `.excalidraw` 파일 또는 디렉터리 경로 |
| `mcp_mode` | 모드: `remote`(기본값) 또는 `local` |
| `style` | 드로잉 스타일: `hand-drawn`(기본값), `architect`, `artist`, `cartoonist` |

**AI-DLC의 Excalidraw 활용 방식:**

- 빠른 다이어그램 및 아키텍처 스케치 생성
- 구성된 드로잉 스타일을 일관되게 적용
- SVG 또는 PNG로 내보내기
- 로컬 모드 파일(`.excalidraw`)은 버전 관리에 직접 포함 가능

## 프로바이더 활용 방식

### 정교화 단계

디자인 프로바이더는 Intent와 관련된 기존 디자인, 컴포넌트, 목업을 가져옵니다. 와이어프레임 생성 시(정교화 6.25단계)에는 디자인 시스템의 컴포넌트 이름을 참조합니다.

### 빌드 단계

builder hat은 UI 구현을 위해 디자인 스펙을 참조하고, 컴포넌트 사용이 디자인 시스템과 일치하는지 검증합니다.

### 리뷰 단계

reviewer hat은 UI 구현을 프로바이더의 디자인 스펙과 교차 검증합니다.

### 점진적 성능 저하

디자인 프로바이더 상호작용은 보조적인 역할을 합니다. 구성된 프로바이더에 대한 MCP 도구를 사용할 수 없는 경우, AI-DLC는 통합을 자동으로 건너뜁니다. 프로바이더가 없어도 워크플로우가 중단되지 않습니다.

## 3단계 지침

디자인 프로바이더 동작은 런타임에 병합되는 세 가지 단계의 지침을 통해 커스터마이즈됩니다:

1. **기본 내장값** — 플러그인에 포함되어 제공됩니다. 각 프로바이더의 범용 동작을 다룹니다.
2. **인라인 지침** — `settings.yml`의 `instructions:` 필드.
3. **프로젝트 오버라이드** — `.ai-dlc/providers/design.md`의 Markdown 파일.

이후 단계는 이전 단계를 보완합니다. 세부적인 커스터마이즈를 위해 프로젝트 수준의 오버라이드를 생성하세요:

```markdown
---
provider: figma
type: design
---

# Design Provider Conventions

## Required
- Only reference frames marked "Ready for Dev"
- Export at 2x for all raster assets
- Use component variants, not detached instances

## Naming
- Frame names: "{Feature} - {Viewport} - {State}"
- Component names: PascalCase matching React component names
```

## 다음 단계

- **[프로바이더](/docs/providers/)** — 모든 프로바이더 카테고리 개요
- **[디자이너 가이드](/docs/guide-designer/)** — AI-DLC에서 디자인 작업하기
- **[워크플로우](/docs/workflows/)** — 디자인 워크플로우 및 unit별 워크플로우
- **[테크 리드 가이드](/docs/guide-tech-lead/)** — 팀을 위한 프로바이더 구성
