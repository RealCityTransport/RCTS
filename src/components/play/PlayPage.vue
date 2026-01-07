<!-- src/components/play/PlayPage.vue -->
<template>
  <div class="play-page-root">
    <section class="play-shell">
      <!-- 상단 헤더 영역 -->
      <header class="play-header">
        <div class="play-header-main">
          <p class="play-badge">PLAY · HUB</p>
          <h2 class="play-title">RCTS 플레이 허브</h2>
          <p class="play-subtitle">
            RCTS에 로그인한 뒤 실제 플레이를 시작하기 전,
            가장 먼저 거치는 시작 화면입니다.
            회사 정보를 등록하고, 운영·노선·차량·설정을 한곳에서 관리하면서
            원하는 시점에 각 상세 화면으로 진입할 수 있습니다.
          </p>

          <!-- 허브 내 메뉴 탭 -->
          <nav class="play-nav">
            <button
              v-for="item in menuItems"
              :key="item.key"
              type="button"
              class="play-nav-item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="activeMenu = item.key"
            >
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
            </button>
          </nav>
        </div>

        <aside class="play-header-side">
          <div class="play-header-card">
            <p class="side-label">현재 선택한 영역</p>
            <p class="side-value">
              {{ currentMenuLabel }}
            </p>
            <p class="side-hint">
              <template v-if="activeMenu === 'company'">
                회사 정보는 선택 사항입니다. 회사를 등록하지 않아도 플레이는 가능하지만,
                회사 이름과 본사 위치를 지정해 두면
                운영·노선·차량 통계를 회사 단위로 묶어서 보는 것이 훨씬 편해집니다.
              </template>
              <template v-else-if="activeMenu === 'operations'">
                운영 화면은 실제 플레이 중 가장 오래 머무는 주요 화면입니다.
                전체 운행 상황, 알림, 노선·차량 요약 정보를 한 화면에서 확인하고,
                필요할 때마다 세부 화면으로 이동할 수 있도록 설계됩니다.
              </template>
              <template v-else-if="activeMenu === 'routes'">
                노선 화면에서는 노선 목록과 상태, 배차 정보를 관리합니다.
                이후에는 노선별 상세 보기, 수요 흐름, 혼잡 구간 확인 등
                노선 운영에 필요한 정보들이 이 영역으로 모이게 됩니다.
              </template>
              <template v-else-if="activeMenu === 'vehicles'">
                차량 화면에서는 보유 차량 목록, 타입별 필터, 가동/정비 상태 등을
                집중적으로 관리하게 됩니다.
                나중에는 모딩으로 추가한 차량도 이곳에서 함께 관리할 수 있습니다.
              </template>
              <template v-else-if="activeMenu === 'settings'">
                설정 화면에서는 플레이 환경, 표시 옵션, 계정 연동 등
                자주 바꾸지 않지만 중요도 높은 항목들을 모아서 관리합니다.
              </template>
            </p>
          </div>
        </aside>
      </header>

      <!-- 본문: 좌측 메인 패널 / 우측 안내 패널 -->
      <main class="play-body">
        <!-- 좌측: 선택된 메뉴 내용 -->
        <section class="play-primary">
          <div class="play-primary-inner">
            <!-- 메뉴: 회사 -->
            <CompanyPage v-if="activeMenu === 'company'" />

            <!-- 메뉴: 운영 -->
            <OperationsPage
              v-else-if="activeMenu === 'operations'"
            />

            <!-- 메뉴: 노선 -->
            <RoutesPage
              v-else-if="activeMenu === 'routes'"
            />

            <!-- 메뉴: 차량 -->
            <div
              v-else-if="activeMenu === 'vehicles'"
              class="section-panel"
            >
              <h3 class="section-title">차량 관리</h3>
              <p class="section-desc">
                이 화면에서는 보유 차량과 편성 상태를 관리합니다.
                차량 타입별 분류, 가동률, 정비 대기 상태 등을 확인하고,
                추후에는 모딩으로 추가한 차량도 동일한 방식으로 다룰 수 있습니다.
              </p>

              <div class="section-grid">
                <div class="section-card">
                  <h4 class="section-card-title">차량 목록</h4>
                  <p class="section-card-text">
                    버스, 철도, 항공, 해상 등 다양한 차량들을 한 목록에서 관리합니다.
                    검색과 필터 기능을 통해 특정 차량만 빠르게 찾아볼 수 있도록 확장됩니다.
                  </p>
                </div>
                <div class="section-card">
                  <h4 class="section-card-title">상태 및 가동률</h4>
                  <p class="section-card-text">
                    운행 중, 대기, 정비 중 등 차량 상태를 구분해서 보여주고,
                    전체 가동률을 간단히 확인하는 영역입니다.
                  </p>
                </div>
                <div class="section-card">
                  <h4 class="section-card-title">편성 관리</h4>
                  <p class="section-card-text">
                    특정 노선에 어떤 차량이 투입되어 있는지,
                    편성 단위로 묶어서 관리하는 기능이 이 영역을 중심으로 추가될 예정입니다.
                  </p>
                </div>
              </div>
            </div>

            <!-- 메뉴: 설정 -->
            <div
              v-else-if="activeMenu === 'settings'"
              class="section-panel"
            >
              <h3 class="section-title">플레이 설정</h3>
              <p class="section-desc">
                플레이 환경과 표시 방식, 계정·회사 연동과 관련된 설정을 모아두는 화면입니다.
                자주 변경되지는 않지만, 한 번 설정해 두면
                이후 플레이 전체에 영향을 주는 항목들이 여기에 모이게 됩니다.
              </p>

              <div class="section-grid">
                <div class="section-card">
                  <h4 class="section-card-title">환경 설정</h4>
                  <p class="section-card-text">
                    게임 속도, 자동 저장 주기, 기본 표시 단위 등
                    전반적인 플레이 환경을 조정하는 옵션이 들어올 예정입니다.
                  </p>
                </div>
                <div class="section-card">
                  <h4 class="section-card-title">표시 옵션</h4>
                  <p class="section-card-text">
                    UI 밀도, 효과 표시 여부, 색상 계열 등
                    화면을 어떻게 보여줄지에 대한 옵션을 묶어서 관리하는 영역입니다.
                  </p>
                </div>
                <div class="section-card">
                  <h4 class="section-card-title">계정 & 연동</h4>
                  <p class="section-card-text">
                    로그인 계정, 회사 프로필 연동, 향후 외부 서비스와의 연동 옵션 등을
                    한곳에서 관리할 수 있도록 확장할 계획입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 우측: 안내/확장 슬롯 -->
        <aside class="play-side">
          <article class="side-card">
            <h3 class="side-title">플레이 허브 안내</h3>
            <p class="side-text">
              플레이 허브는 RCTS에서 자주 오게 되는 기본 시작점입니다.
              회사·운영·노선·차량·설정 화면으로 이동하기 전,
              현재 상황을 정리하고 어디로 들어갈지 고르는 선택창 역할을 합니다.
            </p>
            <ol class="side-list">
              <li>회사를 등록하거나, 회사 없이 바로 운영을 시작할 수 있습니다.</li>
              <li>운영 화면에서 전체 상황을 확인한 뒤, 필요한 세부 화면으로 이동합니다.</li>
              <li>노선과 차량 화면에서 상세한 편집과 정리를 수행합니다.</li>
              <li>설정 화면에서 플레이 환경과 표시 방식을 한 번에 관리합니다.</li>
            </ol>
            <p class="side-note">
              이 허브는 앞으로도 계속 확장되며,
              최근 플레이 기록, 즐겨찾는 화면, 알림 요약 등이 추가될 수 있습니다.
            </p>
          </article>

          <article class="side-card side-card-muted">
            <h3 class="side-title">이 화면을 활용하는 방법</h3>
            <ul class="side-list bullet">
              <li>새로 시작할 때는 회사 → 운영 순서로 진입해 보세요.</li>
              <li>이미 플레이 중이라면 바로 운영 메뉴로 들어가 현재 상황을 확인합니다.</li>
              <li>노선/차량 메뉴는 상세 편집이 필요할 때 사용하는 입구로 활용합니다.</li>
              <li>환경이 마음에 들지 않으면 설정 메뉴에서 한 번에 조정할 수 있습니다.</li>
            </ul>
            <p class="side-note">
              실제 서비스에서는 이 영역에 공지나 패치 노트, 가이드 링크도 함께 노출할 수 있습니다.
            </p>
          </article>
        </aside>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CompanyPage from '@/components/company/CompanyPage.vue'
import OperationsPage from '@/components/operations/OperationsPage.vue'
import RoutesPage from '@/components/routes/RoutesPage.vue'

type MenuKey = 'company' | 'operations' | 'routes' | 'vehicles' | 'settings'

const menuItems: { key: MenuKey; label: string; badge?: string }[] = [
  { key: 'company', label: '회사' },
  { key: 'operations', label: '운영' },
  { key: 'routes', label: '노선' },
  { key: 'vehicles', label: '차량' },
  { key: 'settings', label: '설정' },
]

const activeMenu = ref<MenuKey>('company')

const currentMenuLabel = computed(() => {
  const found = menuItems.find((m) => m.key === activeMenu.value)
  return found ? found.label : ''
})
</script>

<style scoped>
.play-page-root {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 8px 16px;
  justify-content: center;
}

.play-shell {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 28px);
}

.play-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.play-header-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-title {
  font-size: 1.05rem;
  font-weight: 700;
}

.play-subtitle {
  font-size: 0.82rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 상단 메뉴 탭 */

.play-nav {
  margin-top: 10px;
  padding: 6px 6px;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 999px;
  background: radial-gradient(
    circle at top left,
    rgba(30, 64, 175, 0.4),
    rgba(15, 23, 42, 0.98)
  );
  border: 1px solid rgba(129, 140, 248, 0.8);
}

.play-nav-item {
  position: relative;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.5px solid rgba(148, 163, 184, 0.9);
  background: linear-gradient(
    135deg,
    rgba(30, 64, 175, 0.55),
    rgba(15, 23, 42, 0.98)
  );
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.8);
  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.play-nav-item .nav-label {
  opacity: 0.96;
}

.play-nav-item .nav-badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.9);
}

.play-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.8),
    rgba(15, 23, 42, 0.98)
  );
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.9);
}

.play-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  color: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.95);
}

.play-header-side {
  display: flex;
}

.play-header-card {
  width: 100%;
  padding: 8px 10px;
  border-radius: 12px;
  background: radial-gradient(
    circle at top left,
    rgba(56, 189, 248, 0.18),
    rgba(15, 23, 42, 0.96)
  );
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.78rem;
}

.side-label {
  font-size: 0.74rem;
  opacity: 0.8;
  margin-bottom: 2px;
}

.side-value {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.side-hint {
  font-size: 0.78rem;
  opacity: 0.88;
  line-height: 1.5;
}

/* 본문 레이아웃 */

.play-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 좌측: 메인 패널 */

.play-primary {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  padding: 10px 12px;
  box-sizing: border-box;
  display: flex;
}

.play-primary-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* 공통 섹션 패널 (차량/설정) */

.section-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.section-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

.section-grid {
  margin-top: 2px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.section-card {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.section-card-title {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.section-card-text {
  font-size: 0.78rem;
  opacity: 0.88;
  line-height: 1.5;
}

/* 우측: 안내 패널 (보조 패널) */

.play-side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-card {
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.65);
  padding: 10px 12px;
  font-size: 0.8rem;
}

.side-card-muted {
  background: rgba(15, 23, 42, 0.88);
  border-style: dashed;
}

.side-title {
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.side-list {
  margin: 0 0 6px;
  padding-left: 16px;
  line-height: 1.6;
}

.side-list.bullet {
  list-style: disc;
}

.side-note {
  font-size: 0.76rem;
  opacity: 0.82;
  line-height: 1.5;
}

.side-text {
  margin-bottom: 4px;
  opacity: 0.88;
}

/* 반응형 */

@media (min-width: 860px) {
  .play-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .play-header-main {
    flex: 2;
  }

  .play-header-side {
    flex: 1.2;
  }

  .play-body {
    flex-direction: row;
  }

  .play-primary {
    flex: 3;
  }

  .play-side {
    flex: 1.2;
  }

  .section-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
