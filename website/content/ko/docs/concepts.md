---
title: 핵심 개념
description: AI-DLC의 기본 개념 - 완료 기준, 백프레셔, 운영 모드, Unit
order: 5
---

이 개념들을 이해하는 것은 AI-DLC를 효과적으로 활용하는 데 필수적입니다. 이 개념들은 방법론의 토대를 이룹니다.

## Intent와 Unit

### Intent

**Intent**는 목적에 대한 고수준 선언입니다 — 달성하고자 하는 것을 나타냅니다. 비즈니스 목표, 기능, 또는 기술적 결과물을 캡슐화합니다.

모든 Intent에는 다음이 포함됩니다:
- **Description** - 무엇을 왜 만드는지
- **Completion Criteria** - 성공을 정의하는 검증 가능한 조건
- **Context** - 비즈니스 배경 및 제약 사항

```markdown
# Intent: Product Recommendation Engine

## Description
Build a recommendation engine that suggests complementary products
based on purchase history and browsing behavior.

## Business Context
- E-commerce platform with 50,000 products
- 1 million monthly active users
- Need real-time recommendations (<100ms)

## Completion Criteria
- [ ] API responds in <100ms p99
- [ ] Recommendations improve click-through by 10%+
- [ ] Works for new users (cold start handled)
```

### Unit

**Unit**은 Intent에서 도출된 응집력 있고 독립적인 작업 단위입니다. 더 큰 목표를 구성하는 집중된 조각으로 생각하면 됩니다.

**특징:**
- 응집성 - 내부의 사용자 스토리들이 높은 연관성을 가짐
- 느슨한 결합 - 다른 Unit과의 의존성이 최소화됨
- 독립적 배포 가능 - 단독으로 프로덕션에 배포 가능
- 명확한 경계 - 소유권과 범위가 명확함

```
add-recommendation-engine/
  intent.md
  unit-01-data-collection.md    # Capture user behavior
  unit-02-model.md              # Train ML model
  unit-03-api.md                # Real-time serving API
  unit-04-frontend.md           # Display recommendations
```

### Pass

**Pass**는 특정 분야에 집중하여 표준 AI-DLC 루프(상세화 → Unit → 구성 → 검토)를 한 번 순환하는 타입이 지정된 반복입니다. Pass는 단일 Intent 내에서 교차 기능적 인계를 가능하게 합니다.

**Pass 유형:**

| Pass | 참여자 | 모드 | 산출물 |
|------|--------|------|--------|
| `design` | 디자인 + 프로덕트 | OHOTL | 고충실도 디자인 아티팩트 |
| `product` | 프로덕트 + 디자인 | HITL | 행동 명세, 인수 기준 |
| `dev` | 개발 + 프로덕트 + 디자인 | AHOTL/HITL | 동작하는 코드 |

**동작 방식:**

1. 각 Pass는 AI-DLC 루프 전체를 독립적으로 실행합니다
2. 한 Pass의 산출물이 다음 Pass의 입력이 됩니다
3. 역방향 흐름은 예상된 것입니다 -- 개발에서 발견한 제약이 프로덕트로 피드백되고, 프로덕트에서 발견한 디자인 공백은 디자인으로 피드백됩니다

**설정:**

Pass는 선택 사항입니다. 단일 Pass(dev만)가 기본값입니다. 교차 기능적 반복이 필요할 때 Intent에 Pass를 추가하세요:

```yaml
# intent.md frontmatter
---
passes: [design, product, dev]
active_pass: "design"
---
```

한 Pass의 모든 Unit이 완료되면 Intent는 자동으로 다음 Pass로 전환됩니다. Unit은 `pass:` frontmatter 필드를 통해 특정 Pass에 속합니다.

#### 워크플로우 제약

각 Pass는 실행 중에 사용 가능한 워크플로우를 제한합니다. 활성 Pass가 지원하지 않는 워크플로우가 요청되면, 해당 Pass의 기본 워크플로우가 대신 사용됩니다.

| Pass | 사용 가능한 워크플로우 | 기본 워크플로우 |
|------|----------------------|----------------|
| `design` | `design` | `design` |
| `product` | `default`, `bdd` | `default` |
| `dev` | `default`, `tdd`, `adversarial`, `bdd` | `default` |

이를 통해 불일치를 방지합니다 -- 디자인 Pass 중에 실수로 TDD를 실행하는 일이 없습니다.

#### Pass-Back

이후 Pass에서 이전 Pass 작업이 필요한 문제를 발견하면, Intent는 역방향으로 반복됩니다:

1. `active_pass`가 대상 Pass로 역방향 설정됩니다 (예: dev에서 product로, product에서 design으로)
2. 기존의 완료된 Unit과 함께 새 Unit이 생성됩니다
3. Pass-back이 해결된 후 순방향 진행이 재개됩니다

Pass-back은 검토자의 권고 또는 사용자의 결정에 의해 트리거됩니다. 이는 정상적인 교차 분야 반복을 나타냅니다 -- 예를 들어, dev Pass에서 디자인 가정을 무효화하는 기술적 제약을 발견하면 수정을 위해 design Pass로 작업이 돌아갑니다.

#### 커스터마이징

Pass 시스템은 두 가지 커스터마이징 메커니즘을 지원합니다:

- **내장 Pass 보강:** 내장 Pass 이름(예: `design`, `product`, `dev`)과 일치하는 `{name}`으로 `.ai-dlc/passes/{name}.md`를 생성합니다. 작성한 지침은 "Project Augmentation" 제목 아래 내장 지침에 추가됩니다.
- **커스텀 Pass 정의:** 내장 Pass 이름과 일치하지 않는 이름으로 `.ai-dlc/passes/{name}.md`를 생성합니다. 커스텀 Pass가 직접 사용됩니다.

프로젝트의 모든 새 Intent에 대한 기본 Pass를 설정하려면 `.ai-dlc/settings.yml`에서 `default_passes`를 구성하세요:

```yaml
# .ai-dlc/settings.yml
default_passes: [design, product, dev]
```

Pass가 방법론에 어떻게 맞는지에 대한 더 깊은 이론은 논문의 [Iteration Through Passes](https://ai-dlc.dev/papers/ai-dlc-2026/#iteration-through-passes) 섹션을 참조하세요.

### Unit 의존성 (DAG)

Unit은 의존성을 선언하여 방향성 비순환 그래프(DAG)를 형성할 수 있습니다:

```yaml
# unit-04-frontend.md frontmatter
---
status: pending
depends_on: [unit-02-model, unit-03-api]
---
```

이를 통해 다음이 가능합니다:
- **팬아웃**: 독립적인 Unit이 병렬로 실행됨
- **팬인**: Unit이 모든 의존성이 완료될 때까지 대기함
- **최대 병렬성**: 준비된 Unit이 즉시 시작됨

### 프로젝트 지식 레이어

AI-DLC는 Intent 전반에 걸쳐 지속되는 `.ai-dlc/knowledge/`의 구조화된 아티팩트인 **지식 레이어**에 프로젝트 인텔리전스를 축적합니다. 다섯 가지 아티팩트 유형이 프로젝트가 *무엇인지*를 포착합니다:

| 아티팩트 | 포착하는 내용 |
|----------|--------------|
| **design** | 시각적 언어, 컴포넌트 패턴, 디자인 토큰 |
| **architecture** | 시스템 구조, 모듈 경계, 기술 선택 |
| **product** | 비즈니스 규칙, 사용자 페르소나, 도메인 어휘 |
| **conventions** | 코딩 표준, 명명 패턴, 파일 구성 |
| **domain** | 도메인 모델, 엔티티 관계, 경계 컨텍스트 |

지식 아티팩트는 상세화 과정에서 자동으로 채워집니다:
- **브라운필드 프로젝트:** 합성 서브에이전트가 코드베이스를 스캔하고 패턴을 아티팩트로 정제합니다
- **그린필드 프로젝트:** 스캐폴드 아티팩트가 생성된 후 Design Direction 선택기를 통해 시드됩니다

네 가지 실행 hat 모두 관련 지식 아티팩트를 읽으므로, 프로젝트의 다섯 번째 Intent는 처음 네 번의 Intent에서 학습한 모든 내용의 혜택을 받습니다.

### Design Direction

그린필드 또는 초기 단계 프로젝트의 경우, 상세화에는 팀이 시각적 원형을 선택하고 파라미터를 조정하는 **Design Direction** 단계가 포함됩니다. 사용 가능한 원형(Brutalist, Editorial, Dense/Utilitarian, Playful/Warm)과 조정 가능한 파라미터(밀도, 테두리 처리, 색온도, 타이포그래피 대비)는 다음과 같은 **디자인 청사진**을 생성합니다:

- 프로젝트의 `design` 지식 아티팩트를 시드함
- 상세화 중 와이어프레임 생성을 안내함
- 실행 중 모든 hat에 디자인 컨텍스트를 제공함

이 단계는 디자인 지식이 이미 존재하는 기성 프로젝트에서는 건너뜁니다.

## 완료 기준

완료 기준은 AI-DLC에서 가장 중요한 개념입니다. 측정 가능하고 검증 가능한 용어로 성공을 정의합니다.

### 중요한 이유

```
자율성 = f(기준 명확성)
```

- **모호한 기준** = 지속적인 인간 감독 필요
- **명확한 기준** = AI가 자체 검증하고 자율적으로 운영 가능

### 좋은 기준의 특성:

| 속성 | 나쁜 예 | 좋은 예 |
|------|---------|---------|
| **구체적** | "로그인이 작동하게 만들기" | "사용자가 이메일/비밀번호로 로그인할 수 있음" |
| **측정 가능** | "성능이 좋아야 함" | "API가 p95에서 200ms 이내로 응답함" |
| **원자적** | "모든 엣지 케이스 처리" | "누락된 필드에 대해 400 반환" |
| **검증 가능** | "코드가 깔끔함" | "ESLint 오류 또는 경고 없음" |

### 부정적 케이스 포함

작동해야 하는 것만 명세하지 말고 — 실패해야 하는 것도 명세하세요:

```markdown
## Completion Criteria

### Success Cases
- [ ] Valid credentials -> user logged in
- [ ] Remember me checked -> session persists 30 days

### Failure Cases
- [ ] Invalid password -> "Incorrect password" error
- [ ] Non-existent email -> "Account not found" error
- [ ] Empty fields -> validation errors shown
```

### 품질 게이트

품질 게이트는 AI 하네스가 기계적으로 강제하는 자동화된 검사입니다 — 에이전트는 모든 게이트가 통과될 때까지 **멈출 수 없습니다**. 품질 게이트는 Intent와 각 Unit의 YAML frontmatter에 정의되고, 상세화 중에 자동 감지되며, `quality-gate.sh` 훅을 통해 모든 Stop/SubagentStop 이벤트에서 강제됩니다.

```yaml
# intent.md or unit-*.md frontmatter
quality_gates:
  - name: tests
    command: bun test
  - name: typecheck
    command: tsc --noEmit
  - name: lint
    command: biome check
```

**주요 속성:**

- **하네스 강제** — 게이트가 하나라도 실패하면 에이전트는 기계적으로 중단이 차단됩니다. 이는 권고 사항이 아니라 구조적인 것입니다.
- **자동 감지** — 상세화 중에 발견 스킬이 저장소 도구(`package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml`)를 검사하고 확인을 위한 적절한 게이트를 제안합니다.
- **추가적 (래칫)** — 게이트는 추가적으로 병합됩니다: Unit 게이트는 Intent 게이트에 추가됩니다. 빌더는 게이트를 추가할 수 있지만 제거할 수 없습니다. 검토자는 게이트 무결성을 검증합니다.
- **빌딩에 한정** — 빌딩 hat(builder, implementer, refactorer)만 강제됩니다. Planner, reviewer, designer hat은 자동으로 강제를 건너뜁니다.


## 백프레셔

백프레셔는 품질 게이트가 비준수 작업을 단순히 표시하는 것이 아니라 **차단**해야 한다는 원칙입니다.

### 처방 vs. 백프레셔

**처방** (전통적): "먼저 인터페이스를 작성하고, 그 다음 구현하고, 그 다음 테스트를 작성하고, 그 다음 통합 테스트를..."

**백프레셔** (AI-DLC): "이 조건들이 충족되어야 합니다. 방법은 알아서 찾으세요."

### 동작 방식

AI에게 정확히 무엇을 해야 하는지 지시하는 대신, 제약 조건을 정의합니다:

- 모든 테스트가 통과해야 함
- 타입 검사가 성공해야 함
- 린팅이 깨끗해야 함
- 보안 스캔이 통과해야 함
- 커버리지가 임계값을 초과해야 함

AI는 모든 제약 조건이 충족될 때까지 반복합니다.

### 장점

- **AI를 완전히 활용** - AI가 인위적인 제약 없이 훈련을 적용함
- **더 간단한 프롬프트** - 성공 기준이 단계별 지침보다 작성하기 쉬움
- **측정 가능한 성공** - 프로그래밍 방식의 검증이 자율성을 가능하게 함
- **더 나은 반복** - 각 실패가 신호를 제공함

### 철학

> "예측 불가능하게 성공하는 것보다 예측 가능하게 실패하는 것이 낫다."

각 실패는 데이터입니다. 각 반복은 접근 방식을 정제합니다. 기술은 AI를 단계별로 지시하는 것에서 올바른 솔루션으로 수렴하는 기준과 테스트를 작성하는 것으로 전환됩니다.

## 운영 모드

AI-DLC는 작업의 성격에 따라 선택되는 세 가지 수준의 인간 개입을 구분합니다.

### HITL (Human-in-the-Loop)

인간이 AI가 진행하기 전에 각 중요한 단계를 검증합니다.

```
Human defines task
    ↓
AI proposes approach
    ↓
Human validates  ←──┐
    ↓               │
AI executes         │
    ↓               │
Human reviews ──────┘
```

**사용 시기:**
- 새로운 도메인 또는 최초 구현
- 장기적 결과를 가진 아키텍처 결정
- 고위험 작업 (프로덕션 데이터, 보안)
- 이후 작업의 기반이 되는 근본적인 결정

### OHOTL (Observed Human-on-the-Loop)

인간이 실시간으로 관찰하고 개입할 수 있지만 진행을 차단하지 않습니다.

```
Human defines criteria
    ↓
AI works ←──────────┐
    ↓               │
Human observes      │
    ↓               │
Redirect? ──Yes─────┘
    │
    No
    ↓
Criteria met? ──No──→ (continue)
    │
    Yes
    ↓
Human reviews output
```

**사용 시기:**
- 창의적이고 주관적인 작업 (UX, 디자인, 콘텐츠)
- 관찰이 가치를 가지는 훈련 시나리오
- 인식이 도움이 되는 중간 위험 변경
- 취향이 방향을 안내하는 반복적 정제

### AHOTL (Autonomous Human-on-the-Loop)

AI가 기준이 충족될 때까지 경계 내에서 자율적으로 운영됩니다.

```
Human defines criteria
    ↓
AI iterates autonomously ←──┐
    ↓                       │
Quality gates pass? ──No────┘
    │
    Yes
    ↓
Criteria met? ──No──────────┘
    │
    Yes
    ↓
Human reviews output
```

**사용 시기:**
- 명확한 인수 기준이 있는 잘 정의된 작업
- 프로그래밍 방식으로 검증 가능한 작업
- 배치 작업 (마이그레이션, 리팩터링)
- 패턴을 따르는 기계적 변환

### 비교

| 측면 | HITL | OHOTL | AHOTL |
|------|------|-------|-------|
| **인간 주의** | 지속적, 차단 | 지속적, 비차단 | 주기적, 온디맨드 |
| **승인 모델** | 각 단계 전 | 언제든지 (인터럽트) | 완료 시 |
| **AI 자율성** | 최소 | 중간 | 경계 내 완전 |
| **최적 용도** | 새롭고 고위험 | 창의적, 주관적 | 기계적, 검증 가능 |

### 구글 맵 비유

- **HITL**: 매 회전마다 GPS에 알려주고, GPS가 확인하고, 당신이 승인함
- **OHOTL**: GPS가 운전하는 동안 당신이 지켜보고, 언제든지 방향을 바꿀 수 있음
- **AHOTL**: 목적지를 설정하고, 허용 가능한 경로를 정의하고, 도착했을 때 확인함

## Bolt

**Bolt**는 단일 반복 사이클입니다 — 컨텍스트 리셋(`/clear`)으로 경계가 지어진 하나의 집중된 작업 세션입니다.

### "Bolt"라는 이름의 이유?

이 용어는 강렬한 집중과 고속 전달을 강조합니다. Bolt는 주 단위가 아닌 시간 단위로 측정됩니다.

### Bolt 사이클

1. 커밋된 아티팩트에서 컨텍스트 로드
2. hat 전환을 통해 작업 실행
3. 품질 게이트가 통과되거나 차단될 때까지 반복
4. 상태 저장 (아티팩트 커밋, 임시 상태 업데이트)
5. 필요한 경우 컨텍스트 초기화
6. 반복

### Bolt 경계

Bolt는 다음과 같은 경우에 자연스럽게 종료됩니다:
- 컨텍스트 창이 무거워질 때 (`/clear` 유도)
- Unit이 완료될 때
- 작업이 차단되어 인간 입력이 필요할 때
- 세션이 타임아웃될 때

## 상태 관리

AI-DLC는 두 계층 상태 모델을 사용합니다:

### 커밋된 아티팩트 (`.ai-dlc/`)

세션, 브랜치, 팀원 전반에 걸쳐 지속됩니다:

| 파일 | 목적 |
|------|------|
| `intent.md` | 무엇을 만드는지, 전체 기준 |
| `unit-*.md` | 기준이 있는 개별 Unit |

### 임시 상태 (`han keep`)

세션 범위, `/ai-dlc:reset` 시 초기화됩니다:

| 키 | 목적 |
|----|------|
| `iteration.json` | 현재 hat, 반복 횟수, 상태 |
| `scratchpad.md` | 학습 내용 및 진행 메모 |
| `blockers.md` | 문서화된 차단 요소 |

### 컨텍스트 손실로부터 복구

stop 훅 없이 `/clear`를 실행한 경우:

1. 커밋된 아티팩트(`.ai-dlc/`)는 안전합니다
2. 임시 상태는 `han keep`에 지속됩니다
3. `/ai-dlc:execute`를 실행하여 계속합니다

## Pass를 통한 반복

AI-DLC는 반복을 제품 개발의 자연스러운 상태로 취급합니다. 동일한 상태 → 작업 → 피드백 → 학습 → 조정 패턴이 모든 수준에 적용됩니다:

```
Product → Intent → Pass → Unit → Bolt
```

각 수준은 동일한 루프를 포함합니다. Pass는 교차 기능적 반복을 임시방편이 아닌 명시적으로 만듭니다.

### Pass 사용 시기

- **단일 Pass (기본값):** 대부분의 개발 작업. Pass를 완전히 건너뜁니다 -- 그냥 상세화하고 구성하세요.
- **다중 Pass:** Intent가 개발 작업 전(또는 후)에 디자인 탐색, 프로덕트 명세, 또는 기타 분야별 반복이 필요할 때.

### 역방향 흐름

Pass 간의 역방향 화살표는 실패가 아닌 예상된 것입니다:

```
Design Pass → Product Pass → Dev Pass
     ↑              ↑             │
     │              └─ constraint ─┘
     └──── design gap ─┘
```

개발에서 프로덕트 명세를 변경하는 기술적 제약을 발견하면, Intent는 product Pass로 돌아갑니다. 프로덕트에서 디자인 공백을 발견하면 design Pass로 돌아갑니다. 이것은 정상적인 반복입니다.

Pass에 대한 완전한 이론적 설명은 논문의 [Iteration Through Passes](https://ai-dlc.dev/papers/ai-dlc-2026/#iteration-through-passes) 섹션을 참조하세요.

## 디자인 프로바이더

AI-DLC는 워크플로우를 외부 디자인 도구에 연결하는 여섯 가지 디자인 프로바이더를 지원합니다: **Canva**, **Figma**, **OpenPencil**, **Pencil**, **Penpot**, **Excalidraw**. 프로바이더는 사용 가능한 MCP 도구에서 자동으로 감지되거나 `.ai-dlc/settings.yml`에서 명시적으로 구성됩니다.

각 프로바이더는 서로 다른 기능을 가집니다 — 일부는 컴포넌트와 프로토타이핑을 지원하고(Figma, Penpot), 다른 것들은 AI 기반 디자인 생성을 제공하며(Canva, OpenPencil, Pencil), 모두 디자인 읽기, 쓰기, 내보내기를 지원합니다. 상세화 중에 디자인 프로바이더는 관련 목업과 컴포넌트 명세를 가져옵니다. 실행 중에 빌더는 디자인 명세를 참조하고 검토자는 구현을 교차 확인합니다.

디자인 참조는 Unit frontmatter에 저장된 프로바이더별 URI 체계(예: `figma://file-key#node=1:42`)를 사용하여 실행 중 자동 해석을 가능하게 합니다.

각 프로바이더의 설정 지침, 기능 세부 정보 및 구성은 [디자인 프로바이더 가이드](/docs/guide-design-providers/)를 참조하세요.

## 운영 단계

구성 및 통합이 완료된 후, 많은 기능은 지속적인 유지 관리가 필요합니다 — 예약된 작업, 프로덕션 이벤트에 대한 반응적 응답, 또는 주기적인 인간 검토. 운영 단계는 `/ai-dlc:operate`를 사용하여 이러한 작업을 정의하고 관리하는 구조화된 방법을 제공합니다. 운영은 코드와 함께 명세 파일로 정의되고 AI-DLC의 나머지 부분과 동일한 상태 시스템을 통해 추적됩니다.

전체 안내는 [운영 가이드](/docs/operations-guide/)를 참조하세요.

## 다음 단계

- **[워크플로우](/docs/workflows/)** - 네 가지 명명된 워크플로우 학습
- **[Hats](/docs/hats/)** - 각 hat의 책임 이해
- **[예제: 기능 구현](/docs/example-feature/)** - 개념이 실제로 적용되는 모습 확인
- **[운영 가이드](/docs/operations-guide/)** - 지속적인 운영 작업 관리
