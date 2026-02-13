<template>
  <div class="flex min-h-screen flex-col bg-[#070707] text-zinc-100">
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl animate-float-soft"></div>
      <div class="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl animate-float-soft" style="animation-delay: 2s;"></div>
    </div>

    <nav class="relative z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
            <img
              src="/Fichier 2.svg"
              alt="Gentle Mates logo"
              class="h-10 w-10 object-contain sm:h-14 sm:w-14"
            />
          </div>
          <div>
            <p class="font-teko text-2xl uppercase tracking-widest text-white whitespace-nowrap">Pick'Mates</p>

          </div>
        </RouterLink>

        <div class="hidden items-center gap-2 lg:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.href"
            class="rounded-full border border-transparent px-4 py-2 text-sm uppercase tracking-widest text-zinc-300 transition hover:border-emerald-400/40 hover:text-white"
          >
            {{ item.name }}
          </RouterLink>
        </div>

        <button
          class="lg:hidden"
          @click="toggleMenu"
          aria-label="Open menu"
          aria-controls="mobile-nav"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
        >
          <svg v-if="!mobileMenuOpen" class="h-6 w-6 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="h-6 w-6 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div id="mobile-nav" v-if="mobileMenuOpen" class="lg:hidden border-t border-white/10 bg-black/80 px-4 py-4 sm:px-6">
        <div class="grid grid-cols-2 gap-3">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.href"
            class="rounded-lg border border-white/10 px-4 py-2 text-center text-sm uppercase tracking-widest text-zinc-200"
            @click="toggleMenu"
          >
            {{ item.name }}
          </RouterLink>
        </div>
      </div>
    </nav>

    <main class="relative z-10 flex-1">
      <RouterView />
    </main>

    <footer class="relative z-10 border-t border-white/10 bg-black/60">
      <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <p class="font-teko text-xl uppercase tracking-[0.2em] text-white">Gentle Mates Pick'em</p>
          <p class="mt-3 text-sm text-zinc-400">
           JOUEZ STRATEGIQUE. PARIEZ GENTLE MATES.
          </p>
          <p class="mt-3 text-xs text-zinc-500">
            Site de fan non officiel. Ce site n'est pas lie a Gentle Mates, et Gentle Mates n'est pas responsable
            du contenu publie ici.
          </p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Navigation</p>
          <div class="mt-3 flex flex-col gap-2 text-sm text-zinc-300">
            <RouterLink to="/">Accueil</RouterLink>
            <RouterLink to="/matches">Calendrier</RouterLink>
            <RouterLink to="/results">Resultats</RouterLink>
            <RouterLink to="/pickem">Pick'em</RouterLink>
          </div>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Legal</p>
          <div class="mt-3 flex flex-col gap-2 text-sm text-zinc-300">
            <RouterLink to="/reglement">Reglement</RouterLink>
            <RouterLink to="/conditions">Conditions d'utilisation</RouterLink>
            <RouterLink to="/confidentialite">Politique de confidentialite</RouterLink>
            <RouterLink to="/avertissement">Avertissement</RouterLink>
          </div>
          <p class="mt-4 text-sm text-zinc-400">Donnees PandaScore API</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useAppShell, useAuth } from './services/pickemCore';

const { mobileMenuOpen, menuItems, toggleMenu } = useAppShell();
const { user } = useAuth();

const navItems = computed(() =>
  menuItems.map((item) => {
    if (item.href === '/login') {
      return { ...item, name: user.value ? 'Profil' : 'Connexion' };
    }
    return item;
  }),
);
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');

.font-space-grotesk {
  font-family: 'Space Grotesk', sans-serif;
}
</style>
