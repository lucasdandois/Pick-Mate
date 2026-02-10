import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MatchesView from '../views/MatchesView.vue';
import ResultsView from '../views/ResultsView.vue';
import PickemView from '../views/PickemView.vue';
import LoginView from '../views/LoginView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';
import ReglementView from '../views/ReglementView.vue';
import ConditionsView from '../views/ConditionsView.vue';
import ConfidentialiteView from '../views/ConfidentialiteView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/matches', name: 'calendar', component: MatchesView },
    { path: '/results', name: 'results', component: ResultsView },
    { path: '/pickem', name: 'pickem', component: PickemView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/reglement', name: 'reglement', component: ReglementView },
    { path: '/conditions', name: 'conditions', component: ConditionsView },
    { path: '/confidentialite', name: 'confidentialite', component: ConfidentialiteView },
  ],
});

export default router;
