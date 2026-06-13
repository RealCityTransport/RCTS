<template>
  <div class="rcts-shell" :class="{ 'terraria-mode': activePage === 'terraria' }">
    <header class="top-header">
      <div class="brand">
        <strong>{{ activePage === 'terraria' ? 'TERRARIA' : 'RCTS' }}</strong>
        <span>{{ activePage === 'terraria' ? 'NPC 스토리보드 세계' : '그룹 자동 진행 · 커스텀 노선' }}</span>
      </div>
      <nav class="page-switch" aria-label="프로젝트 전환">
        <button type="button" :class="{ active: activePage === 'rcts' }" @click="activePage = 'rcts'">
          RCTS
        </button>
        <button type="button" :class="{ active: activePage === 'terraria' }" @click="activePage = 'terraria'">
          테라리아
        </button>
      </nav>

      <div class="clock-box">
        <span>표준시간</span>
        <strong>{{ standardClock }}</strong>
      </div>
    </header>

    <main v-if="activePage === 'rcts'" class="page-body">
      <section v-if="offlineReport" class="offline-card">
        <div>
          <strong>오프라인 반영</strong>
          <span>{{ offlineReport.elapsedText }} · 기본 {{ offlineReport.completedRuns }}회 · 커스텀 {{ offlineReport.customRuns }}회</span>
        </div>
        <button type="button" @click="offlineReport = null">닫기</button>
      </section>

      <section class="group-list" aria-label="교통 그룹별 자동 진행 슬롯">
        <article
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          :class="{ locked: !isGroupUnlocked(group), master: isGroupMaster(group) }"
        >
          <header class="group-header">
            <div>
              <h2>{{ group.name }}그룹</h2>
              <p>{{ groupSubtitle(group) }}</p>
            </div>
            <div class="group-state">
              <strong>{{ groupTotal(group) }}/100회</strong>
              <span>{{ groupStateLabel(group) }}</span>
            </div>
          </header>

          <div class="slot-list">
            <section
              v-for="stage in groupStages(group.id)"
              :key="stage.id"
              class="slot-card"
              :class="{
                locked: !stage.unlocked,
                running: stage.phase === 'running',
                waiting: stage.phase === 'waiting',
                auto: stage.runs >= SUB_STAGE_UNLOCK_RUNS,
                master: isGroupMaster(group),
              }"
            >
              <div class="slot-title">
                <span class="slot-order">{{ stage.localOrder }}</span>
                <div>
                  <h3>{{ stage.name }}</h3>
                  <p>{{ stageDurationLabel(stage) }}</p>
                </div>
              </div>

              <div class="slot-timer">
                <strong>{{ timerText(stage) }}</strong>
              </div>

              <div class="slot-side">
                <span>{{ stageStateLabel(stage) }}</span>
              </div>
            </section>
          </div>

          <section v-if="isGroupMaster(group)" class="custom-area">
            <header class="custom-head">
              <strong>{{ group.name }} 커스텀</strong>
              <span>{{ customSummary(group) }}</span>
            </header>

            <form v-if="!customRoute(group.id).created" class="custom-form" @submit.prevent="createCustomRoute(group.id)">
              <label>
                <span>노선명</span>
                <input v-model.trim="customDrafts[group.id].routeName" type="text" placeholder="예: 수원역 순환선" maxlength="24" />
              </label>
              <label>
                <span>왕복시간</span>
                <div class="time-inputs">
                  <input v-model.number="customDrafts[group.id].roundTripDays" type="number" min="0" max="365" inputmode="numeric" />
                  <em>일</em>
                  <input v-model.number="customDrafts[group.id].roundTripHours" type="number" min="0" max="23" inputmode="numeric" />
                  <em>시간</em>
                  <input v-model.number="customDrafts[group.id].roundTripMinutes" type="number" min="0" max="59" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <label>
                <span>배차간격</span>
                <div class="time-inputs short">
                  <input v-model.number="customDrafts[group.id].headwayMinutes" type="number" min="1" max="1440" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>

              <div v-if="group.id === 'bus' && isStageUnlocked('commuter_charter')" class="timetable-note">
                전세통근 개방됨 · 표준시간 시간표형 커스텀 준비
                <small>첫차 06:00 · 막차 23:00 · 출퇴근/심야/주말 배차는 다음 설계에서 확장</small>
              </div>

              <button type="submit">커스텀 노선 등록</button>
            </form>

            <div v-else class="custom-slot" :class="{ complete: customRoute(group.id).runs >= CUSTOM_MASTER_RUNS }">
              <div class="custom-title">
                <h3>{{ customRoute(group.id).routeName }}</h3>
                <p>왕복 {{ formatLongDuration(customRoute(group.id).roundTripSeconds) }} · 배차 {{ formatLongDuration(customRoute(group.id).dispatchIntervalSeconds) }}</p>
              </div>
              <div class="custom-timer">
                <strong>{{ customTimerText(group.id) }}</strong>
                <span>운행차량 {{ customRoute(group.id).activeVehicles.length }}대</span>
              </div>
              <div class="custom-side">
                <strong>{{ customRoute(group.id).runs }}/100</strong>
                <span>{{ customRoute(group.id).runs >= CUSTOM_MASTER_RUNS ? '마스터' : '커스텀 운행중' }}</span>
              </div>

              <p v-if="customRoute(group.id).pendingUpdate" class="pending-update">
                수정 예약 · {{ formatApplyDate(customRoute(group.id).pendingUpdate.applyAt) }} 적용
              </p>

              <div v-if="customRoute(group.id).activeVehicles.length" class="vehicle-strip">
                <span
                  v-for="vehicle in customRoute(group.id).activeVehicles.slice(0, 4)"
                  :key="vehicle.id"
                >
                  {{ vehicle.label }} · {{ formatDuration(vehicle.remainingSeconds) }}
                </span>
                <span v-if="customRoute(group.id).activeVehicles.length > 4">
                  +{{ customRoute(group.id).activeVehicles.length - 4 }}대
                </span>
              </div>
              <p v-else class="vehicle-empty">배차 대기중 · 배차간격에 따라 차량이 생성됩니다</p>
            </div>

            <form v-if="customRoute(group.id).created && customRoute(group.id).runs < CUSTOM_MASTER_RUNS" class="custom-form custom-edit-form" @submit.prevent="reserveCustomRouteUpdate(group.id)">
              <label>
                <span>다음날 수정 노선명</span>
                <input v-model.trim="customDrafts[group.id].routeName" type="text" :placeholder="customRoute(group.id).routeName" maxlength="24" />
              </label>
              <label>
                <span>다음날 왕복시간</span>
                <div class="time-inputs">
                  <input v-model.number="customDrafts[group.id].roundTripDays" type="number" min="0" max="365" inputmode="numeric" />
                  <em>일</em>
                  <input v-model.number="customDrafts[group.id].roundTripHours" type="number" min="0" max="23" inputmode="numeric" />
                  <em>시간</em>
                  <input v-model.number="customDrafts[group.id].roundTripMinutes" type="number" min="0" max="59" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <label>
                <span>다음날 배차간격</span>
                <div class="time-inputs short">
                  <input v-model.number="customDrafts[group.id].headwayMinutes" type="number" min="1" max="1440" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <button type="submit">다음날 적용 예약</button>
            </form>
          </section>
        </article>
      </section>
    </main>

    <main v-else class="terraria-page">
      <section class="terraria-hero">
        <div>
          <p class="eyebrow">표준시간 드라마 엔진</p>
          <h1>모든 NPC는 하나의 세계 시간 속에서 함께 살아갑니다.</h1>
          <p>
            현재 시간 이후의 스토리보드가 준비된 만큼 이야기가 진행됩니다.
            한 명이라도 다음 흐름이 비어 있으면 전체 세계 시간은 멈춥니다.
          </p>
        </div>
        <div class="world-status-card">
          <span>세계 진행 상태</span>
          <strong>{{ terrariaWorldStatus.title }}</strong>
          <p>{{ terrariaWorldStatus.description }}</p>
        </div>
      </section>

      <section class="terraria-tabs" aria-label="테라리아 2차 메뉴">
        <button
          v-for="tab in terrariaTabs"
          :key="tab.id"
          type="button"
          :class="{ active: terrariaTab === tab.id }"
          @click="terrariaTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </section>

      <section v-if="terrariaTab === 'npcs'" class="npc-manager">
        <form class="npc-create-card" @submit.prevent="createTerrariaNpc">
          <div class="npc-create-title">
            <span>NPC 데이터 생성</span>
            <strong>생년월일을 가진 인물을 세계에 등록합니다.</strong>
            <p>상태와 진행 흐름은 나중에 스토리보드가 연결되면서 채워지는 구조입니다.</p>
          </div>

          <div class="npc-create-grid simple">
            <label>
              <span>이름</span>
              <input v-model.trim="npcDraft.name" type="text" placeholder="예: 한서윤" maxlength="20" required />
            </label>
            <label>
              <span>생년월일</span>
              <input v-model="npcDraft.birth" type="text" inputmode="numeric" placeholder="YYYY/MM/DD" pattern="\d{4}/\d{2}/\d{2}" required />
            </label>
            <label>
              <span>성별</span>
              <select v-model="npcDraft.gender">
                <option value="여성">여성</option>
                <option value="남성">남성</option>
                <option value="기타/미정">기타/미정</option>
              </select>
            </label>
            <div class="npc-age-preview">
              <span>현재 나이</span>
              <strong>{{ npcDraftAge }}</strong>
            </div>
          </div>

          <label class="npc-memo-field">
            <span>초기 메모</span>
            <textarea v-model.trim="npcDraft.memo" placeholder="스토리보드 작업 전에 참고할 인물의 출발점만 짧게 적어둡니다." maxlength="160"></textarea>
          </label>

          <div class="npc-create-actions">
            <span>생성 후 목록에 표시되며, 상태는 스토리보드 작업 때 연결됩니다.</span>
            <button type="submit">NPC 등록</button>
          </div>
        </form>

        <div class="terraria-grid">
          <div v-if="terrariaNpcs.length === 0" class="npc-empty-card">
            <strong>아직 등록된 NPC가 없습니다.</strong>
            <p>위에서 이름, 생년월일, 성별만 입력해 첫 NPC를 생성하세요. 스토리보드 연결과 상태 표시는 다음 보드 작업에서 붙습니다.</p>
          </div>

          <article v-for="npc in terrariaNpcs" :key="npc.id" class="npc-card">
            <div class="npc-head">
              <div>
                <span class="npc-role">{{ npc.gender }}</span>
                <h2>{{ npc.name }}</h2>
                <p>{{ formatBirth(npc.birth) }} 출생 · {{ npcAgeText(npc.birth) }} · {{ npcCurrentState(npc) }}</p>
              </div>
              <div class="npc-head-actions">
                <strong>{{ npc.focus || '보드 대기' }}</strong>
                <button type="button" @click="deleteTerrariaNpc(npc.id)">삭제</button>
              </div>
            </div>

            <p v-if="npc.parentNames?.length" class="npc-memo">부모 관계: {{ npc.parentNames.join(', ') }}</p>
            <p v-if="npc.memo" class="npc-memo">{{ npc.memo }}</p>

            <div class="npc-storyboards">
              <h3>스토리보드 연결 공간</h3>
              <ul v-if="npc.boardIds.length">
                <li v-for="boardId in npc.boardIds" :key="boardId">
                  <span>{{ getBoard(boardId)?.title }}</span>
                  <em>{{ boardRangeText(getBoard(boardId)) }}</em>
                </li>
              </ul>
              <div v-else class="empty-board-space">
                아직 연결된 스토리보드가 없습니다. 다음 보드 작업에서 이 NPC를 대상/관련 인물로 추가할 수 있습니다.
              </div>
            </div>

            <div class="npc-people">
              <h3>연결 인물</h3>
              <div v-if="npc.links.length">
                <span v-for="person in npc.links" :key="person">{{ person }}</span>
              </div>
              <div v-else class="empty-link-space">관계 보드 생성 전</div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="terrariaTab === 'storyboards'" class="storyboard-manager">
        <form class="storyboard-create-card" @submit.prevent="submitTerrariaStoryboard">
          <div class="storyboard-create-title">
            <span>{{ editingStoryboardId ? '스토리보드 수정' : '스토리보드 생성' }}</span>
            <strong>하나의 이야기를 시간 순서대로 이어가는 보드판입니다.</strong>
            <p>참여 NPC를 불러오거나, NPC 없이 장시간 흐름을 만들 수 있습니다. 시작/종료 시간은 스토리 나열의 첫 시간과 마지막 시간으로 자동 계산됩니다.</p>
          </div>

          <div class="storyboard-create-grid wide">
            <label>
              <span>보드명</span>
              <input v-model.trim="storyboardDraft.title" type="text" placeholder="예: 서윤의 독립 적응기 / 윤성그룹 장기 프로젝트" maxlength="40" required />
            </label>
            <label>
              <span>보드 유형</span>
              <select v-model="storyboardDraft.boardType">
                <option value="story">이야기 흐름</option>
                <option value="project">장시간 프로젝트</option>
                <option value="episode">단막극</option>
              </select>
            </label>
          </div>

          <div class="participant-box">
            <span>참여 NPC 선택</span>
            <div v-if="terrariaNpcs.length" class="participant-list">
              <label v-for="npc in terrariaNpcs" :key="npc.id">
                <input v-model="storyboardDraft.npcIds" type="checkbox" :value="npc.id" />
                <em>{{ npc.name }}</em>
              </label>
            </div>
            <p v-else>등록된 NPC가 없어도 보드는 만들 수 있습니다. 장기 프로젝트나 무명 엑스트라 중심 이야기로 시작할 수 있습니다.</p>
          </div>

          <div v-if="terrariaExtras.length" class="participant-box extra-box">
            <span>재등장 엑스트라</span>
            <div class="participant-list">
              <label v-for="extra in terrariaExtras" :key="extra.id">
                <input v-model="storyboardDraft.returningExtraIds" type="checkbox" :value="extra.id" />
                <em>{{ extraLabel(extra) }} · {{ extra.appearances }}회</em>
              </label>
            </div>
            <p>이전에 등장한 엑스트라를 다시 부르면 등장 횟수가 올라갑니다. 2회 이상 등장하면 NPC 승격이 가능합니다.</p>
          </div>

          <div class="participant-box danger-box">
            <span>시간형 사망/출생 처리</span>
            <p>사망과 출생은 보드 등록 즉시 처리되지 않습니다. 스토리 단계 시간이 실제 표준시간에 도달했을 때 사망은 NPC 목록에서 제거되고, 출생은 그 시점에 새 NPC로 생성됩니다.</p>
          </div>

          <label class="storyboard-summary-field">
            <span>보드 설명</span>
            <textarea v-model.trim="storyboardDraft.summary" placeholder="이 보드가 어떤 흐름인지 짧게 적습니다. NPC 없는 장기 프로젝트, 특정 인물 단막극, 관계 흐름 모두 가능합니다." maxlength="260"></textarea>
          </label>

          <label class="storyboard-summary-field">
            <span>새 무명 엑스트라</span>
            <textarea v-model="storyboardDraft.newExtrasText" placeholder="한 줄에 한 명씩 적습니다.
예) 출근길에 마주친 낯선 남자
예) 회사 로비의 이름 모를 직원
비워두면 새 엑스트라를 만들지 않습니다."></textarea>
          </label>

          <div class="storyboard-steps-field">
            <div class="step-title-row">
              <span>스토리 나열</span>
              <button type="button" @click="addStoryStepRow">단계 추가</button>
            </div>
            <p>각 단계는 시간과 여러 개의 문장 조각으로 고정됩니다. 문장마다 인물을 클릭해 넣고, 뒤에는 상황을 자유롭게 적습니다.</p>
            <p>스토리보드에서 출생이 예정된 인물은 출생 시간 이후 단계에서만 이야기 후보로 불러올 수 있습니다.</p>

            <div class="step-actor-palette">
              <strong>클릭 입력 인물 · 참여 NPC / 엑스트라 / 출생 예정 인물을 문장에 넣습니다</strong>
              <div v-if="availableStoryActors.length" class="actor-chip-list">
                <span v-for="actor in availableStoryActors" :key="actor.key" :title="actor.note || actor.label">{{ actor.label }}</span>
              </div>
              <p v-else>참여 NPC, 재등장 엑스트라, 새 무명 엑스트라가 있으면 문장 조각에 클릭 입력할 수 있습니다. 출생 예정 인물은 해당 출생 시간 이후 단계에서만 표시됩니다.</p>
            </div>

            <div class="story-step-editor">
              <section v-for="(step, index) in storyboardStepDrafts" :key="step.id" class="story-step-row">
                <div class="story-step-head">
                  <label>
                    <span>시간</span>
                    <input v-model="step.time" type="text" inputmode="numeric" placeholder="YYYY/MM/DD HH:MM" pattern="\d{4}/\d{2}/\d{2} \d{2}:\d{2}" required />
                  </label>
                  <button type="button" @click="removeStoryStepRow(index)" :disabled="storyboardStepDrafts.length <= 1">삭제</button>
                </div>

                <div class="story-clause-editor">
                  <div class="story-clause-title">
                    <span>문장 조각</span>
                    <button type="button" @click="addStepClauseRow(step)">문장 추가</button>
                  </div>
                  <p>자동 문장: [한서윤][강태오] 만남을 이어가던 중</p>
                  <p>자유 배치: 한서윤이 지나가던 중 이상함을 느껴 돌아보니 강태오가 바라보고 있습니다.</p>

                  <section v-for="(clause, clauseIndex) in step.clauses" :key="clause.id" class="story-clause-row">
                    <div class="story-clause-head">
                      <strong>문장 {{ clauseIndex + 1 }}</strong>
                      <button type="button" @click="removeStepClauseRow(step, clauseIndex)" :disabled="step.clauses.length <= 1">삭제</button>
                    </div>
                    <div class="story-clause-mode">
                      <label>
                        <span>문장 방식</span>
                        <select v-model="clause.mode">
                          <option value="auto">자동 문장</option>
                          <option value="free">자유 배치</option>
                        </select>
                      </label>
                    </div>

                    <div v-if="clause.mode !== 'free'" class="story-step-actors">
                      <span>등장 인물 · 1번째는 주어, 2번째부터는 함께한 인물</span>
                      <div v-if="availableStoryActorsForStep(step).length" class="actor-chip-list selectable">
                        <button
                          v-for="actor in availableStoryActorsForStep(step)"
                          :key="actor.key"
                          type="button"
                          :class="{ active: clause.actorLabels.includes(actor.label) }"
                          :title="actor.note || actor.label"
                          @click="toggleClauseActor(clause, actor.label)"
                        >
                          {{ actor.label }}
                        </button>
                      </div>
                      <p v-else>인물 없이 프로젝트 문장으로 작성할 수 있습니다.</p>
                    </div>

                    <div v-else class="story-step-actors free-actor-insert">
                      <span>본문에 인물 삽입 · 인물을 원하는 위치에 넣고 뒤 문장을 이어 적습니다</span>
                      <div v-if="availableStoryActorsForStep(step).length" class="actor-chip-list actor-insert-list">
                        <span v-for="actor in availableStoryActorsForStep(step)" :key="actor.key" class="actor-insert-item" :title="actor.note || actor.label">
                          <em>{{ actor.label }}</em>
                          <button type="button" @click="appendActorToClauseText(clause, actor.label, 'subject')">가/이</button>
                          <button type="button" @click="appendActorToClauseText(clause, actor.label, 'with')">와/과</button>
                        </span>
                      </div>
                      <p v-else>인물 없이 자유 문장으로 작성할 수 있습니다.</p>
                    </div>

                    <label class="story-step-action">
                      <span>내용</span>
                      <textarea
                        v-model.trim="clause.action"
                        :placeholder="clause.mode === 'free' ? '예) 한서윤이 지나가던 중 이상함을 느껴 돌아보니 강태오가 바라보고 있습니다.' : '이 문장에서 벌어진 일을 적습니다. 예) 만남을 이어가던 중'"
                        required
                      ></textarea>
                    </label>
                    <div class="story-clause-preview">{{ formatClausePreview(clause) }}</div>
                  </section>
                </div>

                <div class="story-step-effect">
                  <label>
                    <span>시간 도달 처리</span>
                    <select v-model="step.effectType">
                      <option value="none">없음</option>
                      <option value="death">NPC/엑스트라 사망</option>
                      <option value="birth">자녀/NPC 출생</option>
                    </select>
                  </label>

                  <div v-if="step.effectType === 'death'" class="step-effect-panel danger-box">
                    <span>사망 대상 NPC</span>
                    <div v-if="terrariaNpcs.length" class="participant-list death-list">
                      <label v-for="npc in terrariaNpcs" :key="npc.id">
                        <input v-model="step.deathNpcIds" type="checkbox" :value="npc.id" />
                        <em>{{ npc.name }}</em>
                      </label>
                    </div>
                    <p v-else>사망 처리할 등록 NPC가 없습니다.</p>

                    <span>사망 대상 엑스트라</span>
                    <div v-if="availableDeathExtras.length" class="participant-list death-list">
                      <label v-for="extra in availableDeathExtras" :key="extra.id">
                        <input v-model="step.deathExtraIds" type="checkbox" :value="extra.id" />
                        <em>{{ extraLabel(extra) }}</em>
                      </label>
                    </div>
                    <p v-else>사망 처리할 엑스트라가 없습니다.</p>

                    <span>사망 대상 출생 예정 인물</span>
                    <div v-if="availableDeathBirthActorsForStep(step).length" class="participant-list death-list">
                      <label v-for="actor in availableDeathBirthActorsForStep(step)" :key="actor.key">
                        <input v-model="step.deathBirthKeys" type="checkbox" :value="actor.key" />
                        <em>{{ actor.label }}</em>
                        <small>{{ actor.note }}</small>
                      </label>
                    </div>
                    <p v-else>사망 처리할 출생 예정 인물이 없습니다.</p>
                  </div>

                  <div v-if="step.effectType === 'birth'" class="step-effect-panel birth-box">
                    <label>
                      <span>출생 이름</span>
                      <input v-model.trim="step.birthName" type="text" placeholder="예: 한은우" maxlength="20" />
                    </label>
                    <label>
                      <span>성별</span>
                      <select v-model="step.birthGender">
                        <option value="여성">여성</option>
                        <option value="남성">남성</option>
                        <option value="기타/미정">기타/미정</option>
                      </select>
                    </label>
                    <div class="birth-parent-box">
                      <span>부모 관계 NPC</span>
                      <div v-if="terrariaNpcs.length" class="participant-list parent-list">
                        <label v-for="npc in terrariaNpcs" :key="npc.id">
                          <input v-model="step.birthParentNpcIds" type="checkbox" :value="npc.id" />
                          <em>{{ npc.name }}</em>
                        </label>
                      </div>
                      <p v-else>등록된 부모 NPC가 없으면 부모 관계 없이 출생 처리됩니다.</p>
                    </div>
                    <p>스토리 시간이 도달하면 이 단계 날짜가 생년월일이 되고, 선택한 부모 관계와 함께 NPC 목록에 생성됩니다.</p>
                  </div>
                </div>

                <div class="story-step-preview">
                  <time>{{ normalizeDateTimeText(step.time) || 'YYYY/MM/DD HH:MM' }}</time>
                  <span>{{ formatStepPreview(step) }}</span>
                </div>
              </section>
            </div>
          </div>

          <p v-if="storyboardFormError" class="form-error">{{ storyboardFormError }}</p>

          <div class="storyboard-create-actions">
            <span>각 스토리 단계의 시간이 없으면 보드는 작동하지 않습니다. 보드 시간 범위는 단계 시간으로 자동 계산됩니다.</span>
            <button type="button" class="secondary-action" @click="addStoryStepRow">스토리 단계 추가</button>
            <button type="button" v-if="editingStoryboardId" @click="cancelStoryboardEdit">수정 취소</button>
            <button type="submit">{{ editingStoryboardId ? '스토리보드 수정 저장' : '스토리보드 등록' }}</button>
          </div>
        </form>

        <div class="storyboard-world-note">
          <strong>진행 조건</strong>
          <p>스토리보드는 단막 이야기부터 장시간 흐름까지 모두 포함합니다. 시작/종료시간은 스토리 단계 시간으로 자동 계산되며, 마지막 단계 시간이 지나면 자동 삭제됩니다.</p>
        </div>

        <div class="board-list">
          <div v-if="terrariaStoryboards.length === 0" class="board-empty-card">
            <strong>아직 등록된 스토리보드가 없습니다.</strong>
            <p>NPC 없이도 장기 프로젝트나 무명 엑스트라 중심 보드부터 만들 수 있습니다.</p>
          </div>

          <article
            v-for="board in sortedTerrariaStoryboards"
            :key="board.id"
            class="board-card"
          >
            <div class="board-top">
              <span>{{ storyboardDurationLabel(board) }}</span>
              <strong>{{ storyboardStatus(board) }}</strong>
            </div>
            <h2>{{ board.title }}</h2>
            <p>{{ board.summary || '설명 없음' }}</p>
            <div class="board-meta">
              <span>{{ board.start }} ~ {{ board.end }}</span>
              <span>참여 NPC: {{ boardNpcNames(board).join(', ') || '없음' }}</span>
              <span>엑스트라: {{ boardExtraLabels(board).join(', ') || '없음' }}</span>
              <span v-if="board.deathNames?.length">NPC 사망 예정: {{ board.deathNames.join(', ') }}</span>
              <span v-if="board.deathExtraNames?.length">엑스트라 사망 예정: {{ board.deathExtraNames.join(', ') }}</span>
              <span v-if="board.deathBirthNames?.length">출생 예정 인물 사망 예정: {{ board.deathBirthNames.join(', ') }}</span>
              <span v-if="board.birthNames?.length">출생 예정: {{ board.birthNames.join(', ') }}</span>
              <span>단계 {{ board.steps.length }}개</span>
            </div>
            <ol class="story-step-list">
              <li v-for="step in board.steps" :key="step.id">
                <time>{{ step.time }}</time>
                <span>
                  {{ formatSavedStepText(step) }}
                </span>
              </li>
            </ol>
            <div class="board-actions">
              <button type="button" @click="startEditTerrariaStoryboard(board.id)">수정</button>
              <button type="button" @click="deleteTerrariaStoryboard(board.id)">삭제</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="terrariaTab === 'storyboards'" class="extra-manager">
        <div class="storyboard-world-note">
          <strong>엑스트라 자동 순환</strong>
          <p>스토리보드에서 만들어진 무명 인물은 엑스트라 목록에 잠시 남습니다. 다른 스토리보드에 등장하지 않은 엑스트라는 해당 스토리가 끝나면 자동 삭제됩니다. 같은 인물이 2회 이상 등장하면 이름, 나이, 성별을 정해 NPC 목록으로 승격할 수 있습니다.</p>
        </div>

        <div v-if="terrariaExtras.length === 0" class="board-empty-card">
          <strong>아직 생성된 엑스트라가 없습니다.</strong>
          <p>스토리보드의 새 무명 엑스트라 입력칸에서 첫 엑스트라를 등장시킬 수 있습니다.</p>
        </div>

        <article v-for="extra in terrariaExtras" :key="extra.id" class="extra-card">
          <div>
            <span>{{ extra.code }}</span>
            <h3>{{ extraLabel(extra) }}</h3>
            <p>{{ extra.origin || '스토리보드에서 자동 생성된 엑스트라입니다.' }}</p>
          </div>
          <div class="extra-state">
            <strong>{{ extra.appearances }}회 등장</strong>
            <span>{{ extra.appearances >= 2 ? 'NPC 승격 가능' : '재등장 대기' }}</span>
          </div>

          <form v-if="extra.appearances >= 2" class="extra-promote-form" @submit.prevent="promoteExtraToNpc(extra.id)">
            <label>
              <span>이름</span>
              <input v-model.trim="extraPromotionDrafts[extra.id].name" type="text" placeholder="예: 강태오" maxlength="20" required />
            </label>
            <label>
              <span>나이</span>
              <input v-model.number="extraPromotionDrafts[extra.id].age" type="number" min="0" max="120" inputmode="numeric" required />
            </label>
            <label>
              <span>성별</span>
              <select v-model="extraPromotionDrafts[extra.id].gender">
                <option value="여성">여성</option>
                <option value="남성">남성</option>
                <option value="기타/미정">기타/미정</option>
              </select>
            </label>
            <button type="submit">NPC로 승격</button>
          </form>
        </article>
      </section>

      <section v-if="terrariaTab === 'timeline'" class="timeline-list">
        <div v-if="terrariaTimeline.length === 0" class="board-empty-card">
          <strong>작동 중인 사건 시간이 없습니다.</strong>
          <p>스토리보드에 YYYY/MM/DD HH:MM 단계가 등록되면 사건 시간표가 자동으로 불러옵니다.</p>
        </div>
        <article v-for="item in terrariaTimeline" :key="item.id" class="timeline-card">
          <time>{{ item.time }}</time>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </section>
    </main>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SUB_STAGE_UNLOCK_RUNS = 10
const NEXT_GROUP_UNLOCK_RUNS = 50
const GROUP_MASTER_RUNS = 100
const CUSTOM_MASTER_RUNS = 100
const MANUAL_WAIT_SECONDS = 30 * 60
const AUTO_WAIT_SECONDS = 10 * 60
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND = 1000
const MINUTE = 60
const HOUR = 3600
const DAY = 86400

const activePage = ref('rcts')
const terrariaTab = ref('npcs')

const terrariaTabs = [
  { id: 'npcs', label: 'NPC 목록' },
  { id: 'storyboards', label: '스토리보드' },
  { id: 'timeline', label: '사건 시간표' },
]

const terrariaStoryboards = reactive([])
const terrariaExtras = reactive([])
const processedTerrariaStepEffects = reactive([])

const defaultExtraPromotionDraft = { name: '', age: 20, gender: '기타/미정' }
const extraPromotionDrafts = reactive({})

const defaultStoryboardDraft = {
  title: '',
  boardType: 'story',
  start: '',
  end: '',
  npcIds: [],
  returningExtraIds: [],
  deathNpcIds: [],
  summary: '',
  newExtrasText: '',
}

const storyboardDraft = reactive({ ...defaultStoryboardDraft, npcIds: [], returningExtraIds: [], deathNpcIds: [] })
const storyboardStepDrafts = reactive([createEmptyStoryStepDraft()])
const editingStoryboardId = ref('')
const storyboardFormError = ref('')

const defaultNpcDraft = {
  name: '',
  birth: '',
  gender: '여성',
  memo: '',
}

const npcDraft = reactive({ ...defaultNpcDraft })

function createInitialTerrariaNpcs() {
  return []
}

const terrariaNpcs = reactive(createInitialTerrariaNpcs())
const legacyDemoNpcIds = new Set(['seoyun', 'seoha', 'serin', 'eunbyeol'])

const terrariaTimeline = computed(() => {
  const nowValue = standardNow.value.getTime()
  const steps = terrariaStoryboards
    .flatMap((board) => (board.steps || []).map((step) => ({
      id: `${board.id}:${step.id}`,
      boardTitle: board.title,
      boardType: board.boardType,
      time: normalizeDateTimeText(step.time || ''),
      value: dateTimeValue(step.time),
      actors: Array.isArray(step.actorLabels) ? step.actorLabels : [],
      text: step.text || '',
    })))
    .filter((item) => isValidDateTimeText(item.time))
    .sort((a, b) => a.value - b.value)

  const pastSteps = steps.filter((item) => item.value <= nowValue)
  const latestPast = pastSteps[pastSteps.length - 1]
  const upcomingSteps = steps.filter((item) => item.value > nowValue).slice(0, 8)
  const result = []

  if (latestPast) {
    result.push({
      id: `active:${latestPast.id}`,
      time: latestPast.time,
      title: `작동 중 · ${latestPast.boardTitle}`,
      text: `${latestPast.actors.length ? `${latestPast.actors.join(', ')} · ` : ''}${latestPast.text}`,
    })
  }

  upcomingSteps.forEach((item) => {
    result.push({
      id: `upcoming:${item.id}`,
      time: item.time,
      title: `예정 · ${item.boardTitle}`,
      text: `${item.actors.length ? `${item.actors.join(', ')} · ` : ''}${item.text}`,
    })
  })

  return result
})

const groups = [
  { id: 'bus', order: 1, name: '버스' },
  { id: 'rail', order: 2, name: '철도' },
  { id: 'air', order: 3, name: '항공' },
  { id: 'ship', order: 4, name: '선박' },
  { id: 'space', order: 5, name: '우주선' },
]

const stageDefinitions = [
  { id: 'village_bus', groupId: 'bus', localOrder: 1, name: '마을버스', durationSeconds: 30 * MINUTE },
  { id: 'city_bus', groupId: 'bus', localOrder: 2, name: '시내버스', durationSeconds: 1 * HOUR },
  { id: 'express_bus', groupId: 'bus', localOrder: 3, name: '광역버스', durationSeconds: 2 * HOUR },
  { id: 'commuter_charter', groupId: 'bus', localOrder: 4, name: '전세통근', durationSeconds: 8 * HOUR, timeWindow: 'commuter' },
  { id: 'charter_bus', groupId: 'bus', localOrder: 5, name: '전세버스', durationSeconds: 3 * DAY },

  { id: 'tram', groupId: 'rail', localOrder: 1, name: '트램', durationSeconds: 1 * HOUR },
  { id: 'light_rail', groupId: 'rail', localOrder: 2, name: '경전철', durationSeconds: 1 * HOUR },
  { id: 'metro_rail', groupId: 'rail', localOrder: 3, name: '광역전철', durationSeconds: 2 * HOUR },
  { id: 'general_train', groupId: 'rail', localOrder: 4, name: '일반열차', durationSeconds: 4 * HOUR },
  { id: 'domestic_hsr', groupId: 'rail', localOrder: 5, name: '국내고속열차', durationSeconds: 2 * HOUR },
  { id: 'international_hsr', groupId: 'rail', localOrder: 6, name: '국제고속열차', durationSeconds: 6 * HOUR },

  { id: 'domestic_flight', groupId: 'air', localOrder: 1, name: '국내선 항공', durationSeconds: 2 * HOUR },
  { id: 'international_flight', groupId: 'air', localOrder: 2, name: '국제선 항공', durationSeconds: 10 * HOUR },

  { id: 'domestic_ship', groupId: 'ship', localOrder: 1, name: '국내선 선박', durationSeconds: 1 * DAY },
  { id: 'short_international_ship', groupId: 'ship', localOrder: 2, name: '국제선 단거리 선박', durationSeconds: 15 * DAY },
  { id: 'long_international_ship', groupId: 'ship', localOrder: 3, name: '국제선 장거리 선박', durationSeconds: 30 * DAY },

  { id: 'space_station_shuttle', groupId: 'space', localOrder: 1, name: '우주정거장 셔틀', durationSeconds: 3 * HOUR },
  { id: 'stellar_shuttle', groupId: 'space', localOrder: 2, name: '성계 셔틀', durationSeconds: 60 * DAY },
  { id: 'galaxy_shuttle', groupId: 'space', localOrder: 3, name: '은하 셔틀', durationSeconds: 180 * DAY },
]

const defaultCustomDraft = {
  routeName: '',
  roundTripDays: 0,
  roundTripHours: 1,
  roundTripMinutes: 0,
  headwayMinutes: 30,
}

const standardNow = ref(new Date())
const offlineReport = ref(null)
let secondTimer = null
let autoSaveTimer = null
let standardTimer = null
let isSaving = false

function createInitialStages() {
  return stageDefinitions.map((stage) => {
    const initiallyUnlocked = stage.groupId === 'bus' && stage.localOrder === 1
    return {
      ...stage,
      unlocked: initiallyUnlocked,
      phase: initiallyUnlocked ? 'running' : 'locked',
      runs: 0,
      remainingSeconds: stage.durationSeconds,
    }
  })
}

function createInitialCustomRoutes() {
  return groups.map((group) => ({
    groupId: group.id,
    created: false,
    routeName: '',
    roundTripSeconds: 1 * HOUR,
    dispatchIntervalSeconds: 30 * MINUTE,
    nextDispatchAt: null,
    activeVehicles: [],
    runs: 0,
    pendingUpdate: null,
  }))
}

function createInitialCustomDrafts() {
  return Object.fromEntries(groups.map((group) => [group.id, { ...defaultCustomDraft }]))
}

const stages = reactive(createInitialStages())
const customRoutes = reactive(createInitialCustomRoutes())
const customDrafts = reactive(createInitialCustomDrafts())
const logs = ref([])

const standardClock = computed(() => formatStandardClock(standardNow.value))
const npcDraftAge = computed(() => (npcDraft.birth ? npcAgeText(npcDraft.birth) : '-'))
const terrariaWorldStatus = computed(() => {
  if (terrariaNpcs.length === 0) {
    return {
      title: '대기 · NPC 없음',
      description: 'NPC를 생성한 뒤, 현재 시간 이후의 스토리보드를 연결해야 세계가 진행됩니다.',
    }
  }

  const missingNpcs = terrariaNpcs.filter((npc) => !npcHasFutureStoryboard(npc))
  if (missingNpcs.length > 0) {
    return {
      title: '정지 · 미래 보드 부족',
      description: `${missingNpcs.map((npc) => npc.name).join(', ')}의 다음 흐름이 비어 있습니다. 한 명이라도 비어 있으면 전체 세계 시간이 멈춥니다.`,
    }
  }

  return {
    title: '진행 가능 · 미래 보드 확보',
    description: '모든 NPC가 현재 시간 이후의 스토리보드를 가지고 있어 이야기가 계속 진행됩니다.',
  }
})

function groupStages(groupId) {
  return stages.filter((stage) => stage.groupId === groupId)
}

function groupTotal(group) {
  const total = groupStages(group.id).reduce((sum, stage) => sum + stage.runs, 0)
  return Math.min(total, GROUP_MASTER_RUNS)
}

function isGroupUnlocked(group) {
  return groupStages(group.id).some((stage) => stage.unlocked)
}

function isGroupMaster(group) {
  return groupTotal(group) >= GROUP_MASTER_RUNS
}

function groupStateLabel(group) {
  if (!isGroupUnlocked(group)) return '대기'
  if (isGroupMaster(group)) return customRoute(group.id).created ? '커스텀' : '마스터'
  if (groupTotal(group) >= NEXT_GROUP_UNLOCK_RUNS) return '다음 그룹 개방됨'
  return '진행중'
}

function groupSubtitle(group) {
  if (!isGroupUnlocked(group)) return '이전 그룹 50회 달성 시 첫 슬롯 자동개방'
  if (isGroupMaster(group)) return customRoute(group.id).created ? '커스텀 노선 운행중' : '100회 달성 · 커스텀 노선 등록 가능'
  return '50회 다음 그룹 · 100회 커스텀'
}

function getGroupById(groupId) {
  return groups.find((group) => group.id === groupId)
}

function getNextGroup(groupId) {
  const group = getGroupById(groupId)
  if (!group) return null
  return groups.find((item) => item.order === group.order + 1) ?? null
}

function firstStageOfGroup(groupId) {
  return groupStages(groupId).find((stage) => stage.localOrder === 1) ?? null
}

function nextStageInGroup(stage) {
  return groupStages(stage.groupId).find((item) => item.localOrder === stage.localOrder + 1) ?? null
}

function customRoute(groupId) {
  return customRoutes.find((route) => route.groupId === groupId)
}

function unlockStage(stage) {
  if (!stage || stage.unlocked) return false
  stage.unlocked = true
  stage.phase = 'running'
  stage.remainingSeconds = stage.durationSeconds
  return true
}

function updateUnlocks() {
  let changed = false

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.runs < SUB_STAGE_UNLOCK_RUNS) return
    const next = nextStageInGroup(stage)
    if (unlockStage(next)) {
      addLog(`${next.name} 자동개방`)
      changed = true
    }
  })

  groups.forEach((group) => {
    if (groupTotal(group) < NEXT_GROUP_UNLOCK_RUNS) return
    const nextGroup = getNextGroup(group.id)
    if (!nextGroup) return
    const firstStage = firstStageOfGroup(nextGroup.id)
    if (unlockStage(firstStage)) {
      addLog(`${group.name}그룹 50회 달성 · ${nextGroup.name}그룹 개방`)
      changed = true
    }
  })

  groups.forEach((group) => {
    if (!isGroupMaster(group)) return
    groupStages(group.id).forEach((stage) => {
      if (stage.unlocked && stage.phase !== 'master') {
        stage.phase = 'master'
        stage.remainingSeconds = 0
        changed = true
      }
    })
  })

  return changed
}

function tickGame() {
  const now = new Date()
  const prev = new Date(now.getTime() - SECOND)
  standardNow.value = now
  processDueTerrariaStepEffects()
  cleanupExpiredTerrariaStoryboards()
  applyPendingCustomUpdates(now)

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.phase === 'locked' || stage.phase === 'master') return

    const tickAmount = getTickAmountForStage(stage, now, prev)
    if (tickAmount <= 0) return

    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage) - tickAmount)
    if (stage.remainingSeconds <= 0) completeStageStep(stage)
  })

  processCustomRoutes(now, 1)
  updateUnlocks()
}

function completeStageStep(stage) {
  if (stage.phase === 'running') {
    const group = getGroupById(stage.groupId)
    if (group && !isGroupMaster(group)) {
      stage.runs += 1
      addLog(`${stage.name} ${stage.runs}회 완료`)
    }

    updateUnlocks()

    if (stage.phase !== 'master') {
      stage.phase = 'waiting'
      stage.remainingSeconds = getWaitSeconds(stage)
    }
    return
  }

  if (stage.phase === 'waiting') {
    stage.phase = 'running'
    stage.remainingSeconds = stage.durationSeconds
  }
}

function getWaitSeconds(stage) {
  return stage.runs >= SUB_STAGE_UNLOCK_RUNS ? AUTO_WAIT_SECONDS : MANUAL_WAIT_SECONDS
}

function getTickAmountForStage(stage, currentDate, previousDate) {
  if (stage.timeWindow === 'commuter') return countCommuterOperableSeconds(previousDate, currentDate)
  return 1
}

function processCustomRoutes(now, elapsedSeconds) {
  applyPendingCustomUpdates(now)

  customRoutes.forEach((route) => {
    if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return

    route.activeVehicles.forEach((vehicle) => {
      vehicle.remainingSeconds = Math.max(0, vehicle.remainingSeconds - elapsedSeconds)
    })

    const completed = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds <= 0)
    if (completed.length > 0) {
      const availableRuns = CUSTOM_MASTER_RUNS - route.runs
      const addRuns = Math.min(availableRuns, completed.length)
      route.runs += addRuns
      if (route.runs >= CUSTOM_MASTER_RUNS) addLog(`${getGroupById(route.groupId).name} 커스텀 마스터`)
    }
    route.activeVehicles = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds > 0)

    dispatchCustomVehicles(route, now)
  })
}

function dispatchCustomVehicles(route, now) {
  if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return
  if (!route.nextDispatchAt) route.nextDispatchAt = now.toISOString()

  let nextTime = new Date(route.nextDispatchAt)
  let guard = 0
  const headway = Math.max(MINUTE, route.dispatchIntervalSeconds || 30 * MINUTE)

  while (nextTime <= now && guard < 50 && route.runs < CUSTOM_MASTER_RUNS) {
    guard += 1
    if (isCustomServiceActive(route.groupId, nextTime)) {
      route.activeVehicles.push({
        id: cryptoRandomId(),
        label: `${route.routeName} ${route.activeVehicles.length + 1}호`,
        remainingSeconds: route.roundTripSeconds,
        startedAt: nextTime.toISOString(),
      })
    }
    nextTime = new Date(nextTime.getTime() + headway * SECOND)
  }

  route.nextDispatchAt = nextTime.toISOString()
}

function isCustomServiceActive(groupId, date) {
  if (groupId !== 'bus') return true
  if (!isStageUnlocked('commuter_charter')) return true
  const hour = date.getHours()
  return hour >= 6 && hour < 23
}

function createCustomRoute(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route || !draft) return

  const name = draft.routeName?.trim() || `${getGroupById(groupId).name} 커스텀 노선`
  const roundTripSeconds = normalizeCustomRoundTrip(groupId, (
    (Number(draft.roundTripDays) || 0) * DAY
    + (Number(draft.roundTripHours) || 0) * HOUR
    + (Number(draft.roundTripMinutes) || 0) * MINUTE
  ))
  const dispatchIntervalSeconds = Math.max(MINUTE, (Number(draft.headwayMinutes) || 30) * MINUTE)

  route.created = true
  route.routeName = name
  route.roundTripSeconds = roundTripSeconds
  route.dispatchIntervalSeconds = dispatchIntervalSeconds
  route.nextDispatchAt = new Date().toISOString()
  route.activeVehicles = []
  route.runs = 1
  route.pendingUpdate = null
  setDraftFromRoute(groupId)

  addLog(`${getGroupById(groupId).name} 커스텀 노선 등록 · ${name}`)
  saveSoon()
}

function reserveCustomRouteUpdate(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route?.created || !draft) return

  const routeName = draft.routeName?.trim() || route.routeName
  const roundTripSeconds = normalizeCustomRoundTrip(groupId, (
    (Number(draft.roundTripDays) || 0) * DAY
    + (Number(draft.roundTripHours) || 0) * HOUR
    + (Number(draft.roundTripMinutes) || 0) * MINUTE
  ))
  const dispatchIntervalSeconds = Math.max(MINUTE, (Number(draft.headwayMinutes) || 30) * MINUTE)
  const applyAt = nextDayStart(new Date()).toISOString()

  route.pendingUpdate = {
    routeName,
    roundTripSeconds,
    dispatchIntervalSeconds,
    applyAt,
  }

  addLog(`${getGroupById(groupId).name} 커스텀 수정 예약 · 다음날 적용`)
  saveSoon()
}

function applyPendingCustomUpdates(now) {
  customRoutes.forEach((route) => {
    if (!route.pendingUpdate?.applyAt) return
    const applyAt = new Date(route.pendingUpdate.applyAt)
    if (applyAt > now) return

    route.routeName = route.pendingUpdate.routeName || route.routeName
    route.roundTripSeconds = normalizeCustomRoundTrip(route.groupId, route.pendingUpdate.roundTripSeconds)
    route.dispatchIntervalSeconds = Math.max(MINUTE, route.pendingUpdate.dispatchIntervalSeconds || route.dispatchIntervalSeconds)
    route.nextDispatchAt = now.toISOString()
    route.pendingUpdate = null
    setDraftFromRoute(route.groupId)
    addLog(`${getGroupById(route.groupId).name} 커스텀 수정 적용 · 다음날 반영 완료`)
  })
}

function nextDayStart(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() + 1)
  return next
}

function setDraftFromRoute(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route || !draft) return
  const days = Math.floor(route.roundTripSeconds / DAY)
  const hours = Math.floor((route.roundTripSeconds % DAY) / HOUR)
  const minutes = Math.floor((route.roundTripSeconds % HOUR) / MINUTE)
  draft.routeName = route.routeName
  draft.roundTripDays = days
  draft.roundTripHours = hours
  draft.roundTripMinutes = minutes
  draft.headwayMinutes = Math.max(1, Math.round(route.dispatchIntervalSeconds / MINUTE))
}

function normalizeCustomRoundTrip(groupId, seconds) {
  let value = Math.max(10 * MINUTE, seconds || HOUR)
  if (groupId === 'space') value = Math.max(30 * DAY, value)
  return value
}

function isStageUnlocked(stageId) {
  return stages.find((stage) => stage.id === stageId)?.unlocked ?? false
}

function customSummary(group) {
  const route = customRoute(group.id)
  if (!route?.created) return '노선명 · 왕복시간 · 배차간격 등록'
  if (route.runs >= CUSTOM_MASTER_RUNS) return '커스텀 마스터'
  return '배차간격에 따라 차량 생성 · 운행 완료 후 소멸'
}

function customTimerText(groupId) {
  const route = customRoute(groupId)
  if (!route?.created) return '준비'
  if (route.runs >= CUSTOM_MASTER_RUNS) return 'MASTER'
  const soonest = route.activeVehicles.reduce((min, vehicle) => Math.min(min, vehicle.remainingSeconds), Infinity)
  if (Number.isFinite(soonest)) return formatDuration(soonest)
  if (!route.nextDispatchAt) return '배차 대기'
  const diff = Math.max(0, Math.floor((new Date(route.nextDispatchAt).getTime() - Date.now()) / SECOND))
  return `배차 ${formatDuration(diff)}`
}

function applyOfflineProgress(elapsedSeconds, savedAtDate) {
  if (elapsedSeconds <= 0) return

  let remainingElapsed = elapsedSeconds
  let cursor = new Date(savedAtDate)
  let completedRuns = 0
  let guard = 0

  while (remainingElapsed > 0 && guard < 20000) {
    guard += 1
    updateUnlocks()

    const activeStages = stages.filter((stage) => (
      stage.unlocked && stage.phase !== 'locked' && stage.phase !== 'master'
    ))

    if (activeStages.length === 0) break

    let nextEventSeconds = Infinity
    activeStages.forEach((stage) => {
      const seconds = realSecondsUntilStageEvent(stage, cursor, remainingElapsed)
      if (seconds > 0 && seconds < nextEventSeconds) nextEventSeconds = seconds
    })

    if (!Number.isFinite(nextEventSeconds) || nextEventSeconds > remainingElapsed) {
      advanceStagesByRealSeconds(activeStages, cursor, remainingElapsed)
      remainingElapsed = 0
      break
    }

    advanceStagesByRealSeconds(activeStages, cursor, nextEventSeconds)
    cursor = new Date(cursor.getTime() + nextEventSeconds * SECOND)
    remainingElapsed -= nextEventSeconds

    activeStages.forEach((stage) => {
      if (stage.remainingSeconds <= 0 && stage.phase === 'running') completedRuns += 1
      if (stage.remainingSeconds <= 0) completeStageStep(stage)
    })
  }

  applyPendingCustomUpdates(new Date())
  const customRuns = applyCustomOfflineProgress(elapsedSeconds)

  if (guard >= 20000 && remainingElapsed > 0) {
    addLog('오프라인 진행 일부 반영 · 장기 방치 보정 필요')
  }

  updateUnlocks()

  if (completedRuns > 0 || customRuns > 0) {
    offlineReport.value = {
      elapsedText: formatLongDuration(elapsedSeconds),
      completedRuns,
      customRuns,
    }
    addLog(`오프라인 진행 기본 ${completedRuns}회 · 커스텀 ${customRuns}회 반영`)
  }
}

function applyCustomOfflineProgress(elapsedSeconds) {
  let customRuns = 0
  const now = new Date()

  customRoutes.forEach((route) => {
    if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return

    route.activeVehicles.forEach((vehicle) => {
      vehicle.remainingSeconds = Math.max(0, vehicle.remainingSeconds - elapsedSeconds)
    })

    const completed = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds <= 0).length
    if (completed > 0) {
      const addRuns = Math.min(CUSTOM_MASTER_RUNS - route.runs, completed)
      route.runs += addRuns
      customRuns += addRuns
    }
    route.activeVehicles = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds > 0)

    if (!route.nextDispatchAt) route.nextDispatchAt = now.toISOString()
    let nextTime = new Date(route.nextDispatchAt)
    const headway = Math.max(MINUTE, route.dispatchIntervalSeconds || 30 * MINUTE)
    let guard = 0

    while (nextTime <= now && route.runs < CUSTOM_MASTER_RUNS && guard < 1000) {
      guard += 1
      if (isCustomServiceActive(route.groupId, nextTime)) {
        const ageSeconds = Math.floor((now.getTime() - nextTime.getTime()) / SECOND)
        if (ageSeconds >= route.roundTripSeconds) {
          route.runs += 1
          customRuns += 1
        } else {
          route.activeVehicles.push({
            id: cryptoRandomId(),
            label: `${route.routeName} ${route.activeVehicles.length + 1}호`,
            remainingSeconds: route.roundTripSeconds - ageSeconds,
            startedAt: nextTime.toISOString(),
          })
        }
      }
      nextTime = new Date(nextTime.getTime() + headway * SECOND)
    }
    route.nextDispatchAt = nextTime.toISOString()
  })

  return customRuns
}

function realSecondsUntilStageEvent(stage, cursor, maxSeconds) {
  const remaining = normalizeRemaining(stage)
  if (stage.timeWindow !== 'commuter') return Math.min(remaining, maxSeconds)
  return realSecondsToAccumulateCommuter(cursor, remaining, maxSeconds)
}

function realSecondsToAccumulateCommuter(startDate, needOperableSeconds, maxRealSeconds) {
  if (needOperableSeconds <= 0) return 0

  let accumulated = 0
  let elapsed = 0
  const cursor = new Date(startDate)

  while (elapsed < maxRealSeconds && accumulated < needOperableSeconds) {
    const nextBoundary = nextCommuterBoundary(cursor)
    const step = Math.max(1, Math.min(
      maxRealSeconds - elapsed,
      Math.floor((nextBoundary.getTime() - cursor.getTime()) / SECOND) || 1,
      needOperableSeconds - accumulated || 1,
    ))

    if (isCommuterWindow(cursor)) accumulated += step
    cursor.setTime(cursor.getTime() + step * SECOND)
    elapsed += step
  }

  return accumulated >= needOperableSeconds ? elapsed : maxRealSeconds + 1
}

function nextCommuterBoundary(date) {
  const candidates = []
  for (let offset = 0; offset <= 8; offset += 1) {
    const base = new Date(date)
    base.setDate(base.getDate() + offset)
    base.setHours(0, 0, 0, 0)
    ;[6, 10, 17, 21, 24].forEach((hour) => {
      const candidate = new Date(base)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate > date) candidates.push(candidate)
    })
  }
  return candidates.sort((a, b) => a - b)[0] ?? new Date(date.getTime() + HOUR * SECOND)
}

function advanceStagesByRealSeconds(activeStages, cursor, realSeconds) {
  const end = new Date(cursor.getTime() + realSeconds * SECOND)
  activeStages.forEach((stage) => {
    const effective = stage.timeWindow === 'commuter'
      ? countCommuterOperableSeconds(cursor, end)
      : realSeconds
    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage) - effective)
  })
}

function normalizeRemaining(stage) {
  if (!Number.isFinite(stage.remainingSeconds) || stage.remainingSeconds <= 0) {
    if (stage.phase === 'waiting') return getWaitSeconds(stage)
    return stage.durationSeconds
  }
  return stage.remainingSeconds
}

function countCommuterOperableSeconds(startDate, endDate) {
  if (endDate <= startDate) return 0

  let total = 0
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  while (cursor < endDate) {
    const day = cursor.getDay()
    const isWeekday = day >= 1 && day <= 5

    if (isWeekday) {
      total += overlapSeconds(startDate, endDate, withHour(cursor, 6), withHour(cursor, 10))
      total += overlapSeconds(startDate, endDate, withHour(cursor, 17), withHour(cursor, 21))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return total
}

function withHour(baseDate, hour) {
  const date = new Date(baseDate)
  date.setHours(hour, 0, 0, 0)
  return date
}

function overlapSeconds(rangeStart, rangeEnd, windowStart, windowEnd) {
  const start = Math.max(rangeStart.getTime(), windowStart.getTime())
  const end = Math.min(rangeEnd.getTime(), windowEnd.getTime())
  return Math.max(0, Math.floor((end - start) / SECOND))
}

function stageStateLabel(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.phase === 'master') return '기본 완료'
  const mode = stage.runs >= SUB_STAGE_UNLOCK_RUNS ? '자동' : `${stage.runs}/${SUB_STAGE_UNLOCK_RUNS}회`
  if (stage.phase === 'waiting') return `${mode} · 대기중`
  if (stage.phase === 'running') return `${mode} · 운행중`
  return mode
}

function timerText(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.phase === 'master') return '완료'
  if (stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) return `휴식 · ${formatDuration(stage.remainingSeconds)}`
  return formatDuration(stage.remainingSeconds)
}

function stageDurationLabel(stage) {
  if (stage.timeWindow === 'commuter') return '월~금 06~10 / 17~21'
  return `1회 ${formatLongDuration(stage.durationSeconds)}`
}

function isCommuterWindow(date) {
  const day = date.getDay()
  const hour = date.getHours()
  return day >= 1 && day <= 5 && ((hour >= 6 && hour < 10) || (hour >= 17 && hour < 21))
}



const pendingBirthStoryActors = computed(() => {
  const actors = []

  terrariaStoryboards.forEach((board) => {
    ;(board.steps || []).forEach((step) => {
      if (step.effectType !== 'birth' || !step.birthName || step.birthDeathProcessed) return
      if (step.birthNpcId && getNpcById(step.birthNpcId)) return
      actors.push({
        key: `pending-birth:${board.id}:${step.id}`,
        label: step.birthName,
        birthTime: normalizeDateTimeText(step.time),
        stepId: step.id,
        boardId: board.id,
        note: `${board.title} · ${normalizeDateTimeText(step.time) || '출생 예정'}`,
      })
    })
  })

  storyboardStepDrafts.forEach((step) => {
    if (step.effectType !== 'birth' || !step.birthName || step.birthDeathProcessed) return
    actors.push({
      key: `draft-birth:${step.id}`,
      label: step.birthName,
      birthTime: normalizeDateTimeText(step.time),
      stepId: step.id,
      boardId: 'draft',
      note: `현재 작성 중 · ${normalizeDateTimeText(step.time) || '시간 미정'}`,
    })
  })

  return actors
})

const baseStoryActors = computed(() => {
  const npcActors = storyboardDraft.npcIds
    .map((id) => getNpcById(id))
    .filter(Boolean)
    .map((npc) => ({ key: `npc:${npc.id}`, label: npc.name }))

  const returningActors = storyboardDraft.returningExtraIds
    .map((id) => getExtraById(id))
    .filter(Boolean)
    .map((extra) => ({ key: `extra:${extra.id}`, label: extraLabel(extra) }))

  const newExtraActors = parseNewExtraLines(storyboardDraft.newExtrasText)
    .map((line, index) => ({ key: `new-extra:${index}`, label: `새 엑스트라 ${index + 1} · ${line}` }))

  return uniqueActors([...npcActors, ...returningActors, ...newExtraActors])
})

const availableStoryActors = computed(() => baseStoryActors.value)

function uniqueActors(actors = []) {
  const seen = new Set()
  return actors.filter((actor) => {
    if (!actor.label || seen.has(actor.label)) return false
    seen.add(actor.label)
    return true
  })
}

function isPendingBirthAvailableForStep(actor, targetStep) {
  if (!actor?.birthTime || !targetStep?.time) return false
  if (!isValidDateTimeText(actor.birthTime) || !isValidDateTimeText(targetStep.time)) return false
  if (actor.stepId && targetStep.id && actor.stepId === targetStep.id) return false
  return dateTimeValue(actor.birthTime) <= dateTimeValue(targetStep.time)
}

function availableBirthActorsForStep(step) {
  return pendingBirthStoryActors.value.filter((actor) => isPendingBirthAvailableForStep(actor, step))
}

function availableStoryActorsForStep(step) {
  return uniqueActors([...baseStoryActors.value, ...availableBirthActorsForStep(step)])
}

function availableDeathBirthActorsForStep(step) {
  return availableBirthActorsForStep(step)
}

const availableDeathExtras = computed(() => {
  const ids = new Set([...(storyboardDraft.returningExtraIds || [])])
  parseNewExtraLines(storyboardDraft.newExtrasText).forEach((_, index) => ids.add(`new-extra:${index}`))

  const existing = terrariaExtras.filter((extra) => ids.has(extra.id))
  const newDraftExtras = parseNewExtraLines(storyboardDraft.newExtrasText).map((line, index) => ({
    id: `new-extra:${index}`,
    code: `새 엑스트라 ${index + 1}`,
    name: line,
    origin: line,
    appearances: 0,
    isDraftOnly: true,
  }))
  return [...existing, ...newDraftExtras]
})

const availableDeathBirthActors = computed(() => pendingBirthStoryActors.value)

function normalizeDeathBirthKeysForBoard(keys = [], boardId = '') {
  return Array.from(new Set((Array.isArray(keys) ? keys : []).map((key) => {
    const text = String(key || '')
    if (text.startsWith('pending-birth:')) return text.replace('pending-birth:', 'birth:')
    if (text.startsWith('draft-birth:')) return `birth:${boardId}:${text.replace('draft-birth:', '')}`
    return text
  }).filter(Boolean)))
}

function pendingBirthLabelByKey(key, localSteps = null, boardId = '') {
  const target = resolvePendingBirthByKey(key, localSteps, boardId)
  return target?.step?.birthName || ''
}

function resolvePendingBirthByKey(key, localSteps = null, localBoardId = '') {
  const text = String(key || '')
  let boardId = ''
  let stepId = ''

  if (text.startsWith('birth:')) {
    const parts = text.split(':')
    boardId = parts[1] || ''
    stepId = parts[2] || ''
  } else if (text.startsWith('pending-birth:')) {
    const parts = text.split(':')
    boardId = parts[1] || ''
    stepId = parts[2] || ''
  } else if (text.startsWith('draft-birth:')) {
    boardId = localBoardId
    stepId = text.replace('draft-birth:', '')
  }

  if (!stepId) return null

  if (localSteps && (!boardId || boardId === localBoardId)) {
    const step = localSteps.find((item) => item.id === stepId && item.effectType === 'birth')
    if (step) return { board: { id: localBoardId, title: storyboardDraft.title || '작성 중', npcIds: [] }, step }
  }

  const board = terrariaStoryboards.find((item) => item.id === boardId)
  if (!board) return null
  const step = (board.steps || []).find((item) => item.id === stepId && item.effectType === 'birth')
  if (!step) return null
  return { board, step }
}

function createEmptyStoryClauseDraft(row = {}) {
  return {
    id: row.id || cryptoRandomId(),
    mode: row.mode === 'free' ? 'free' : 'auto',
    actorLabels: Array.isArray(row.actorLabels) ? [...row.actorLabels] : [],
    action: row.action || row.text || '',
  }
}

function normalizeStepClauses(row = {}) {
  if (Array.isArray(row.clauses) && row.clauses.length) {
    return row.clauses.map((clause) => createEmptyStoryClauseDraft(clause))
  }

  return [createEmptyStoryClauseDraft({
    actorLabels: Array.isArray(row.actorLabels) ? [...row.actorLabels] : [],
    action: row.action || row.text || '',
  })]
}

function createEmptyStoryStepDraft() {
  return {
    id: cryptoRandomId(),
    time: '',
    clauses: [createEmptyStoryClauseDraft()],
    effectType: 'none',
    deathNpcIds: [],
    deathExtraIds: [],
    deathBirthKeys: [],
    birthName: '',
    birthGender: '기타/미정',
    birthParentNpcIds: [],
    birthNpcId: '',
    birthDeathProcessed: false,
  }
}

function addStoryStepRow() {
  storyboardStepDrafts.push(createEmptyStoryStepDraft())
}

function removeStoryStepRow(index) {
  if (storyboardStepDrafts.length <= 1) return
  storyboardStepDrafts.splice(index, 1)
}

function resetStoryStepRows(rows = null) {
  storyboardStepDrafts.splice(0, storyboardStepDrafts.length)
  const nextRows = Array.isArray(rows) && rows.length ? rows : [createEmptyStoryStepDraft()]
  nextRows.forEach((row) => {
    storyboardStepDrafts.push({
      id: row.id || cryptoRandomId(),
      time: normalizeDateTimeText(row.time || ''),
      clauses: normalizeStepClauses(row),
      effectType: ['death', 'birth'].includes(row.effectType) ? row.effectType : 'none',
      deathNpcIds: Array.isArray(row.deathNpcIds) ? [...row.deathNpcIds] : [],
      deathExtraIds: Array.isArray(row.deathExtraIds) ? [...row.deathExtraIds] : [],
      deathBirthKeys: Array.isArray(row.deathBirthKeys) ? [...row.deathBirthKeys] : [],
      birthName: row.birthName || '',
      birthGender: row.birthGender || '기타/미정',
      birthParentNpcIds: Array.isArray(row.birthParentNpcIds) ? [...row.birthParentNpcIds] : [],
      birthNpcId: row.birthNpcId || '',
      birthDeathProcessed: Boolean(row.birthDeathProcessed),
    })
  })
}

function addStepClauseRow(step) {
  if (!step) return
  if (!Array.isArray(step.clauses)) step.clauses = [createEmptyStoryClauseDraft()]
  step.clauses.push(createEmptyStoryClauseDraft())
}

function removeStepClauseRow(step, clauseIndex) {
  if (!step || !Array.isArray(step.clauses) || step.clauses.length <= 1) return
  step.clauses.splice(clauseIndex, 1)
}

function toggleClauseActor(clause, actorLabel) {
  if (!clause || !actorLabel) return
  if (!Array.isArray(clause.actorLabels)) clause.actorLabels = []
  const index = clause.actorLabels.indexOf(actorLabel)
  if (index >= 0) clause.actorLabels.splice(index, 1)
  else clause.actorLabels.push(actorLabel)
}

function appendActorToClauseText(clause, actorLabel, particleType = 'subject') {
  if (!clause || !actorLabel) return
  if (!Array.isArray(clause.actorLabels)) clause.actorLabels = []
  if (!clause.actorLabels.includes(actorLabel)) clause.actorLabels.push(actorLabel)
  const particle = particleType === 'with' ? withParticle(actorLabel) : subjectParticle(actorLabel)
  const insertText = `${actorLabel}${particle} `
  const current = String(clause.action || '')
  clause.action = current ? `${current.trimEnd()} ${insertText}` : insertText
}

function stepClauses(step) {
  return normalizeStepClauses(step)
}

function formatClausePreview(clause) {
  return buildStorySentence(clause.actorLabels || [], clause.action || '내용을 입력하세요.', clause.mode)
}

function formatStepPreview(step) {
  return stepClauses(step).map((clause) => formatClausePreview(clause)).join(' ')
}

function formatSavedStepText(step) {
  if (Array.isArray(step.clauses) && step.clauses.length) {
    return step.clauses.map((clause) => buildStorySentence(clause.actorLabels || [], clause.text || clause.action || '', clause.mode)).join(' ')
  }
  return buildStorySentence(step.actorLabels || [], step.text || '')
}

function buildStorySentence(actorLabels, actionText, mode = 'auto') {
  const actors = Array.isArray(actorLabels) ? actorLabels.filter(Boolean) : []
  const action = String(actionText || '').trim() || '내용을 입력하세요.'
  if (mode === 'free') return action
  if (actors.length === 0) return action
  if (actors.length === 1) return `${actors[0]}${subjectParticle(actors[0])} ${action}`

  const subject = actors[0]
  const companions = actors.slice(1)
  const companionText = companions.map((name, index) => {
    const particle = index === companions.length - 1 ? withParticle(name) : ','
    return `${name}${particle}`
  }).join(' ')
  return `${subject}${subjectParticle(subject)} ${companionText} ${action}`
}

function subjectParticle(text) {
  return hasFinalConsonant(text) ? '이' : '가'
}

function withParticle(text) {
  return hasFinalConsonant(text) ? '과' : '와'
}

function hasFinalConsonant(text) {
  const chars = Array.from(String(text || '').trim())
  if (!chars.length) return false
  const code = chars[chars.length - 1].charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return ((code - 0xac00) % 28) !== 0
}

function prepareStoryStepRows() {
  return storyboardStepDrafts
    .map((step) => {
      const clauses = normalizeStepClauses(step)
        .map((clause) => ({
          id: clause.id || cryptoRandomId(),
          mode: clause.mode === 'free' ? 'free' : 'auto',
          actorLabels: Array.isArray(clause.actorLabels) ? [...clause.actorLabels] : [],
          text: String(clause.action || clause.text || '').trim(),
        }))
        .filter((clause) => clause.text || clause.actorLabels.length)
      const actorLabels = Array.from(new Set(clauses.flatMap((clause) => clause.actorLabels || [])))
      const text = clauses.map((clause) => buildStorySentence(clause.actorLabels || [], clause.text || '', clause.mode)).join(' ').trim()

      return {
        id: step.id || cryptoRandomId(),
        time: normalizeDateTimeText(step.time || ''),
        actorLabels,
        clauses,
        text,
        effectType: ['death', 'birth'].includes(step.effectType) ? step.effectType : 'none',
        deathNpcIds: Array.isArray(step.deathNpcIds) ? [...step.deathNpcIds] : [],
        deathExtraIds: Array.isArray(step.deathExtraIds) ? [...step.deathExtraIds] : [],
        deathBirthKeys: Array.isArray(step.deathBirthKeys) ? [...step.deathBirthKeys] : [],
        birthName: String(step.birthName || '').trim(),
        birthGender: step.birthGender || '기타/미정',
        birthParentNpcIds: Array.isArray(step.birthParentNpcIds) ? [...step.birthParentNpcIds] : [],
        birthNpcId: step.birthNpcId || '',
        birthDeathProcessed: Boolean(step.birthDeathProcessed),
      }
    })
    .filter((step) => step.time || step.text || step.actorLabels.length)
}

function parseNewExtraLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const sortedTerrariaStoryboards = computed(() => {
  return [...terrariaStoryboards].sort((a, b) => storyboardDateValue(a.start) - storyboardDateValue(b.start))
})

function submitTerrariaStoryboard() {
  if (editingStoryboardId.value) {
    updateTerrariaStoryboard()
    return
  }
  createTerrariaStoryboard()
}

function createTerrariaStoryboard() {
  const prepared = prepareStoryboardPayload()
  if (!prepared) return

  const { board, npcIds, returningExtraIds, deathNpcIds, title } = prepared
  const newExtraResult = createExtrasFromText(storyboardDraft.newExtrasText, title)
  const newExtraIds = newExtraResult.ids
  applyNewExtraIdMapToBoard(board, newExtraResult.idMap)
  returningExtraIds.forEach((extraId) => registerExtraAppearance(extraId, title))
  board.extraIds = Array.from(new Set([...newExtraIds, ...returningExtraIds]))

  terrariaStoryboards.unshift(board)
  syncNpcBoardLinks(board.id, npcIds)
  processDueTerrariaStepEffects()
  ensureExtraPromotionDrafts()
  resetStoryboardDraft()
  addLog(`테라리아 스토리보드 등록 · ${title}`)
  saveSoon()
}

function updateTerrariaStoryboard() {
  const index = terrariaStoryboards.findIndex((board) => board.id === editingStoryboardId.value)
  if (index < 0) {
    cancelStoryboardEdit()
    return
  }

  const prepared = prepareStoryboardPayload({ existingId: editingStoryboardId.value, keepExistingExtras: true })
  if (!prepared) return

  const oldBoard = terrariaStoryboards[index]
  const { board, npcIds, returningExtraIds, deathNpcIds, title } = prepared
  const newExtraResult = createExtrasFromText(storyboardDraft.newExtrasText, title)
  const newExtraIds = newExtraResult.ids
  applyNewExtraIdMapToBoard(board, newExtraResult.idMap)
  returningExtraIds.forEach((extraId) => {
    if (!(oldBoard.extraIds || []).includes(extraId)) registerExtraAppearance(extraId, title)
  })
  board.extraIds = Array.from(new Set([...(oldBoard.extraIds || []), ...newExtraIds, ...returningExtraIds]))
  board.createdAt = oldBoard.createdAt || board.createdAt
  board.updatedAt = new Date().toISOString()

  removeStoryboardLinks(oldBoard.id)
  terrariaStoryboards.splice(index, 1, board)
  syncNpcBoardLinks(board.id, npcIds)
  processDueTerrariaStepEffects()
  ensureExtraPromotionDrafts()
  resetStoryboardDraft()
  addLog(`테라리아 스토리보드 수정 · ${title}`)
  saveSoon()
}

function prepareStoryboardPayload(options = {}) {
  storyboardFormError.value = ''
  const title = storyboardDraft.title.trim()
  const boardType = storyboardDraft.boardType || 'story'
  const npcIds = [...storyboardDraft.npcIds]
  const returningExtraIds = [...storyboardDraft.returningExtraIds]
  const deathNpcIds = [...storyboardDraft.deathNpcIds]
  const steps = prepareStoryStepRows()

  if (!title) {
    storyboardFormError.value = '보드명을 입력해야 합니다.'
    return null
  }
  if (steps.length === 0) {
    storyboardFormError.value = '스토리 단계는 1개 이상 필요합니다.'
    return null
  }
  if (steps.some((step) => !isValidDateTimeText(step.time) || !step.text)) {
    storyboardFormError.value = '모든 스토리 단계는 시간과 내용을 입력해야 합니다.'
    return null
  }
  if (steps.some((step) => step.effectType === 'death' && step.deathNpcIds.length === 0 && step.deathExtraIds.length === 0 && step.deathBirthKeys.length === 0)) {
    storyboardFormError.value = '사망 처리 단계에는 사망 대상 NPC, 엑스트라, 출생 예정 인물 중 1명 이상 선택해야 합니다.'
    return null
  }
  if (steps.some((step) => step.effectType === 'birth' && !step.birthName)) {
    storyboardFormError.value = '출생 처리 단계에는 출생 예정 이름을 입력해야 합니다.'
    return null
  }

  const sortedSteps = [...steps].sort((a, b) => dateTimeValue(a.time) - dateTimeValue(b.time))
  const start = sortedSteps[0].time
  const end = sortedSteps[sortedSteps.length - 1].time

  const participantNames = npcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  const stepDeathNpcIds = Array.from(new Set(sortedSteps.flatMap((step) => step.effectType === 'death' ? step.deathNpcIds : [])))
  const boardId = options.existingId || cryptoRandomId()
  const stepDeathExtraIds = Array.from(new Set(sortedSteps.flatMap((step) => step.effectType === 'death' ? step.deathExtraIds : [])))
  sortedSteps.forEach((step) => {
    if (step.effectType === 'death') step.deathBirthKeys = normalizeDeathBirthKeysForBoard(step.deathBirthKeys || [], boardId)
  })
  const stepDeathBirthKeys = Array.from(new Set(sortedSteps.flatMap((step) => step.effectType === 'death' ? step.deathBirthKeys : [])))
  const deathNames = stepDeathNpcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  const deathExtraNames = stepDeathExtraIds.map((id) => extraLabel(getExtraById(id))).filter(Boolean)
  const deathBirthNames = stepDeathBirthKeys.map((key) => pendingBirthLabelByKey(key, sortedSteps, boardId)).filter(Boolean)
  const birthNames = sortedSteps.filter((step) => step.effectType === 'birth').map((step) => step.birthName).filter(Boolean)

  return {
    title,
    npcIds,
    returningExtraIds,
    deathNpcIds,
    board: {
      id: boardId,
      title,
      boardType,
      start,
      end,
      npcIds,
      participantNames,
      extraIds: [],
      deathNpcIds: stepDeathNpcIds,
      deathExtraIds: stepDeathExtraIds,
      deathBirthKeys: stepDeathBirthKeys,
      deathNames,
      deathExtraNames,
      deathBirthNames,
      birthNames,
      summary: storyboardDraft.summary.trim(),
      steps: sortedSteps,
      createdAt: new Date().toISOString(),
    },
  }
}

function startEditTerrariaStoryboard(boardId) {
  const board = getBoard(boardId)
  if (!board) return
  editingStoryboardId.value = board.id
  storyboardFormError.value = ''
  Object.assign(storyboardDraft, {
    title: board.title || '',
    boardType: board.boardType || 'story',
    npcIds: [...(board.npcIds || [])].filter((id) => getNpcById(id)),
    returningExtraIds: [...(board.extraIds || [])].filter((id) => getExtraById(id)),
    deathNpcIds: [],
    summary: board.summary || '',
    newExtrasText: '',
  })
  resetStoryStepRows((board.steps || []).map((step) => ({
    id: step.id || cryptoRandomId(),
    time: normalizeDateTimeText(step.time || ''),
    clauses: Array.isArray(step.clauses) && step.clauses.length
      ? step.clauses.map((clause) => ({
          id: clause.id || cryptoRandomId(),
          mode: clause.mode === 'free' ? 'free' : 'auto',
          actorLabels: Array.isArray(clause.actorLabels) ? [...clause.actorLabels] : [],
          action: clause.text || clause.action || '',
        }))
      : [{
          id: cryptoRandomId(),
          mode: step.mode === 'free' ? 'free' : 'auto',
          actorLabels: Array.isArray(step.actorLabels) ? [...step.actorLabels] : [],
          action: step.text || '',
        }],
    effectType: step.effectType || 'none',
    deathNpcIds: Array.isArray(step.deathNpcIds) ? [...step.deathNpcIds] : [],
    deathExtraIds: Array.isArray(step.deathExtraIds) ? [...step.deathExtraIds] : [],
    deathBirthKeys: Array.isArray(step.deathBirthKeys) ? [...step.deathBirthKeys] : [],
    birthName: step.birthName || '',
    birthGender: step.birthGender || '기타/미정',
    birthParentNpcIds: Array.isArray(step.birthParentNpcIds) ? [...step.birthParentNpcIds] : [],
    birthNpcId: step.birthNpcId || '',
    birthDeathProcessed: Boolean(step.birthDeathProcessed),
  })))
}

function cancelStoryboardEdit() {
  resetStoryboardDraft()
}

function resetStoryboardDraft() {
  editingStoryboardId.value = ''
  storyboardFormError.value = ''
  Object.assign(storyboardDraft, { ...defaultStoryboardDraft, npcIds: [], returningExtraIds: [], deathNpcIds: [] })
  resetStoryStepRows()
}

function deleteTerrariaStoryboard(boardId, options = {}) {
  const index = terrariaStoryboards.findIndex((board) => board.id === boardId)
  if (index < 0) return
  const [removed] = terrariaStoryboards.splice(index, 1)
  removeStoryboardLinks(boardId, removed)
  cleanupExtrasAfterStoryboardRemoval(removed)
  if (editingStoryboardId.value === boardId) resetStoryboardDraft()
  addLog(options.expired ? `테라리아 스토리보드 자동 종료 삭제 · ${removed.title}` : `테라리아 스토리보드 삭제 · ${removed.title}`)
  if (!options.skipSave) saveSoon()
}

function cleanupExtrasAfterStoryboardRemoval(removedBoard) {
  const removedExtraIds = Array.isArray(removedBoard?.extraIds) ? removedBoard.extraIds : []
  if (!removedExtraIds.length) return

  removedExtraIds.forEach((extraId) => {
    const stillUsed = terrariaStoryboards.some((board) => (board.extraIds || []).includes(extraId))
    if (stillUsed) return

    const extraIndex = terrariaExtras.findIndex((extra) => extra.id === extraId)
    if (extraIndex < 0) return

    const [removedExtra] = terrariaExtras.splice(extraIndex, 1)
    delete extraPromotionDrafts[extraId]
    addLog(`스토리 종료 엑스트라 삭제 · ${extraLabel(removedExtra)}`)
  })
}

function removeStoryboardLinks(boardId, removedBoard = getBoard(boardId)) {
  const names = removedBoard ? boardNpcNames(removedBoard) : []
  terrariaNpcs.forEach((npc) => {
    npc.boardIds = (npc.boardIds || []).filter((id) => id !== boardId)
    if (names.length) npc.links = (npc.links || []).filter((name) => !names.includes(name))
  })
}

function cleanupExpiredTerrariaStoryboards() {
  const nowValue = standardNow.value.getTime()
  const expiredIds = terrariaStoryboards
    .filter((board) => dateTimeValue(board.end) < nowValue)
    .map((board) => board.id)
  if (!expiredIds.length) return false
  expiredIds.forEach((boardId) => deleteTerrariaStoryboard(boardId, { expired: true, skipSave: true }))
  saveSoon()
  return true
}

function syncNpcBoardLinks(boardId, npcIds) {
  const participantNames = npcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  terrariaNpcs.forEach((npc) => {
    if (!npcIds.includes(npc.id)) return
    if (!npc.boardIds.includes(boardId)) npc.boardIds.push(boardId)
    const otherNames = participantNames.filter((name) => name !== npc.name)
    npc.links = Array.from(new Set([...(npc.links || []), ...otherNames]))
  })
}

function createExtrasFromText(text, boardTitle) {
  const ids = []
  const idMap = {}
  parseNewExtraLines(text).forEach((line, index) => {
    const extra = {
      id: cryptoRandomId(),
      code: nextExtraCode(),
      origin: line,
      appearances: 1,
      firstBoardTitle: boardTitle,
      lastBoardTitle: boardTitle,
      createdAt: new Date().toISOString(),
    }
    terrariaExtras.push(extra)
    extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
    ids.push(extra.id)
    idMap[`new-extra:${index}`] = extra.id
  })
  return { ids, idMap }
}

function applyNewExtraIdMapToBoard(board, idMap = {}) {
  if (!board || !idMap || Object.keys(idMap).length === 0) return
  ;(board.steps || []).forEach((step) => {
    step.deathExtraIds = (step.deathExtraIds || []).map((id) => idMap[id] || id)
  })
  const deathExtraIds = Array.from(new Set((board.steps || []).flatMap((step) => step.effectType === 'death' ? (step.deathExtraIds || []) : [])))
  board.deathExtraIds = deathExtraIds
  board.deathExtraNames = deathExtraIds.map((id) => extraLabel(getExtraById(id))).filter(Boolean)
}

function nextExtraCode() {
  return `EX-${String(terrariaExtras.length + 1).padStart(3, '0')}`
}

function registerExtraAppearance(extraId, boardTitle) {
  const extra = getExtraById(extraId)
  if (!extra) return
  extra.appearances = (Number(extra.appearances) || 0) + 1
  extra.lastBoardTitle = boardTitle
  if (!extraPromotionDrafts[extra.id]) extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
}

function getExtraById(extraId) {
  return terrariaExtras.find((extra) => extra.id === extraId)
}

function extraLabel(extra) {
  if (!extra) return '알 수 없는 엑스트라'
  return extra.name || `${extra.code} · 무명 엑스트라`
}

function boardExtraLabels(board) {
  return (board.extraIds || []).map((id) => extraLabel(getExtraById(id))).filter(Boolean)
}

function stepEffectKey(boardId, stepId, effectType) {
  return `${boardId}:${stepId}:${effectType}`
}

function hasProcessedStepEffect(key) {
  return processedTerrariaStepEffects.includes(key)
}

function markProcessedStepEffect(key) {
  if (!processedTerrariaStepEffects.includes(key)) processedTerrariaStepEffects.push(key)
}

function createBirthNpcFromStep(board, step) {
  if (!board || !step || step.effectType !== 'birth' || !step.birthName || step.birthDeathProcessed) return null
  if (step.birthNpcId && getNpcById(step.birthNpcId)) return getNpcById(step.birthNpcId)

  const birth = normalizeBirthText((step.time || '').split(' ')[0] || '')
  if (!isValidBirthText(birth)) return null

  const parentIds = Array.isArray(step.birthParentNpcIds) ? step.birthParentNpcIds.filter((id) => getNpcById(id)) : []
  const parentNames = parentIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  const child = {
    id: cryptoRandomId(),
    name: step.birthName,
    birth,
    gender: step.birthGender || '기타/미정',
    memo: parentNames.length
      ? `${board.title}에서 출생 · 부모: ${parentNames.join(', ')}`
      : `${board.title}에서 출생`,
    focus: '출생',
    parentIds,
    parentNames,
    boardIds: [board.id],
    links: parentNames,
    originBoardId: board.id,
    originStepId: step.id,
  }
  terrariaNpcs.unshift(child)
  step.birthNpcId = child.id
  if (!board.npcIds.includes(child.id)) board.npcIds.push(child.id)
  board.birthNames = Array.from(new Set([...(board.birthNames || []), child.name]))
  addLog(`테라리아 NPC 출생 · ${child.name} · ${birth}`)
  return child
}

function processDueTerrariaStepEffects() {
  const nowValue = standardNow.value.getTime()
  let changed = false

  terrariaStoryboards.forEach((board) => {
    ;(board.steps || []).forEach((step) => {
      if (!['death', 'birth'].includes(step.effectType)) return
      if (!isValidDateTimeText(step.time) || dateTimeValue(step.time) > nowValue) return

      const key = stepEffectKey(board.id, step.id, step.effectType)
      if (hasProcessedStepEffect(key)) return

      if (step.effectType === 'death') {
        ;(step.deathNpcIds || []).forEach((npcId) => {
          const npc = getNpcById(npcId)
          if (!npc) return
          removeTerrariaNpcById(npcId, { reason: 'death', boardTitle: board.title })
          changed = true
        })
        ;(step.deathExtraIds || []).forEach((extraId) => {
          const extra = getExtraById(extraId)
          if (!extra) return
          removeTerrariaExtraById(extraId, { reason: 'death', boardTitle: board.title })
          changed = true
        })
        ;(step.deathBirthKeys || []).forEach((birthKey) => {
          const target = resolvePendingBirthByKey(birthKey)
          if (!target?.board || !target?.step) return
          const child = createBirthNpcFromStep(target.board, target.step)
          if (child) removeTerrariaNpcById(child.id, { reason: 'death', boardTitle: board.title })
          target.step.birthDeathProcessed = true
          markProcessedStepEffect(stepEffectKey(target.board.id, target.step.id, 'birth'))
          addLog(`테라리아 출생 예정 인물 사망 · ${target.step.birthName} · ${board.title}`)
          changed = true
        })
      }

      if (step.effectType === 'birth') {
        const child = createBirthNpcFromStep(board, step)
        if (child) changed = true
      }

      markProcessedStepEffect(key)
    })
  })

  if (changed) saveSoon()
  return changed
}

function removeTerrariaNpcById(npcId, options = {}) {
  const index = terrariaNpcs.findIndex((npc) => npc.id === npcId)
  if (index < 0) return null
  const [removed] = terrariaNpcs.splice(index, 1)
  terrariaStoryboards.forEach((board) => {
    board.npcIds = (board.npcIds || []).filter((id) => id !== npcId)
    board.deathNpcIds = (board.deathNpcIds || []).filter((id) => id !== npcId)
    ;(board.steps || []).forEach((step) => {
      step.deathNpcIds = (step.deathNpcIds || []).filter((id) => id !== npcId)
    })
  })
  if (options.reason === 'death') addLog(`테라리아 NPC 사망 · ${removed.name} · ${options.boardTitle || '스토리보드'}`)
  else addLog(`테라리아 NPC 삭제 · ${removed.name}`)
  return removed
}

function removeTerrariaExtraById(extraId, options = {}) {
  const index = terrariaExtras.findIndex((extra) => extra.id === extraId)
  if (index < 0) return null
  const [removed] = terrariaExtras.splice(index, 1)
  terrariaStoryboards.forEach((board) => {
    board.extraIds = (board.extraIds || []).filter((id) => id !== extraId)
    board.deathExtraIds = (board.deathExtraIds || []).filter((id) => id !== extraId)
    board.deathExtraNames = (board.deathExtraNames || []).filter((name) => name !== extraLabel(removed))
    ;(board.steps || []).forEach((step) => {
      step.deathExtraIds = (step.deathExtraIds || []).filter((id) => id !== extraId)
    })
  })
  delete extraPromotionDrafts[extraId]
  if (options.reason === 'death') addLog(`테라리아 엑스트라 사망 · ${extraLabel(removed)} · ${options.boardTitle || '스토리보드'}`)
  else addLog(`테라리아 엑스트라 삭제 · ${extraLabel(removed)}`)
  return removed
}

function applyStoryboardDeaths(deathNpcIds, boardId) {
  // 사망 처리는 보드 저장 즉시 실행하지 않습니다.
  // 각 스토리 단계 시간이 표준시간에 도달하면 processDueTerrariaStepEffects()에서 처리합니다.
}

function promoteExtraToNpc(extraId) {
  const extra = getExtraById(extraId)
  const draft = extraPromotionDrafts[extraId]
  if (!extra || !draft?.name?.trim()) return

  const age = Math.max(0, Math.min(120, Number(draft.age) || 0))
  const birthYear = standardNow.value.getFullYear() - age
  const birth = `${birthYear}/01/01`
  const newNpcId = cryptoRandomId()

  terrariaNpcs.unshift({
    id: newNpcId,
    name: draft.name.trim(),
    birth,
    gender: draft.gender || '기타/미정',
    memo: `${extra.code}에서 승격 · ${extra.appearances}회 등장`,
    focus: '엑스트라 승격',
    boardIds: boardsByExtra(extraId).map((board) => board.id),
    links: [],
  })

  boardsByExtra(extraId).forEach((board) => {
    if (!board.npcIds.includes(newNpcId)) board.npcIds.push(newNpcId)
  })

  const index = terrariaExtras.findIndex((item) => item.id === extraId)
  if (index >= 0) terrariaExtras.splice(index, 1)
  delete extraPromotionDrafts[extraId]
  addLog(`엑스트라 NPC 승격 · ${draft.name.trim()}`)
  saveSoon()
}

function boardsByExtra(extraId) {
  return terrariaStoryboards.filter((board) => (board.extraIds || []).includes(extraId))
}

function ensureExtraPromotionDrafts() {
  terrariaExtras.forEach((extra) => {
    if (!extraPromotionDrafts[extra.id]) extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
  })
}

function parseStorySteps(text) {
  return parseNewExtraLines(text)
    .map((line) => {
      const match = line.match(/^(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})\s+(\d{1,2}:\d{2})\s*[-–—:]\s*(.+)$/)
      if (!match) return { id: cryptoRandomId(), time: '', text: line }
      return {
        id: cryptoRandomId(),
        time: normalizeDateTimeText(`${match[1]} ${match[2]}`),
        text: match[3].trim(),
      }
    })
}

function boardNpcNames(board) {
  const liveNames = (board.npcIds || board.npcs || [])
    .map((idOrName) => getNpcById(idOrName)?.name || '')
    .filter(Boolean)
  const snapshotNames = Array.isArray(board.participantNames) ? board.participantNames : []
  return Array.from(new Set([...liveNames, ...snapshotNames]))
}

function getNpcById(npcId) {
  return terrariaNpcs.find((npc) => npc.id === npcId)
}

function dateTimeValue(dateTimeText) {
  const normalized = normalizeDateTimeText(dateTimeText)
  if (!isValidDateTimeText(normalized)) return 0
  const [datePart, timePart] = normalized.split(' ')
  const [year, month, day] = datePart.split('/').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime()
}

function storyboardDateValue(dateText) {
  return dateTimeValue(dateText)
}

function storyboardStatus(board) {
  const now = standardNow.value.getTime()
  const start = dateTimeValue(board.start)
  const end = dateTimeValue(board.end)
  if (now < start) return '예정'
  if (now > end) return '종료됨'
  return '진행 중'
}

function storyboardDurationLabel(board) {
  const days = Math.max(1, Math.round((storyboardDateValue(board.end) - storyboardDateValue(board.start)) / (DAY * SECOND)) + 1)
  if (days <= 1) return '하루 보드'
  if (days <= 31) return '단기 보드'
  if (days <= 365) return '장기 보드'
  return '장시간 프로젝트 보드'
}

function npcHasFutureStoryboard(npc) {
  return (npc.boardIds || []).some((boardId) => {
    const board = getBoard(boardId)
    return board && dateTimeValue(board.end) > standardNow.value.getTime()
  })
}

function startOfTodayValue() {
  return new Date(standardNow.value.getFullYear(), standardNow.value.getMonth(), standardNow.value.getDate()).getTime()
}

function createTerrariaNpc() {
  const name = npcDraft.name.trim()
  const birth = normalizeBirthText(npcDraft.birth)
  if (!name || !isValidBirthText(birth)) return

  terrariaNpcs.unshift({
    id: cryptoRandomId(),
    name,
    birth,
    gender: npcDraft.gender,
    memo: npcDraft.memo.trim(),
    focus: '',
    futureBirth: false,
    boardIds: [],
    links: [],
  })

  Object.assign(npcDraft, { ...defaultNpcDraft })
  addLog(`테라리아 NPC 등록 · ${name}`)
  saveSoon()
}

function deleteTerrariaNpc(npcId) {
  const removed = removeTerrariaNpcById(npcId)
  if (removed) saveSoon()
}

function normalizeDateTimeText(dateTimeText) {
  const raw = String(dateTimeText || '').trim().replace(/\s+/, ' ')
  if (!raw) return ''
  const [datePart, timePart = ''] = raw.split(' ')
  const normalizedDate = normalizeBirthText(datePart)
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})$/)
  if (!timeMatch) return `${normalizedDate} ${timePart}`.trim()
  const hour = timeMatch[1].padStart(2, '0')
  const minute = timeMatch[2].padStart(2, '0')
  return `${normalizedDate} ${hour}:${minute}`
}

function isValidDateTimeText(dateTimeText) {
  const normalized = normalizeDateTimeText(dateTimeText)
  if (!/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(normalized)) return false
  const [datePart, timePart] = normalized.split(' ')
  if (!isValidBirthText(datePart)) return false
  const [hour, minute] = timePart.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function normalizeBirthText(birthText) {
  const raw = String(birthText || '').trim().replaceAll('.', '/').replaceAll('-', '/')
  const parts = raw.split('/').map((part) => part.padStart(2, '0'))
  if (parts.length !== 3) return raw
  return `${parts[0].padStart(4, '0')}/${parts[1]}/${parts[2]}`
}

function isValidBirthText(birthText) {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(birthText)) return false
  const [year, month, day] = birthText.split('/').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function formatBirth(birthText) {
  return normalizeBirthText(birthText)
}

function npcCurrentState(npc) {
  if (!npc.boardIds?.length) return '스토리보드 대기'
  const firstBoard = getBoard(npc.boardIds[0])
  return firstBoard?.status ? `${firstBoard.status} · ${firstBoard.title}` : '보드 연결됨'
}

function boardRangeText(board) {
  if (!board) return ''
  return `${board.start} ~ ${board.end}`
}

function getBoard(boardId) {
  return terrariaStoryboards.find((board) => board.id === boardId)
}

function npcAgeText(birthText) {
  const birthValue = birthDateValue(birthText)
  if (!birthValue) return '나이 미정'
  if (birthValue > standardNow.value.getTime()) return '출생 예정'
  return `${getAge(birthText)}세`
}

function birthDateValue(birthText) {
  const birth = normalizeBirthText(birthText)
  if (!isValidBirthText(birth)) return 0
  const [year, month, day] = birth.split('/').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

function getAge(birthText) {
  const normalized = normalizeBirthText(birthText)
  if (!isValidBirthText(normalized)) return '-'
  const [year, month, day] = normalized.split('/').map(Number)
  if (!year || !month || !day) return 0
  const birth = new Date(year, month - 1, day)
  let age = standardNow.value.getFullYear() - birth.getFullYear()
  const birthdayThisYear = new Date(standardNow.value.getFullYear(), birth.getMonth(), birth.getDate())
  if (standardNow.value < birthdayThisYear) age -= 1
  return age
}

function addLog(text) {
  logs.value = [
    { id: cryptoRandomId(), time: formatLogTime(new Date()), text },
    ...logs.value,
  ].slice(0, 20)
}

function isLegacyDemoNpc(npc) {
  return legacyDemoNpcIds.has(npc?.id) && (npc?.role || npc?.asset || npc?.traits)
}

function normalizeSavedNpc(npc) {
  return {
    id: npc.id || cryptoRandomId(),
    name: npc.name || '이름 없는 NPC',
    birth: normalizeBirthText(npc.birth || ''),
    gender: npc.gender || '기타/미정',
    memo: npc.memo || '',
    focus: npc.focus || '',
    futureBirth: Boolean(npc.futureBirth),
    parentIds: Array.isArray(npc.parentIds) ? npc.parentIds : [],
    parentNames: Array.isArray(npc.parentNames) ? npc.parentNames : [],
    originBoardId: npc.originBoardId || '',
    originStepId: npc.originStepId || '',
    boardIds: Array.isArray(npc.boardIds) ? npc.boardIds : [],
    links: Array.isArray(npc.links) ? npc.links : [],
  }
}

function normalizeSavedStoryboard(board) {
  const steps = Array.isArray(board.steps)
    ? board.steps.map((step) => {
        const clauses = Array.isArray(step.clauses) && step.clauses.length
          ? step.clauses.map((clause) => ({
              id: clause.id || cryptoRandomId(),
              mode: clause.mode === 'free' ? 'free' : 'auto',
              actorLabels: Array.isArray(clause.actorLabels) ? clause.actorLabels : [],
              text: String(clause.text || clause.action || '').trim(),
            })).filter((clause) => clause.text || clause.actorLabels.length)
          : [{
              id: cryptoRandomId(),
              mode: step.mode === 'free' ? 'free' : 'auto',
              actorLabels: Array.isArray(step.actorLabels) ? step.actorLabels : [],
              text: String(step.text || '').trim(),
            }].filter((clause) => clause.text || clause.actorLabels.length)
        const actorLabels = Array.from(new Set(clauses.flatMap((clause) => clause.actorLabels || [])))
        const text = clauses.length
          ? clauses.map((clause) => buildStorySentence(clause.actorLabels || [], clause.text || '', clause.mode)).join(' ').trim()
          : String(step.text || '').trim()
        return {
          id: step.id || cryptoRandomId(),
          time: normalizeDateTimeText(step.time || ''),
          actorLabels,
          clauses,
          text,
          effectType: ['death', 'birth'].includes(step.effectType) ? step.effectType : 'none',
          deathNpcIds: Array.isArray(step.deathNpcIds) ? step.deathNpcIds : [],
          deathExtraIds: Array.isArray(step.deathExtraIds) ? step.deathExtraIds : [],
          deathBirthKeys: Array.isArray(step.deathBirthKeys) ? step.deathBirthKeys : [],
          birthName: step.birthName || '',
          birthGender: step.birthGender || '기타/미정',
          birthParentNpcIds: Array.isArray(step.birthParentNpcIds) ? step.birthParentNpcIds : [],
          birthNpcId: step.birthNpcId || '',
          birthDeathProcessed: Boolean(step.birthDeathProcessed),
        }
      }).filter((step) => step.text)
    : []
  const sortedSteps = [...steps].sort((a, b) => dateTimeValue(a.time) - dateTimeValue(b.time))
  const start = sortedSteps[0]?.time || normalizeDateTimeText(board.start || '')
  const end = sortedSteps[sortedSteps.length - 1]?.time || normalizeDateTimeText(board.end || board.start || '')

  return {
    id: board.id || cryptoRandomId(),
    title: board.title || '이름 없는 스토리보드',
    boardType: board.boardType || 'story',
    start,
    end,
    npcIds: Array.isArray(board.npcIds) ? board.npcIds : [],
    participantNames: Array.isArray(board.participantNames) ? board.participantNames : [],
    extraIds: Array.isArray(board.extraIds) ? board.extraIds : [],
    deathNpcIds: Array.isArray(board.deathNpcIds) ? board.deathNpcIds : [],
    deathNames: Array.isArray(board.deathNames) ? board.deathNames : [],
    birthNames: Array.isArray(board.birthNames) ? board.birthNames : [],
    summary: board.summary || '',
    steps: sortedSteps,
    createdAt: board.createdAt || new Date().toISOString(),
  }
}

function normalizeSavedExtra(extra, index = 0) {
  return {
    id: extra.id || cryptoRandomId(),
    code: extra.code || `EX-${String(index + 1).padStart(3, '0')}`,
    name: extra.name || '',
    origin: extra.origin || '',
    appearances: Math.max(1, Number(extra.appearances) || 1),
    firstBoardTitle: extra.firstBoardTitle || '',
    lastBoardTitle: extra.lastBoardTitle || '',
    createdAt: extra.createdAt || new Date().toISOString(),
  }
}

function getSavePayload() {
  return {
    savedAt: new Date().toISOString(),
    standardTime: standardNow.value.toISOString(),
    activePage: activePage.value,
    stages: stages.map((stage) => ({
      id: stage.id,
      unlocked: stage.unlocked,
      phase: stage.phase,
      runs: stage.runs,
      remainingSeconds: stage.remainingSeconds,
    })),
    customRoutes: customRoutes.map((route) => ({
      groupId: route.groupId,
      created: route.created,
      routeName: route.routeName,
      roundTripSeconds: route.roundTripSeconds,
      dispatchIntervalSeconds: route.dispatchIntervalSeconds,
      nextDispatchAt: route.nextDispatchAt,
      activeVehicles: route.activeVehicles,
      runs: route.runs,
      pendingUpdate: route.pendingUpdate,
    })),
    customDrafts: JSON.parse(JSON.stringify(customDrafts)),
    terrariaNpcs: JSON.parse(JSON.stringify(terrariaNpcs)),
    terrariaStoryboards: JSON.parse(JSON.stringify(terrariaStoryboards)),
    terrariaExtras: JSON.parse(JSON.stringify(terrariaExtras)),
    processedTerrariaStepEffects: JSON.parse(JSON.stringify(processedTerrariaStepEffects)),
    logs: logs.value,
  }
}

async function saveSoon() {
  if (isSaving) return
  isSaving = true
  try {
    await saveRctsAutoSave(getSavePayload())
  } finally {
    isSaving = false
  }
}

async function loadSave() {
  const record = await loadRctsAutoSave()
  if (!record?.payload) {
    updateUnlocks()
    return
  }

  const payload = record.payload
  if (payload.activePage === 'terraria' || payload.activePage === 'rcts') activePage.value = payload.activePage

  if (Array.isArray(payload.stages)) {
    payload.stages.forEach((savedStage) => {
      const stage = stages.find((item) => item.id === savedStage.id)
      if (!stage) return
      stage.unlocked = Boolean(savedStage.unlocked)
      stage.phase = ['running', 'waiting', 'master'].includes(savedStage.phase) ? savedStage.phase : (stage.unlocked ? 'running' : 'locked')
      stage.runs = Number(savedStage.runs) || 0
      stage.remainingSeconds = Number(savedStage.remainingSeconds) || stage.durationSeconds
    })
  }

  if (Array.isArray(payload.customRoutes)) {
    payload.customRoutes.forEach((savedRoute) => {
      const route = customRoute(savedRoute.groupId)
      if (!route) return
      route.created = Boolean(savedRoute.created)
      route.routeName = savedRoute.routeName || ''
      route.roundTripSeconds = Number(savedRoute.roundTripSeconds) || HOUR
      route.dispatchIntervalSeconds = Number(savedRoute.dispatchIntervalSeconds) || 30 * MINUTE
      route.nextDispatchAt = savedRoute.nextDispatchAt || null
      route.activeVehicles = Array.isArray(savedRoute.activeVehicles) ? savedRoute.activeVehicles : []
      route.runs = Math.min(CUSTOM_MASTER_RUNS, Number(savedRoute.runs) || 0)
      route.pendingUpdate = savedRoute.pendingUpdate ?? null
      if (route.created) setDraftFromRoute(route.groupId)
    })
  }

  if (payload.customDrafts && typeof payload.customDrafts === 'object') {
    Object.keys(customDrafts).forEach((groupId) => {
      Object.assign(customDrafts[groupId], payload.customDrafts[groupId] ?? {})
    })
  }

  if (Array.isArray(payload.terrariaStoryboards)) {
    const savedBoards = payload.terrariaStoryboards.map(normalizeSavedStoryboard)
    terrariaStoryboards.splice(0, terrariaStoryboards.length, ...savedBoards)
  }

  if (Array.isArray(payload.terrariaExtras)) {
    const savedExtras = payload.terrariaExtras.map(normalizeSavedExtra)
    terrariaExtras.splice(0, terrariaExtras.length, ...savedExtras)
    ensureExtraPromotionDrafts()
  }

  if (Array.isArray(payload.terrariaNpcs)) {
    const savedNpcs = payload.terrariaNpcs
      .filter((npc) => !isLegacyDemoNpc(npc))
      .map(normalizeSavedNpc)
    terrariaNpcs.splice(0, terrariaNpcs.length, ...savedNpcs)
  }

  if (Array.isArray(payload.processedTerrariaStepEffects)) {
    processedTerrariaStepEffects.splice(0, processedTerrariaStepEffects.length, ...payload.processedTerrariaStepEffects.filter(Boolean))
  }

  ensureExtraPromotionDrafts()

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

  const savedAtIso = payload.savedAt ?? record.savedAt
  if (savedAtIso) {
    const savedAt = new Date(savedAtIso)
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND))
    applyOfflineProgress(elapsedSeconds, savedAt)
  }

  processDueTerrariaStepEffects()
  updateUnlocks()
}

function scheduleTimers() {
  secondTimer = window.setInterval(tickGame, SECOND)
  autoSaveTimer = window.setInterval(saveSoon, AUTO_SAVE_INTERVAL_MS)
  scheduleStandardTick()
}

function scheduleStandardTick() {
  standardNow.value = new Date()
  const delay = 1000 - standardNow.value.getMilliseconds()
  standardTimer = window.setTimeout(scheduleStandardTick, delay)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') saveSoon()
}

function formatApplyDate(value) {
  const date = new Date(value)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}.${dd} 00:00`
}

function formatStandardClock(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function formatLogTime(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mi}`
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / DAY)
  const hours = Math.floor((total % DAY) / HOUR)
  const minutes = Math.floor((total % HOUR) / MINUTE)
  const secs = total % MINUTE

  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${secs}초`
  return `${secs}초`
}

function formatLongDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const months = Math.floor(total / (30 * DAY))
  const days = Math.floor((total % (30 * DAY)) / DAY)
  const hours = Math.floor((total % DAY) / HOUR)
  const minutes = Math.floor((total % HOUR) / MINUTE)

  if (months > 0) return days > 0 ? `${months}개월 ${days}일` : `${months}개월`
  if (days > 0) return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`
  if (hours > 0) return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`
  if (minutes > 0) return `${minutes}분`
  return `${total}초`
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

onMounted(async () => {
  await loadSave()
  scheduleTimers()
  window.addEventListener('beforeunload', saveSoon)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})

onBeforeUnmount(() => {
  if (secondTimer) window.clearInterval(secondTimer)
  if (autoSaveTimer) window.clearInterval(autoSaveTimer)
  if (standardTimer) window.clearTimeout(standardTimer)
  window.removeEventListener('beforeunload', saveSoon)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})
</script>

<style>
:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: rgba(15, 28, 48, 0.94);
  --panel-soft: rgba(15, 28, 48, 0.62);
  --line: rgba(148, 163, 184, 0.18);
  --text: #e8f1ff;
  --muted: #92a4bd;
  --blue: #38bdf8;
  --green: #22c55e;
  --yellow: #f59e0b;
}

* { box-sizing: border-box; }
html, body, #app { min-height: 100%; margin: 0; }
html { overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
body {
  font-family: Inter, Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 32%), var(--bg);
  color: var(--text);
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar,
.rcts-shell::-webkit-scrollbar { width: 0; height: 0; display: none; }
button, input, select, textarea { font-family: inherit; }

.rcts-shell { min-height: 100vh; overflow: visible; }
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px clamp(12px, 3vw, 24px);
  background: rgba(6, 15, 28, 0.92);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.brand { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.brand strong { font-size: 22px; letter-spacing: 0.08em; color: var(--blue); }
.brand span { color: var(--muted); font-size: 12px; white-space: nowrap; }
.clock-box { display: grid; justify-items: end; gap: 1px; min-width: max-content; }
.clock-box span { color: var(--muted); font-size: 10px; }
.clock-box strong { color: var(--blue); font-size: 14px; font-variant-numeric: tabular-nums; }

.page-body {
  width: min(980px, calc(100% - 16px));
  margin: 0 auto;
  padding: 70px 0 28px;
  display: grid;
  gap: 8px;
}
.offline-card,
.group-card,
.slot-card,
.custom-area,
.custom-slot {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 14px;
}
.offline-card {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-color: rgba(56, 189, 248, 0.42);
}
.offline-card div { display: grid; gap: 2px; }
.offline-card strong { color: var(--blue); font-size: 13px; }
.offline-card span { color: var(--muted); font-size: 12px; }
.offline-card button,
.custom-form button {
  border: 0;
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(56, 189, 248, 0.22);
  color: var(--text);
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.group-list { display: grid; gap: 10px; }
.group-card { padding: 9px; display: grid; gap: 8px; }
.group-card.locked { opacity: 0.54; }
.group-card.master { border-color: rgba(34, 197, 94, 0.48); }
.group-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 0 2px;
}
.group-header h2 { margin: 0; font-size: 15px; line-height: 1.1; }
.group-header p { margin: 3px 0 0; color: var(--muted); font-size: 11px; }
.group-state { display: grid; justify-items: end; gap: 2px; min-width: max-content; }
.group-state strong { color: var(--blue); font-size: 15px; font-variant-numeric: tabular-nums; }
.group-state span { color: var(--muted); font-size: 10px; }

.slot-list { display: grid; gap: 6px; }
.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, 190px) minmax(74px, 0.72fr);
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 7px 9px;
  background: var(--panel-soft);
}
.slot-card.locked { opacity: 0.45; }
.slot-card.running { border-color: rgba(56, 189, 248, 0.46); }
.slot-card.waiting { border-color: rgba(245, 158, 11, 0.36); }
.slot-card.auto { border-color: rgba(34, 197, 94, 0.36); }
.slot-card.master { border-color: rgba(34, 197, 94, 0.5); }
.slot-title { display: flex; gap: 8px; align-items: center; min-width: 0; }
.slot-order {
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.14);
  color: var(--blue);
  font-size: 10px;
  font-weight: 900;
  flex: 0 0 auto;
}
h3 { margin: 0; font-size: 13px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
p { margin: 1px 0 0; color: var(--muted); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-timer { display: grid; place-items: center; min-width: 0; text-align: center; }
.slot-timer strong {
  color: var(--blue);
  font-size: clamp(20px, 3.4vw, 28px);
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.slot-side { display: grid; justify-items: end; min-width: 0; }
.slot-side span {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.custom-area {
  display: grid;
  gap: 8px;
  padding: 9px;
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.055);
}
.custom-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.custom-head strong { color: #86efac; font-size: 13px; }
.custom-head span { color: var(--muted); font-size: 10px; text-align: right; }
.custom-form {
  display: grid;
  grid-template-columns: minmax(130px, 1.1fr) minmax(160px, 1.5fr) minmax(90px, 0.7fr) auto;
  gap: 8px;
  align-items: end;
}
.custom-form label { display: grid; gap: 4px; color: var(--muted); font-size: 10px; }
.custom-form input {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 9px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-weight: 800;
}
.time-inputs { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto; gap: 4px; align-items: center; }
.time-inputs.short { grid-template-columns: 1fr auto; }
.time-inputs em { color: var(--muted); font-style: normal; font-size: 10px; }
.timetable-note {
  grid-column: 1 / -1;
  padding: 7px 9px;
  border: 1px solid rgba(56, 189, 248, 0.24);
  border-radius: 10px;
  color: var(--blue);
  font-size: 11px;
  font-weight: 900;
  background: rgba(56, 189, 248, 0.07);
}
.timetable-note small { display: block; margin-top: 3px; color: var(--muted); font-weight: 700; }
.custom-slot {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(118px, 190px) minmax(84px, 0.6fr);
  gap: 8px;
  align-items: center;
  padding: 8px 9px;
  background: rgba(15, 28, 48, 0.74);
}
.custom-slot.complete { border-color: rgba(34, 197, 94, 0.58); }
.custom-title { min-width: 0; }
.custom-timer { display: grid; justify-items: center; gap: 3px; text-align: center; }
.custom-timer strong {
  color: #86efac;
  font-size: clamp(18px, 3vw, 24px);
  line-height: 1;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}
.custom-timer span,
.custom-side span { color: var(--muted); font-size: 10px; }
.custom-side { display: grid; justify-items: end; gap: 2px; }
.custom-side strong { color: #86efac; font-size: 14px; font-variant-numeric: tabular-nums; }
.pending-update {
  grid-column: 1 / -1;
  margin: 0;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  font-size: 10px;
  font-weight: 900;
  width: fit-content;
}
.custom-edit-form {
  border-top: 1px solid var(--line);
  padding-top: 8px;
}

.vehicle-strip,
.vehicle-empty {
  grid-column: 1 / -1;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin: 0;
}
.vehicle-strip span,
.vehicle-empty {
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}


.storyboard-manager { display: grid; gap: 10px; }
.storyboard-create-card,
.storyboard-world-note,
.board-empty-card {
  border: 1px solid rgba(167, 139, 250, 0.28);
  background: rgba(17, 24, 39, 0.88);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
}
.storyboard-create-title { display: grid; gap: 4px; }
.storyboard-create-title span { color: var(--violet); font-size: 10px; font-weight: 950; letter-spacing: 0.08em; }
.storyboard-create-title strong { font-size: 16px; letter-spacing: -0.02em; }
.storyboard-create-title p,
.storyboard-world-note p,
.board-empty-card p { margin: 0; color: var(--muted); white-space: normal; line-height: 1.5; }
.storyboard-create-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.8fr); gap: 8px; }
.storyboard-create-grid label,
.storyboard-summary-field,
.storyboard-steps-field,
.participant-box { display: grid; gap: 6px; color: var(--muted); font-size: 10px; font-weight: 900; }
.storyboard-create-grid input,
.storyboard-summary-field textarea,
.storyboard-steps-field input,
.storyboard-steps-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 10px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
}
.storyboard-summary-field textarea { min-height: 70px; resize: vertical; line-height: 1.5; }
.storyboard-steps-field textarea { min-height: 54px; resize: vertical; line-height: 1.55; }
.step-title-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.step-title-row button {
  border: 1px solid rgba(167, 139, 250, 0.35);
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(167, 139, 250, 0.16);
  color: var(--text);
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}
.storyboard-steps-field p,
.step-actor-palette p,
.story-step-actors p { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.45; }
.step-actor-palette,
.story-step-editor { display: grid; gap: 8px; }
.step-actor-palette strong { color: var(--text); font-size: 11px; }
.actor-chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
.actor-chip-list span,
.actor-chip-list button {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(6, 15, 28, 0.52);
  color: var(--text);
  font-size: 11px;
  font-weight: 900;
}
.actor-chip-list button { cursor: pointer; }
.actor-chip-list button.active { border-color: rgba(167, 139, 250, 0.7); background: rgba(167, 139, 250, 0.24); }
.story-step-row { border: 1px solid var(--line); border-radius: 14px; padding: 10px; display: grid; gap: 9px; background: rgba(6, 15, 28, 0.35); }
.story-step-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }

.story-clause-editor {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  padding: 9px;
  display: grid;
  gap: 8px;
  background: rgba(15, 23, 42, 0.38);
}
.story-clause-title,
.story-clause-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.story-clause-title span,
.story-clause-head strong { color: var(--text); font-size: 11px; font-weight: 950; }
.story-clause-title button,
.story-clause-head button {
  border: 1px solid rgba(56, 189, 248, 0.32);
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(56, 189, 248, 0.12);
  color: var(--text);
  font-size: 10px;
  font-weight: 950;
  cursor: pointer;
}
.story-clause-head button {
  border-color: rgba(248, 113, 113, 0.32);
  background: rgba(248, 113, 113, 0.10);
  color: #fecaca;
}
.story-clause-head button:disabled { opacity: 0.4; cursor: not-allowed; }
.story-clause-row {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 11px;
  padding: 8px;
  display: grid;
  gap: 7px;
  background: rgba(6, 15, 28, 0.42);
}
.story-clause-preview {
  padding: 7px 8px;
  border-radius: 9px;
  background: rgba(167, 139, 250, 0.08);
  color: var(--text);
  font-size: 11px;
  line-height: 1.5;
}
.story-step-head label,
.story-step-action,
.story-step-actors { display: grid; gap: 5px; }
.story-step-head button {
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(248, 113, 113, 0.10);
  color: #fecaca;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}
.story-step-head button:disabled { opacity: 0.4; cursor: not-allowed; }
.story-step-preview { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 8px; padding: 8px; border-radius: 10px; background: rgba(148, 163, 184, 0.08); font-size: 11px; }
.story-step-preview time { color: var(--violet); font-weight: 950; }
.story-step-preview span { color: var(--text); }
.story-step-list em { display: block; color: var(--violet); font-style: normal; font-weight: 950; margin-bottom: 2px; }
.participant-list { display: flex; gap: 7px; flex-wrap: wrap; }
.participant-list label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(6, 15, 28, 0.5);
  cursor: pointer;
}
.participant-list input { accent-color: #a78bfa; }
.participant-list em { color: var(--text); font-size: 11px; font-style: normal; font-weight: 900; }
.storyboard-create-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.storyboard-create-actions span { color: var(--muted); font-size: 11px; }
.storyboard-create-actions button,
.board-actions button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(167, 139, 250, 0.22);
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.storyboard-create-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
.storyboard-world-note { border-style: dashed; background: rgba(167, 139, 250, 0.07); }
.storyboard-world-note strong,
.board-empty-card strong { font-size: 14px; color: var(--text); }
.board-empty-card { text-align: center; border-style: dashed; }
.story-step-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}
.story-step-list li {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 8px;
  padding: 8px 9px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  font-size: 11px;
  line-height: 1.45;
}
.story-step-list time { color: var(--violet); font-weight: 950; white-space: nowrap; }
.story-step-list span { color: var(--text); }
.board-actions { display: flex; justify-content: flex-end; }
.board-actions button {
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.10);
  color: #fecaca;
  padding: 6px 10px;
  font-size: 10px;
}


.storyboard-create-grid.wide { grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr); }
.storyboard-create-grid select,
.extra-promote-form input,
.extra-promote-form select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 10px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
}
.extra-box { border-color: rgba(56, 189, 248, 0.28); }
.danger-box { border-color: rgba(248, 113, 113, 0.32); }
.danger-box p { color: #fecaca; }
.death-list label { border-color: rgba(248, 113, 113, 0.28); background: rgba(248, 113, 113, 0.08); }
.extra-manager { display: grid; gap: 10px; }
.extra-card {
  border: 1px solid rgba(167, 139, 250, 0.28);
  background: rgba(17, 24, 39, 0.88);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 12px;
  align-items: start;
}
.extra-card > div > span { color: var(--violet); font-size: 10px; font-weight: 950; }
.extra-card h3 { margin-top: 3px; font-size: 15px; white-space: normal; }
.extra-card p { white-space: normal; line-height: 1.5; }
.extra-state { display: grid; justify-items: end; gap: 3px; }
.extra-state strong { color: var(--violet); font-size: 14px; }
.extra-state span { color: var(--muted); font-size: 11px; }
.extra-promote-form {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 140px auto;
  gap: 8px;
  align-items: end;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.extra-promote-form label { display: grid; gap: 5px; color: var(--muted); font-size: 10px; font-weight: 900; }
.extra-promote-form button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(167, 139, 250, 0.22);
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .custom-form { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .top-header { padding: 9px 10px; }
  .brand span { display: none; }
  .page-body { width: min(100% - 10px, 980px); padding-top: 64px; }
  .group-card { padding: 7px; gap: 7px; }
  .group-header h2 { font-size: 14px; }
  .group-header p { font-size: 10px; }
  .group-state strong { font-size: 13px; }
  .slot-card {
    grid-template-columns: minmax(76px, 1fr) minmax(106px, 1.02fr) minmax(62px, 0.72fr);
    gap: 5px;
    min-height: 50px;
    padding: 6px 7px;
  }
  .slot-order { width: 21px; height: 21px; font-size: 9px; border-radius: 7px; }
  h3 { font-size: 12px; }
  p { font-size: 9px; }
  .slot-timer strong { font-size: clamp(18px, 6.5vw, 25px); }
  .slot-side span { font-size: 9px; }
  .custom-head { align-items: start; }
  .custom-head span { max-width: 48%; }
  .custom-slot {
    grid-template-columns: minmax(86px, 1fr) minmax(100px, 1fr) minmax(58px, 0.6fr);
    gap: 5px;
    padding: 7px;
  }
  .custom-timer strong { font-size: clamp(17px, 6vw, 23px); }
}

:root { --violet: #a78bfa; }
.rcts-shell.terraria-mode {
  background:
    radial-gradient(circle at top right, rgba(167, 139, 250, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.08), transparent 28%),
    var(--bg);
}
.page-switch {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(15, 28, 48, 0.62);
}
.page-switch button {
  border: 0;
  border-radius: 999px;
  padding: 7px 11px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}
.page-switch button.active {
  background: rgba(56, 189, 248, 0.18);
  color: var(--text);
}
.terraria-mode .page-switch button.active {
  background: rgba(167, 139, 250, 0.22);
}
.terraria-mode .brand strong,
.terraria-mode .clock-box strong { color: var(--violet); }
.terraria-page {
  width: min(980px, calc(100% - 16px));
  margin: 0 auto;
  padding: 74px 0 30px;
  display: grid;
  gap: 10px;
}
.terraria-hero,
.npc-card,
.npc-empty-card,
.board-card,
.project-card,
.timeline-card,
.world-status-card {
  border: 1px solid var(--line);
  background: rgba(17, 24, 39, 0.88);
  border-radius: 16px;
}
.terraria-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 12px;
  padding: 16px;
  align-items: stretch;
}
.eyebrow { color: var(--violet); font-size: 11px; font-weight: 950; letter-spacing: 0.08em; }
.terraria-hero h1 { margin: 4px 0 8px; font-size: clamp(20px, 3.5vw, 32px); line-height: 1.18; letter-spacing: -0.04em; }
.terraria-hero p { font-size: 12px; white-space: normal; line-height: 1.55; }
.world-status-card { padding: 14px; display: grid; gap: 8px; align-content: center; }
.world-status-card span { color: var(--muted); font-size: 11px; font-weight: 900; }
.world-status-card strong { color: var(--violet); font-size: 18px; }
.world-status-card p { white-space: normal; line-height: 1.45; }
.terraria-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.terraria-tabs::-webkit-scrollbar { display: none; }
.terraria-tabs button {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 9px 12px;
  background: rgba(15, 28, 48, 0.76);
  color: var(--muted);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.terraria-tabs button.active { color: var(--text); border-color: rgba(167, 139, 250, 0.45); background: rgba(167, 139, 250, 0.16); }
.npc-manager { display: grid; gap: 10px; }
.npc-create-card {
  border: 1px solid rgba(167, 139, 250, 0.28);
  background: rgba(17, 24, 39, 0.88);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
}
.npc-create-title { display: grid; gap: 4px; }
.npc-create-title span { color: var(--violet); font-size: 10px; font-weight: 950; letter-spacing: 0.08em; }
.npc-create-title strong { font-size: 16px; letter-spacing: -0.02em; }
.npc-create-title p { white-space: normal; line-height: 1.45; }
.npc-create-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.npc-create-grid.simple { grid-template-columns: 1.15fr 1fr 0.8fr 0.72fr; }
.npc-create-grid label,
.npc-memo-field { display: grid; gap: 5px; color: var(--muted); font-size: 10px; font-weight: 900; }
.npc-create-grid input,
.npc-create-grid select,
.npc-memo-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 10px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
}
.npc-memo-field textarea { min-height: 68px; resize: vertical; line-height: 1.45; }
.npc-age-preview {
  display: grid;
  gap: 5px;
  align-content: center;
  padding: 8px 10px;
  border: 1px solid rgba(167, 139, 250, 0.28);
  border-radius: 10px;
  background: rgba(167, 139, 250, 0.08);
}
.npc-age-preview span { color: var(--muted); font-size: 10px; font-weight: 900; }
.npc-age-preview strong { font-size: 16px; color: var(--violet); }
.npc-create-actions { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
.npc-create-actions span { color: var(--muted); font-size: 11px; }
.npc-create-actions button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(167, 139, 250, 0.22);
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.terraria-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.npc-card { padding: 13px; display: grid; gap: 12px; }
.npc-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
.npc-role { display: inline-flex; color: var(--violet); font-size: 10px; font-weight: 950; margin-bottom: 4px; }
.npc-head h2,
.board-card h2,
.project-card h2 { margin: 0; font-size: 18px; letter-spacing: -0.03em; }
.npc-head p,
.board-card p,
.project-card p,
.timeline-card p { white-space: normal; line-height: 1.45; }
.npc-head-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.npc-head-actions strong { color: var(--text); font-size: 11px; padding: 5px 8px; border-radius: 999px; background: rgba(167, 139, 250, 0.12); white-space: nowrap; }
.npc-head-actions button {
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(248, 113, 113, 0.10);
  color: #fecaca;
  font-size: 10px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.npc-empty-card {
  grid-column: 1 / -1;
  padding: 18px;
  display: grid;
  gap: 6px;
  text-align: center;
  border-style: dashed;
  background: rgba(17, 24, 39, 0.72);
}
.npc-empty-card strong { font-size: 16px; }
.npc-empty-card p { margin: 0; color: var(--muted); line-height: 1.5; white-space: normal; }
.npc-profile-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.npc-profile-tags span {
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(167, 139, 250, 0.10);
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}
.npc-memo {
  margin: 0;
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  white-space: normal;
  line-height: 1.5;
}
.npc-storyboards,
.npc-people { display: grid; gap: 7px; }
.npc-storyboards h3,
.npc-people h3 { margin: 0; color: var(--muted); font-size: 11px; }
.npc-storyboards ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.npc-storyboards li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 11px; }
.npc-storyboards li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.npc-storyboards li em { color: var(--muted); font-size: 10px; font-style: normal; white-space: nowrap; }
.npc-people div { display: flex; gap: 5px; flex-wrap: wrap; }
.npc-people span,
.board-meta span { padding: 5px 7px; border-radius: 999px; background: rgba(148, 163, 184, 0.12); color: var(--muted); font-size: 10px; font-weight: 800; }
.empty-board-space,
.empty-link-space {
  padding: 10px;
  border: 1px dashed rgba(167, 139, 250, 0.32);
  border-radius: 12px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  background: rgba(167, 139, 250, 0.06);
}
.board-list,
.project-list,
.timeline-list { display: grid; gap: 10px; }
.board-card,
.project-card { padding: 14px; display: grid; gap: 10px; }
.board-card.day { border-color: rgba(56, 189, 248, 0.32); }
.board-card.project { border-color: rgba(167, 139, 250, 0.36); }
.board-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
.board-top span,
.project-card > div > span { color: var(--violet); font-size: 10px; font-weight: 950; }
.board-top strong { color: var(--text); font-size: 11px; }
.board-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.progress-track { height: 7px; border-radius: 999px; background: rgba(148, 163, 184, 0.14); overflow: hidden; }
.progress-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--violet), var(--blue)); }
.project-card { grid-template-columns: minmax(0, 1fr) 160px; align-items: center; }
.project-card .progress-track { grid-column: 1 / -1; }
.project-time { display: grid; justify-items: end; gap: 3px; }
.project-time strong { color: var(--violet); font-size: 15px; }
.project-time span { color: var(--muted); font-size: 11px; }
.timeline-card { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 12px; padding: 13px; align-items: start; }
.timeline-card time { color: var(--violet); font-size: 12px; font-weight: 950; }
.timeline-card strong { font-size: 14px; }


.storyboard-manager { display: grid; gap: 10px; }
.storyboard-create-card,
.storyboard-world-note,
.board-empty-card {
  border: 1px solid rgba(167, 139, 250, 0.28);
  background: rgba(17, 24, 39, 0.88);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
}
.storyboard-create-title { display: grid; gap: 4px; }
.storyboard-create-title span { color: var(--violet); font-size: 10px; font-weight: 950; letter-spacing: 0.08em; }
.storyboard-create-title strong { font-size: 16px; letter-spacing: -0.02em; }
.storyboard-create-title p,
.storyboard-world-note p,
.board-empty-card p { margin: 0; color: var(--muted); white-space: normal; line-height: 1.5; }
.storyboard-create-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.8fr); gap: 8px; }
.storyboard-create-grid label,
.storyboard-summary-field,
.storyboard-steps-field,
.participant-box { display: grid; gap: 6px; color: var(--muted); font-size: 10px; font-weight: 900; }
.storyboard-create-grid input,
.storyboard-summary-field textarea,
.storyboard-steps-field input,
.storyboard-steps-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 10px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
}
.storyboard-summary-field textarea { min-height: 70px; resize: vertical; line-height: 1.5; }
.storyboard-steps-field textarea { min-height: 54px; resize: vertical; line-height: 1.55; }
.participant-list { display: flex; gap: 7px; flex-wrap: wrap; }
.participant-list label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(6, 15, 28, 0.5);
  cursor: pointer;
}
.participant-list input { accent-color: #a78bfa; }
.participant-list em { color: var(--text); font-size: 11px; font-style: normal; font-weight: 900; }
.storyboard-create-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.storyboard-create-actions span { color: var(--muted); font-size: 11px; }
.storyboard-create-actions button,
.board-actions button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(167, 139, 250, 0.22);
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.storyboard-create-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
.storyboard-world-note { border-style: dashed; background: rgba(167, 139, 250, 0.07); }
.storyboard-world-note strong,
.board-empty-card strong { font-size: 14px; color: var(--text); }
.board-empty-card { text-align: center; border-style: dashed; }
.story-step-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}
.story-step-list li {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 8px;
  padding: 8px 9px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  font-size: 11px;
  line-height: 1.45;
}
.story-step-list time { color: var(--violet); font-weight: 950; white-space: nowrap; }
.story-step-list span { color: var(--text); }
.board-actions { display: flex; justify-content: flex-end; }
.board-actions button {
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.10);
  color: #fecaca;
  padding: 6px 10px;
  font-size: 10px;
}

@media (max-width: 760px) {
  .top-header { flex-wrap: wrap; }
  .page-switch { order: 3; width: 100%; justify-content: center; }
  .page-body,
  .terraria-page { padding-top: 108px; }
  .terraria-hero,
  .terraria-grid,
  .npc-create-grid,
  .storyboard-create-grid,
  .project-card,
  .timeline-card,
  .storyboard-create-grid.wide,
  .extra-card,
  .extra-promote-form { grid-template-columns: 1fr; }
  .npc-create-actions,
  .storyboard-create-actions { align-items: stretch; flex-direction: column; }
  .project-time,
  .extra-state { justify-items: start; }
}

@media (max-width: 640px) {
  .page-body,
  .terraria-page { width: min(100% - 10px, 980px); padding-top: 112px; }
  .terraria-hero { padding: 14px; }
  .npc-storyboards li { grid-template-columns: 1fr; gap: 2px; }
  .timeline-card { gap: 6px; }
  .story-step-list li { grid-template-columns: 1fr; gap: 3px; }
}


.form-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
  font-size: 13px;
  font-weight: 700;
}

.story-step-effect {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.22);
}

.step-effect-panel {
  display: grid;
  gap: 8px;
}

.birth-box {
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 12px;
  padding: 10px;
  background: rgba(14, 165, 233, 0.08);
}


.story-clause-mode {
  display: grid;
  gap: 6px;
}

.story-clause-mode label {
  display: grid;
  gap: 6px;
}

.free-actor-insert {
  border-color: rgba(34, 197, 94, 0.20);
  background: rgba(34, 197, 94, 0.06);
}

.actor-insert-list {
  align-items: stretch;
}

.actor-insert-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.32);
}

.actor-insert-item em {
  font-style: normal;
  color: var(--text);
  font-size: 11px;
  font-weight: 800;
}

.actor-insert-item button {
  padding: 4px 7px;
  font-size: 10px;
}

</style>

