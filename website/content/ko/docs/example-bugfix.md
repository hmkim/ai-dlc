---
title: "예시: 가설 워크플로를 활용한 버그 수정"
description: 체계적인 디버깅을 위한 가설 워크플로 활용
order: 12
---

이 예시는 **가설 워크플로**를 시연합니다. 가설 워크플로는 근본 원인이 명확하지 않은 복잡한 문제를 디버깅할 때 사용하는 과학적 접근 방식입니다.

## 버그 설명

사용자들이 결제 과정에서 간헐적으로 500 오류가 발생한다고 보고합니다. 무작위로 발생하며, 전체 결제의 약 2%에 영향을 미치고, 2주 전부터 지속되고 있습니다.

## 가설 워크플로를 선택한 이유

이 버그는 가설 워크플로에 적합한 사례입니다:

- **간헐적 발생** - 재현이 불가능함
- **원인 불명** - 스택 트레이스에 타임아웃이 표시되지만, 이유가 불분명함
- **프로덕션 영향** - 매출 손실이 발생하고 있어 체계적인 수정이 필요함
- **복잡한 시스템** - 결제 프로세스가 여러 서비스와 연결되어 있음

무작위로 수정을 시도하는 "산탄총 디버깅" 방식은 비효율적이고 위험합니다.

## 1단계: 상세화

```
User: /ai-dlc:elaborate

I want to fix intermittent 500 errors on checkout. About 2% of
checkouts fail with database timeout errors. Been happening for
2 weeks. I want to use the hypothesis workflow.
```

**AI (Elaborator):** "가설 기반 디버깅을 위한 설정을 진행하겠습니다.

```markdown
# .ai-dlc/fix-checkout-500/intent.md

---
status: active
workflow: hypothesis
started_at: 2026-02-02T10:00:00Z
---

# Fix Intermittent Checkout 500 Errors

## Problem Statement
~2% of checkout attempts fail with HTTP 500 errors. Stack traces
indicate database connection timeout. Issue started approximately
2 weeks ago.

## Completion Criteria
- [ ] Root cause identified with evidence
- [ ] Fix implemented and verified
- [ ] Regression test added
- [ ] Error rate returns to baseline (<0.1%)
- [ ] Monitoring added to detect recurrence
- [ ] All tests pass
```

단일 조사 작업이므로, 전체 디버그 사이클을 위한 Unit을 하나 생성하겠습니다."

## 2단계: 실행

### Observer Hat (OHOTL)

**AI (Observer):** "결제 실패에 관한 데이터를 수집합니다...

**오류 로그 분석:**

```
Querying logs for checkout 500 errors, last 7 days...

Findings:
- 847 errors out of 42,350 checkouts (2.0%)
- Error: "SequelizeConnectionAcquireTimeoutError"
- Timeout after 10s waiting for connection
- No correlation with specific users
- No correlation with cart size or products
```

**시간대별 분석:**

```
Errors by hour:
  00:00-06:00: 12 errors (0.8%)
  06:00-12:00: 187 errors (1.5%)
  12:00-18:00: 423 errors (2.8%)
  18:00-24:00: 225 errors (2.1%)

Peak error rate correlates with peak traffic.
```

**최근 변경 사항 (최근 3주):**

```
- Week -3: No checkout changes
- Week -2: Added inventory check before payment (PR #1234)
- Week -1: Various unrelated changes
```

**데이터베이스 메트릭:**

```
Current pool configuration:
  - Max connections: 25
  - Idle timeout: 10s
  - Acquire timeout: 10s

Connection pool stats (peak hour):
  - Active: 23-25 (often at max)
  - Waiting: 0-8
  - Idle: 0-2
```

**관찰 요약:**
1. 오류는 커넥션 풀 고갈로 인한 것임 (쿼리 실패가 아님)
2. 트래픽 피크 시간대와 상관관계가 있음
3. 재고 확인 기능 추가 시점과 일치함
4. 풀이 최대 커넥션 수에 자주 도달함
5. 특정 느린 쿼리는 식별되지 않음"

### Hypothesizer Hat (HITL)

**AI (Hypothesizer):** "관찰 결과를 바탕으로 다음과 같은 가설을 수립했습니다:

**가설 1: 커넥션 풀 크기 부족 (높은 확률)**
- 근거: 풀 최대값이 25이며 자주 고갈됨
- 이론: 트래픽 증가에 비해 풀 크기가 부족함
- 검증: 풀 크기를 늘리고 오류율 측정

**가설 2: 새로운 재고 확인 로직이 커넥션을 점유 (중간 확률)**
- 근거: PR #1234 적용 시점과 일치함
- 이론: 재고 확인 로직이 커넥션을 제대로 해제하지 않음
- 검증: 코드 검토 및 커넥션 누수 확인

**가설 3: 느린 쿼리가 풀을 차단 (중간 확률)**
- 근거: 높은 트래픽 시 타임아웃 발생
- 이론: 특정 쿼리가 부하 상황에서 커넥션을 차단함
- 검증: 슬로우 쿼리 로깅 활성화 후 피크 시간대 분석

**가설 4: 데이터베이스 성능 저하 (낮은 확률)**
- 근거: 최근에 발생한 문제임
- 이론: 데이터베이스 서버 리소스 제약
- 검증: DB 서버 메트릭, 디스크 I/O, CPU 확인

**우선순위:**
1. 커넥션 풀 크기 부족 (가장 단순하며 데이터와 일치)
2. 재고 확인 커넥션 누수 (타이밍 일치)
3. 느린 쿼리 (기여 요인 가능성)
4. 데이터베이스 성능 저하 (가능성 낮음, 다른 작업에도 영향을 미쳤을 것)

어떤 가설부터 검증할까요?"

```
User: Start with #1, but also investigate #2 since it matches the timing.
```

### Experimenter Hat (OHOTL)

**AI (Experimenter):** "가설 1과 2를 검증합니다...

**실험 1: 커넥션 풀 분석**

```javascript
// Adding pool monitoring
const poolStats = [];
setInterval(() => {
  poolStats.push({
    timestamp: Date.now(),
    active: pool.numUsed(),
    waiting: pool.numPendingAcquires(),
    available: pool.numFree(),
  });
}, 1000);
```

스테이징 환경에 모니터링을 배포하고, 피크 트래픽을 시뮬레이션하는 부하 테스트를 실행했습니다.

**결과:**
```
Load: 100 concurrent checkouts

With pool size 25:
- Average wait time: 4.2s
- Timeouts: 8 requests
- Peak waiting: 12

With pool size 50:
- Average wait time: 0.3s
- Timeouts: 0 requests
- Peak waiting: 2

With pool size 75:
- Average wait time: 0.1s
- Timeouts: 0 requests
- Peak waiting: 0
```

**결론:** 현재 부하에서 풀 크기 25는 부족합니다. 50으로 늘리면 테스트에서 타임아웃이 사라집니다.

---

**실험 2: 재고 확인 코드 검토**

```javascript
// PR #1234 - The inventory check
async function checkInventory(cartItems) {
  const connection = await getConnection();  // Acquires from pool
  try {
    for (const item of cartItems) {
      const stock = await connection.query(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [item.productId]
      );
      if (stock.quantity < item.quantity) {
        throw new InsufficientStockError(item);
      }
    }
  } finally {
    connection.release();  // Properly released
  }
}
```

코드 분석:
- 커넥션이 올바르게 획득 및 해제됨
- try/finally 패턴을 올바르게 사용함
- 단, 각 장바구니 항목에 대해 순차적으로 쿼리를 실행함

**발견된 문제:** 누수는 아니지만, 순차적 쿼리 방식으로 인해 커넥션이 필요 이상으로 오래 점유됩니다. 장바구니에 항목이 10개 있으면 하나의 커넥션에서 10개의 쿼리가 순차적으로 실행됩니다.

**최적화된 방식:**
```javascript
async function checkInventory(cartItems) {
  const productIds = cartItems.map(i => i.productId);
  const stocks = await db.query(
    'SELECT product_id, quantity FROM inventory WHERE product_id IN (?)',
    [productIds]
  );
  // Single query, connection held briefly
}
```

**테스트 결과:**
- 기존 방식: 커넥션 점유 시간 340ms (항목 10개 기준)
- 최적화 방식: 커넥션 점유 시간 45ms (항목 10개 기준)

**복합적 영향:**
두 가지 문제가 모두 원인에 기여합니다:
1. 트래픽 대비 풀 크기 부족
2. 재고 확인 로직이 필요보다 7배 오래 커넥션을 점유함"

### Analyst Hat (HITL)

**AI (Analyst):** "결과를 분석하고 수정 방안을 제안합니다...

**근본 원인 확인:**
두 가지 기여 요인:

1. **주요 원인:** 현재 트래픽 수준에 비해 커넥션 풀 크기(25)가 부족함
2. **부차적 원인:** 순차적 쿼리로 인해 재고 확인 로직이 커넥션을 필요 이상으로 오래 점유함

**근거:**
- 커넥션 풀 고갈이 오류와 직접적으로 연관됨
- 풀 크기 증가 시 테스트에서 타임아웃 오류가 사라짐
- 재고 코드 변경 시점이 문제 발생 시점과 일치함
- 재고 쿼리 최적화 시 커넥션 점유 시간이 87% 감소함

**제안된 수정 방안:**

```yaml
# Phase 1: Immediate relief
database:
  pool:
    max: 50  # Was 25
    min: 10  # Was 5
    acquireTimeout: 30000  # Was 10000

# Phase 2: Code optimization
# Batch inventory queries (PR attached)
```

**검증 계획:**
1. 스테이징 환경에 풀 크기 증가 배포
2. 부하 테스트로 타임아웃 없음 확인
3. 프로덕션에 카나리 배포
4. 24시간 동안 오류율 모니터링
5. 재고 최적화 배포
6. 추가 개선 여부 모니터링

**추가된 모니터링:**
```javascript
// Alert if pool utilization > 80% for 5 minutes
alert('db_pool_high_utilization', {
  condition: 'pool_used / pool_max > 0.8',
  duration: '5m',
  severity: 'warning'
});

// Alert if acquire wait time > 5s
alert('db_pool_slow_acquire', {
  condition: 'acquire_wait_p95 > 5000',
  duration: '1m',
  severity: 'critical'
});
```

**회귀 테스트:**
```javascript
describe('Checkout under load', () => {
  it('completes 100 concurrent checkouts without timeout', async () => {
    const checkouts = Array(100).fill(null).map(() =>
      checkout({ items: [{ productId: 'test', quantity: 1 }] })
    );
    const results = await Promise.allSettled(checkouts);
    const failures = results.filter(r => r.status === 'rejected');
    expect(failures.length).toBe(0);
  });
});
```

이 수정 방안을 구현할까요?"

```
User: Yes, proceed.
```

**AI:** "수정을 구현합니다...

**변경 사항:**
1. 데이터베이스 설정 업데이트: 풀 최대값 25 -> 50
2. 재고 확인 최적화: 순차 쿼리 -> 배치 쿼리
3. 풀 모니터링 메트릭 추가
4. 회귀 테스트 추가

**배포:**
- 스테이징 환경에 배포 완료
- 부하 테스트: 동시 사용자 150명에서 타임아웃 0건
- 프로덕션 카나리 배포 진행 중 (10%)

**2시간 후 결과:**
```
Canary (new config):
- Checkouts: 1,247
- Errors: 0
- Error rate: 0%

Control (old config):
- Checkouts: 11,223
- Errors: 198
- Error rate: 1.8%
```

수정 효과가 확인되었습니다. 전체 롤아웃을 진행합니다."

## 3단계: 완료

**AI:** "수정이 검증되었습니다. intent를 업데이트합니다...

```markdown
# .ai-dlc/fix-checkout-500/intent.md

---
status: completed
workflow: hypothesis
started_at: 2026-02-02T10:00:00Z
completed_at: 2026-02-02T14:30:00Z
---

## Completion Criteria
- [x] Root cause identified: Pool exhaustion + inefficient inventory queries
- [x] Fix implemented: Pool size increase + query optimization
- [x] Regression test added: Load test for concurrent checkouts
- [x] Error rate: 0% post-deployment (was 2%)
- [x] Monitoring added: Pool utilization + acquire time alerts
- [x] All tests pass: 156/156
```

**Intent 완료.**

**요약:**
- 근본 원인: 커넥션 풀 크기 부족 + 비효율적인 쿼리
- 수정 방안: 풀 크기 증가 및 쿼리 최적화
- 결과: 오류율 2% -> 0%
- 재발 방지: 모니터링 알림 추가"

## 핵심 정리

### 가설 워크플로가 효과적이었던 이유

1. **체계적인 접근** - 무작위 수정 시도를 하지 않음
2. **데이터 기반** - 관찰 결과가 가설을 이끌어냄
3. **다중 가설** - 두 가지 기여 요인을 모두 발견함
4. **검증된 수정** - 카나리 배포로 효과를 확인함

### 소요 시간

| 단계 | 시간 | 활동 |
|-------|------|------------|
| Observer | 30분 | 로그 분석, 메트릭 검토, 코드 히스토리 확인 |
| Hypothesizer | 15분 | 가설 수립 및 우선순위 결정 |
| Experimenter | 60분 | 풀 테스트, 코드 검토, 최적화 |
| Analyst | 30분 | 원인 확인, 수정 구현, 검증 |

총 소요 시간: 복잡한 프로덕션 버그에 약 2.5시간.

### 가설 워크플로 없이 진행했을 경우의 문제점

**가설 워크플로 없이 진행했다면:**
- 풀 크기만 늘리고 쿼리 최적화를 놓쳤을 수 있음
- 무작위 수정을 시도하며 시간을 낭비했을 수 있음
- 검증 없이 수정 사항을 배포했을 수 있음
- 모니터링을 추가하지 않아 버그가 재발했을 수 있음

### 사람이 내린 결정

1. 검증할 가설의 우선순위 결정
2. 검증 계획 승인
3. 프로덕션 배포 승인

### AI의 기여

1. 체계적으로 데이터 수집 및 분석
2. 다양한 가설 생성
3. 실험 설계 및 실행
4. 모니터링이 포함된 종합적인 수정 방안 제안

## 다음 단계

- **[워크플로](/docs/workflows/)** - 모든 워크플로 옵션 검토
- **[예시: 기능 구현](/docs/example-feature/)** - 기본 워크플로 예시
- **[핵심 개념](/docs/concepts/)** - 기본 원리 이해
