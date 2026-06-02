---
title: 워크플로우
description: AI-DLC의 명명된 워크플로우 패턴 - Default, Adversarial, Design, Hypothesis, TDD 및 커스텀 워크플로우
order: 6
---

AI-DLC는 다섯 가지 내장 워크플로우를 제공하며, 각각 서로 다른 작업 유형에 최적화되어 있습니다. 작업에 맞는 워크플로우를 선택하거나 직접 정의할 수 있습니다.

## 워크플로우란?

워크플로우는 hats의 명명된 시퀀스입니다. 각 워크플로우는 다음을 정의합니다:
- 사용되는 hats
- 전환 순서

워크플로우는 `/ai-dlc:elaborate` 실행 중에 선택되며, 프로젝트별로 커스터마이징할 수 있습니다. Intent 내의 개별 Unit도 Intent 수준의 워크플로우를 재정의할 수 있습니다.

> **운영 모드에 대한 참고 사항:** 아래에 나열된 HITL(Human-in-the-Loop)과 OHOTL(Over-the-Horizon) 모드는 각 hat과 상호작용하는 방식에 대한 권장 사항입니다. 플러그인은 hat별로 특정 모드를 강제하지 않으며, 적용할 감독 수준은 사용자가 선택합니다.

## Default 워크플로우

대부분의 기능 작업을 위한 표준 개발 워크플로우입니다.

### Hats

Planner → Builder → Reviewer

| Hat | 권장 모드 | 역할 |
|-----|-----------|------|
| Planner | HITL | Unit에 대한 전술적 계획 수립 |
| Builder | OHOTL | 계획에 따라 구현 |
| Reviewer | HITL | 구현이 기준을 충족하는지 검증 |

### 흐름

```
/ai-dlc:elaborate
    ↓
Intent, 기준, Unit, 워크플로우 정의
    ↓
/ai-dlc:execute
    ↓
Planner (HITL): 구현 방법 계획
    ↓
Builder (OHOTL): 구현
    ↓
Reviewer (HITL): 완료 여부 검증
    ↓
다음 Unit 또는 Intent 완료
```

> **Elaborator는 어디에 있나요?** Elaboration은 실행 워크플로우의 hat이 아닙니다. `/ai-dlc:elaborate` 명령을 통해 실행이 시작되기 전에 수행됩니다. `/ai-dlc:execute`가 실행될 때는 Intent와 Unit이 이미 정의된 상태입니다.

### 사용 시기

- 표준 기능 개발
- 일반적인 개선 작업
- 대부분의 CRUD 작업
- 통합 작업

### 예시

**Intent:** 사용자 프로필 편집 기능 추가

```
/ai-dlc:elaborate: "사용자가 어떤 필드를 편집해야 하나요?"
You: "이름, 이메일, 아바타 이미지"
(Intent와 Unit이 이제 정의됨)

/ai-dlc:execute 시작:

Planner: "/api/profile 엔드포인트, ProfileForm
컴포넌트, 크기 유효성 검사가 포함된 이미지 업로드를 추가하겠습니다."

Builder: [계획 구현]

Reviewer: "모든 기준 충족. 사용자가 이름, 이메일을 편집하고
아바타를 업로드할 수 있습니다. 테스트 통과. 검토 준비 완료."
```

## Adversarial 워크플로우

Red/Blue 팀 단계를 포함한 보안 중심 개발 워크플로우입니다.

### Hats

Planner → Builder → Red Team → Blue Team → Reviewer

| Hat | 권장 모드 | 역할 |
|-----|-----------|------|
| Planner | HITL | 보안을 고려한 기능 계획 |
| Builder | OHOTL | 명세에 따라 구현 |
| Red Team | OHOTL | 공격 - 취약점 탐색 |
| Blue Team | OHOTL | 방어 - 취약점 수정 |
| Reviewer | HITL | 최종 보안 검토 |

### 흐름

```
/ai-dlc:elaborate (adversarial 워크플로우 선택)
    ↓
/ai-dlc:execute
    ↓
Planner (HITL): 기능 계획
    ↓
Builder (OHOTL): 기능 구현
    ↓
Red Team (OHOTL): 취약점 시도
    ↓
Blue Team (OHOTL): 발견된 문제 수정
    ↓
Reviewer (HITL): 최종 보안 검증
    ↓
안전한가? → 완료
```

### 사용 시기

- 인증/인가 기능
- 결제 처리
- 개인정보 보호가 필요한 데이터 처리
- 공개 API 엔드포인트
- 민감한 데이터를 다루는 기능

### 예시

**Intent:** API 키 관리 기능 추가

```
Planner: "계획: crypto-random 바이트로 키 생성,
해시 저장, 상수 시간 비교로 유효성 검사,
유효성 검사 엔드포인트에 속도 제한 적용."

Builder: "API 키 생성, 저장, 유효성 검사
엔드포인트 구현 완료."

Red Team: "문제 발견:
1. 키가 평문으로 저장됨 (해시 처리 필요)
2. 키 유효성 검사에 속도 제한 없음
3. 키 비교에서 타이밍 공격 가능"

Blue Team: "모든 문제 수정:
1. 키 해시에 bcrypt 사용
2. 속도 제한 추가 (100회/분)
3. 상수 시간 비교 사용"

Reviewer: "수정 사항 검증 완료. 보안 스캔 통과.
프로덕션 배포 승인."
```

### 철학

Adversarial 워크플로우는 모든 기능이 잠재적인 공격 표면이라고 가정합니다. 공격자와 방어자의 관점을 번갈아 취함으로써 더 안전한 소프트웨어를 구축할 수 있습니다.

## Design 워크플로우

구현 전에 디자인 산출물을 생성하는 UI/UX 중심 워크플로우입니다.

### Hats

Planner → Designer → Reviewer

| Hat | 권장 모드 | 역할 |
|-----|-----------|------|
| Planner | HITL | 디자인 문제와 제약 조건 정의 |
| Designer | HITL | 시각적 디자인, UI 목업, UX 흐름 생성 |
| Reviewer | HITL | 디자인이 요구사항을 충족하고 구현 가능한지 검증 |

### 흐름

```
/ai-dlc:elaborate (design 워크플로우 선택)
    ↓
/ai-dlc:execute
    ↓
Planner (HITL): 디자인 대상 정의
    ↓
Designer (HITL): 옵션 탐색, 사용자와 함께 개선, 명세 작성
    ↓
Reviewer (HITL): 디자인이 완전하고 구현 가능한지 검증
    ↓
구현을 위한 디자인 명세 준비 완료
```

### 사용 시기

- 새로운 UI 컴포넌트 또는 페이지
- UX 재설계
- 디자인 시스템 추가
- 코드 작성 전에 시각적 완성도가 중요한 경우
- 실행 코드가 아닌 디자인 명세를 산출물로 하는 Unit

### 예시

**Intent:** 프로젝트 분석 대시보드 디자인

```
Planner: "표시할 항목: 빌드 성공률,
배포 빈도, 평균 복구 시간.
대상 사용자: 엔지니어링 매니저. 모바일 지원 필수."

Designer: "옵션 A: 스파크라인이 있는 카드 그리드.
옵션 B: 단일 스크롤 타임라인.
옵션 C: 지표 카테고리별 탭 섹션.
데스크톱에서의 가독성과 모바일에서의 자연스러운
스택 배치를 위해 옵션 A를 권장합니다."

Reviewer: "디자인 명세 완성: 간격, 색상은
디자인 토큰 참조, 반응형 브레이크포인트 정의,
접근성 명암비 충족. 구현 준비 완료."
```

### 디자인 프로바이더

Design 워크플로우는 AI-DLC의 [디자인 프로바이더](/docs/guide-design-providers/) — Canva, Figma, OpenPencil, Pencil, Penpot, Excalidraw와 통합됩니다. 디자인 프로바이더가 구성된 경우, designer hat은 기존 디자인과 컴포넌트 명세를 자동으로 가져오고, 이후 구현 워크플로우에서 사용할 수 있도록 디자인 참조(예: `figma://file-key#node=1:42`)를 Unit 프론트매터에 저장합니다.

### 철학

Design 워크플로우는 디자인 결정과 구현을 분리합니다. 이는 Intent에 코드 작성 전에 디자인 탐색이 필요한 Unit이 포함된 경우에 유용합니다. 동일한 Intent 내의 구현 Unit에는 Unit별 워크플로우를 사용하여 Default 워크플로우와 함께 활용하세요.

## Hypothesis 워크플로우

복잡한 버그를 조사하기 위한 과학적 디버깅 워크플로우입니다.

### Hats

Observer → Hypothesizer → Experimenter → Analyst

| Hat | 권장 모드 | 역할 |
|-----|-----------|------|
| Observer | OHOTL | 버그에 대한 데이터 수집 |
| Hypothesizer | HITL | 원인에 대한 가설 수립 |
| Experimenter | OHOTL | 체계적으로 가설 검증 |
| Analyst | HITL | 결과 평가 및 수정 구현 |

### 흐름

```
/ai-dlc:elaborate (hypothesis 워크플로우 선택)
    ↓
/ai-dlc:execute
    ↓
Observer (OHOTL): 증상, 로그, 트레이스 수집
    ↓
Hypothesizer (HITL): 우선순위가 있는 가설 수립
    ↓
Experimenter (OHOTL): 각 가설 검증
    ↓
Analyst (HITL): 결과 해석, 수정 구현
    ↓
버그 수정됨? → 완료
```

### 사용 시기

- 간헐적/불안정한 버그
- 원인을 알 수 없는 성능 문제
- 프로덕션 인시던트
- "발생해서는 안 되는" 버그
- 복잡한 시스템 상호작용

### 예시

**Intent:** 결제 시 간헐적으로 발생하는 500 오류 수정

```
Observer: "데이터 수집:
- 오류는 요청의 약 2%에서 발생
- 피크 시간대에 더 빈번함
- 스택 트레이스에서 DB 타임아웃 확인
- 특정 사용자와의 상관관계 없음"

Hypothesizer: "우선순위별 가설:
1. 부하 시 커넥션 풀 고갈
2. 커넥션을 차단하는 느린 쿼리
3. 데이터베이스 리소스 경합
4. 네트워크 지연 급증"

Experimenter: "가설 #1 검증:
- 커넥션 풀 메트릭 추가
- 발견: 25개 커넥션에서 풀 고갈
- 피크 시 약 40개 커넥션 필요"

Analyst: "근본 원인 확인. 수정 사항:
- 풀 크기를 50으로 증가
- 커넥션 타임아웃 처리 추가
- 24시간 동안 모니터링 결과 오류율 0%"
```

### 철학

> "추측하지 말고 조사하라."

Hypothesis 워크플로우는 버그를 수정하기 위해 무작위로 변경을 시도하는 "산탄총 디버깅"을 방지합니다. 모든 변경은 특정 가설을 검증하는 통제된 실험입니다.

## TDD 워크플로우

테스트 주도 개발: Red-Green-Refactor 패턴.

### Hats

Test Writer → Implementer → Refactorer → Reviewer

| Hat | 권장 모드 | 역할 |
|-----|-----------|------|
| Test Writer | OHOTL | 먼저 실패하는 테스트 작성 |
| Implementer | OHOTL | 최소한의 코드로 테스트 통과 |
| Refactorer | OHOTL | 테스트를 통과한 상태로 코드 개선 |
| Reviewer | HITL | 테스트의 의미와 코드 품질 검증 |

### 흐름

```
/ai-dlc:elaborate (tdd 워크플로우 선택)
    ↓
/ai-dlc:execute
    ↓
Test Writer (OHOTL): 실패하는 테스트 작성
    ↓
Implementer (OHOTL): 테스트 통과
    ↓
Refactorer (OHOTL): 코드 정리
    ↓
Reviewer (HITL): 테스트 및 코드 품질 검증
    ↓
모든 테스트 통과? → 다음 Unit
```

### 사용 시기

- 명확하게 명세된 동작 (API 계약, 비즈니스 규칙)
- 버그 수정 (재현 테스트 작성 후 수정)
- 안전망을 갖춘 리팩토링
- 테스트를 살아있는 문서로 활용하고 싶을 때

### 예시

**Intent:** 결제 계산 버그 수정

```
Test Writer: "버그를 재현하는 테스트 작성:
  test('세금 이후가 아닌 이전에 할인 적용')"

Implementer: "예상대로 테스트 실패. applyDiscount()의
계산 순서 수정 중... 테스트 통과."

Refactorer: "명확성을 위해 할인 로직을 별도
함수로 추출. 모든 테스트 여전히 통과."

Reviewer: "테스트가 엣지 케이스를 커버함. 구현
코드 깔끔함. 승인."
```

### 철학

> "원했던 테스트를 작성하라."

Test Writer는 단순히 테스트를 작성하는 것이 아니라, 처음부터 버그를 잡거나 기능을 검증했을 테스트를 작성합니다.

## 워크플로우 선택 가이드

| 작업 유형 | 워크플로우 | 이유 |
|-----------|-----------|------|
| 새로운 기능 | Default | 균형 잡힌 계획-구현-검토 사이클 |
| UI/UX 작업 | Design | 구현 전 디자인 탐색 |
| 버그 수정 (원인 파악됨) | TDD | 테스트로 버그 재현 및 수정 검증 |
| 버그 수정 (원인 불명) | Hypothesis | 체계적인 조사 |
| 보안 민감 기능 | Adversarial | 내장된 보안 검증 |
| 성능 작업 | Hypothesis | 데이터 기반 최적화 |
| 리팩토링 | TDD | 테스트가 안전망 역할 |

## Pass와 워크플로우 제약

Intent가 [Pass](/docs/concepts/#pass)를 사용하는 경우, 각 Pass는 사용 가능한 워크플로우를 제한합니다. Unit이 활성 Pass에서 지원하지 않는 워크플로우를 요청하면, Pass의 기본 워크플로우가 대신 사용됩니다.

| Pass | 사용 가능한 워크플로우 | 기본값 |
|------|----------------------|--------|
| `design` | `design` | `design` |
| `product` | `default`, `bdd` | `default` |
| `dev` | `default`, `tdd`, `adversarial`, `bdd` | `default` |

예를 들어, design Pass 중에 `tdd`를 요청하면 자동으로 `design` 워크플로우로 폴백됩니다. 이를 통해 적절한 시점에 올바른 방법론이 적용됩니다.

Pass가 구성되지 않은 경우(기본값), 모든 워크플로우를 제한 없이 사용할 수 있습니다.

## Unit별 워크플로우

단일 Intent 내의 서로 다른 Unit은 각각 다른 워크플로우를 사용할 수 있습니다. 이는 Intent가 UI 디자인과 백엔드 로직처럼 여러 관심사에 걸쳐 있을 때 유용합니다.

Unit별 워크플로우를 설정하려면 Unit의 프론트매터에 `workflow:` 필드를 추가하세요:

```markdown
---
title: Dashboard UI
status: pending
workflow: design
---

분석 대시보드 레이아웃 디자인...
```

```markdown
---
title: Analytics API
status: pending
workflow: default
---

분석 데이터를 위한 API 엔드포인트 구축...
```

`/ai-dlc:execute`가 각 Unit을 처리할 때, Unit의 워크플로우를 독립적으로 결정합니다:
1. Unit에 `workflow:` 필드가 있으면 해당 워크플로우를 사용
2. 없으면 Intent 수준의 워크플로우가 적용

즉, 단일 Intent 내에서 일부 Unit은 Planner → Designer → Reviewer를 거치고, 다른 Unit은 Planner → Builder → Reviewer를 거치며, 각각 자신의 hat 시퀀스에 따라 진행될 수 있습니다.

## 운영 및 회고

운영과 회고는 워크플로우 선택 사항이 아니라, 구축이 완료된 후 실행되는 별도의 라이프사이클 단계입니다. `/ai-dlc:operate`를 사용하여 운영 단계에 진입하고, `/ai-dlc:reflect`를 사용하여 회고 단계에 진입합니다. 이 단계들은 자체적인 hat 시퀀스를 가지며, 실행 중에 사용된 워크플로우와 독립적으로 호출됩니다. 운영 작업의 정의 및 관리에 대한 자세한 내용은 [운영 가이드](/docs/operations-guide/)를 참조하세요.

## 커스텀 워크플로우

`.ai-dlc/workflows.yml`에 프로젝트별 워크플로우를 생성할 수 있습니다. 프로젝트 워크플로우는 내장 워크플로우와 병합되며, 이름이 충돌하는 경우 프로젝트 정의가 우선합니다.

```yaml
research-first:
  description: Research before building
  hats: [researcher, planner, builder, reviewer]

quick-fix:
  description: Minimal overhead for trivial changes
  hats: [builder, reviewer]
```

플러그인의 `hats/` 디렉토리에 정의된 모든 hat을 커스텀 워크플로우에서 참조할 수 있습니다. 전체 목록은 [Hats](/docs/hats/) 페이지를 참조하세요.

## 다음 단계

- **[Hats](/docs/hats/)** - 각 hat에 대한 상세 참조
- **[예시: 기능 구현](/docs/example-feature/)** - Default 워크플로우 실전 적용
- **[예시: 버그 수정](/docs/example-bugfix/)** - Hypothesis 워크플로우 실전 적용
