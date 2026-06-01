<!-- src/components/header/HeaderTop.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 헤더 상단 영역을 담당한다.
- 좌측에는 RCTS 로고와 부제를 표시한다.
- 우측 끝에는 표준시간을 디지털 느낌으로 표시한다.

현재 연결:
- Header.vue에서 호출된다.
- src/modules/standardTime.js 의 state를 직접 읽어서 시간을 표시한다.

현재 표시:
- 날짜: YYYY년 MM월 DD일
- 시간: HH:MM
- 초는 표시하지 않지만, 내부 tick은 1초마다 계속 흐른다.

주의:
- 초안 레이아웃 v0.1, 전체 남은 시간, 설정/메뉴 버튼은 제거된 상태.
- 중앙 영역은 비워두었다.
- 부제는 현재 임시값이며, 나중에 사용자가 정한 회사명/월드명으로 교체 예정.

다음 작업 방향:
- 회사 생성 후 company.name을 HeaderTop에 전달하거나 전역 월드 상태에서 읽도록 연결한다.
-->

<template>
  <section class="topbar">
    <section class="brand">
      <h1>RCTS</h1>
      <p>{{ worldName }}</p>
    </section>

    <section class="top-center"></section>

    <section class="standard-clock">
      <span>{{ standardClockDateText }}</span>
      <strong>{{ standardClockTimeText }}</strong>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { standardTime } from '../../modules/standardTime'

const worldName = 'Railway Command Time System'

const standardClockDateText = computed(() => {
  const { kstDate } = standardTime.state

  if (!kstDate) {
    return '표준시간 준비 중'
  }

  const [year, month, day] = kstDate.split('.')

  return `${year}년 ${month}월 ${day}일`
})

const standardClockTimeText = computed(() => {
  const { kstTime } = standardTime.state

  if (!kstTime) {
    return '--:--'
  }

  return kstTime
})
</script>

<style scoped>
.topbar {
  min-height: 74px;
  display: grid;
  grid-template-columns: 320px 1fr 220px;
  align-items: center;
  gap: 16px;
  padding: 10px 28px;
  color: white;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.18), transparent 38%),
    var(--header-bg, #172033);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  min-width: 0;
}

.brand h1 {
  margin: 0;
  font-size: 42px;
  line-height: 0.9;
  letter-spacing: 4px;
}

.brand p {
  margin: 7px 0 0;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-center {
  min-height: 1px;
}

.standard-clock {
  justify-self: end;
  min-width: 188px;
  padding: 8px 16px;
  border-radius: 12px;
  text-align: right;
  background: rgba(15, 23, 42, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.standard-clock span {
  display: block;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.standard-clock strong {
  display: block;
  margin-top: 2px;
  color: #facc15;
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1280px) {
  .topbar {
    grid-template-columns: 280px 1fr 200px;
  }

  .brand h1 {
    font-size: 38px;
  }

  .standard-clock strong {
    font-size: 28px;
  }
}

@media (max-width: 820px) {
  .topbar {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 16px;
  }

  .brand h1 {
    font-size: 38px;
  }

  .brand p {
    white-space: normal;
  }

  .top-center {
    display: none;
  }

  .standard-clock {
    justify-self: stretch;
    min-width: 0;
    text-align: left;
  }

  .standard-clock strong {
    font-size: 28px;
  }
}
</style>