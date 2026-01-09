<!-- src/components/play/settings/SettingsPage.vue -->
<template>
  <div class="settings-root">
    <header class="settings-header">
      <div class="settings-header-left">
        <p class="settings-badge">SETTINGS · CENTER</p>
        <h3 class="settings-title">설정 센터</h3>
        <p class="settings-subtitle">계정/게임/표시/알림/데이터 관리 (더미 UI)</p>
      </div>

      <div class="settings-header-right">
        <button type="button" class="settings-cta" @click="handleSaveDummy">
          저장(더미)
        </button>
      </div>
    </header>

    <section class="settings-stats">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">프로필</span>
          <span class="stat-chip">Account</span>
        </div>
        <p class="stat-value">{{ profile.name }}</p>
        <p class="stat-desc">권한: {{ profile.role }}</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">저장 상태</span>
          <span class="stat-chip chip-ok">OK</span>
        </div>
        <p class="stat-value">{{ saveStateLabel }}</p>
        <p class="stat-desc">마지막 저장: {{ lastSavedAt }}</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">게임 프리셋</span>
          <span class="stat-chip chip-blue">Preset</span>
        </div>
        <p class="stat-value">{{ game.preset }}</p>
        <p class="stat-desc">난이도/속도 기반</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">데이터</span>
          <span class="stat-chip chip-warn">Manage</span>
        </div>
        <p class="stat-value">{{ data.sizeLabel }}</p>
        <p class="stat-desc">로컬 캐시 포함(더미)</p>
      </div>
    </section>

    <section class="settings-layout">
      <aside class="settings-left">
        <div class="panel">
          <div class="panel-head">
            <h4 class="panel-title">설정 메뉴</h4>
            <p class="panel-meta">카테고리 선택</p>
          </div>

          <div class="menu">
            <button
              v-for="m in menus"
              :key="m.key"
              type="button"
              class="menu-item"
              :class="{ 'is-active': activeMenu === m.key }"
              @click="activeMenu = m.key"
            >
              <span class="menu-main">
                <span class="menu-dot" />
                <span class="menu-text">
                  <span class="menu-title">{{ m.label }}</span>
                  <span class="menu-sub">{{ m.desc }}</span>
                </span>
              </span>
              <span v-if="m.badge" class="menu-badge">{{ m.badge }}</span>
            </button>
          </div>
        </div>
      </aside>

      <section class="settings-right">
        <div class="panel panel-detail">
          <div class="panel-head detail-head">
            <div class="detail-title">
              <h4 class="panel-title">{{ currentMenu.label }}</h4>
              <p class="panel-meta">{{ currentMenu.desc }}</p>
            </div>

            <div class="detail-actions">
              <button type="button" class="ghost-btn" @click="handleResetDummy">
                초기화(더미)
              </button>
            </div>
          </div>

          <div class="detail-body">
            <div v-if="activeMenu === 'account'" class="grid">
              <div class="card">
                <h5 class="card-title">프로필</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">표시 이름</span>
                    <input v-model="profile.name" class="input" type="text" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">권한</span>
                    <select v-model="profile.role" class="select">
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Member">Member</option>
                    </select>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">자동 로그인</span>
                    <Toggle v-model="account.autoLogin" />
                  </div>
                </div>
              </div>

              <div class="card">
                <h5 class="card-title">보안</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">2단계 인증</span>
                    <Toggle v-model="account.twoFactor" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">세션 유지</span>
                    <Toggle v-model="account.keepSession" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">로그아웃</span>
                    <button type="button" class="danger-outline" @click="handleLogoutDummy">
                      로그아웃(더미)
                    </button>
                  </div>
                </div>
              </div>

              <div class="card card-wide">
                <h5 class="card-title">연결 정보</h5>
                <p class="card-text">
                  이 영역은 추후 실제 인증/계정 시스템 연결 시, 이메일/연동 계정/로그인 기록 등이 들어갈 자리야.
                </p>
              </div>
            </div>

            <div v-else-if="activeMenu === 'game'" class="grid">
              <div class="card">
                <h5 class="card-title">게임 프리셋</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">프리셋</span>
                    <select v-model="game.preset" class="select">
                      <option value="표준">표준</option>
                      <option value="캐주얼">캐주얼</option>
                      <option value="하드코어">하드코어</option>
                    </select>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">튜토리얼</span>
                    <Toggle v-model="game.tutorial" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">자동 저장</span>
                    <Toggle v-model="game.autoSave" />
                  </div>
                </div>
              </div>

              <div class="card">
                <h5 class="card-title">속도/밸런스</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">게임 속도</span>
                    <div class="range-wrap">
                      <input v-model.number="game.speed" class="range" type="range" min="1" max="5" step="1" />
                      <span class="range-val">{{ game.speed }}x</span>
                    </div>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">난이도</span>
                    <select v-model="game.difficulty" class="select">
                      <option value="쉬움">쉬움</option>
                      <option value="보통">보통</option>
                      <option value="어려움">어려움</option>
                    </select>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">현실 모드</span>
                    <Toggle v-model="game.realism" />
                  </div>
                </div>
              </div>

              <div class="card card-wide">
                <h5 class="card-title">주의</h5>
                <p class="card-text">
                  여기 수치들은 지금은 더미고, 나중에 운영/재정/시간 시스템이 붙으면 실제 체감 밸런스를 좌우해.
                </p>
              </div>
            </div>

            <div v-else-if="activeMenu === 'display'" class="grid">
              <div class="card">
                <h5 class="card-title">테마/표시</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">고대비</span>
                    <Toggle v-model="display.highContrast" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">애니메이션</span>
                    <Toggle v-model="display.animations" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">텍스트 크기</span>
                    <select v-model="display.fontSize" class="select">
                      <option value="작게">작게</option>
                      <option value="보통">보통</option>
                      <option value="크게">크게</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="card">
                <h5 class="card-title">표준 시간 표시</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">표시 형식</span>
                    <select v-model="display.clockFormat" class="select">
                      <option value="YYYY. MM. DD. HH:MM">YYYY. MM. DD. HH:MM</option>
                      <option value="YYYY-MM-DD HH:MM">YYYY-MM-DD HH:MM</option>
                    </select>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">초 표시</span>
                    <Toggle v-model="display.showSeconds" />
                  </div>
                </div>
              </div>

              <div class="card card-wide">
                <h5 class="card-title">미리보기</h5>
                <div class="preview">
                  <div class="preview-row">
                    <span class="preview-key">현재 옵션</span>
                    <span class="preview-val">
                      {{ display.fontSize }} · {{ display.highContrast ? '고대비' : '기본' }} ·
                      {{ display.animations ? '애니메이션 ON' : '애니메이션 OFF' }}
                    </span>
                  </div>
                  <div class="preview-row">
                    <span class="preview-key">시간 형식</span>
                    <span class="preview-val">
                      {{ display.clockFormat }} {{ display.showSeconds ? '(초 포함)' : '' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeMenu === 'notifications'" class="grid">
              <div class="card">
                <h5 class="card-title">알림</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">운영 알림</span>
                    <Toggle v-model="notify.ops" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">정비 알림</span>
                    <Toggle v-model="notify.maintenance" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">재정 알림</span>
                    <Toggle v-model="notify.finance" />
                  </div>
                </div>
              </div>

              <div class="card">
                <h5 class="card-title">알림 강도</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">레벨</span>
                    <select v-model="notify.level" class="select">
                      <option value="낮음">낮음</option>
                      <option value="보통">보통</option>
                      <option value="높음">높음</option>
                    </select>
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">조용한 모드</span>
                    <Toggle v-model="notify.quietMode" />
                  </div>
                </div>
              </div>

              <div class="card card-wide">
                <h5 class="card-title">설명</h5>
                <p class="card-text">
                  나중에 실제 이벤트(차량 고장/운영 이슈/노선 혼잡도 등)랑 연결되면,
                  여기서 알림 룰을 컨트롤하게 될 거야.
                </p>
              </div>
            </div>

            <div v-else class="grid">
              <div class="card">
                <h5 class="card-title">캐시/저장</h5>
                <div class="kv">
                  <div class="kv-row">
                    <span class="kv-key">로컬 캐시</span>
                    <Toggle v-model="data.localCache" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">압축 저장</span>
                    <Toggle v-model="data.compress" />
                  </div>
                  <div class="kv-row">
                    <span class="kv-key">사용량</span>
                    <span class="kv-val">{{ data.sizeLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="card">
                <h5 class="card-title">내보내기(더미)</h5>
                <div class="btn-col">
                  <button type="button" class="ghost-btn" @click="handleExportDummy">
                    설정 내보내기
                  </button>
                  <button type="button" class="ghost-btn" @click="handleImportDummy">
                    설정 가져오기
                  </button>
                </div>
              </div>

              <div class="card card-wide danger-zone">
                <h5 class="card-title danger-title">위험 구역</h5>
                <p class="card-text">
                  여기 버튼들은 “실제로 연결되면” 진짜 데이터가 날아갈 수 있어. 지금은 전부 더미 처리야.
                </p>

                <div class="danger-actions">
                  <button type="button" class="danger-btn" @click="handleWipeLocalDummy">
                    로컬 데이터 초기화(더미)
                  </button>
                  <button type="button" class="danger-btn" @click="handleFactoryResetDummy">
                    공장 초기화(더미)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'

type MenuKey = 'account' | 'game' | 'display' | 'notifications' | 'data'

const menus = [
  { key: 'account', label: '계정', desc: '프로필 · 보안 · 세션', badge: '' },
  { key: 'game', label: '게임', desc: '난이도 · 속도 · 자동 저장', badge: '' },
  { key: 'display', label: '표시', desc: '테마 · 텍스트 · 시간 표시', badge: '' },
  { key: 'notifications', label: '알림', desc: '운영/정비/재정 이벤트', badge: 'beta' },
  { key: 'data', label: '데이터', desc: '캐시 · 내보내기 · 초기화', badge: '' },
] as const

const activeMenu = ref<MenuKey>('account')

const currentMenu = computed(() => {
  return menus.find((m) => m.key === activeMenu.value) ?? menus[0]
})

const profile = ref({
  name: 'ME Making',
  role: 'Owner',
})

const account = ref({
  autoLogin: true,
  twoFactor: false,
  keepSession: true,
})

const game = ref({
  preset: '표준',
  tutorial: true,
  autoSave: true,
  speed: 2,
  difficulty: '보통',
  realism: false,
})

const display = ref({
  highContrast: false,
  animations: true,
  fontSize: '보통',
  clockFormat: 'YYYY. MM. DD. HH:MM',
  showSeconds: false,
})

const notify = ref({
  ops: true,
  maintenance: true,
  finance: false,
  level: '보통',
  quietMode: false,
})

const data = ref({
  localCache: true,
  compress: true,
  sizeLabel: '24.8 MB',
})

const saveState = ref<'saved' | 'dirty' | 'saving'>('saved')
const lastSavedAt = ref('2026-01-09 22:00')

const saveStateLabel = computed(() => {
  if (saveState.value === 'saving') return '저장 중'
  if (saveState.value === 'dirty') return '변경됨'
  return '저장됨'
})

const markDirty = () => {
  if (saveState.value !== 'saving') saveState.value = 'dirty'
}
const markSaved = () => {
  saveState.value = 'saved'
  lastSavedAt.value = '2026-01-09 22:00'
}

const handleSaveDummy = async () => {
  saveState.value = 'saving'
  await new Promise((r) => setTimeout(r, 180))
  markSaved()
}

const handleResetDummy = async () => {
  saveState.value = 'saving'
  await new Promise((r) => setTimeout(r, 140))
  saveState.value = 'saved'
}

const handleLogoutDummy = () => { markDirty() }
const handleExportDummy = () => { markDirty() }
const handleImportDummy = () => { markDirty() }
const handleWipeLocalDummy = () => { markDirty() }
const handleFactoryResetDummy = () => { markDirty() }

const Toggle = defineComponent({
  name: 'SettingsToggle',
  props: {
    modelValue: { type: Boolean, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const onToggle = () => {
      emit('update:modelValue', !props.modelValue)
      markDirty()
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          class: ['toggle', props.modelValue ? 'is-on' : 'is-off'],
          onClick: onToggle,
          'aria-pressed': String(props.modelValue),
        },
        [
          h('span', { class: 'toggle-track' }),
          h('span', { class: ['toggle-label', 'toggle-label-off'] }, 'OFF'),
          h('span', { class: ['toggle-label', 'toggle-label-on'] }, 'ON'),
          h('span', { class: 'toggle-knob' }),
        ]
      )
  },
})
</script>

<style scoped>
.settings-root {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 */

.settings-header {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.16),
      rgba(15, 23, 42, 0.98)
    );
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.settings-header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.settings-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.96);
}

.settings-title {
  font-size: 0.98rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.98);
  line-height: 1.1;
}

.settings-subtitle {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.4;
}

.settings-cta {
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.98);
  cursor: pointer;
  transition:
    transform 0.08s ease-out,
    box-shadow 0.16s ease-out,
    border-color 0.16s ease-out;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.9);
}

.settings-cta:hover {
  transform: translateY(-1px);
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.6);
}

/* 상단 요약 */

.settings-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat-label {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.92);
}

.stat-chip {
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(2, 6, 23, 0.6);
  color: rgba(226, 232, 240, 0.9);
  letter-spacing: 0.08em;
}

.chip-ok { border-color: rgba(34, 197, 94, 0.75); }
.chip-blue { border-color: rgba(59, 130, 246, 0.75); }
.chip-warn { border-color: rgba(251, 191, 36, 0.8); }

.stat-value {
  font-size: 1.02rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-desc {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.35;
}

/* 레이아웃 */

.settings-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.settings-left,
.settings-right {
  min-height: 0;
}

/* 패널 공통 */

.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-head {
  padding: 10px 10px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
}

.panel-meta {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.82);
  white-space: nowrap;
}

/* 좌 메뉴 */

.menu {
  padding: 8px 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}

.menu-item {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.menu-item:hover {
  border-color: rgba(191, 219, 254, 0.9);
  transform: translateY(-1px);
}

.menu-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.menu-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.menu-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.9);
  box-shadow: 0 0 10px rgba(191, 219, 254, 0.4);
  flex: 0 0 auto;
}

.menu-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-title {
  font-size: 0.82rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-sub {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.84);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-badge {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.88);
  color: rgba(226, 232, 240, 0.92);
  letter-spacing: 0.06em;
}

/* 상세 */

.panel-detail { overflow: hidden; }

.detail-head {
  align-items: center;
}

.detail-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-body {
  padding: 10px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  min-height: 0;
}

/* 카드/그리드 */

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 10px;
}

.card-wide { grid-column: 1 / -1; }

.card-title {
  font-size: 0.82rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  margin-bottom: 8px;
}

.card-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.6;
}

.kv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.kv-key {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
}

.kv-val {
  font-size: 0.76rem;
  color: rgba(248, 250, 252, 0.95);
  font-weight: 900;
}

/* 입력 UI */

.input,
.select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.65);
  background: rgba(2, 6, 23, 0.45);
  padding: 8px 10px;
  color: rgba(226, 232, 240, 0.94);
  font-size: 0.78rem;
  outline: none;
  box-sizing: border-box;
}

.input:focus,
.select:focus {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
}

.range-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.range {
  width: 100%;
}

.range-val {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.92);
  white-space: nowrap;
}

/* 토글 */

.toggle {
  width: 54px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.75);
  position: relative;
  cursor: pointer;

  /* ✅ 전역 button color(검정) 덮어쓰기 */
  color: rgba(248, 250, 252, 0.96) !important;
  -webkit-text-fill-color: rgba(248, 250, 252, 0.96) !important;

  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out;
}

.toggle.is-on {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(
    circle at left,
    rgba(37, 99, 235, 0.25),
    rgba(15, 23, 42, 0.85)
  );
  z-index: 1;
}

.toggle-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 2; /* ✅ 트랙 위로 */
  pointer-events: none;

  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0.08em;

  /* ✅ 전역 button color(검정) 강제 무력화 */
  color: rgba(248, 250, 252, 0.98) !important;
  -webkit-text-fill-color: rgba(248, 250, 252, 0.98) !important;

  text-shadow: 0 1px 0 rgba(2, 6, 23, 0.8);
  transition: opacity 0.14s ease-out;
}

/* OFF일 때는 OFF만 보이게 */
.toggle-label-on { opacity: 0; }
.toggle.is-on .toggle-label-on { opacity: 1; }
.toggle.is-on .toggle-label-off { opacity: 0; }

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.96);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.9);
  transition: transform 0.16s ease-out;
  z-index: 3; /* ✅ 제일 위 */
}

.toggle.is-on .toggle-knob {
  transform: translateX(26px);
}

/* 버튼 */

.ghost-btn {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.7);
  padding: 7px 10px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.92);
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.ghost-btn:hover {
  border-color: rgba(191, 219, 254, 0.95);
  transform: translateY(-1px);
}

.danger-outline {
  border-radius: 12px;
  border: 1px solid rgba(244, 63, 94, 0.7);
  background: rgba(2, 6, 23, 0.35);
  padding: 8px 10px;
  font-size: 0.78rem;
  color: rgba(248, 250, 252, 0.92);
  font-weight: 900;
  cursor: pointer;
}

.danger-outline:hover {
  border-color: rgba(244, 63, 94, 1);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.18);
}

.btn-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 프리뷰 */

.preview {
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.25);
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.preview-key {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
}

.preview-val {
  font-size: 0.78rem;
  color: rgba(248, 250, 252, 0.9);
  font-weight: 900;
}

/* 위험 구역 */

.danger-zone {
  border-color: rgba(244, 63, 94, 0.55);
  background: rgba(2, 6, 23, 0.35);
}

.danger-title {
  color: rgba(254, 202, 202, 0.95);
}

.danger-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.danger-btn {
  border-radius: 999px;
  border: 1px solid rgba(244, 63, 94, 0.65);
  background: rgba(15, 23, 42, 0.55);
  padding: 8px 12px;
  font-size: 0.78rem;
  color: rgba(248, 250, 252, 0.92);
  font-weight: 900;
  cursor: pointer;
}

.danger-btn:hover {
  border-color: rgba(244, 63, 94, 1);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.16);
}

/* 반응형 */

@media (max-width: 1100px) {
  .settings-layout {
    grid-template-columns: 320px minmax(0, 1fr);
  }
}

@media (max-width: 859px) {
  .settings-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .settings-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .kv-row {
    grid-template-columns: 100px minmax(0, 1fr);
  }

  .preview-row {
    grid-template-columns: 100px minmax(0, 1fr);
  }
}
</style>
