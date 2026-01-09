// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import MainView from '@/views/MainView.vue'
import AboutPage from '@/components/about/aboutpage.vue'
import CommunityPage from '@/components/community/communitypage.vue'
import DevlogPage from '@/components/devlog/devlogpage.vue'
import WikiPage from '@/components/wiki/wikipage.vue'
import PlayPage from '@/components/play/PlayPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'main', component: MainView },
    { path: '/about', name: 'about', component: AboutPage },
    { path: '/community', name: 'community', component: CommunityPage },
    { path: '/devlog', name: 'devlog', component: DevlogPage },
    { path: '/wiki', name: 'wiki', component: WikiPage },
    { path: '/play', name: 'play', component: PlayPage },
  ],
})

export default router
