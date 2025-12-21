<!-- src/views/LineView.vue -->
<template>
  <div class="page">
    <header class="page-header">
      <h1 class="title">노선</h1>
      <p class="desc">노선/정차지/배차 운영 기능은 아직 잠겨 있습니다. 연구로 개방할 수 있어요.</p>

      <div class="status-row">
        <span class="badge lock">LOCKED</span>
        <span class="badge">노선 시스템</span>
        <button class="btn primary" @click="goResearch">연구로 이동</button>
      </div>
    </header>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">노선 운영</h2>
        <div class="panel-actions">
          <button class="btn" disabled>노선 생성</button>
          <button class="btn" disabled>정차지 편집</button>
          <button class="btn ghost" disabled>수익 분석</button>
        </div>
      </div>

      <div class="empty">
        현재는 잠금 상태입니다. 노선 개방 연구 완료 후 이용 가능합니다.
      </div>

      <div class="list">
        <article class="card" v-for="n in 8" :key="n">
          <div class="card-left">
            <div class="icon">🧭</div>
          </div>

          <div class="card-mid">
            <div class="name-row">
              <div class="name">잠김 노선 슬롯</div>
              <div class="meta">
                <span class="pill lock">잠김</span>
                <span class="pill time">—</span>
              </div>
            </div>
            <div class="hint2">
              해금 후: 정차지, 배차 간격, 혼잡도, 수익/비용 분석이 활성화됩니다.
            </div>
          </div>

          <div class="card-right">
            <button class="btn primary" disabled>잠김</button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">미리보기</h2>
      <p class="panel-desc">해금 후 제공될 주요 표/리포트 영역입니다.</p>

      <div class="table">
        <div class="table-head">
          <span>노선</span><span>구간</span><span>배차</span><span>수요</span><span>손익</span>
        </div>
        <div class="table-row" v-for="n in 8" :key="n">
          <span class="muted">—</span><span class="muted">—</span><span class="muted">—</span><span class="muted">—</span><span class="muted">—</span>
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
   LineView (LOCKED)
   - Page owns scroll (no max-height hacks)
   - Mobile: cards stack, actions wrap, table scrolls horizontally
   - Scrollbar hidden but scroll works
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
.panel-desc{ margin:8px 0 0 0; opacity:0.85; font-size:13px; line-height:1.35; }

.panel-actions{ display:flex; gap:8px; flex-wrap:wrap; }

.list{
  margin-top:12px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.card{
  display:grid;
  grid-template-columns:44px 1fr 120px;
  gap:12px;
  align-items:center;
  padding:12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.10);
  background:rgba(0,0,0,0.20);
}

.icon{
  width:44px;
  height:44px;
  display:grid;
  place-items:center;
  font-size:22px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.10);
  background:rgba(255,255,255,0.03);
}

.name-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}
.name{ font-weight:900; }

.meta{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.pill{
  font-size:11px;
  padding:4px 8px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.12);
  background:rgba(255,255,255,0.03);
  opacity:0.9;
}
.pill.lock{ opacity:0.75; }
.pill.time{ opacity:0.75; }

.hint2{ margin-top:6px; opacity:0.85; font-size:12px; line-height:1.35; }

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
  grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr 0.8fr;
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

.muted{ opacity:0.6; }

/* =========================================================
   Responsive
   ========================================================= */
@media (max-width: 900px){
  /* 상단 버튼은 줄바꿈 시 100% */
  .status-row .btn.primary{ width: 100%; }

  /* 패널 헤더 스택 */
  .panel-head{
    flex-direction: column;
    align-items: stretch;
  }
  .panel-actions .btn{ flex: 1; }

  /* 카드 스택 */
  .card{
    grid-template-columns:44px 1fr;
    align-items:start;
  }
  .card-right{
    grid-column: 1 / -1;
  }
  .card-right .btn{ width: 100%; }

  /* 테이블: 모바일에서 가로 스크롤(깨짐 방지) */
  .table{
    overflow-x:auto;
    -ms-overflow-style:none;
    scrollbar-width:none;
  }
  .table::-webkit-scrollbar{ width:0; height:0; }
  .table-head, .table-row{
    min-width: 560px;
  }
}

@media (max-width: 520px){
  .page{ padding:12px; }
  .panel{ padding:12px; }
  .title{ font-size:18px; }
  .panel-title{ font-size:15px; }
  .badge{ font-size:11px; padding:5px 8px; }
}
</style>
