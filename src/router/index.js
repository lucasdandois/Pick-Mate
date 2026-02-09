import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MatchesView from '../views/MatchesView.vue';
import ResultsView from '../views/ResultsView.vue';
import PickemView from '../views/PickemView.vue';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/matches', name: 'calendar', component: MatchesView },
    { path: '/results', name: 'results', component: ResultsView },
    { path: '/pickem', name: 'pickem', component: PickemView },
    { path: '/login', name: 'login', component: LoginView },
  ],
});

export default router;
