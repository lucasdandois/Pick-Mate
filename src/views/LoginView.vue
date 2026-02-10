<template>
  <section class="mx-auto max-w-4xl px-6 pb-24 pt-12">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div v-if="user" class="space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Profil</p>
            <h2 class="mt-3 font-teko text-4xl uppercase text-white">
              Bienvenue {{ profile?.display_name || user.email }}
            </h2>
            <p class="mt-4 text-sm text-zinc-300">
              Tes informations sont stockees dans la base de donnees.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
            @click="signOut"
          >
            Deconnexion
          </button>
        </div>

        <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">Profil</p>
          <div class="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2">
              <span>Pseudo:</span>
              <span class="font-semibold text-white">{{ profile?.display_name || 'Non defini' }}</span>
            </div>
          </div>
          <p class="mt-3">Email: {{ profile?.email || user.email }}</p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">Votre rang</p>
            <p class="text-xs text-zinc-400">Points: {{ totalPoints }}</p>
          </div>
          <div class="mt-4 flex items-center gap-4">
            <img :src="currentRank.image" :alt="currentRank.name" class="h-16 w-16 object-contain" />
            <div>
              <p class="text-base font-semibold text-white">{{ currentRank.name }}</p>
              <p class="text-xs text-zinc-400">Progression du classement</p>
            </div>
          </div>
          <div v-if="currentGroup" class="mt-6 rounded-xl border border-white/10 bg-black/40 p-3">
            <p class="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{{ currentGroup.name }}</p>
            <div class="mt-3 grid grid-cols-4 gap-3">
              <div
                v-for="tier in currentGroup.tiers"
                :key="tier.name"
                class="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2 text-center"
              >
                <img
                  :src="tier.image"
                  :alt="tier.name"
                  class="object-contain"
                  :class="tier.name === currentRank.name ? 'h-14 w-14' : 'h-10 w-10'"
                />
                <p
                  class="text-[10px] uppercase tracking-[0.2em]"
                  :class="tier.name === currentRank.name ? 'text-emerald-300' : 'text-zinc-400'"
                >
                  {{ tier.name }}
                </p>
                <p class="text-[10px] text-zinc-500">{{ tier.range }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">Historique des paris</p>
            <button
              type="button"
              class="rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white"
              @click="refresh"
            >
              Rafraichir
            </button>
          </div>
          <div class="mt-4 space-y-3">
            <div v-if="loadingHistory" class="text-xs text-zinc-400">Chargement...</div>
            <div v-else-if="historyError" class="text-xs text-red-300">{{ historyError }}</div>
            <div v-else-if="history.length === 0" class="text-xs text-zinc-400">
              Aucun pari enregistre pour le moment.
            </div>
            <div
              v-for="item in history"
              :key="item.id"
              class="rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <p class="text-sm font-semibold text-white">{{ item.title }}</p>
              <p class="mt-1 text-xs text-zinc-400">{{ item.meta }}</p>
              <p class="mt-1 text-xs text-zinc-500">{{ item.date }}</p>
              <p class="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
                Pick: {{ item.pick }} • {{ item.confirmed ? 'Valide' : 'En attente' }} • {{ item.points }} pts
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          <p class="text-xs uppercase tracking-[0.25em] text-zinc-500">Classement</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="tier in tiers" :key="tier.name" class="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
              <img :src="tier.image" :alt="tier.name" class="mx-auto h-20 w-20 object-contain" />
              <p class="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-300">{{ tier.name }}</p>
              <p class="mt-1 text-[10px] text-zinc-500">{{ tier.range }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Connexion</p>
          <h2 class="mt-3 font-teko text-4xl uppercase text-white">Acces membres Gentle Mates</h2>
          <p class="mt-4 text-sm text-zinc-300">
            Connecte-toi pour enregistrer tes picks et retrouver ton historique.
          </p>
          <div class="mt-6 flex gap-2">
            <button
              class="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em]"
              :class="mode === 'login'
                ? 'border-emerald-400 bg-emerald-400 text-black'
                : 'border-white/20 bg-black/30 text-zinc-200'"
              @click="mode = 'login'"
            >
              Se connecter
            </button>
            <button
              class="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em]"
              :class="mode === 'signup'
                ? 'border-emerald-400 bg-emerald-400 text-black'
                : 'border-white/20 bg-black/30 text-zinc-200'"
              @click="mode = 'signup'"
            >
              Creer un compte
            </button>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label class="text-xs uppercase tracking-[0.25em] text-zinc-400">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              placeholder="toi@email.com"
            />
          </div>
          <div>
            <label class="text-xs uppercase tracking-[0.25em] text-zinc-400">Mot de passe</label>
            <input
              v-model="password"
              type="password"
              required
              class="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div v-if="mode === 'signup'">
            <label class="text-xs uppercase tracking-[0.25em] text-zinc-400">Pseudo</label>
            <input
              v-model="displayName"
              type="text"
              class="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              placeholder="Lucas"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-full bg-gradient-to-r from-emerald-400 to-fuchsia-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            {{ mode === 'login' ? 'Connexion' : 'Inscription' }}
          </button>
        </form>
      </div>

      <p v-if="error" class="mt-4 text-xs text-red-300">{{ error }}</p>
      <p v-if="success" class="mt-2 text-xs text-emerald-300">{{ success }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { computed } from 'vue';
import { useAuth, usePickHistory } from '../services/pickemCore';

const { user, profile, loading, error, signIn, signUp, signOut } = useAuth();
const { history, totalPoints, loading: loadingHistory, error: historyError, refresh } = usePickHistory();

const mode = ref('login');
const email = ref('');
const password = ref('');
const displayName = ref('');
const success = ref('');

const submit = async () => {
  success.value = '';
  if (mode.value === 'login') {
    const ok = await signIn(email.value, password.value);
    if (ok) success.value = 'Connexion reussie.';
    return;
  }
  const ok = await signUp(email.value, password.value, displayName.value);
  if (ok) success.value = 'Compte cree. Verifie ton email si necessaire.';
};

const tiers = [
  { name: 'Iron 1', min: 0, range: '0-49', image: '/iron1.png' },
  { name: 'Iron 2', min: 50, range: '50-99', image: '/iron2.png' },
  { name: 'Iron 3', min: 100, range: '100-149', image: '/iron3.png' },
  { name: 'Iron 4', min: 150, range: '150-199', image: '/iron4.png' },
  { name: 'Bronze 1', min: 200, range: '200-249', image: '/bronze1.png' },
  { name: 'Bronze 2', min: 250, range: '250-299', image: '/bronze2.png' },
  { name: 'Bronze 3', min: 300, range: '300-349', image: '/bronze3.png' },
  { name: 'Bronze 4', min: 350, range: '350-399', image: '/bronze4.png' },
  { name: 'Silver 1', min: 400, range: '400-449', image: '/silver1.png' },
  { name: 'Silver 2', min: 450, range: '450-499', image: '/silver2.png' },
  { name: 'Silver 3', min: 500, range: '500-549', image: '/silver3.png' },
  { name: 'Silver 4', min: 550, range: '550-599', image: '/silver4.png' },
  { name: 'Gold 1', min: 600, range: '600-649', image: '/gold1.png' },
  { name: 'Gold 2', min: 650, range: '650-699', image: '/gold2.png' },
  { name: 'Gold 3', min: 700, range: '700-749', image: '/gold3.png' },
  { name: 'Gold 4', min: 750, range: '750-799', image: '/gold4.png' },
  { name: 'Platine 1', min: 800, range: '800-849', image: '/platine1.png' },
  { name: 'Platine 2', min: 850, range: '850-899', image: '/platine2.png' },
  { name: 'Platine 3', min: 900, range: '900-949', image: '/platine3.png' },
  { name: 'Platine 4', min: 950, range: '950-999', image: '/platine4.png' },
  { name: 'Emerald 1', min: 1000, range: '1000-1049', image: '/emerald1.png' },
  { name: 'Emerald 2', min: 1050, range: '1050-1099', image: '/emerald2.png' },
  { name: 'Emerald 3', min: 1100, range: '1100-1149', image: '/emerald3.png' },
  { name: 'Emerald 4', min: 1150, range: '1150-1199', image: '/emerald4.png' },
  { name: 'Rubi 1', min: 1200, range: '1200-1249', image: '/rubi1.png' },
  { name: 'Rubi 2', min: 1250, range: '1250-1299', image: '/rubi2.png' },
  { name: 'Rubi 3', min: 1300, range: '1300-1349', image: '/rubi3.png' },
  { name: 'Rubi 4', min: 1350, range: '1350-1399', image: '/rubi4.png' },
  { name: 'Diamond 1', min: 1400, range: '1400-1449', image: '/diamond1.png' },
  { name: 'Diamond 2', min: 1450, range: '1450-1499', image: '/diamond2.png' },
  { name: 'Diamond 3', min: 1500, range: '1500-1549', image: '/diamond3.png' },
  { name: 'Diamond 4', min: 1550, range: '1550-1599', image: '/diamond4.png' },
  { name: 'Iri 1', min: 1600, range: '1600-1649', image: '/iri1.png' },
  { name: 'Iri 2', min: 1650, range: '1650-1699', image: '/iri2.png' },
  { name: 'Iri 3', min: 1700, range: '1700-1749', image: '/iri3.png' },
  { name: 'Iri 4', min: 1750, range: '1750+', image: '/iri4.png' },
];

const currentRank = computed(() => {
  const points = totalPoints.value || 0;
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let result = sorted[0];
  for (const tier of sorted) {
    if (points >= tier.min) result = tier;
  }
  return result;
});

const groupedTiers = computed(() => {
  const groups = new Map();
  tiers.forEach((tier) => {
    const base = tier.name.split(' ')[0];
    if (!groups.has(base)) {
      groups.set(base, { name: base, tiers: [] });
    }
    groups.get(base).tiers.push(tier);
  });
  return Array.from(groups.values());
});

const currentGroup = computed(() => {
  const base = currentRank.value?.name?.split(' ')[0];
  return groupedTiers.value.find((group) => group.name === base) || null;
});
</script>
