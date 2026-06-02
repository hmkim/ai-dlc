---
title: 설치
description: Claude Code 프로젝트에 AI-DLC 설치하기
order: 2
---

AI-DLC는 Claude Code 플러그인으로 배포됩니다. 이 가이드에서는 설치 방법과 사전 요구 사항을 다룹니다.

## 사전 요구 사항

### Claude Code

AI-DLC를 사용하려면 Anthropic의 AI 기반 개발 환경인 [Claude Code](https://claude.ai/code)가 필요합니다. Claude Code가 설치되어 있고 올바르게 구성되어 있는지 확인하세요.

### Han CLI (권장)

AI-DLC는 상태 관리(`han keep` 명령어)에 [Han CLI](https://han.guru)를 사용합니다. 플러그인은 Han 없이도 동작하지만, Han을 설치하면 더 나은 경험을 얻을 수 있습니다.

**curl을 통한 Han 설치 (권장):**

```bash
curl -fsSL https://han.guru/install.sh | bash
```

**또는 Homebrew를 통한 설치:**

```bash
brew install thebushidocollective/tap/han
```

**설치 확인:**

```bash
han --version
```

## 설치 방법

### 방법 1: Claude Code를 통한 설치 (권장)

Claude Code 세션 내에서 직접 설치합니다:

```
/plugin marketplace add thebushidocollective/ai-dlc
/plugin install ai-dlc@thebushidocollective-ai-dlc --scope project
```

### 방법 2: Han을 통한 설치

Han이 설치되어 있다면 플러그인 매니저를 사용하세요 (반드시 npx, 프로젝트 범위로 설치해야 합니다):

```bash
npx han plugin install thebushidocollective/ai-dlc --scope project
```

### 방법 3: 수동 구성

Claude Code 설정 파일에 플러그인을 직접 추가합니다.

**사용자 수준 설치** (`~/.claude/settings.json`):

```json
{
  "plugins": [
    "github:thebushidocollective/ai-dlc"
  ]
}
```

**프로젝트 수준 설치** (프로젝트 내 `.claude/settings.json`):

```json
{
  "plugins": [
    "github:thebushidocollective/ai-dlc"
  ]
}
```

## 설치 확인

설치 후 플러그인이 정상적으로 동작하는지 확인합니다:

1. 프로젝트에서 새 Claude Code 세션을 시작합니다
2. `/ai-dlc:elaborate`를 입력합니다 — 상세화 흐름이 시작되는 것을 확인할 수 있습니다
3. `/ai-dlc:elaborate`가 정상적으로 동작하면 설치가 완료된 것입니다

명령어가 인식되지 않으면 Claude Code 세션을 재시작하세요.

## 권장 보조 플러그인

AI-DLC는 품질 게이트를 제공하는 백프레셔 플러그인과 함께 사용할 때 가장 효과적입니다:

### TypeScript 프로젝트

```bash
npx han plugin install jutsu-typescript --scope project
npx han plugin install jutsu-biome --scope project
```

### Python 프로젝트

```bash
npx han plugin install jutsu-python --scope project
npx han plugin install jutsu-ruff --scope project
```

### Go 프로젝트

```bash
npx han plugin install jutsu-go --scope project
```

> **참고:** Han 플러그인은 동일한 설치 패턴을 따릅니다. Claude Code에서 직접 설치하려면 각 플러그인에 맞는 마켓플레이스 식별자를 사용하여 `/plugin marketplace add`와 `/plugin install`을 실행하세요.

이 플러그인들은 다음을 제공합니다:
- **타입 검사** — 오류 발생 시 진행을 차단합니다
- **린팅** — 코드 품질을 유지합니다
- **포맷팅** — 코드 일관성을 보장합니다

## 프로젝트 설정

### AI-DLC 디렉터리 생성

AI-DLC는 프로젝트 루트의 `.ai-dlc/` 디렉터리에 아티팩트를 저장합니다:

```
your-project/
  .ai-dlc/
    add-oauth-login/         # Intent 디렉터리
      intent.md              # Intent 정의
      unit-01-setup.md       # Unit 파일
      unit-02-callback.md
  src/
  tests/
  ...
```

이 디렉터리는 `/ai-dlc:elaborate`를 처음 실행할 때 자동으로 생성됩니다.

### Git 구성

AI-DLC 아티팩트를 버전 관리에 추가합니다:

```bash
# AI-DLC 아티팩트는 커밋해야 합니다
git add .ai-dlc/
```

`.ai-dlc/` 디렉터리에는 다음이 포함됩니다:
- Intent 정의
- Unit 명세
- 진행 상황 추적

이 파일들은 보존해야 할 중요한 문서입니다.

### Gitignore (선택 사항)

AI-DLC 아티팩트를 커밋하지 않으려면:

```gitignore
# .gitignore
.ai-dlc/
```

그러나 커밋하는 것을 권장합니다. 커밋하면 다음과 같은 이점이 있습니다:
- 작업 이력 및 컨텍스트 보존
- 팀 협업 지원
- 컨텍스트 초기화 시 복구 가능

## 문제 해결

### 명령어가 인식되지 않는 경우

**증상:** `/ai-dlc:elaborate` 또는 `/ai-dlc:execute`가 활성화되지 않음

**해결 방법:**
1. Claude Code 세션 재시작
2. settings.json에 플러그인이 등록되어 있는지 확인
3. 플러그인 경로의 오타 확인

### Han 명령어 실패

**증상:** `han keep` 명령어가 오류를 반환함

**해결 방법:**
1. Han 설치 확인: `han --version`
2. Han이 PATH에 포함되어 있는지 확인
3. 재설치: `curl -fsSL https://han.guru/install.sh | bash`

### 플러그인 충돌

**증상:** 예기치 않은 동작 또는 명령어 충돌

**해결 방법:**
1. 설정에 중복된 플러그인이 있는지 확인
2. 호환 가능한 플러그인 버전인지 확인
3. 충돌하는 플러그인을 일시적으로 비활성화

## 다음 단계

- **[빠른 시작](/docs/quick-start/)** — AI-DLC로 첫 번째 기능 구현하기
- **[핵심 개념](/docs/concepts/)** — Intent, Unit, hats 이해하기
- **[워크플로우](/docs/workflows/)** — 다양한 개발 패턴 알아보기
