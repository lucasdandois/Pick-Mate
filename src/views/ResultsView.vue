<template>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-12">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Resultats</p>
        <h2 class="mt-2 font-teko text-4xl uppercase text-white">Board Des Resultats</h2>
      </div>
      <button class="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white" @click="refresh">
        Rafraichir
      </button>
    </div>

    <div class="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <p class="px-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">Jeux Avec Matchs</p>
        <button
          v-for="game in games"
          :key="game.name"
          class="rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.25em]"
          :class="selectedGame === game.name
            ? 'border-emerald-400 bg-emerald-400 text-black'
            : 'border-white/15 bg-black/40 text-zinc-200 hover:border-emerald-400/60'"
          @click="setGame(game.name)"
        >
          {{ game.name }} ({{ game.count }})
        </button>
      </div>
    </div>

    <div class="mt-4 space-y-4">
      <div v-if="loading" class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        Chargement PandaScore...
      </div>
      <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {{ error }}
      </div>
      <div
        v-for="match in filteredPastMatches"
        :key="match.id"
        class="rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-semibold text-white">{{ getMatchTitle(match) }}</p>
            <p class="mt-1 text-xs text-zinc-400">{{ getMatchMeta(match) }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="pill in getGamePills(match)"
                :key="pill.label"
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                :class="pill.className"
              >
                {{ pill.label }}
              </span>
              <span
                v-for="badge in getFilteredSeriesBadges(match)"
                :key="badge"
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                :class="getSeriesBadgeClass(badge)"
              >
                {{ badge }}
              </span>
            </div>
          </div>
          <div class="rounded-xl border border-emerald-400/40 bg-black/40 px-5 py-3 text-center">
            <p class="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Score Final</p>
            <p class="mt-1 text-lg font-semibold text-emerald-300">{{ getMatchScoreline(match) }}</p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">
            {{ formatMatchDate(match.begin_at) }}
          </p>
          <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">{{ match.status || 'termine' }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import {
  formatMatchDate,
  getMatchMeta,
  getMatchTitle,
  getMatchScoreline,
  getSeriesBadges,
  isMatchInPast,
  useCalendarFilters,
  useMonthlyMatches,
} from '../services/pickemCore';

const { matches, loading, error, refresh } = useMonthlyMatches();
const pastMatches = computed(() => (matches.value || []).filter((match) => isMatchInPast(match)));
const { games, selectedGame, filteredMatches: filteredPastMatches, setGame } = useCalendarFilters(pastMatches);

const getGamePills = (match) => {
  const name = (match?.videogame?.name || '').toLowerCase();
  const pills = [];

  if (name.includes('call of duty') || name.includes('cod') || name.includes('warzone')) {
    pills.push({
      label: 'CDL',
      className: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200',
    });
  }

  if (name.includes('valorant')) {
    const seriesText = `${match?.league?.name ?? ''} ${match?.serie?.name ?? ''} ${match?.tournament?.name ?? ''}`.toLowerCase();
    const isGC = seriesText.includes('game changers');
    if (isGC) {
      pills.push({
        label: 'GC',
        className: 'border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-200',
      });
    }
  }

  if (name.includes('rocket league')) {
    pills.push({
      label: 'RL',
      className: 'border-sky-400/50 bg-sky-500/10 text-sky-200',
    });
  }

  if (name.includes('counter-strike') || name.includes('cs2') || name === 'cs') {
    pills.push({
      label: 'CS',
      className: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
    });
  }

  return pills;
};

const getFilteredSeriesBadges = (match) => {
  const seriesText = `${match?.league?.name ?? ''} ${match?.serie?.name ?? ''} ${match?.tournament?.name ?? ''}`.toLowerCase();
  const isGC = seriesText.includes('game changers') || seriesText.includes('gc');
  if (isGC) return ['GC'];
  const isVctEmea = seriesText.includes('vct') && seriesText.includes('emea');
  return getSeriesBadges(match).filter((badge) => badge === 'VCT' && isVctEmea);
};

const getSeriesBadgeClass = (badge) => {
  if (badge === 'VCT') {
    return 'border-red-400/50 bg-red-500/10 text-red-200';
  }
  return 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200';
};
</script>
