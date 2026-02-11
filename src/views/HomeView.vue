<template>
  <section class="relative z-10 w-full px-4 pb-24 pt-10 sm:px-6">
    <div class="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[260px_1fr_320px]">
      <aside class="space-y-4">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Top ligues</p>
          <div class="mt-4 space-y-2">
            <button
              v-for="sport in sports"
              :key="sport"
              class="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/50"
            >
              <span>{{ sport }}</span>
              <span class="text-emerald-300">+</span>
            </button>
          </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-fuchsia-500/10 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-zinc-200">Mode Rapide</p>
          <p class="mt-3 text-sm text-zinc-300">Acces direct aux picks et au calendrier de {{ teamName }}.</p>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <RouterLink
              to="/pickem"
              class="rounded-3xl border border-white/10 bg-black/70 px-4 py-4 text-center text-sm font-semibold text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset]"
            >
              Pick'em
            </RouterLink>
            <RouterLink
              to="/matches"
              class="rounded-3xl border border-white/10 bg-black/70 px-4 py-4 text-center text-sm font-semibold text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset]"
            >
              Matchs
            </RouterLink>
          </div>
        </div>
      </aside>

      <main class="space-y-4">
        <div class="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Gentle Mate Pick'em</p>
          <h1 class="mt-3 font-teko text-4xl uppercase leading-[0.92] text-white sm:text-6xl">
            Tableau Des Paris <span class="text-emerald-300">{{ teamName }}</span>
          </h1>
          <p class="mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Layout inspiré bookmaker: cote rapide, planning immédiat, accès pick en 1 clic.
          </p>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-[0.35em] text-emerald-300">Matchs Disponibles</p>
            <RouterLink to="/matches" class="text-xs uppercase tracking-[0.3em] text-zinc-400">Voir tout</RouterLink>
          </div>

          <div v-if="loading" class="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
            Chargement
          </div>
          <div v-else-if="error" class="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {{ error }}
          </div>

          <div v-else class="mt-4 space-y-3">
            <div
              v-for="match in homeMatches"
              :key="match.id"
              class="rounded-2xl border border-white/10 bg-black/40 p-4"
            >
              <div>
                <p class="text-sm font-semibold text-white">{{ getMatchTitle(match) }}</p>
                <p class="mt-1 text-xs text-zinc-400">{{ getMatchMeta(match) }}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="badge in getMatchBadges(match)"
                    :key="`${match.id}-${badge}`"
                    class="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-emerald-200"
                  >
                    {{ badge }}
                  </span>
                </div>
                <p class="mt-2 text-xs uppercase tracking-[0.25em] text-emerald-300">{{ formatMatchDate(match.begin_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="space-y-4">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Resultats</p>
          <div class="mt-4 space-y-2">
            <div
              v-for="match in ticketResults"
              :key="match.id"
              class="rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <p class="text-sm text-white">{{ getMatchTitle(match) }}</p>
              <p class="mt-1 text-xs uppercase tracking-[0.22em] text-emerald-300">{{ getMatchScoreline(match) }}</p>
            </div>
            <p v-if="ticketResults.length === 0" class="text-xs text-zinc-400">Aucun resultat disponible.</p>
          </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Flash Infos</p>
          <div class="mt-3 space-y-2">
            <div class="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">
              Forme du moment et calendrier synchrone avec PandaScore.
            </div>
            <div class="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">
              Pense a valider tes picks avant le debut des matchs.
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import {
  formatMatchDate,
  getMatchMeta,
  getMatchScoreline,
  getMatchTitle,
  useBrandInfo,
  usePastMatches,
  useUpcomingMatches,
} from '../services/pickemCore';

const { teamName } = useBrandInfo();
const { matches, loading, error } = useUpcomingMatches();
const { matches: pastMatches } = usePastMatches({ perPage: 10 });
const homeMatches = computed(() => (matches.value || []).slice(0, 5));
const ticketResults = computed(() => (pastMatches.value || []).slice(0, 2));

const sports = computed(() => [
  'Call Of Duty',
  'Valorant',
  'Counter-Strike',
  'Rocket League',
  'TFT',
  'Fortnite',
]);

const getMatchBadges = (match) => {
  const badges = [];
  const game = String(match?.videogame?.name || '').toLowerCase();
  const text = `${match?.league?.name || ''} ${match?.serie?.name || ''} ${match?.tournament?.name || ''}`.toLowerCase();

  if (game.includes('counter-strike') || game.includes('cs2') || game.includes('cs-go')) badges.push('CS');
  if (game.includes('call of duty') || game.includes('cod') || game.includes('warzone')) badges.push('COD');
  if (game.includes('valorant')) {
    if (text.includes('game changers') || text.includes('gc')) {
      badges.push('GC');
    } else if (text.includes('vct')) {
      badges.push('VCT');
    }
  }

  return badges;
};
</script>
