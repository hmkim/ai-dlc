---
title: 디자이너 가이드
description: AI-DLC 프로젝트에 협업하는 UX/UI 디자이너를 위한 가이드
order: 21
---

이 가이드는 디자이너가 AI-DLC 방법론 안에서 효과적으로 작업하는 방법을 다룹니다. 디자인 스펙 작성, 구현 검토, AI 지원 개발 협업 등 어떤 역할을 맡고 있든, AI-DLC는 팀 전체에 도움이 되는 구조를 제공합니다.

## AI-DLC에서 디자이너의 역할

디자인 작업은 AI-DLC의 여러 핵심 지점과 교차합니다:

1. **Intent 정의** - 시각적으로 성공이 어떤 모습인지 정의하는 데 기여
2. **완료 기준** - 측정 가능한 디자인 요구사항 명세
3. **검토 단계** - 구현 결과가 디자인 의도와 일치하는지 검증
4. **반복** - 개선 방향을 안내하는 피드백 제공

Intent가 멀티패스를 사용하는 경우, 디자이너는 **디자인 Pass**의 주요 참여자가 됩니다. 목업, 프로토타입, 컴포넌트 스펙 등 디자인 산출물에 집중하여 전체 정교화·실행·검토 루프를 진행합니다. 디자인 Pass의 결과물은 이후 프로덕트 및 개발 Pass의 입력값이 됩니다. 자세한 내용은 [Passes](/docs/concepts/#pass)를 참고하세요.

## 디자인 완료 기준 작성하기

가장 효과적으로 기여할 수 있는 방법은 명확하고 검증 가능한 디자인 기준을 작성하는 것입니다. 모호한 스펙은 불필요한 반복 작업을 낳고, 정확한 스펙은 AI가 처음부터 올바르게 구현할 수 있게 합니다.

### 모호함에서 검증 가능함으로

| 모호한 표현 | 검증 가능한 표현 |
|-------|------------|
| "모바일에서 보기 좋음" | "375px 너비 기준: 내비게이션은 햄버거 메뉴로 접히고, 카드는 세로로 쌓이며, 텍스트 가독성 유지 (최소 16px)" |
| "깔끔한 디자인" | "컴포넌트가 8px 그리드를 따르고, 디자인 토큰의 색상만 사용하며, 4.5:1 명도 대비 비율 유지" |
| "브랜드와 일관성 있음" | "Inter 폰트 패밀리 사용, 주요 버튼은 --color-brand-500 적용, 아이콘은 Lucide 세트 사용" |
| "접근성 있음" | "모든 인터랙티브 요소 키보드 접근 가능, 포커스 상태 가시적, 아이콘에 ARIA 레이블 적용" |

### 기준을 구조화하기

디자인 기준을 카테고리별로 정리하세요:

```markdown
## Design Completion Criteria

### Layout
- [ ] Container max-width 1200px, centered with 24px padding
- [ ] 3-column grid on desktop (>1024px), 2-column on tablet (768-1023px), 1-column on mobile (<768px)
- [ ] Cards maintain 16px gap between items

### Typography
- [ ] Headings: Inter Bold, sizes per type scale (h1: 48px, h2: 36px, h3: 24px)
- [ ] Body: Inter Regular 16px/1.5 line-height
- [ ] Captions: Inter Regular 14px, --color-gray-600

### Colors & Contrast
- [ ] All text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large)
- [ ] Interactive states: hover, active, focus, disabled defined
- [ ] Dark mode variants specified

### Components
- [ ] Buttons follow design system (primary, secondary, ghost variants)
- [ ] Form inputs 44px min height, visible focus rings
- [ ] Loading states for async operations
```

### 시각적 참고 자료 포함하기

디자인 파일을 직접 참조하세요:

```markdown
## Visual Reference

**Figma:** https://figma.com/file/...

### Key Screens
- Home: Frame "Home - Desktop" (design token: page-home)
- Mobile nav: Frame "Nav - Mobile Open" (design token: nav-mobile)
- Empty state: Component "Empty State/No Results"
```

## 디자이너의 Hat 워크플로우

### 리서치 단계

팀이 리서치 단계에 있을 때 기여할 수 있는 내용:

- **경쟁사 분석** - 다른 서비스는 이 UX 문제를 어떻게 해결하는가?
- **패턴 리서치** - 적용 가능한 표준 패턴은 무엇인가?
- **접근성 리서치** - 적용해야 할 WCAG 요구사항은 무엇인가?
- **디자인 시스템 감사** - 재사용 가능한 기존 컴포넌트는 무엇인가?

### 기획 단계

팀이 기획 단계에 있을 때 다음을 정의하는 데 도움을 주세요:

- **컴포넌트 분류** - 어떤 디자인 시스템 컴포넌트가 필요한가?
- **반응형 전략** - 레이아웃이 어떻게 적응하는가?
- **애니메이션 스펙** - 어떤 모션/전환이 필요한가?
- **엣지 케이스** - 빈 상태, 오류 상태, 로딩 상태

### 빌딩 단계

빌더가 작업하는 동안 다음을 준비하세요:

- **디자인 QA 체크리스트** - 검토 시 확인할 항목
- **반응형 스크린샷** - 각 브레이크포인트에서의 예상 모습
- **인터랙션 플로우** - 예상되는 hover/click/focus 동작
- **에셋 내보내기** - 아이콘, 이미지, 커스텀 그래픽 등

### 검토 단계

이 단계가 디자이너가 가장 빛나는 순간입니다. 다음 항목을 기준으로 검토하세요:

1. **시각적 충실도** - 디자인과 일치하는가?
2. **반응형** - 모든 브레이크포인트에서 잘 작동하는가?
3. **인터랙션** - 상태와 애니메이션이 자연스러운가?
4. **접근성** - 키보드로 탐색할 수 있는가? 명도 대비는 충분한가?
5. **엣지 케이스** - 빈 상태, 오류, 로딩은 어떻게 보이는가?

## 디자인 피드백 작성하기

검토 중 문제가 발견되면 실행 가능한 피드백을 작성하세요:

### 나쁜 피드백 예시

> "간격이 이상해 보여요"

### 좋은 피드백 예시

> "히어로 섹션과 피처 카드 사이의 간격이 48px인데, 디자인 시스템의 section-spacing 토큰에 따라 64px이어야 합니다"

### 구조화된 피드백 템플릿

```markdown
### Issue: [Brief description]

**Expected:** [What the design specifies]
**Actual:** [What was implemented]
**Reference:** [Link to Figma frame or design system doc]
**Fix:** [Specific change needed]
```

## 디자인 시스템 통합

AI-DLC는 디자인 시스템이 있을 때 가장 잘 작동합니다. 팀에 디자인 시스템이 없다면 다음을 만드는 것을 고려해 보세요:

### 디자인 토큰 파일

Claude가 참조할 수 있는 토큰 파일을 만드세요:

```markdown
## Design Tokens

### Colors
- --color-brand-500: #2563eb (Primary CTA)
- --color-gray-900: #111827 (Headings)
- --color-gray-600: #4b5563 (Body text)
- --color-gray-100: #f3f4f6 (Backgrounds)

### Spacing
- --space-xs: 4px
- --space-sm: 8px
- --space-md: 16px
- --space-lg: 24px
- --space-xl: 32px
- --space-2xl: 48px
- --space-section: 64px

### Typography
- --font-heading: Inter, sans-serif
- --font-body: Inter, sans-serif
- --font-mono: JetBrains Mono, monospace
```

### 컴포넌트 명세

컴포넌트를 문서화하세요:

```markdown
## Button Component

### Variants
- **Primary:** bg-brand-500, text-white, hover:bg-brand-600
- **Secondary:** bg-transparent, border-gray-300, text-gray-700
- **Ghost:** bg-transparent, text-brand-500, hover:bg-brand-50

### Sizes
- **sm:** h-32px, px-12px, text-14px
- **md:** h-40px, px-16px, text-16px
- **lg:** h-48px, px-24px, text-18px

### States
- **Hover:** darken 10%
- **Active:** darken 15%
- **Focus:** 2px ring, ring-offset-2, ring-brand-500
- **Disabled:** opacity-50, cursor-not-allowed
```

## AI가 생성한 UI와 협업하기

Claude는 UI 코드를 생성할 수 있지만, 명확한 가이드가 필요합니다. 다음과 같이 도움을 주세요:

### 컨텍스트 제공하기

디자인 스펙에 다음을 포함하세요:

- 토큰에 대한 Tailwind 클래스 매핑
- 사용 중인 컴포넌트 라이브러리 (Radix, shadcn 등)
- 애니메이션 라이브러리 (Framer Motion, CSS transitions)
- 아이콘 세트 (Lucide, Heroicons 등)

### 제약 조건 설정하기

하지 말아야 할 것을 명시적으로 지정하세요:

```markdown
## Design Constraints

### Do Not
- Use colors outside the design system palette
- Add animations not in the motion spec
- Create new component variants without approval
- Use font sizes outside the type scale
- Use spacing values not in the spacing scale
```

## 검토 체크리스트

### 시각적 검토 체크리스트

```markdown
## Visual QA

### Layout
- [ ] Matches Figma at desktop breakpoint
- [ ] Matches Figma at tablet breakpoint
- [ ] Matches Figma at mobile breakpoint
- [ ] No horizontal overflow at any breakpoint

### Typography
- [ ] Correct fonts loaded
- [ ] Headings match type scale
- [ ] Line heights comfortable
- [ ] No orphaned words on important headlines

### Colors
- [ ] All colors from design system
- [ ] Contrast passes WCAG AA
- [ ] Dark mode properly implemented

### Components
- [ ] Match design system specs
- [ ] All states styled (hover, focus, active, disabled)
- [ ] Loading states present
```

### 인터랙션 검토 체크리스트

```markdown
## Interaction QA

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] Focus rings visible
- [ ] Escape closes modals

### Touch Targets
- [ ] Minimum 44x44px
- [ ] Adequate spacing between targets

### Animations
- [ ] Smooth, no jank
- [ ] Respects prefers-reduced-motion
- [ ] Duration appropriate (150-300ms for micro, 300-500ms for larger)

### Feedback
- [ ] Buttons show click feedback
- [ ] Form errors clearly indicated
- [ ] Loading states for async actions
- [ ] Success/error confirmations
```

## 디자인 방향 설정 (그린필드 프로젝트)

새 프로젝트를 시작하거나 확립된 디자인 패턴이 없는 경우, 정교화 단계에 **디자인 방향 설정** 단계가 포함됩니다. 시각적 선택 도구를 통해 디자인 아키타입과 조정 가능한 파라미터를 제시합니다:

**아키타입:**
- **Brutalist** - 높은 대비, 날것의 테두리, 비대칭 그리드, 모노스페이스 타입
- **Editorial** - 매거진 레이아웃, 강한 타이포그래피, 넉넉한 여백
- **Dense/Utilitarian** - 컴팩트한 레이아웃, 데이터 중심, 공간 효율적 활용
- **Playful/Warm** - 둥근 요소, 생동감 있는 색상, 친근한 타이포그래피

**조정 가능한 파라미터:**
- 밀도, 테두리 처리, 색온도, 타이포그래피 대비 등

선택 결과는 **디자인 블루프린트**를 생성하며, 이는:
- 프로젝트의 디자인 지식 산출물을 초기화합니다 (모든 Intent에 걸쳐 유지됨)
- 정교화 단계의 와이어프레임 생성을 안내합니다
- 모든 실행 hats에 디자인 컨텍스트를 제공합니다

**디자이너로서 이 단계는 코드가 작성되기 전에 시각적 기반을 설정할 수 있는 기회입니다.** 블루프린트는 AI가 기능 전반에 걸쳐 일관되게 적용할 수 있는 구조화된 형태로 디자인 방향을 담아냅니다. 기존 프로젝트의 경우 이 단계는 건너뛰며, 기존 디자인 패턴이 가이드 역할을 합니다.

## 디자인 프로바이더 사용하기

AI-DLC는 여섯 가지 디자인 프로바이더를 지원합니다: **Canva**, **Figma**, **OpenPencil**, **Pencil**, **Penpot**, **Excalidraw**. 디자인 프로바이더가 설정되면, AI-DLC는 정교화 단계에서 자동으로 디자인 스펙을 가져오고, 빌딩 단계에서 이를 참조하며, 검토 단계에서 구현 결과를 교차 확인합니다.

### 프로바이더 선택하기

| 사용 중인 도구 | `type:` 설정값 | 주요 강점 |
|---------------|-------------------|---------------|
| Canva | `canva` | 브랜드 키트, 템플릿, 마케팅 에셋 |
| Figma | `figma` | 컴포넌트, 변수, 프로토타이핑 |
| OpenPencil | `openpencil` | 8개 프레임워크로 코드 내보내기, 디자인 토큰 |
| Pencil | `pencil` | AI 생성, 경량 로컬 디자인 |
| Penpot | `penpot` | 셀프 호스팅, SVG 네이티브, 컴포넌트 |
| Excalidraw | `excalidraw` | 빠른 다이어그램, 아키텍처 스케치 |

또는 `type: auto`로 설정하면 AI-DLC가 사용 가능한 MCP 도구를 통해 프로바이더를 자동으로 감지합니다.

### Unit의 디자인 참조

정교화 단계에서 디자인 작업이 포함된 Unit을 생성할 때, 프로바이더별 URI를 사용하여 참조를 저장합니다:

```markdown
---
design_ref: "figma://abc123#node=1:42"
---
```

이 참조는 실행 중에 자동으로 해석되므로, 빌더는 해당 Unit에 맞는 정확한 디자인 스펙을 가져올 수 있습니다.

### 프로바이더 동작 커스터마이징

`.ai-dlc/providers/design.md`에 프로젝트별 디자인 관례를 추가하세요:

```markdown
---
provider: figma
type: design
---

# Design Conventions
- Only reference frames marked "Ready for Dev"
- Export at 2x for retina displays
- Use component variants, not detached instances
```

각 프로바이더의 전체 설정 방법과 기능 상세 내용은 [디자인 프로바이더 가이드](/docs/guide-design-providers/)를 참고하세요.

## 협업 팁

### 비동기 협업

Claude는 세션 단위로 작동하므로 결정 사항을 문서화하세요:

- `.ai-dlc/` 폴더에 `design-decisions.md` 파일을 유지하세요
- Figma 댓글을 스크린샷으로 찍어 저장소에 보관하세요
- 디자인 피드백에는 PR 리뷰를 활용하세요

### 동기 협업

개발자와 Claude를 함께 사용하며 실시간으로 작업할 때:

- 구현 과정을 직접 지켜보세요
- 불일치 사항을 조기에 지적하세요
- 판단이 필요한 사항에 즉각적인 피드백을 제공하세요

### 핸드오프 모범 사례

원활한 핸드오프를 위해:

1. **정돈된 Figma** - 프레임 이름을 명확하게 지정하고 컴포넌트를 활용하세요
2. **문서화된 스펙** - Figma에만 의존하지 마세요
3. **반응형 노트** - 브레이크포인트 동작을 문서화하세요
4. **에셋 내보내기** - 최적화된 이미지/아이콘을 제공하세요
5. **모션 스펙** - 애니메이션을 문서로 기록하세요

## 다음 단계

- **[핵심 개념](/docs/concepts/)** - 전체 방법론 이해하기
- **[워크플로우](/docs/workflows/)** - 다양한 워크플로우 유형 알아보기
- **[테크 리드 가이드](/docs/guide-tech-lead/)** - 더 넓은 팀 관점에서 살펴보기
