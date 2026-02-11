<template>
  <section class="relative z-10 w-full px-4 pb-24 pt-10 sm:px-6">
    <div class="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[260px_1fr_320px]">
      <aside class="space-y-4">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Equipes</p>
          <div class="mt-4 space-y-2">
            <RouterLink
              v-for="team in teams"
              :key="team.filter"
              :to="{ path: '/pickem', query: { game: team.filter } }"
              class="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/50"
            >
              <span>{{ team.label }}</span>
              <span class="text-emerald-300">+</span>
            </RouterLink>
          </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Mode Rapide</p>
          <p class="mt-3 text-sm text-zinc-300">Acces direct aux picks et au calendrier de matche {{ teamName }}.</p>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <RouterLink
              to="/pickem"
              class="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs uppercase tracking-[0.25em] text-zinc-200 hover:border-emerald-400/60"
            >
              Pick'em
            </RouterLink>
            <RouterLink
              to="/matches"
              class="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs uppercase tracking-[0.25em] text-zinc-200 hover:border-emerald-400/60"
            >
              A venir
            </RouterLink>
          </div>
        </div>
      </aside>

      <main class="space-y-4">
        <div class="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Gentle Mate Pick'em</p>
          <h1 class="mt-3 font-teko text-4xl uppercase leading-[0.92] text-white sm:text-6xl">
            Tout les Paris de <span class="text-emerald-300">{{ teamName }}</span>
          </h1>
          <p class="mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
           Tous les matchs Gentle Mates, tous les paris, en un clin d’œil.
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
                    :key="`${match.id}-${badge.label}`"
                    class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                    :class="badge.className"
                  >
                    {{ badge.label }}
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
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="badge in getMatchBadges(match)"
                  :key="`${match.id}-result-${badge.label}`"
                  class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                  :class="badge.className"
                >
                  {{ badge.label }}
                </span>
              </div>
              <p class="mt-1 text-xs uppercase tracking-[0.22em] text-emerald-300">{{ getMatchScoreline(match) }}</p>
            </div>
            <p v-if="ticketResults.length === 0" class="text-xs text-zinc-400">Aucun resultat disponible.</p>
          </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.32em] text-emerald-300">Top 5 Joueurs</p>
          <div class="mt-3 space-y-2">
            <p v-if="leaderboardLoading" class="text-xs text-zinc-400">Chargement...</p>
            <p v-else-if="leaderboardError" class="text-xs text-red-300">{{ leaderboardError }}</p>
            <div
              v-else
              v-for="(player, index) in topPlayers"
              :key="player.id"
              class="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 text-xs"
            >
              <p class="text-zinc-200">{{ index + 1 }}. {{ player.display_name || 'Joueur' }}</p>
              <p class="font-semibold text-emerald-300">{{ player.total_points ?? 0 }} pts</p>
            </div>
            <p v-if="!leaderboardLoading && !leaderboardError && topPlayers.length === 0" class="text-xs text-zinc-400">
              Aucun joueur classe.
            </p>
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
  useLeaderboard,
  usePastMatches,
  useUpcomingMatches,
} from '../services/pickemCore';

const { teamName } = useBrandInfo();
const { matches, loading, error } = useUpcomingMatches();
const { matches: pastMatches } = usePastMatches({ perPage: 10 });
const { players: topPlayers, loading: leaderboardLoading, error: leaderboardError } = useLeaderboard(5);
const homeMatches = computed(() => (matches.value || []).slice(0, 5));
const ticketResults = computed(() => (pastMatches.value || []).slice(0, 2));

const teams = computed(() => [
  { label: 'Call Of Duty', filter: 'Call of Duty' },
  { label: 'Valorant', filter: 'Valorant' },
  { label: 'Counter-Strike', filter: 'Counter-Strike' },
  { label: 'Rocket League', filter: 'Rocket League' },
]);

const getMatchBadges = (match) => {
  const badges = [];
  const game = String(match?.videogame?.name || '').toLowerCase();
  const text = `${match?.league?.name || ''} ${match?.serie?.name || ''} ${match?.tournament?.name || ''}`.toLowerCase();

  if (game.includes('counter-strike') || game.includes('cs2') || game.includes('cs-go')) {
    badges.push({
      label: 'CS',
      className: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
    });
  }

  if (game.includes('call of duty') || game.includes('cod') || game.includes('warzone')) {
    badges.push({
      label: 'CDL',
      className: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200',
    });
  }

  if (game.includes('valorant')) {
    if (text.includes('game changers') || text.includes('gc')) {
      badges.push({
        label: 'GC',
        className: 'border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-200',
      });
    } else if (text.includes('vct') && text.includes('emea')) {
      badges.push({
        label: 'VCT',
        className: 'border-red-400/50 bg-red-500/10 text-red-200',
      });
    }
  }

  return badges;
};
</script>
