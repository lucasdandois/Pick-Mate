<template>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-12">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="font-teko text-4xl uppercase text-white">Pick'em</h2>
      </div>
      <div class="text-xs uppercase tracking-[0.3em] text-zinc-400">
        Picks: <span class="text-emerald-300">{{ pickCount }}</span>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">

      <p v-if="locked" class="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Picks valides et definitifs
      </p>
      <p v-else class="text-xs text-zinc-500">
        Une fois valides, les picks ne peuvent plus etre modifies.
      </p>
    </div>

    <div class="mt-6">
      <p class="mb-2 px-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500">Jeux Avec Matchs</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="game in games"
          :key="game.name"
          class="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em]"
          :class="selectedGame === game.name
            ? 'border-emerald-400 bg-emerald-400 text-black'
            : 'border-white/15 bg-black/40 text-zinc-200 hover:border-emerald-400/60'"
          @click="setGame(game.name)"
        >
          {{ game.name }} ({{ game.count }})
        </button>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
        <aside class="rounded-2xl border border-white/10 bg-white/5 p-3 md:sticky md:top-24 md:h-fit">
          <p class="px-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">Vos Paris Joues</p>
          <div class="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            <div
              v-for="item in pickedSummary"
              :key="`summary-${item.id}`"
              class="rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white">{{ item.title }}</p>
              <p class="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">Pick: {{ item.pick }}</p>
              <p class="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">Score: {{ item.score }}</p>
              <p
                class="mt-2 text-[10px] uppercase tracking-[0.2em]"
                :class="item.confirmed ? 'text-emerald-300' : 'text-amber-300'"
              >
                {{ item.confirmed ? 'Valide' : 'En attente' }}
              </p>
            </div>
            <p v-if="pickedSummary.length === 0" class="px-1 text-xs text-zinc-400">
              Aucun pick selectionne.
            </p>
          </div>
        </aside>

        <div class="space-y-4">
          <div v-if="loading" class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            Chargement PandaScore...
          </div>
          <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            {{ error }}
          </div>
          <div
            v-else-if="unplayedMatches.length === 0"
            class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300"
          >
            Tous les matchs de ce filtre ont deja un pick.
          </div>
          <div
            v-for="match in unplayedMatches"
            :key="match.id"
            :id="`pickem-match-${match.id}`"
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
          <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">{{ formatMatchDate(match.begin_at) }}</p>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div class="grid gap-2 sm:grid-cols-2 lg:col-span-2">
            <button
              v-for="opponent in getOpponents(match)"
              :key="opponent.id"
              class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-60"
              :class="picks[match.id] === opponent.id
                ? 'border-emerald-400 bg-emerald-400 text-black'
                : 'border-white/10 bg-black/40 text-zinc-200 hover:border-emerald-400/60'"
              :disabled="locked || isMatchStarted(match)"
              @click="selectPick(match.id, opponent.id)"
            >
              <span>{{ opponent.name }}</span>
              <span class="text-xs text-black/70" v-if="picks[match.id] === opponent.id">Pick</span>
            </button>
          </div>
          <div class="lg:col-span-2">
            <p class="text-xs uppercase tracking-[0.2em] text-zinc-500">Score exact</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="option in getScoreOptions(match, picks[match.id])"
                :key="option.label"
                class="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-60"
                :class="isScoreSelected(match, option)
                  ? 'border-emerald-300 bg-emerald-400 text-black ring-2 ring-emerald-300/60 shadow-lg shadow-emerald-400/30 scale-[1.03]'
                  : 'border-white/15 bg-black/40 text-zinc-200 hover:border-emerald-400/60 hover:shadow-md hover:shadow-emerald-400/20'"
                :disabled="locked || confirmed[match.id] || isMatchStarted(match) || !picks[match.id]"
                @click="selectScorePick(match.id, option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="lg:row-span-2 lg:flex lg:items-end">
            <button
              class="w-full rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-60"
              :class="confirmed[match.id]
                ? 'border-emerald-400 bg-emerald-400 text-black'
                : 'border-emerald-400/60 bg-black/40 text-emerald-200'"
              :disabled="locked || !picks[match.id] || !scorePicks[match.id] || confirmed[match.id] || isMatchStarted(match)"
              @click="handleConfirmPick(match.id)"
            >
              {{ confirmed[match.id] ? 'Valide' : 'Valider Pick' }}
            </button>
          </div>
        </div>
        <p v-if="isMatchStarted(match)" class="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
          Match lance, picks verrouilles
        </p>
          </div>
        </div>
      </div>
    </div>


  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import {
  formatMatchDate,
  getMatchMeta,
  getMatchTitle,
  getSeriesBadges,
  getOpponents,
  isMatchStarted,
  saveConfirmedPickToDatabase,
  useAuth,
  usePickemBoard,
  useCalendarFilters,
} from '../services/pickemCore';

const { pickableMatches, loading, error, picks, pickCount, selectPick, scorePicks, selectScorePick, locked, confirmed, confirmPick } = usePickemBoard();
const { games, selectedGame, filteredMatches, setGame } = useCalendarFilters(pickableMatches);
const { user } = useAuth();
const router = useRouter();
const route = useRoute();
const pickedSummary = computed(() => {
  const rows = (filteredMatches.value || [])
    .filter((match) => Boolean(confirmed.value?.[match.id]))
    .map((match) => {
      const opponents = getOpponents(match);
      const pickedTeamId = picks.value?.[match.id];
      const pickedTeam = opponents.find((team) => team.id === pickedTeamId);
      const score = scorePicks.value?.[match.id];
      return {
        id: match.id,
        title: getMatchTitle(match),
        pick: pickedTeam?.name || '-',
        score: score ? `${score.scoreA}-${score.scoreB}` : '-',
        confirmed: Boolean(confirmed.value?.[match.id]),
      };
    });
  return rows;
});

const unplayedMatches = computed(() =>
  (filteredMatches.value || []).filter(
    (match) => !confirmed.value?.[match.id],
  ),
);

const applyRouteGameFilter = () => {
  const gameFromQuery = typeof route.query?.game === 'string' ? route.query.game : null;
  if (!gameFromQuery) return;
  const exists = games.value.some((game) => game.name === gameFromQuery);
  if (exists) {
    setGame(gameFromQuery);
  }
};

onMounted(applyRouteGameFilter);
watch(() => route.query?.game, applyRouteGameFilter);

const scrollToRouteMatch = async () => {
  const targetMatchId = typeof route.query?.matchId === 'string' ? route.query.matchId : '';
  if (!targetMatchId) return;
  await nextTick();
  const el = document.getElementById(`pickem-match-${targetMatchId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

onMounted(scrollToRouteMatch);
watch(() => route.query?.matchId, scrollToRouteMatch);
watch(unplayedMatches, scrollToRouteMatch, { deep: true });

const handleConfirmPick = async (matchId) => {
  if (!user.value) {
    router.push('/login?redirect=/pickem');
    return;
  }
  const match = (filteredMatches.value || []).find((item) => Number(item.id) === Number(matchId));
  const pickedTeamId = picks.value?.[matchId];
  const scorePick = scorePicks.value?.[matchId];
  try {
    await saveConfirmedPickToDatabase({
      matchId,
      pickedTeamId,
      scorePick,
      match,
    });
    confirmPick(matchId);
  } catch (err) {
    console.error('Save pick failed', err);
  }
};

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

const getScoreOptions = (match, pickedTeamId) => {
  const opponents = getOpponents(match);
  if (opponents.length < 2) return [];
  const bestOf = match?.number_of_games || match?.games?.length || 3;
  const isBo5 = bestOf >= 5;
  const pairs = isBo5
    ? [[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]]
    : [[2, 0], [2, 1], [1, 2], [0, 2]];

  const teamAId = opponents[0].id;
  const teamBId = opponents[1].id;

  const filteredPairs = pickedTeamId
    ? pairs.filter(([scoreA, scoreB]) => {
        const winnerId = scoreA === scoreB ? null : scoreA > scoreB ? teamAId : teamBId;
        return winnerId === pickedTeamId;
      })
    : pairs;

  return filteredPairs.map(([scoreA, scoreB]) => ({
    label: `${scoreA}-${scoreB}`,
    value: {
      teamAId,
      teamBId,
      scoreA,
      scoreB,
    },
  }));
};

const isScoreSelected = (match, option) => {
  const selected = scorePicks.value?.[match.id];
  if (!selected) return false;
  return (
    selected.teamAId === option.value.teamAId &&
    selected.teamBId === option.value.teamBId &&
    selected.scoreA === option.value.scoreA &&
    selected.scoreB === option.value.scoreB
  );
};

</script>
