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
              <th class="pb-3">Rang</th>
              <th class="pb-3">Joueur</th>
              <th class="pb-3">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in players" :key="player.id" class="border-t border-white/10">
              <td class="py-3">{{ index + 1 }}</td>
              <td class="py-3">{{ player.display_name || 'Joueur' }}</td>
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
</script>
