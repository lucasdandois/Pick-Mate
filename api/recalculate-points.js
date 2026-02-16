import { createClient } from '@supabase/supabase-js';

const PANDASCORE_BASE = 'https://api.pandascore.co';

function isSettledMatch(status) {
  const s = String(status || '').toLowerCase();
  return s === 'finished' || s === 'completed';
}

function computePointsFromMatch(match, pick) {
  if (!isSettledMatch(match?.status)) return 0;
  const results = Array.isArray(match?.results) ? match.results : [];
  if (!results.length) return 0;

  const scoreMap = new Map(results.map((r) => [Number(r.team_id), Number(r.score ?? 0)]));
  const teamAId = Number(pick.team_a_id || 0);
  const teamBId = Number(pick.team_b_id || 0);

  let resolvedTeamAId = teamAId;
  let resolvedTeamBId = teamBId;
  if (!resolvedTeamAId || !resolvedTeamBId) {
    const opponents = Array.isArray(match?.opponents) ? match.opponents : [];
    const a = Number(opponents?.[0]?.opponent?.id || 0);
    const b = Number(opponents?.[1]?.opponent?.id || 0);
    resolvedTeamAId = resolvedTeamAId || a;
    resolvedTeamBId = resolvedTeamBId || b;
  }

  const scoreA = scoreMap.get(resolvedTeamAId);
  const scoreB = scoreMap.get(resolvedTeamBId);
  if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) return 0;

  const winnerId = scoreA === scoreB ? null : scoreA > scoreB ? resolvedTeamAId : resolvedTeamBId;
  const pickedTeamId = Number(pick.pick_team_id);
  let points = winnerId && pickedTeamId === winnerId ? 20 : -10;

  const predictedA = Number(pick.score_a);
  const predictedB = Number(pick.score_b);
  if (Number.isFinite(predictedA) && Number.isFinite(predictedB)) {
    if (predictedA === scoreA && predictedB === scoreB) {
      points += 10;
    }
  }

  return points;
}

async function fetchMatchById(matchId, token) {
  const response = await fetch(`${PANDASCORE_BASE}/matches/${matchId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function authorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = req.headers.authorization || '';
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true;
  if (req.headers['x-vercel-cron']) return true;
  return !cronSecret;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pandascoreToken = process.env.PANDASCORE_TOKEN;

  if (!supabaseUrl || !serviceRoleKey || !pandascoreToken) {
    res.status(500).json({ error: 'Missing env vars' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: picks, error: picksError } = await supabase
    .from('user_picks')
    .select('user_id,match_id,pick_team_id,team_a_id,team_b_id,score_a,score_b,status')
    .eq('status', 'confirmed');

  if (picksError) {
    res.status(500).json({ error: picksError.message });
    return;
  }

  const allPicks = picks || [];
  const matchIds = Array.from(new Set(allPicks.map((p) => Number(p.match_id)).filter(Number.isFinite)));
  const matchCache = new Map();

  for (const matchId of matchIds) {
    const match = await fetchMatchById(matchId, pandascoreToken);
    if (match) matchCache.set(matchId, match);
  }

  const totals = new Map();
  for (const pick of allPicks) {
    const userId = pick.user_id;
    const match = matchCache.get(Number(pick.match_id));
    const points = match ? computePointsFromMatch(match, pick) : 0;
    totals.set(userId, (totals.get(userId) || 0) + points);
  }

  const updates = Array.from(totals.entries()).map(([id, total_points]) => ({ id, total_points }));
  if (updates.length) {
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' });
    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }
  }

  const userIdsWithPick = new Set(totals.keys());
  const { data: allProfiles, error: profilesError } = await supabase.from('profiles').select('id');
  if (!profilesError && Array.isArray(allProfiles)) {
    const zeroUpdates = allProfiles
      .filter((p) => !userIdsWithPick.has(p.id))
      .map((p) => ({ id: p.id, total_points: 0 }));
    if (zeroUpdates.length) {
      await supabase.from('profiles').upsert(zeroUpdates, { onConflict: 'id' });
    }
  }

  res.status(200).json({
    ok: true,
    picksProcessed: allPicks.length,
    usersUpdated: updates.length,
    matchesResolved: matchCache.size,
    at: new Date().toISOString(),
  });
}
