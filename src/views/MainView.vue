<!-- src/views/MainView.vue -->
<template>
  <div
    class="hub-root"
    :style="{ backgroundImage: `url(${hubImage})` }"
  >
    <!-- ===========================
         모바일 전용 RCTS 로고 영역
    ============================ -->
    <div class="mobile-logo">
      <div class="mobile-logo-main">RCTS</div>
      <div class="mobile-logo-sub">Real City Transport Simulator</div>
    </div>

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

  position: relative;
}

/* ===========================
   모바일 전용 RCTS 로고
=========================== */
.mobile-logo {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);

  display: none; /* 기본은 숨김 (PC/태블릿) */
  text-align: center;
  pointer-events: none;
}

.mobile-logo-main {
  font-size: 32px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  text-shadow: 0 6px 20px rgba(0, 0, 0, 0.85);
}

.mobile-logo-sub {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.85);
  letter-spacing: 0.15em;
  text-transform: uppercase;
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
  overflow: hidden;
}

/* ===========================
   50 : 50 LAYOUT
=========================== */
.hub-main {
  flex: 1;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.hub-left .card-link {
  display: block;
  height: 100%;
}

.hub-left .card {
  height: 100%;
}

.hub-right {
  display: flex;
}

.hub-grid {
  flex: 1;

  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  gap: 14px;
}

.hub-grid .card-link {
  display: block;
  height: 100%;
}

/* ===========================
   카드 공통
=========================== */
.card-link {
  text-decoration: none;
  color: inherit;
}

.card {
  position: relative;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;

  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.8);

  display: flex;
  align-items: flex-end;

  transition:
    transform .15s ease,
    box-shadow .15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(0,0,0,.9);
}

.card-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.card-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,.05),
    rgba(0,0,0,.6)
  );
}

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
   카드 배경 이미지
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
   모바일 전용 스타일
=========================== */
@media (max-width: 767px) {
  .hub-root {
    background-image: radial-gradient(
        circle at top,
        #1e293b 0,
        #020617 52%,
        #000000 100%
      ) !important;
    background-color: #000;
  }

  .mobile-logo {
    display: block;
  }

  .hub-overlay {
    width: 100%;
    height: 100%;
    padding: 120px 16px 24px;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 20px;

    overflow-y: auto;
  }

  .hub-main {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hub-left,
  .hub-right {
    width: 100%;
  }

  .hub-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card-image,
  .card-gradient {
    display: none;
  }

  .card {
    width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: none;

    align-items: center;
    justify-content: center;

    transition:
      background-color .15s ease,
      border-color .15s ease,
      transform .1s ease;
  }

  .card-text {
    width: 100%;
    padding: 14px 18px;
    text-shadow: none;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .card-title {
    font-size: 1.1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .card-sub {
    font-size: 0.78rem;
    opacity: 0.8;
  }

  .card-start {
    min-height: 82px;
    background: linear-gradient(
      135deg,
      #38bdf8 0%,
      #6366f1 45%,
      #a855f7 100%
    );
    border: none;
  }

  .card-start .card-title {
    font-size: 1.2rem;
    letter-spacing: 0.08em;
  }

  .card-start .card-sub {
    font-size: 0.8rem;
    opacity: 0.92;
  }

  .card-start:active {
    transform: scale(0.97);
    filter: brightness(1.05);
  }

  .card-wiki,
  .card-devlog,
  .card-community,
  .card-about {
    min-height: 64px;
    background-color: rgba(15, 23, 42, 0.86);
    border: 1px solid rgba(148, 163, 184, 0.6);
  }

  .card-wiki .card-title,
  .card-devlog .card-title,
  .card-community .card-title,
  .card-about .card-title {
    font-size: 1rem;
  }

  .card-wiki .card-sub,
  .card-devlog .card-sub,
  .card-community .card-sub,
  .card-about .card-sub {
    font-size: 0.75rem;
    opacity: 0.78;
  }

  .card-wiki:active,
  .card-devlog:active,
  .card-community:active,
  .card-about:active {
    transform: scale(0.98);
    border-color: rgba(248, 250, 252, 0.9);
    background-color: rgba(15, 23, 42, 0.96);
  }
}
</style>
