import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { createClient } from '@supabase/supabase-js';

const API_BASE = '/api/pandascore?path=';
const DEFAULT_PER_PAGE = 8;
const TEAM_ID = import.meta.env.VITE_GM_TEAM_ID;
const TEAM_IDS = import.meta.env.VITE_GM_TEAM_IDS;
const TEAM_SLUG = 'gentle-mates';
let cachedTeamId = null;
let teamIdPromise = null;
let cachedTeamIds = null;
let teamIdsPromise = null;
const CACHE_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map();
const persistedCache = new Map();
const inFlightRequests = new Map();
const API_CACHE_STORAGE_KEY = 'gentle-mates-api-cache-v1';
let persistedCacheLoaded = false;
const PICKS_LOCK_KEY = 'gentle-mates-pickem-locked';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

const MENU_ITEMS = [
  { name: 'Accueil', href: '/' },
  { name: 'Calendrier', href: '/matches' },
  { name: "Pick'em", href: '/pickem' },
  { name: 'Resultats', href: '/results' },
  { name: 'Classement', href: '/leaderboard' },
  { name: 'Connexion', href: '/login' },
];

const TEAM_NAME = 'Gentle Mates';
const PICKS_STORAGE_KEY = 'gentle-mates-pickem-picks';
const PICKS_CONFIRMED_KEY = 'gentle-mates-pickem-confirmed';
const PICKS_SCORE_KEY = 'gentle-mates-pickem-scores';
const PENDING_DISPLAY_NAME_KEY = 'gentle-mates-pending-display-name';
let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env missing');
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function normalizeDisplayName(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const withoutPrefix = trimmed.replace(/^m8[\s-_]*/i, '').trim();
  if (!withoutPrefix) return '';
  return `M8 ${withoutPrefix}`;
}

export function formatDisplayName(value) {
  const normalized = normalizeDisplayName(value);
  if (normalized) return normalized;
  return value || 'Non defini';
}

function getDisplayNameError(err) {
  const message = err?.message || '';
  if (message.includes('profiles_display_name_unique') || message.toLowerCase().includes('duplicate')) {
    return 'Pseudo deja utilise.';
  }
  return null;
}

function loadPersistedCache() {
  if (persistedCacheLoaded) return;
  persistedCacheLoaded = true;
  try {
    const raw = localStorage.getItem(API_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.entries(parsed || {}).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      if (Date.now() - value.timestamp > CACHE_TTL_MS) return;
      persistedCache.set(key, value);
    });
  } catch {
    // ignore invalid local cache
  }
}

function savePersistedCache() {
  try {
    const payload = {};
    persistedCache.forEach((value, key) => {
      payload[key] = value;
    });
    localStorage.setItem(API_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage limits
  }
}

function getCache(key) {
  const entry = memoryCache.get(key);
  if (entry) {
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      memoryCache.delete(key);
    } else {
      return entry.data;
    }
  }

  loadPersistedCache();
  const persistedEntry = persistedCache.get(key);
  if (!persistedEntry) return null;
  if (Date.now() - persistedEntry.timestamp > CACHE_TTL_MS) {
    persistedCache.delete(key);
    savePersistedCache();
    return null;
  }
  memoryCache.set(key, persistedEntry);
  return persistedEntry.data;
}

function setCache(key, data) {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  loadPersistedCache();
  persistedCache.set(key, entry);
  savePersistedCache();
}

async function request(path, params) {
  const url = buildUrl(path, params);
  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) return existingRequest;

  const requestPromise = (async () => {
    const response = await fetch(url, {
      headers: {},
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PandaScore error ${response.status}: ${text}`);
    }

    return response.json();
  })();

  inFlightRequests.set(url, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(url);
  }
}

async function safeRequest(path, params) {
  try {
    return await request(path, params);
  } catch (err) {
    return { __error: err };
  }
}

async function resolveTeamId() {
  if (TEAM_ID) return TEAM_ID;
  if (cachedTeamId) return cachedTeamId;
  if (!teamIdPromise) {
    teamIdPromise = request('/teams', { [`search[slug]`]: TEAM_SLUG })
      .then((data) => {
        cachedTeamId = data?.[0]?.id ?? null;
        return cachedTeamId;
      })
      .catch(() => null);
  }
  return teamIdPromise;
}

async function resolveTeamIds() {
  if (TEAM_IDS) return splitIds(TEAM_IDS);
  if (TEAM_ID) return [TEAM_ID];
  if (cachedTeamIds) return cachedTeamIds;
  if (!teamIdsPromise) {
    teamIdsPromise = (async () => {
      const teamsBySlug = await fetchTeamsBySearch('slug', TEAM_SLUG);
      const teamsByName = await fetchTeamsBySearch('name', TEAM_NAME);
      const allTeams = [...teamsBySlug, ...teamsByName];
      const ids = allTeams
        .filter((team) => (team?.name || '').toLowerCase().includes('gentle'))
        .map((team) => team.id)
        .filter(Boolean);

      const uniqueIds = Array.from(new Set(ids)).map((id) => String(id));
      cachedTeamIds = uniqueIds.length ? uniqueIds : null;
      return cachedTeamIds;
    })().catch(() => null);
  }
  return teamIdsPromise;
}

export function useAppShell() {
  const mobileMenuOpen = ref(false);
  const toggleMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  };

  return {
    mobileMenuOpen,
    menuItems: MENU_ITEMS,
    toggleMenu,
  };
}

export function useAuth() {
  const user = ref(null);
  const profile = ref(null);
  const loading = ref(false);
  const error = ref('');

  const loadSession = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      user.value = data?.session?.user ?? null;
      if (user.value) {
        await loadProfile(user.value.id);
      }
    } catch (err) {
      error.value = err?.message ?? 'Erreur auth';
    }
  };

  const loadProfile = async (userId) => {
    try {
      const supabase = getSupabase();
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (queryError) return;
      profile.value = data ?? null;
    } catch {
      // ignore profile errors
    }
  };

  const signIn = async (email, password) => {
    loading.value = true;
    error.value = '';
    try {
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      user.value = data?.user ?? null;
      if (user.value) {
        await loadProfile(user.value.id);
        await ensureProfile(user.value.id, email);
        await applyPendingDisplayName(email, updateProfile);
      }
      return true;
    } catch (err) {
      error.value = err?.message ?? 'Connexion impossible';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const signUp = async (email, password, displayName) => {
    loading.value = true;
    error.value = '';
    try {
      const normalized = normalizeDisplayName(displayName);
      if (!normalized) {
        error.value = 'Pseudo obligatoire.';
        return false;
      }
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: normalized },
        },
      });
      if (authError) throw authError;
      user.value = data?.user ?? null;
      if (data?.session?.user) {
        await updateProfile(normalized);
        await loadProfile(data.session.user.id);
      } else {
        storePendingDisplayName(email, normalized);
      }
      return true;
    } catch (err) {
      error.value = getDisplayNameError(err) || err?.message || 'Inscription impossible';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      user.value = null;
      profile.value = null;
    } catch (err) {
      error.value = err?.message ?? 'Deconnexion impossible';
    }
  };

  const updateProfile = async (displayName) => {
    loading.value = true;
    error.value = '';
    try {
      if (!user.value) return false;
      const normalized = normalizeDisplayName(displayName);
      if (!normalized) {
        error.value = 'Pseudo obligatoire.';
        return false;
      }
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: normalized || null,
        })
        .eq('id', user.value.id);
      if (updateError) throw updateError;
      await loadProfile(user.value.id);
      return true;
    } catch (err) {
      error.value = getDisplayNameError(err) || err?.message || 'Mise a jour impossible';
      return false;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadSession();
    try {
      const supabase = getSupabase();
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null;
        if (user.value) {
          ensureProfile(user.value.id, user.value.email);
        }
      });
    } catch {
      // ignore env issues
    }
  });

  return {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}

async function ensureProfile(userId, email) {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('display_name,email')
      .eq('id', userId)
      .single();
    if (!data) return;
    // Do not auto-fill display_name; enforce user input in UI.
  } catch {
    // ignore ensure errors
  }
}

function storePendingDisplayName(email, displayName) {
  try {
    const raw = localStorage.getItem(PENDING_DISPLAY_NAME_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[email] = normalizeDisplayName(displayName);
    localStorage.setItem(PENDING_DISPLAY_NAME_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

async function applyPendingDisplayName(email, updater) {
  try {
    const raw = localStorage.getItem(PENDING_DISPLAY_NAME_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const pending = normalizeDisplayName(map[email]);
    if (!pending) return;
    if (typeof updater === 'function') {
      await updater(pending);
    }
    delete map[email];
    localStorage.setItem(PENDING_DISPLAY_NAME_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function useUpcomingMatches(options = {}) {
  const matches = ref([]);
  const loading = ref(false);
  const error = ref('');
  let intervalId;

  const refresh = async () => {
    loading.value = true;
    error.value = '';
    try {
      const teamIds = await resolveTeamIds();
      const cacheKey = `upcoming:${(teamIds || []).join(',')}:${options.perPage ?? DEFAULT_PER_PAGE}`;
      const cached = getCache(cacheKey);
      if (cached) {
        matches.value = cached;
      } else {
        const data = await fetchMatchesByStatus('upcoming', teamIds, options);
        matches.value = data;
        setCache(cacheKey, data);
      }
    } catch (err) {
      error.value = err?.message ?? 'Erreur API PandaScore';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    refresh();
    intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { matches, loading, error, refresh };
}

export function usePastMatches(options = {}) {
  const matches = ref([]);
  const loading = ref(false);
  const error = ref('');
  let intervalId;

  const refresh = async () => {
    loading.value = true;
    error.value = '';
    try {
      const teamIds = await resolveTeamIds();
      const cacheKey = `past:${(teamIds || []).join(',')}:${options.perPage ?? DEFAULT_PER_PAGE}`;
      const cached = getCache(cacheKey);
      if (cached) {
        matches.value = cached;
      } else {
        const data = await fetchMatchesByStatus('past', teamIds, options);
        matches.value = data;
        setCache(cacheKey, data);
      }
    } catch (err) {
      error.value = err?.message ?? 'Erreur API PandaScore';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    refresh();
    intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { matches, loading, error, refresh };
}

export function usePickemBoard() {
  const { matches, loading, error, refresh } = useMonthlyMatches();
  const picks = ref(loadPicks());
  const locked = ref(loadPickLock());
  const confirmed = ref(loadConfirmedPicks());
  const scorePicks = ref(loadScorePicks());

  const pickCount = computed(() => Object.keys(picks.value).length);
  const pickableMatches = computed(() => (matches.value || []).filter((match) => !isMatchInPast(match)));

  const selectPick = (matchId, teamId) => {
    if (locked.value) return;
    if (confirmed.value[matchId]) return;
    if (!matchId || !teamId) return;
    picks.value = { ...picks.value, [matchId]: teamId };
  };

  const selectScorePick = (matchId, scorePick) => {
    if (locked.value) return;
    if (confirmed.value[matchId]) return;
    if (!matchId || !scorePick) return;
    scorePicks.value = { ...scorePicks.value, [matchId]: scorePick };
  };

  watch(picks, () => savePicks(picks.value), { deep: true });
  watch(locked, () => savePickLock(locked.value));
  watch(confirmed, () => saveConfirmedPicks(confirmed.value), { deep: true });
  watch(scorePicks, () => saveScorePicks(scorePicks.value), { deep: true });

  return {
    matches,
    pickableMatches,
    loading,
    error,
    refresh,
    picks,
    pickCount,
    selectPick,
    scorePicks,
    selectScorePick,
    locked,
    confirmed,
    confirmPicks: () => {
      locked.value = true;
    },
    confirmPick: (matchId) => {
      if (!matchId) return;
      confirmed.value = { ...confirmed.value, [matchId]: true };
    },
  };
}

export function usePickHistory() {
  const { matches, loading, error, refresh } = useMonthlyMatches();
  const picks = ref(loadPicks());
  const confirmed = ref(loadConfirmedPicks());
  const scorePicks = ref(loadScorePicks());
  let lastSyncedPoints = null;

  watch(picks, () => savePicks(picks.value), { deep: true });
  watch(confirmed, () => saveConfirmedPicks(confirmed.value), { deep: true });
  watch(scorePicks, () => saveScorePicks(scorePicks.value), { deep: true });

  const history = computed(() => {
    const list = [];
    const matchMap = new Map((matches.value || []).map((match) => [match.id, match]));
    Object.entries(picks.value || {}).forEach(([matchId, teamId]) => {
      const match = matchMap.get(Number(matchId)) || matchMap.get(matchId);
      const opponents = getOpponents(match || {});
      const picked = opponents.find((team) => team.id === teamId);
      const points = match
        ? computeMatchPoints(match, teamId, scorePicks.value?.[matchId], confirmed.value?.[matchId])
        : 0;
      list.push({
        id: matchId,
        title: match ? getMatchTitle(match) : `Match #${matchId}`,
        meta: match ? getMatchMeta(match) : '',
        date: match ? formatMatchDate(match.begin_at) : 'Date TBD',
        pick: picked?.name || '—',
        confirmed: Boolean(confirmed.value?.[matchId]),
        points,
      });
    });
    return list;
  });

  const totalPoints = computed(() => history.value.reduce((sum, item) => sum + (item.points || 0), 0));

  watch(totalPoints, async (points) => {
    if (points === lastSyncedPoints) return;
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;
    lastSyncedPoints = points;
    await supabase.from('profiles').update({ total_points: points }).eq('id', userId);
  });

  return { history, totalPoints, loading, error, refresh };
}

export function useLeaderboard(limit = 50) {
  const players = ref([]);
  const loading = ref(false);
  const error = ref('');

  const refresh = async () => {
    loading.value = true;
    error.value = '';
    try {
      const supabase = getSupabase();
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, display_name, total_points')
        .order('total_points', { ascending: false })
        .limit(limit);
      if (queryError) throw queryError;
      players.value = data || [];
    } catch (err) {
      error.value = err?.message ?? 'Erreur classement';
    } finally {
      loading.value = false;
    }
  };

  onMounted(refresh);

  return { players, loading, error, refresh };
}

export function useBrandInfo() {
  return {
    teamName: TEAM_NAME,
  };
}

export function useGentleMatesTeam() {
  const team = ref(null);
  const loading = ref(false);
  const error = ref('');

  const refresh = async () => {
    loading.value = true;
    error.value = '';
    try {
      const data = await request('/teams', { [`search[slug]`]: TEAM_SLUG });
      team.value = data?.[0] ?? null;
    } catch (err) {
      error.value = err?.message ?? 'Erreur API PandaScore';
    } finally {
      loading.value = false;
    }
  };

  onMounted(refresh);

  return { team, loading, error, refresh };
}

export function formatMatchDate(dateValue) {
  if (!dateValue) return 'Date TBD';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMatchTitle(match) {
  const opponents = Array.isArray(match?.opponents) ? match.opponents : [];
  if (opponents.length >= 2) {
    return `${opponents[0]?.opponent?.name ?? 'TBD'} vs ${opponents[1]?.opponent?.name ?? 'TBD'}`;
  }
  return match?.name || 'Match a venir';
}

export function getMatchMeta(match) {
  const league = match?.league?.name || '';
  const serie = match?.serie?.name || '';
  const tournament = match?.tournament?.name || '';
  return [league, serie, tournament].filter(Boolean).join(' • ');
}

export function getOpponents(match) {
  const opponents = Array.isArray(match?.opponents) ? match.opponents : [];
  return opponents.map((item) => item?.opponent).filter(Boolean);
}

export function getSeriesBadges(match) {
  const text = `${match?.league?.name ?? ''} ${match?.serie?.name ?? ''} ${match?.tournament?.name ?? ''}`.toLowerCase();
  const badges = [];
  if (text.includes('vct')) badges.push('VCT');
  if (text.includes('gc')) badges.push('GC');
  return badges;
}

export function getMatchScoreline(match) {
  const results = Array.isArray(match?.results) ? match.results : [];
  if (results.length === 0) return 'Score TBD';
  const scores = results.map((item) => item?.score ?? 0);
  return scores.join(' - ');
}

export function isMatchInPast(match) {
  const beginAt = match?.begin_at;
  if (!beginAt) return false;
  return new Date(beginAt).getTime() < Date.now();
}

export function isMatchStarted(match) {
  const status = (match?.status || '').toLowerCase();
  if (status === 'running' || status === 'in_progress' || status === 'live') return true;
  const beginAt = match?.begin_at;
  if (!beginAt) return false;
  return new Date(beginAt).getTime() <= Date.now();
}

export function useMonthlyMatches() {
  const matches = ref([]);
  const loading = ref(false);
  const error = ref('');
  const currentMonth = ref(new Date());
  let intervalId;

  const monthLabel = computed(() =>
    currentMonth.value.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
  );

  const setMonth = (offset) => {
    const date = new Date(currentMonth.value);
    date.setMonth(date.getMonth() + offset);
    currentMonth.value = date;
  };

  const refresh = async () => {
    loading.value = true;
    error.value = '';
    try {
      const { startISO, endISO } = getMonthRange(currentMonth.value);
      const teamIds = await resolveTeamIds();
      const cacheKey = `month:${startISO}:${endISO}:${(teamIds || []).join(',')}`;
      const cached = getCache(cacheKey);
      if (cached) {
        matches.value = cached;
      } else {
        const data = await fetchAllMatchesInRange(startISO, endISO);
        matches.value = data;
        setCache(cacheKey, data);
      }
    } catch (err) {
      error.value = err?.message ?? 'Erreur API PandaScore';
    } finally {
      loading.value = false;
    }
  };

  watch(currentMonth, refresh, { immediate: true });
  onMounted(() => {
    intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return {
    matches,
    loading,
    error,
    monthLabel,
    nextMonth: () => setMonth(1),
    prevMonth: () => setMonth(-1),
    refresh,
  };
}

export function useCalendarFilters(matchesRef) {
  const selectedGame = ref('Tous');

  const games = computed(() => {
    const counts = {};
    (matchesRef.value || []).forEach((match) => {
      const name = match?.videogame?.name || 'Autre';
      counts[name] = (counts[name] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [{ name: 'Tous', count: matchesRef.value?.length || 0 }, ...entries.map(([name, count]) => ({ name, count }))];
  });

  const filteredMatches = computed(() => {
    if (selectedGame.value === 'Tous') return matchesRef.value || [];
    return (matchesRef.value || []).filter(
      (match) => (match?.videogame?.name || 'Autre') === selectedGame.value,
    );
  });

  return {
    selectedGame,
    games,
    filteredMatches,
    setGame: (name) => {
      selectedGame.value = name;
    },
  };
}

function loadPicks() {
  try {
    const raw = localStorage.getItem(PICKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePicks(picks) {
  try {
    localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(picks));
  } catch {
    // ignore write errors
  }
}

function loadPickLock() {
  try {
    return localStorage.getItem(PICKS_LOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

function savePickLock(locked) {
  try {
    localStorage.setItem(PICKS_LOCK_KEY, locked ? 'true' : 'false');
  } catch {
    // ignore write errors
  }
}

function loadConfirmedPicks() {
  try {
    const raw = localStorage.getItem(PICKS_CONFIRMED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConfirmedPicks(confirmed) {
  try {
    localStorage.setItem(PICKS_CONFIRMED_KEY, JSON.stringify(confirmed));
  } catch {
    // ignore write errors
  }
}

function loadScorePicks() {
  try {
    const raw = localStorage.getItem(PICKS_SCORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScorePicks(scorePicks) {
  try {
    localStorage.setItem(PICKS_SCORE_KEY, JSON.stringify(scorePicks));
  } catch {
    // ignore write errors
  }
}

function computeMatchPoints(match, pickedTeamId, scorePick, isConfirmed) {
  if (!isConfirmed) return 0;
  const status = (match?.status || '').toLowerCase();
  if (status && status !== 'finished' && status !== 'completed') return 0;
  const results = Array.isArray(match?.results) ? match.results : [];
  if (results.length === 0) return 0;

  const scoreMap = new Map(results.map((item) => [item.team_id, item.score ?? 0]));
  const opponents = getOpponents(match || {});
  if (opponents.length < 2) return 0;

  const teamAId = opponents[0].id;
  const teamBId = opponents[1].id;
  const scoreA = scoreMap.get(teamAId);
  const scoreB = scoreMap.get(teamBId);
  if (scoreA === undefined || scoreB === undefined) return 0;

  const winnerId = scoreA === scoreB ? null : scoreA > scoreB ? teamAId : teamBId;
  const correctPick = winnerId && pickedTeamId === winnerId;
  let points = correctPick ? 20 : -10;

  if (scorePick && scorePick.teamAId === teamAId && scorePick.teamBId === teamBId) {
    const exact = scorePick.scoreA === scoreA && scorePick.scoreB === scoreB;
    if (exact) points += 10;
  }

  return points;
}

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

async function fetchAllMatchesInRange(startISO, endISO) {
  const teamIds = await resolveTeamIds();
  if (!teamIds || teamIds.length === 0) return [];

  const rangeMatches = await fetchMatchesByRange(startISO, endISO, teamIds);
  if (rangeMatches.length > 0) {
    return rangeMatches;
  }

  const upcoming = await fetchMatchesByStatus('upcoming', teamIds);
  const running = await fetchMatchesByStatus('running', teamIds);
  const past = await fetchMatchesByStatus('past', teamIds);
  const merged = [...upcoming, ...running, ...past];
  return merged.filter((match) => isMatchInRange(match, startISO, endISO));
}

async function fetchMatchesByStatus(status, teamIds, options = {}) {
  const perPage = options.perPage ?? 50;
  const maxPages = 5;
  const collected = [];
  const ids = Array.isArray(teamIds) ? teamIds : teamIds ? [teamIds] : [];

  for (const id of ids) {
    for (let page = 1; page <= maxPages; page += 1) {
      const pageData = await safeRequest(`/matches/${status}`, {
        per_page: perPage,
        page,
        sort: status === 'past' ? '-begin_at' : 'begin_at',
        ...(id ? { 'filter[opponent_id]': id } : {}),
      });

      if (pageData?.__error) {
        const message = pageData.__error?.message ?? '';
        if (message.includes('500') && id) {
          const retryData = await safeRequest(`/matches/${status}`, {
            per_page: 20,
            page,
            sort: status === 'past' ? '-begin_at' : 'begin_at',
          });
          if (Array.isArray(retryData) && retryData.length) {
            collected.push(...retryData);
          }
          break;
        }
        break;
      }

      if (!Array.isArray(pageData) || pageData.length === 0) break;
      collected.push(...pageData);
      if (pageData.length < perPage) break;
    }
  }

  return dedupeMatches(collected);
}

function isMatchInRange(match, startISO, endISO) {
  const beginAt = match?.begin_at;
  if (!beginAt) return false;
  const time = new Date(beginAt).getTime();
  return time >= new Date(startISO).getTime() && time <= new Date(endISO).getTime();
}

async function fetchMatchesByRange(startISO, endISO, teamId) {
  const perPage = 50;
  const maxPages = 3;
  const collected = [];
  const ids = Array.isArray(teamId) ? teamId : teamId ? [teamId] : [];

  for (const id of ids) {
    for (let page = 1; page <= maxPages; page += 1) {
      const pageData = await safeRequest('/matches', {
        per_page: perPage,
        page,
        sort: 'begin_at',
        'filter[begin_at]': `${startISO},${endISO}`,
        ...(id ? { 'filter[opponent_id]': id } : {}),
      });

      if (pageData?.__error) {
        const message = pageData.__error?.message ?? '';
        if (message.includes('500') && id) {
          const retryData = await safeRequest('/matches', {
            per_page: 20,
            page,
            sort: 'begin_at',
            'filter[begin_at]': `${startISO},${endISO}`,
          });
          if (Array.isArray(retryData) && retryData.length) {
            collected.push(...retryData);
          }
          break;
        }
        break;
      }

      if (!Array.isArray(pageData) || pageData.length === 0) break;
      collected.push(...pageData);
      if (pageData.length < perPage) break;
    }
  }

  return dedupeMatches(collected).filter((match) => isMatchInRange(match, startISO, endISO));
}

function dedupeMatches(matches) {
  const map = new Map();
  (matches || []).forEach((match) => {
    if (match?.id) map.set(match.id, match);
  });
  return Array.from(map.values());
}

function splitIds(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchTeamsBySearch(field, value) {
  const pageData = await request('/teams', {
    per_page: 50,
    [`search[${field}]`]: value,
  });

  return Array.isArray(pageData) ? pageData : [];
}
