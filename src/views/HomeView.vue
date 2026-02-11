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
          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink to="/pickem" class="rounded-full border border-emerald-400/70 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-emerald-200">
              Pick'em
            </RouterLink>
            <RouterLink to="/matches" class="rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white">
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
              v-for="match in matches"
              :key="match.id"
              class="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 md:grid-cols-[1fr_auto_auto_auto]"
            >
              <div>
                <p class="text-sm font-semibold text-white">{{ getMatchTitle(match) }}</p>
                <p class="mt-1 text-xs text-zinc-400">{{ getMatchMeta(match) }}</p>
                <p class="mt-2 text-xs uppercase tracking-[0.25em] text-emerald-300">{{ formatMatchDate(match.begin_at) }}</p>
              </div>
              <button class="rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/60">
                1 <span class="ml-2 text-emerald-300">{{ getOdds(match.id, 1) }}</span>
              </button>
              <button class="rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/60">
                X <span class="ml-2 text-emerald-300">{{ getOdds(match.id, 2) }}</span>
              </button>
              <button class="rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/60">
                2 <span class="ml-2 text-emerald-300">{{ getOdds(match.id, 3) }}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <aside class="space-y-4">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Ticket</p>
          <div class="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
            <p class="text-xs uppercase tracking-[0.22em] text-zinc-500">Selection Active</p>
            <p class="mt-2 text-sm text-white">Aucune selection</p>
            <p class="mt-2 text-xs text-zinc-400">Clique une cote pour preparer ton pari.</p>
          </div>
          <RouterLink to="/pickem" class="mt-4 block w-full rounded-xl bg-gradient-to-r from-emerald-400 to-fuchsia-400 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Aller Au Pick'em
          </RouterLink>
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
  getMatchTitle,
  useBrandInfo,
  useUpcomingMatches,
} from '../services/pickemCore';

const { teamName } = useBrandInfo();
const { matches, loading, error } = useUpcomingMatches();

const sports = computed(() => [
  'Call Of Duty',
  'Valorant',
  'Counter-Strike',
  'Rocket League',
  'TFT',
  'Fortnite',
]);

const getOdds = (id, seed) => {
  const base = ((Number(id || 1) * (seed + 7)) % 145) / 100 + 1.15;
  return base.toFixed(2);
};
</script>
