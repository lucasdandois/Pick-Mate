<template>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-12">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Resultats</p>
        <h2 class="mt-2 font-teko text-4xl uppercase text-white">Scores du mois</h2>
      </div>
      <button class="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white" @click="refresh">
        Rafraichir
      </button>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <div v-if="loading" class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        Chargement PandaScore...
      </div>
      <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {{ error }}
      </div>
      <div
        v-for="match in pastMatches"
        :key="match.id"
        class="rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <p class="text-sm font-semibold text-white">{{ getMatchTitle(match) }}</p>
        <p class="mt-1 text-xs text-zinc-400">{{ getMatchMeta(match) }}</p>
        <div v-if="getSeriesBadges(match).length" class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="badge in getSeriesBadges(match)"
            :key="badge"
            class="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-fuchsia-200"
          >
            {{ badge }}
          </span>
        </div>
        <p class="mt-3 text-xs uppercase tracking-[0.3em] text-emerald-300">
          {{ formatMatchDate(match.begin_at) }}
        </p>
        <p class="mt-2 text-sm text-zinc-200">Score: {{ getMatchScoreline(match) }}</p>
        <p class="mt-1 text-xs text-zinc-400">Status: {{ match.status || 'termine' }}</p>
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
  useMonthlyMatches,
} from '../services/pickemCore';

const { matches, loading, error, refresh } = useMonthlyMatches();
const pastMatches = computed(() => (matches.value || []).filter((match) => isMatchInPast(match)));
</script>
