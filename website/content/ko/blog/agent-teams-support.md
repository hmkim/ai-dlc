---
title: "AI-DLC, 에이전트 팀을 만나다"
description: "AI-DLC의 구성 루프가 이제 Claude Code의 Agent Teams를 활용합니다. 각 작업 단위가 고유한 컨텍스트, 워크트리, 권한 모델을 갖춘 독립적인 팀원으로 동작합니다."
date: 2026-02-05
author: The Bushido Collective
---

Claude Code가 최근 [Agent Teams](https://code.claude.com/docs/en/agent-teams)를 출시했습니다. 여러 독립적인 Claude Code 인스턴스가 함께 협력하도록 조율하는 실험적 기능입니다. 각 팀원은 자체 컨텍스트 윈도우를 가지며, 다른 팀원에게 직접 메시지를 보낼 수 있고, 자율 조정을 위한 공유 작업 목록을 활용합니다.

AI-DLC는 이제 이를 네이티브로 지원합니다.

## Agent Teams가 AI-DLC에 중요한 이유

AI-DLC의 구성 루프는 이미 작업을 **unit** 단위로 분리합니다. 명확한 완료 기준을 가진 집중된 작업 조각으로, 각각 고유한 브랜치 위의 독립된 git 워크트리에서 실행됩니다. 기존에는 이 unit들이 서브에이전트로 실행되었습니다. 즉, 부모 세션 내에서 실행되며 결과를 호출자에게만 보고할 수 있는 제한된 작업자였습니다.

Agent Teams는 판도를 바꿉니다. 서브에이전트 대신, 각 unit이 이제 **완전히 독립적인 Claude Code 세션**으로 실행될 수 있습니다. 그 차이는 다음과 같습니다:

| | 서브에이전트 | Agent Teams |
|---|---|---|
| **컨텍스트** | 부모의 컨텍스트 예산 공유 | 독립적인 전체 컨텍스트 윈도우 |
| **통신** | 호출자에게만 결과 보고 | 모든 팀원에게 직접 메시지 전송 |
| **조정** | 부모가 모든 것을 관리 | 공유 작업 목록, 자율 조정 |
| **격리** | 부모 세션 내에서 실행 | 완전히 독립적인 세션 |

AI-DLC 관점에서 이는, 백엔드를 담당하는 빌더 팀원이 아키텍처 결정 사항에 대해 리뷰어 팀원에게 직접 메시지를 보낼 수 있음을 의미합니다. 테스트 작성자는 플래너에게 인수 기준에 대한 설명을 요청할 수 있습니다. 팀원들은 관리자에게 보고하는 단순한 작업자가 아니라, 실제 팀처럼 협력합니다.

## 동작 방식

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`가 활성화되면, `/ai-dlc:execute` 루프는 팀으로 동작합니다:

1. **리드 세션**이 unit들의 DAG와 의존성을 읽습니다
2. 준비된 각 unit에 대해, 리드가 해당 unit의 git 워크트리에 **팀원을 생성**합니다
3. 팀원들은 독립적으로 작업하며, 현재 hat의 역할(계획, 빌드, 리뷰)을 수행합니다
4. 팀원들은 공유 메일박스를 통해 **발견 사항을 공유**합니다
5. unit의 기준이 충족되면, 팀원이 완료로 표시하고 리드가 워크플로를 진행합니다

각 팀원은 훅 주입을 통해 AI-DLC 컨텍스트를 자동으로 수신합니다. 현재 hat 지침, Intent, 완료 기준, 워크플로 상태가 포함됩니다. 팀원들은 일반적인 Claude Code 세션과 동일하게 전체 프로젝트 컨텍스트(CLAUDE.md, MCP 서버, 스킬)를 갖추고 시작합니다.

## Intent 전체를 위한 단일 모드

Agent Teams가 AI-DLC와 깔끔하게 동작하도록, 운영 모드를 개별 hat에서 **Intent 수준**으로 이동했습니다.

기존에는 각 hat이 자체 모드를 가졌습니다. 빌더는 기본적으로 OHOTL, 리뷰어는 HITL이었습니다. 이로 인해 자율성 결정이 hat 정의 전반에 분산되어, 팀원들에게 일관된 권한 모델을 부여하는 것이 불가능했습니다.

이제 `/ai-dlc:elaborate` 실행 시 모드를 한 번만 선택합니다. 이 단일 결정이 구성 과정에서 생성되는 모든 팀원의 권한 모델을 제어합니다:

| AI-DLC 모드 | Agent Teams 모드 | 동작 방식 |
|---|---|---|
| **HITL** | `plan` | 팀원이 계획을 수립하고, 리드가 구현 전에 승인 |
| **OHOTL** | `acceptEdits` | 팀원이 자율적으로 작업하며, 리드가 개입 가능 |
| **AHOTL** | `bypassPermissions` | 완전 자율, 완료 기준과 백프레셔에 의해서만 제한 |

모드는 Intent 파일에 저장되며 전체 워크플로에 상속됩니다:

```yaml
# .ai-dlc/my-feature/intent.md
---
workflow: default
mode: OHOTL
created: 2026-02-05
status: active
---
```

일상적인 리팩터링을 수행하는 시니어 엔지니어는 AHOTL을 선택할 수 있습니다. 팀원들이 완전한 자율성으로 실행되고, 백프레셔 훅(린팅, 테스트, 타입 검사)이 자동으로 품질을 보장합니다. 낯선 영역을 탐색하는 팀은 HITL을 선택할 수 있습니다. 모든 팀원이 구현 전에 리드가 검토하는 계획을 제출합니다.

얼마나 많은 감독을 원하는지는 사람이 결정합니다. 모드는 작업자가 아닌 작업의 속성입니다.

## 동적 Hat 탐색

워크플로를 더욱 조합 가능하게 만들었습니다. 이제 모든 hat이 프론트매터에 `description`을 포함합니다:

```yaml
---
name: "🔨 Builder"
description: Implements code to satisfy completion criteria using backpressure as feedback
---
```

`/ai-dlc:elaborate` 실행 시, 시스템은 하드코딩된 테이블을 참조하는 대신 모든 hat 파일을 읽어 동적으로 사용 가능한 hat을 탐색합니다. 적절한 프론트매터를 갖춘 새 hat 파일을 `hats/` 디렉터리에 추가하면 즉시 워크플로에서 사용할 수 있습니다.

내장된 13개의 hat이 이제 모두 자신을 설명합니다:

| Hat | 역할 |
|---|---|
| Observer | 체계적인 관찰을 통해 버그 관련 데이터 수집 |
| Hypothesizer | 버그 원인에 대한 검증 가능한 이론 수립 |
| Experimenter | 통제된 실험을 통해 가설 검증 |
| Analyst | 결과를 평가하고 확인된 수정 사항 구현 |
| Planner | 다음 Bolt를 위한 전술적 실행 계획 수립 |
| Builder | 백프레셔를 피드백으로 활용하여 코드 구현 |
| Reviewer | 구현이 완료 기준을 충족하는지 검증 |
| Test Writer | 예상 동작을 정의하는 실패 테스트 작성 (RED) |
| Implementer | 테스트를 통과하는 최소한의 코드 작성 (GREEN) |
| Refactorer | 테스트를 통과한 상태를 유지하며 코드 품질 개선 (REFACTOR) |
| Designer | 시각적 디자인, UI 목업, UX 플로우 작성 |
| Red Team | 보안 테스트를 통해 구현의 취약점 탐색 |
| Blue Team | Red Team이 발견한 취약점 수정 |

커스텀 워크플로는 슬러그로 hat을 참조하며, 시스템이 런타임에 이를 해석합니다:

```yaml
# .ai-dlc/workflows.yml
adversarial:
  description: Security-focused build with attack/defend cycles
  hats: [planner, builder, red-team, blue-team, reviewer]
```

## 상세화 플로우

`/ai-dlc:elaborate` 명령은 이제 전체 구성 루프를 형성하는 세 가지 질문을 합니다:

1. **무엇을 만드나요?** Intent와 완료 기준을 정의합니다
2. **어떤 워크플로가 적합한가요?** 동적으로 탐색된 워크플로와 hat 중에서 선택합니다
3. **얼마나 많은 자율성을 원하나요?** 전체 Intent에 대해 HITL, OHOTL, 또는 AHOTL을 선택합니다

이 결정들은 한 번 수집되어 Intent 파일에 저장되고, 구성 전반에 걸쳐 모든 팀원에게 상속됩니다. hat별 설정도 없고, 모드 불일치도 없습니다. 팀이 어떻게 운영될지를 정의하는 단 한 번의 대화입니다.

## 시작하기

Claude Code 설정에서 Agent Teams를 활성화하세요:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

AI-DLC 플러그인을 설치하거나 업데이트하세요:

```
/plugin marketplace add thebushidocollective/ai-dlc
/plugin install ai-dlc@thebushidocollective-ai-dlc --scope project
```

그런 다음 `/ai-dlc:elaborate`를 실행하여 모드가 포함된 Intent를 정의하고, `/ai-dlc:execute`로 팀을 시작하세요.

변경 사항은 하위 호환성을 유지합니다. Agent Teams가 활성화되지 않은 경우, 구성 루프는 기존과 동일하게 서브에이전트를 사용합니다. `mode` 필드가 없는 기존 Intent는 기본적으로 OHOTL로 동작합니다.

---

*Unit은 팀원이 됩니다. Hat은 역할이 됩니다. Intent는 팀의 헌장이 됩니다.*
