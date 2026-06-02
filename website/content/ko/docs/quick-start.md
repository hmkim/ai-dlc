---
title: 빠른 시작
description: 5분 안에 AI-DLC 시작하기
order: 2
---

AI-DLC를 프로젝트에 설치하고 첫 번째 기능을 완성해 보세요. AI-DLC는 [H•AI•K•U Method](https://haikumethod.ai) (Human AI Knowledge Unification)의 소프트웨어 개발 프로파일입니다.

## 설치

**옵션 1: Claude Code 사용 (권장)**
```
/plugin marketplace add thebushidocollective/ai-dlc
/plugin install ai-dlc@thebushidocollective-ai-dlc --scope project
```

**옵션 2: Han 사용**
```bash
npx han plugin install thebushidocollective/ai-dlc --scope project
```

## 꼭 알아야 할 두 가지 명령어

AI-DLC는 두 가지 주요 명령어만 사용합니다:

| 명령어 | 기능 |
|---------|--------------|
| `/ai-dlc:elaborate` | 무엇을 만들지, 완료 기준은 무엇인지 정의합니다 |
| `/ai-dlc:execute` | 자율 실행 루프를 시작합니다 |

## 첫 번째 기능 만들기

### 1단계: Elaborate

```
/ai-dlc:elaborate
```

AI가 다음 항목들을 안내합니다:
1. **무엇을** 만들 것인지
2. **완료 기준** - 작업이 끝났음을 어떻게 알 수 있는지
3. **Units** - 복잡한 기능의 경우 작업을 어떻게 분할할지

예시 세션:
```
User: /ai-dlc:elaborate
AI: What do you want to build?
User: Add user authentication with email/password
AI: [Asks clarifying questions via interactive prompts]
AI: Here are the success criteria I captured...
AI: Elaboration complete! Run /ai-dlc:execute to start.
```

### 2단계: Execute

```
/ai-dlc:execute
```

AI가 자율적으로 작업을 수행합니다:
- 기능 브랜치 생성
- 구현 계획 수립
- 완료 기준에 맞게 구현
- 자체 코드 리뷰
- 모든 기준이 충족될 때까지 계속 진행

작업 과정을 지켜보거나, 필요할 때 개입하거나, 그냥 실행되도록 둘 수 있습니다.

### 3단계: 컨텍스트 초기화 후 이어서 진행하기

세션이 길어지면 AI가 컨텍스트 초기화를 제안합니다:
```
AI: "Context getting full. Run /clear to continue."
User: /clear
User: /ai-dlc:execute
```

진행 상황은 보존되며, AI는 중단된 지점부터 작업을 재개합니다.

## 기타 명령어

| 명령어 | 용도 |
|---------|---------|
| `/ai-dlc:review` | 배포 전 코드 리뷰 — 외부 CI/봇 실행 전에 문제를 미리 발견합니다 |
| `/ai-dlc:resume [slug]` | 중단된 Intent를 재개합니다 |
| `/ai-dlc:reset` | 현재 작업을 폐기하고 새로 시작합니다 |
| `/methodology [question]` | AI-DLC에 대해 질문합니다 |

## 예시: 전체 워크플로우

```
User: /ai-dlc:elaborate
AI: What do you want to build?
User: Add a dark mode toggle to the settings page
AI: [Guides through requirements and criteria]
AI: Elaboration complete!

User: /ai-dlc:execute
AI: [Works autonomously through planner → builder → reviewer]
AI: Intent complete! All criteria satisfied.

User: Great, let's create a PR
AI: [Creates PR with summary of changes]
```

## 구현 완료 후

Intent가 완료되면 `/ai-dlc:operate`를 사용해 지속적인 운영 작업을 관리하세요. `.ai-dlc/{intent}/operations/` 경로에 스펙 파일로 예약 작업, 반응형 핸들러, 사람 검토 프로세스를 정의할 수 있습니다. 자세한 내용은 [운영 가이드](/docs/operations-guide/)를 참고하세요.

## 다음 단계

- [Elaboration 가이드](/docs/elaboration/) - `/ai-dlc:elaborate` 진행 과정 안내
- [핵심 개념](/docs/concepts/) - Intent, Unit, hats 이해하기
- [워크플로우](/docs/workflows/) - TDD, 적대적 검증, 가설 검증 워크플로우 알아보기
- [설치](/docs/installation/) - Han CLI를 포함한 상세 설치 방법
- [운영 가이드](/docs/operations-guide/) - 지속적인 운영 작업 관리
