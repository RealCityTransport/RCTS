<!-- src/components/header/HeaderNews.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 헤더 아래 한 줄 뉴스/공지 영역을 담당한다.
- 현재는 흐르는 티커가 아니라 고정 문구 방식이다.

현재 연결:
- Header.vue에서 newsItems 배열을 props로 전달받는다.

현재 상태:
- 초기 문구: "초기 레이아웃 구성중입니다."
- 애니메이션 없음.
- 문구가 길면 말줄임 처리된다.

주의:
- 뉴스 영역은 Header의 일부로 취급한다.
- 현재는 단순 공지용이며, 게임 뉴스 시스템과는 아직 연결되지 않았다.

다음 작업 방향:
- 실제 게임 뉴스/공지/월드 이벤트 로그와 연결 가능.
- 필요 시 newsItems를 단일 문자열로 단순화할 수 있다.
-->

<template>
  <section class="news-bar">
    <strong>RCTS NEWS</strong>

    <div class="news-content">
      <span v-for="news in newsItems" :key="news">
        {{ news }}
      </span>
    </div>
  </section>
</template>

<script setup>
defineProps({
  newsItems: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.news-bar {
  height: 38px;
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  background: var(--news-bg, #0f172a);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.news-bar > strong {
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--news-label-bg, #2563eb);
  color: white;
  font-size: 13px;
  letter-spacing: 1px;
}

.news-content {
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
}

.news-content span {
  color: #dbeafe;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 820px) {
  .news-bar {
    height: 40px;
    grid-template-columns: 112px 1fr;
  }

  .news-bar > strong {
    font-size: 12px;
  }

  .news-content {
    padding: 0 14px;
  }

  .news-content span {
    font-size: 13px;
  }
}
</style>