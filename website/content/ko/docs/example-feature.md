---
title: "예시: 기능 구현"
description: AI-DLC를 사용하여 실제 기능을 구현하는 전체 과정 안내
order: 11
---

이것은 AI-DLC를 사용하여 기능을 구현하는 완전하고 현실적인 예시입니다. 방법론이 실제로 어떻게 작동하는지 따라가며 확인해 보세요.

## 구현할 기능

웹 애플리케이션에 **알림 시스템**을 추가합니다. 사용자는 다음을 할 수 있어야 합니다:
- 앱 내 알림 수신
- 알림을 읽음으로 표시
- 알림 환경설정 구성

## 1단계: 상세화(Elaboration)

### 프로세스 시작

```
User: /ai-dlc:elaborate

I want to add a notification system to our app. Users should
get notifications for important events and be able to manage them.
```

### AI의 명확화 질문

**AI (Elaborator):** "이 Intent를 정의하는 데 도움을 드리겠습니다. 몇 가지 질문을 드리겠습니다:

1. **알림 유형:** 어떤 이벤트가 알림을 트리거하나요?
   - 사용자 멘션, 댓글, 좋아요, 팔로우, 시스템 알림?

2. **전달 채널:** 앱 내 알림만인가요, 이메일/푸시도 포함하나요?

3. **실시간 여부:** 알림이 즉시 표시되어야 하나요, 아니면 페이지 새로고침 시에 표시되어도 되나요?

4. **보존 기간:** 알림을 얼마나 오래 보관하나요?

5. **환경설정:** 사용자가 제어할 수 있는 항목은 무엇인가요?
   - 유형별 활성화/비활성화? 빈도? 방해 금지 시간?"

### 사용자의 컨텍스트 제공

```
User:
1. Start with: new comments on your posts, new followers, mentions
2. In-app only for now, email later
3. Real-time via WebSocket would be nice but polling is OK for v1
4. Keep 90 days, show last 50 in UI
5. Users can enable/disable each notification type
```

### AI의 Intent 생성

**AI:** "논의 내용을 바탕으로 Intent를 작성했습니다:

```markdown
# .ai-dlc/add-notifications/intent.md

---
status: active
workflow: default
started_at: 2026-02-02T14:00:00Z
---

# Add Notification System

## Overview
Add an in-app notification system that alerts users to important
events (comments, followers, mentions) with user-configurable
preferences.

## Completion Criteria
- [ ] Users receive notifications for new comments on their posts
- [ ] Users receive notifications for new followers
- [ ] Users receive notifications when mentioned
- [ ] Notification bell shows unread count
- [ ] Clicking notification bell shows notification list (last 50)
- [ ] Users can mark individual notifications as read
- [ ] Users can mark all as read
- [ ] Users can enable/disable each notification type
- [ ] Notifications auto-delete after 90 days
- [ ] All tests pass
- [ ] No TypeScript errors
```

이제 이를 Unit으로 분리하겠습니다..."

### AI의 Unit 제안

**AI:** "4개의 Unit을 권장합니다:

**unit-01-backend-model.md** - 데이터베이스 스키마 및 API
- 유형, 읽음 상태, 타임스탬프를 포함한 알림 모델
- 알림 CRUD 엔드포인트
- 환경설정 모델 및 엔드포인트

**unit-02-notification-triggers.md** - 이벤트 훅
- 댓글, 팔로우, 멘션 시 알림 생성
- 기존 이벤트 시스템 연결

**unit-03-frontend-ui.md** - React 컴포넌트
- 배지가 있는 알림 벨
- 알림 목록 드롭다운
- 읽음 처리 인터랙션

**unit-04-preferences.md** - 설정 페이지
- 각 유형별 환경설정 토글
- 환경설정 저장 및 적용

의존성: unit-02는 unit-01에 의존하고, unit-03은 unit-01에 의존하며, unit-04는 unit-01에 의존합니다.

이 파일들을 생성할까요?"

```
User: Yes, looks good.
```

## 2단계: 실행 - Unit 01

### 첫 번째 Unit 시작

```
User: /ai-dlc:execute
```

### Planner Hat (HITL)

**AI (Planner):** "unit-01-backend-model을 계획합니다.

**현재 상태 분석:**
- 데이터베이스: Prisma ORM을 사용하는 PostgreSQL
- 기존 모델: User, Post, Comment, Follow
- API: REST 엔드포인트를 사용하는 Express

**계획:**

1. Prisma 스키마에 Notification 모델 생성
   - id, userId, type (enum), message, read, createdAt
   - User에 대한 외래 키
   - 효율적인 쿼리를 위한 userId + createdAt 인덱스

2. NotificationPreference 모델 생성
   - userId, notificationType, enabled
   - userId + type에 대한 유니크 제약 조건

3. 마이그레이션 생성 및 실행

4. API 엔드포인트 생성:
   - GET /api/notifications - 현재 사용자의 목록 조회
   - PATCH /api/notifications/:id/read - 하나를 읽음으로 표시
   - POST /api/notifications/mark-all-read - 모두 읽음으로 표시
   - GET /api/notification-preferences - 환경설정 조회
   - PUT /api/notification-preferences - 환경설정 업데이트

5. 모든 엔드포인트에 대한 테스트 작성

이 계획대로 진행할까요?"

```
User: Yes, proceed.
```

### Builder Hat (OHOTL)

**AI (Builder):** "unit-01-backend-model을 구현합니다...

**1단계: Prisma 모델 추가**

```prisma
// prisma/schema.prisma

enum NotificationType {
  COMMENT
  FOLLOW
  MENTION
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, createdAt(sort: Desc)])
}

model NotificationPreference {
  id       String           @id @default(uuid())
  userId   String
  user     User             @relation(fields: [userId], references: [id])
  type     NotificationType
  enabled  Boolean          @default(true)

  @@unique([userId, type])
}
```

마이그레이션 실행 중...
- 마이그레이션 `20260202_add_notifications` 생성됨
- 마이그레이션 성공적으로 적용됨

**2단계: API 라우트 생성**

```typescript
// src/routes/notifications.ts

router.get('/api/notifications', auth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

// ... 추가 엔드포인트 구현됨
```

**3단계: 테스트 실행**

```
npm test -- --grep notifications

  Notification API
    ✓ GET /api/notifications returns user notifications
    ✓ GET /api/notifications returns empty array for new user
    ✓ PATCH /api/notifications/:id/read marks as read
    ✓ PATCH /api/notifications/:id/read returns 404 for other user
    ✓ POST /api/notifications/mark-all-read marks all as read
    ✓ GET /api/notification-preferences returns defaults
    ✓ PUT /api/notification-preferences updates preferences

  7 passing (2s)
```

**4단계: 품질 게이트 실행**

```
tsc --noEmit    # No errors
npm run lint    # No warnings
npm run test    # 7/7 passing
```

모든 품질 게이트를 통과했습니다. Unit 완료."

### Reviewer Hat (HITL)

**AI (Reviewer):** "unit-01-backend-model을 검토합니다:

**완료 기준 확인:**

| 기준 | 상태 | 근거 |
|------|------|------|
| Notification 모델 생성 | PASS | Prisma 스키마 + 마이그레이션 |
| Preferences 모델 생성 | PASS | 스키마 + 유니크 제약 조건 |
| 목록 엔드포인트 작동 | PASS | 테스트: 사용자 알림 반환 |
| 읽음 표시 작동 | PASS | 테스트: 개별 항목 표시 |
| 전체 읽음 표시 작동 | PASS | 테스트: 전체 표시 |
| Preferences CRUD 작동 | PASS | 테스트: 조회 + 업데이트 |
| 테스트 통과 | PASS | 7/7 통과 |
| TS 오류 없음 | PASS | tsc 클린 |

**코드 품질:**
- 양호: 쿼리 성능을 위한 적절한 인덱스
- 양호: 모든 라우트에 인증 미들웨어 적용
- 양호: 접근 제어를 위한 적절한 404 처리
- 참고: 목록 엔드포인트에 페이지네이션 고려 (향후)

**보안:**
- 모든 엔드포인트에 인증 필요
- 사용자는 자신의 알림에만 접근 가능
- 민감한 데이터 노출 없음

**권고사항:** 승인(APPROVE)

unit-02 준비 완료."

## 3단계: 실행 - Unit 02

### Planner Hat

**AI (Planner):** "unit-02-notification-triggers를 계획합니다.

**분석:**
- 기존 이벤트 시스템은 EventEmitter 패턴 사용
- 이벤트: `comment:created`, `follow:created`, `mention:detected`
- 이벤트를 수신하고 알림을 생성해야 함

**계획:**
1. NotificationService 클래스 생성
2. 관련 이벤트 구독
3. 알림 생성 전 사용자 환경설정 확인
4. 알림 레코드 생성
5. 통합 테스트 작성

진행할까요?"

```
User: Yes
```

### Builder Hat

**AI (Builder):** "트리거를 구현합니다...

```typescript
// src/services/notification-service.ts

export class NotificationService {
  constructor(private eventBus: EventEmitter) {
    this.subscribe();
  }

  private subscribe() {
    this.eventBus.on('comment:created', this.onComment.bind(this));
    this.eventBus.on('follow:created', this.onFollow.bind(this));
    this.eventBus.on('mention:detected', this.onMention.bind(this));
  }

  private async onComment(event: CommentCreatedEvent) {
    const postAuthor = await getPostAuthor(event.postId);
    if (postAuthor.id === event.authorId) return; // Don't notify self

    if (await this.isEnabled(postAuthor.id, 'COMMENT')) {
      await this.create({
        userId: postAuthor.id,
        type: 'COMMENT',
        message: `${event.authorName} commented on your post`,
      });
    }
  }

  // ... 팔로우 및 멘션도 유사하게 구현
}
```

테스트:
```
  Notification Triggers
    ✓ creates notification when someone comments on post
    ✓ does not notify when commenting on own post
    ✓ respects user preference to disable comments
    ✓ creates notification for new follower
    ✓ creates notification when mentioned

  5 passing
```

모든 게이트를 통과했습니다."

### Reviewer Hat

**AI (Reviewer):** "unit-02를 검토합니다:

- [x] 댓글 알림 작동
- [x] 팔로우 알림 작동
- [x] 멘션 알림 작동
- [x] 환경설정 반영됨
- [x] 자기 자신에 대한 알림 방지됨

승인(APPROVE)."

## 4단계: 실행 - Unit 03-04

*(프론트엔드 및 환경설정 Unit도 유사한 패턴으로 진행됩니다)*

### Unit 03 요약 (프론트엔드)

구현 내용:
- 읽지 않은 알림 배지가 있는 `NotificationBell` 컴포넌트
- 읽음 표시 기능이 있는 `NotificationList` 드롭다운
- 주기적 폴링(5초)을 통한 실시간 업데이트

### Unit 04 요약 (환경설정)

구현 내용:
- 알림을 위한 설정 페이지 섹션
- 각 알림 유형별 토글 스위치
- 롤백 기능이 있는 낙관적 UI 업데이트

## 5단계: Intent 완료

**AI:** "'알림 시스템 추가'의 모든 Unit이 완료되었습니다:

| Unit | 상태 | 테스트 |
|------|------|--------|
| unit-01-backend-model | 완료 | 7 통과 |
| unit-02-notification-triggers | 완료 | 5 통과 |
| unit-03-frontend-ui | 완료 | 8 통과 |
| unit-04-preferences | 완료 | 4 통과 |

**Intent 완료 기준:**

- [x] 댓글에 대한 알림 수신 - 확인됨
- [x] 팔로워에 대한 알림 수신 - 확인됨
- [x] 멘션에 대한 알림 수신 - 확인됨
- [x] 알림 벨에 읽지 않은 수 표시 - 확인됨
- [x] 알림 목록에 최근 50개 표시 - 확인됨
- [x] 개별 읽음 표시 - 확인됨
- [x] 전체 읽음 표시 - 확인됨
- [x] 유형별 활성화/비활성화 - 확인됨
- [x] 90일 자동 삭제 - 확인됨 (크론 작업 추가됨)
- [x] 모든 테스트 통과 - 24/24 통과
- [x] TypeScript 오류 없음 - 클린

**Intent 완료(COMPLETE).**

다음 중 원하시는 작업을 선택해 주세요:
1. 모든 변경 사항으로 PR 생성
2. 릴리스 노트 생성
3. 새로운 Intent 시작"

## 주요 시사점

### 잘 작동한 점

1. **명확화 질문을 통한 요구사항 도출** - 실시간 vs 폴링 결정을 초기에 확정
2. **Unit 의존성이 명확했음** - 백엔드 우선 구현으로 프론트엔드 병렬 작업 가능
3. **역압(Backpressure)이 문제를 포착** - 테스트 실패가 구현 방향을 안내
4. **Hats가 집중력 유지** - 구현 전 계획 수립으로 범위 확장 방지

### 소요 시간

- 상세화(Elaboration): 약 15분 (명확화 포함)
- Unit 01 (백엔드): 약 45분
- Unit 02 (트리거): 약 30분
- Unit 03 (프론트엔드): 약 60분
- Unit 04 (환경설정): 약 20분

총계: 24개의 테스트를 포함한 완전한 알림 시스템 구현에 약 2.5시간.

### 사람이 한 일

1. 명확화 질문에 답변
2. 계획 승인
3. AI 결정 사항 검토
4. 트레이드오프 결정 (폴링 vs WebSocket)

### AI가 한 일

1. 요구사항 구조화
2. Unit으로 분해
3. 각 구현 계획 수립
4. 모든 코드 및 테스트 작성
5. 완료 기준 검증

## 구축 이후: 운영

알림 시스템이 완성된 후, Builder는 지속적인 유지보수를 위한 운영 작업을 정의했습니다:

- **`clear-expired-notifications`** — 90일이 지난 알림을 매일 밤 삭제하는 예약된 에이전트 운영 작업
- **`monitor-delivery-latency`** — 알림 전달이 5초를 초과할 때 경고를 발생시키는 반응형 에이전트 운영 작업
- **`review-notification-metrics`** — 전달률, 열람률, 환경설정 트렌드를 검토하는 월간 사람 프로세스

이 운영 작업 명세는 `.ai-dlc/notifications/operations/`에 저장되며 `/ai-dlc:operate notifications`로 관리됩니다. 자세한 내용은 [운영 가이드](/docs/operations-guide/)를 참조하세요.

## 다음 단계

- **[예시: 버그 수정](/docs/example-bugfix/)** - 가설 워크플로우 확인
- **[워크플로우](/docs/workflows/)** - 다양한 패턴 시도
- **[핵심 개념](/docs/concepts/)** - 이해 심화
