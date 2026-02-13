<template>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-12">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Classement</p>
        <h2 class="mt-2 font-teko text-4xl uppercase text-white">Top 50 joueurs</h2>
      </div>
      <button class="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white" @click="refresh">
        Rafraichir
      </button>
    </div>

    <div class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div v-if="loading" class="text-sm text-zinc-300">Chargement...</div>
      <div v-else-if="error" class="text-sm text-red-300">{{ error }}</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-zinc-300">
          <thead class="text-xs uppercase tracking-[0.25em] text-zinc-500">
            <tr>
              <th class="pb-3">Top</th>
              <th class="pb-3">Joueur</th>
              <th class="pb-3">Rang</th>
              <th class="pb-3">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in players" :key="player.id" class="border-t border-white/10">
              <td class="py-3">{{ index + 1 }}</td>
              <td class="py-3">{{ player.display_name || 'Joueur' }}</td>
              <td class="py-3">
                <img
                  :src="getRankImage(player.total_points)"
                  :alt="getRankName(player.total_points)"
                  class="h-[46px] w-[46px] object-contain"
                />
              </td>
              <td class="py-3">{{ player.total_points ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useLeaderboard } from '../services/pickemCore';

const { players, loading, error, refresh } = useLeaderboard(50);

const tiers = [
  { name: 'Iron 1', min: 0, image: '/iron1.png' },
  { name: 'Iron 2', min: 50, image: '/iron2.png' },
  { name: 'Iron 3', min: 100, image: '/iron3.png' },
  { name: 'Iron 4', min: 150, image: '/iron4.png' },
  { name: 'Bronze 1', min: 200, image: '/bronze1.png' },
  { name: 'Bronze 2', min: 250, image: '/bronze2.png' },
  { name: 'Bronze 3', min: 300, image: '/bronze3.png' },
  { name: 'Bronze 4', min: 350, image: '/bronze4.png' },
  { name: 'Silver 1', min: 400, image: '/silver1.png' },
  { name: 'Silver 2', min: 450, image: '/silver2.png' },
  { name: 'Silver 3', min: 500, image: '/silver3.png' },
  { name: 'Silver 4', min: 550, image: '/silver4.png' },
  { name: 'Gold 1', min: 600, image: '/gold1.png' },
  { name: 'Gold 2', min: 650, image: '/gold2.png' },
  { name: 'Gold 3', min: 700, image: '/gold3.png' },
  { name: 'Gold 4', min: 750, image: '/gold4.png' },
  { name: 'Platine 1', min: 800, image: '/platine1.png' },
  { name: 'Platine 2', min: 850, image: '/platine2.png' },
  { name: 'Platine 3', min: 900, image: '/platine3.png' },
  { name: 'Platine 4', min: 950, image: '/platine4.png' },
  { name: 'Emerald 1', min: 1000, image: '/emerald1.png' },
  { name: 'Emerald 2', min: 1050, image: '/emerald2.png' },
  { name: 'Emerald 3', min: 1100, image: '/emerald3.png' },
  { name: 'Emerald 4', min: 1150, image: '/emerald4.png' },
  { name: 'Ruby 1', min: 1200, image: '/ruby1.png' },
  { name: 'Ruby 2', min: 1250, image: '/ruby2.png' },
  { name: 'Ruby 3', min: 1300, image: '/ruby3.png' },
  { name: 'Ruby 4', min: 1350, image: '/ruby4.png' },
  { name: 'Diamond 1', min: 1400, image: '/diamond1.png' },
  { name: 'Diamond 2', min: 1450, image: '/diamond2.png' },
  { name: 'Diamond 3', min: 1500, image: '/diamond3.png' },
  { name: 'Diamond 4', min: 1550, image: '/diamond4.png' },
  { name: 'Oracle 1', min: 1600, image: '/oracle1.png' },
  { name: 'Oracle 2', min: 1650, image: '/oracle2.png' },
  { name: 'Oracle 3', min: 1700, image: '/oracle3.png' },
  { name: 'Oracle 4', min: 1750, image: '/oracle4.png' },
];

const getRankTier = (points) => {
  const value = Number(points) || 0;
  let result = tiers[0];
  for (const tier of tiers) {
    if (value >= tier.min) result = tier;
  }
  return result;
};

const getRankImage = (points) => getRankTier(points).image;
const getRankName = (points) => getRankTier(points).name;
</script>
