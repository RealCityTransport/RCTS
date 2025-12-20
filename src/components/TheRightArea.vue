<!-- src/components/TheRightArea.vue -->
<template>
  <div class="layout-area right-area">
    <div class="right-panel-wrapper">
      <!-- 상단 컨트롤 영역 -->
      <div class="control-panel">
        <h3 class="panel-heading">⚡️ 컨트롤 타워 ⚡️</h3>
        <p class="placeholder-text">이곳은 주요 시스템 제어 및 빠른 명령을 수행하는 영역입니다.</p>
        <div class="control-buttons">
          <button class="control-btn">긴급 중지</button>
          <button class="control-btn accent">시스템 리셋</button>
        </div>
      </div>

      <!-- 하단 로그 영역 -->
      <div class="log-display">
        <h3 class="panel-heading">📜 시스템 로그 📜</h3>
        <div class="log-messages">
          <p class="log-entry success">[00:00:01] 시스템 부팅 완료. 모든 모듈 온라인.</p>
          <p class="log-entry info">[00:00:05] '민은 그룹 협력' 프로젝트 시작.</p>
          <p class="log-entry warn">[00:01:23] 트럭 운송망 '초과 포화' 경고: 즉시 재조정 필요!</p>
          <p class="log-entry error">[00:02:10] 버스 노선 #101 '운행 지연' 발생: 원인 분석 중.</p>
          <p class="log-entry info">[00:02:45] KST 표준 시간 동기화 완료.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// TheRightArea 컴포넌트에는 현재 특별한 로직이 없으므로 비워둡니다.
</script>

<!-- scoped SCSS를 외부 .scss 파일로 분리하여 참조합니다. -->
<style scoped lang="scss">
@import '../styles/TheRightArea.scss';
</style>