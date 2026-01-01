<!-- src/views/MainView.vue -->
<template>
  <div
    class="hub-root"
    :style="{ backgroundImage: `url(${hubImage})` }"
  >
    <div class="hub-overlay">
      <main class="hub-main">
        <!-- ====================================
             LEFT 50%  :  START PLAYING
        ==================================== -->
        <section class="hub-left">
          <router-link to="/play" class="card-link">
            <div class="card card-start">
              <div class="card-image"></div>
              <div class="card-gradient"></div>

              <div class="card-text">
                <div class="card-title">Start Playing</div>
                <div class="card-sub">ENTER THE WORLD</div>
              </div>
            </div>
          </router-link>
        </section>

        <!-- ====================================
             RIGHT 50% GRID
        ==================================== -->
        <section class="hub-right">
          <div class="hub-grid">
            <router-link to="/wiki" class="card-link">
              <div class="card card-wiki">
                <div class="card-image"></div>
                <div class="card-gradient"></div>

                <div class="card-text">
                  <div class="card-title">Wiki</div>
                  <div class="card-sub">GAME GUIDE &amp; INFO</div>
                </div>
              </div>
            </router-link>

            <router-link to="/devlog" class="card-link">
              <div class="card card-devlog">
                <div class="card-image"></div>
                <div class="card-gradient"></div>

                <div class="card-text">
                  <div class="card-title">Devlog</div>
                  <div class="card-sub">LATEST UPDATES</div>
                </div>
              </div>
            </router-link>

            <router-link to="/community" class="card-link">
              <div class="card card-community">
                <div class="card-image"></div>
                <div class="card-gradient"></div>

                <div class="card-text">
                  <div class="card-title">Community</div>
                  <div class="card-sub">FORUMS &amp; CHAT</div>
                </div>
              </div>
            </router-link>

            <router-link to="/about" class="card-link">
              <div class="card card-about">
                <div class="card-image"></div>
                <div class="card-gradient"></div>

                <div class="card-text">
                  <div class="card-title">About</div>
                  <div class="card-sub">LEARN MORE</div>
                </div>
              </div>
            </router-link>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import hubImage from '@/assets/rcts-hub-main.png'
</script>

<style scoped>
/* ===========================
   배경
=========================== */
.hub-root {
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===========================
   중앙 컨테이너
=========================== */
.hub-overlay {
  width: min(1152px, 100vw - 24px);
  height: min(768px, 100vh - 24px);

  padding: 300px 48px 40px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
}

/* ===========================
   50 : 50 LAYOUT
=========================== */
.hub-main {
  flex: 1;

  display: grid;
  grid-template-columns: 1fr 1fr; /* 50 / 50 */
  gap: 24px;
}

/* LEFT 50% */
/* RIGHT 50% */
.hub-right {
  display: flex;
}

.hub-grid {
  flex: 1;

  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 x 2 */
  grid-auto-rows: 1fr;           /* 각 행 높이 균등 */
  gap: 14px;
}

/* ===========================
   링크 공통
=========================== */
.card-link {
  display: block;
  height: 100%;       /* 🔥 각 그리드 셀 높이 100% 채움 */
  text-decoration: none;
  color: inherit;
}

/* ===========================
   카드 공통
=========================== */
.card {
  position: relative;
  height: 100%;       /* 🔥 부모(link)의 100% 높이 사용 */
  border-radius: 18px;
  overflow: hidden;

  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.8);

  display: flex;
  align-items: flex-end;

  transition: transform .15s ease, box-shadow .15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(0,0,0,.9);
}

/* 이미지 */
.card-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

/* 가독성 그라디언트 */
.card-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,.05),
    rgba(0,0,0,.6)
  );
}

/* 텍스트 — 좌측 하단 */
.card-text {
  position: relative;
  z-index: 2;
  padding: 16px 18px;

  color: #fff;
  text-shadow: 0 2px 6px rgba(0,0,0,.8);

  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 900;
}

.card-sub {
  font-size: .85rem;
  opacity: .95;
}

/* ===========================
   카드별 배경 이미지
=========================== */
.card-start .card-image {
  background-image: url('@/assets/cards/card-start.png');
}

.card-wiki .card-image {
  background-image: url('@/assets/cards/card-wiki.png');
}

.card-devlog .card-image {
  background-image: url('@/assets/cards/card-devlog.png');
}

.card-community .card-image {
  background-image: url('@/assets/cards/card-community.png');
}

.card-about .card-image {
  background-image: url('@/assets/cards/card-about.png');
}

/* ===========================
   반응형
=========================== */
@media (max-width: 900px) {
  .hub-overlay {
    padding: 180px 16px 24px;
  }

  .hub-main {
    grid-template-columns: 1fr;
  }

  .hub-grid {
    grid-template-columns: 1fr;
  }

  .card {
    height: auto; /* 모바일에서는 내용에 맞게 */
  }
}
</style>
