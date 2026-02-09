<template>
    <section class="relative z-10 w-full px-6 pb-24 pt-16">
    <div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Gente Mate Pick'em</p>
        <h1 class="mt-4 font-teko text-5xl uppercase leading-[0.95] text-white sm:text-6xl">
          Le hub Pick'em pour suivre <span class="text-emerald-300">{{ teamName }}</span>
        </h1>
        <p class="mt-6 max-w-xl text-base text-zinc-300">
          Pronostics, calendrier et resultats en un seul endroit. Connecte a PandaScore
          pour suivre les matchs et lancer tes picks rapidement.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            to="/pickem"
            class="rounded-full bg-gradient-to-r from-emerald-400 to-fuchsia-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black"
          >
            Jouer au Pick'em
          </RouterLink>
          <RouterLink
            to="/matches"
            class="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
          >
            Voir les matchs
          </RouterLink>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between">
          <p class="text-xs uppercase tracking-[0.35em] text-emerald-300">Prochains matchs</p>
          <RouterLink to="/matches" class="text-xs uppercase tracking-[0.3em] text-zinc-400">Calendrier</RouterLink>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-if="loading" class="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
            Chargement
          </div>
          <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {{ error }}
          </div>
          <div
            v-for="match in matches"
            :key="match.id"
            class="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <p class="text-sm font-semibold text-white">{{ getMatchTitle(match) }}</p>
            <p class="mt-1 text-xs text-zinc-400">{{ getMatchMeta(match) }}</p>
            <p class="mt-2 text-xs uppercase tracking-[0.25em] text-emerald-300">
              {{ formatMatchDate(match.begin_at) }}
            </p>
          </div>
        </div>

      </div>
    </div>

    <div class="mt-16 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Calendrier</p>
        <p class="mt-3 text-sm text-zinc-300">
          Suivi complet des matchs, serie et tournois via PandaScore.
        </p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Resultats</p>
        <p class="mt-3 text-sm text-zinc-300">
          Consulte les scores et les stats des dernieres rencontres.
        </p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Pick'em</p>
        <p class="mt-3 text-sm text-zinc-300">
          Choisis ton vainqueur, sauvegarde tes picks et partage-les.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
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
</script>
