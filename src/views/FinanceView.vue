<!-- src/views/FinanceView.vue -->
<template>
  <div class="page">
    <header class="page-header">
      <h1 class="title">재정</h1>
      <p class="desc">현금흐름/손익/리포트 기능은 아직 잠겨 있습니다. 연구로 개방할 수 있어요.</p>

      <div class="status-row">
        <span class="badge lock">LOCKED</span>
        <span class="badge">재정 시스템</span>
        <button class="btn primary" @click="goResearch">연구로 이동</button>
      </div>
    </header>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">재정 대시보드</h2>
        <div class="panel-actions">
          <button class="btn" disabled>일간</button>
          <button class="btn" disabled>주간</button>
          <button class="btn" disabled>월간</button>
          <button class="btn ghost" disabled>내보내기</button>
        </div>
      </div>

      <div class="empty">
        현재는 잠금 상태입니다. 재정 개방 연구 완료 후 이용 가능합니다.
      </div>

      <div class="grid">
        <div class="mini-card" v-for="n in 4" :key="n">
          <div class="mini-title">지표</div>
          <div class="mini-value muted">—</div>
          <div class="mini-sub muted">잠김</div>
        </div>
      </div>

      <div class="table">
        <div class="table-head">
          <span>항목</span><span>금액</span><span>변동</span><span>비고</span>
        </div>
        <div class="table-row" v-for="n in 8" :key="n">
          <span class="muted">—</span><span class="muted">—</span><span class="muted">—</span><span class="muted">—</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function goResearch() {
  router.push('/home/research');
}
</script>

<style scoped>
/* =========================================================
   FinanceView (LOCKED)
   - Local code preserved (structure/text)
   - Layout stabilization: remove max-height hacks
   - Mobile: stack header/actions, table horizontal scroll
   ========================================================= */

.page{
  width:100%;
  height:100%;
  min-height:0;

  overflow-y:auto;
  overflow-x:hidden;

  /* ✅ max-height 제거 */
  padding:18px;
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  gap:14px;

  -ms-overflow-style:none;
  scrollbar-width:none;
}
.page::-webkit-scrollbar{ width:0; height:0; }

.page-header{
  padding:14px 14px;
  border:1px solid rgba(255,255,255,0.10);
  border-radius:12px;
  background:rgba(255,255,255,0.04);
}
.title{ margin:0 0 6px 0; font-size:20px; font-weight:800; }
.desc{ margin:0 0 10px 0; opacity:0.85; font-size:13px; line-height:1.35; }

.status-row{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }

.badge{
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.12);
  background:rgba(0,0,0,0.25);
  opacity:0.95;
}
.badge.lock{
  border-color: rgba(255, 140, 140, 0.22);
  background: rgba(255, 140, 140, 0.08);
  font-weight:900;
  letter-spacing:0.06em;
}

.panel{
  padding:14px;
  border:1px solid rgba(255,255,255,0.10);
  border-radius:12px;
  background:rgba(255,255,255,0.03);
}
.panel-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:8px;
}
.panel-title{ margin:0; font-size:16px; font-weight:800; }

.panel-actions{ display:flex; gap:8px; flex-wrap:wrap; }

.btn{
  border:1px solid rgba(255,255,255,0.14);
  background:rgba(255,255,255,0.06);
  color:inherit;
  padding:8px 10px;
  border-radius:10px;
  cursor:pointer;
  font-size:12px;
}
.btn:disabled{ opacity:0.55; cursor:not-allowed; }
.btn.ghost{ opacity:0.9; }
.btn.primary{
  border-color: rgba(120, 255, 120, 0.25);
  background: rgba(120, 255, 120, 0.12);
  font-weight:800;
}

.empty{
  margin-top:12px;
  padding:14px;
  border-radius:12px;
  border:1px dashed rgba(255,255,255,0.18);
  opacity:0.85;
  font-size:13px;
}

.grid{
  margin-top:12px;
  display:grid;
  grid-template-columns: repeat(4, 1fr);
  gap:10px;
}
.mini-card{
  border:1px solid rgba(255,255,255,0.10);
  border-radius:12px;
  background:rgba(0,0,0,0.18);
  padding:12px;
  min-height:86px;
}
.mini-title{ font-weight:900; font-size:12px; opacity:0.9; }
.mini-value{ margin-top:10px; font-weight:900; font-size:18px; }
.mini-sub{ margin-top:6px; font-size:12px; opacity:0.75; }
.muted{ opacity:0.6; }

/* table */
.table{
  margin-top:12px;
  border:1px solid rgba(255,255,255,0.10);
  border-radius:12px;
  overflow:hidden;
  background: rgba(0,0,0,0.12);
}
.table-head, .table-row{
  display:grid;
  grid-template-columns: 1.2fr 1fr 0.8fr 1fr;
  gap:10px;
  padding:10px 12px;
}
.table-head{
  font-weight:900;
  border-bottom:1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
}
.table-row{
  border-bottom:1px solid rgba(255,255,255,0.06);
}
.table-row:last-child{ border-bottom:0; }

/* =========================================================
   Responsive
   ========================================================= */
@media (max-width: 900px){
  .grid{ grid-template-columns: repeat(2, 1fr); }

  /* 상단 버튼은 줄바꿈 시 100% */
  .status-row .btn.primary{ width: 100%; }

  /* 패널 헤더 스택 */
  .panel-head{
    flex-direction: column;
    align-items: stretch;
  }
  .panel-actions .btn{ flex: 1; }

  /* 테이블: 모바일에서 깨짐 방지(가로 스크롤) */
  .table{
    overflow-x:auto;
    -ms-overflow-style:none;
    scrollbar-width:none;
  }
  .table::-webkit-scrollbar{ width:0; height:0; }
  .table-head, .table-row{
    min-width: 520px;
  }
}

@media (max-width: 520px){
  .grid{ grid-template-columns: 1fr; }
  .page{ padding:12px; }
  .panel{ padding:12px; }
  .title{ font-size:18px; }
  .panel-title{ font-size:15px; }
  .badge{ font-size:11px; padding:5px 8px; }
}
</style>
